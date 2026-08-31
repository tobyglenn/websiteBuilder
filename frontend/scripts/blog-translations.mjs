import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile, copyFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createServer } from 'vite';

export const LOCALES = ['de', 'es', 'pt', 'hi'];
export const MODEL = 'minimax/MiniMax-M3';

const LANGUAGE_NAMES = {
  de: 'German (de-DE)',
  es: 'Spanish (es-ES)',
  pt: 'Brazilian Portuguese (pt-BR)',
  hi: 'Hindi (hi-IN)',
};
const PROTECTED_NAMES = [
  'Toby',
  'Speediance',
  'Gym Monster',
  'Tonal',
  'WHOOP',
  'Garmin',
  'Oura',
  '8Sleep',
  'OpenClaw',
  'AgentStack',
  'Anthropic',
  'Claude',
  'BJJ',
];
const TRANSLATION_LEAK_PATTERNS = [
  /--max-tokens\b/i,
  /--no-fallback\b/i,
  /--system\b/i,
  /deterministic professional translator/i,
  /return only (?:the )?(?:requested )?(?:final )?json/i,
  /do not include (?:reasoning|commentary)/i,
  /devuelve (?:solo|unicamente|únicamente).{0,100}json/i,
  /no incluyas (?:razonamiento|comentarios)/i,
  /gib nur.{0,100}json/i,
  /retorne apenas.{0,100}json/i,
];
const PRIORITY_SLUGS = [
  'garmin-and-whoop-what-each-is-actually-for',
  'anthropic-refund-scam',
  'gym-monster-2-vs-original',
  'whoop-5-not-smaller-review',
  'openclaw-fitness-reports-garmin-whoop-speediance',
  'speediance-vs-tonal-comparison',
];

const scriptPath = fileURLToPath(import.meta.url);
const frontendRoot = resolve(dirname(scriptPath), '..');
const repoRoot = resolve(frontendRoot, '..');
const stagingRoot = resolve(
  process.env.BLOG_TRANSLATION_STATE_DIR
    || join(homedir(), '.openclaw/state/website-blog-translations'),
);
const outputRoot = resolve(
  process.env.BLOG_TRANSLATION_OUTPUT_DIR
    || join(frontendRoot, 'src/generated/blog-translations'),
);
const statusPath = resolve(
  process.env.BLOG_TRANSLATION_STATUS_FILE
    || join(homedir(), '.openclaw/logs/analytics/blog-translations/latest.json'),
);
const failuresPath = join(stagingRoot, 'failures.json');
const freecallRoot = process.env.FREECALL_ROOT || join(homedir(), '.openclaw/scripts');
const modelTimeoutSeconds = Number(process.env.BLOG_TRANSLATION_MODEL_TIMEOUT || 900);
const modelMaxTokens = Number(process.env.BLOG_TRANSLATION_MAX_TOKENS || 8192);
const modelAttempts = Math.max(1, Number(process.env.BLOG_TRANSLATION_MODEL_ATTEMPTS || 3));
const draftAttempts = Math.max(1, Number(process.env.BLOG_TRANSLATION_DRAFT_ATTEMPTS || 3));
const modelRetrySeconds = Math.max(0, Number(process.env.BLOG_TRANSLATION_MODEL_RETRY_SECONDS || 5));
const retryDelayMinutes = Number(process.env.BLOG_TRANSLATION_RETRY_MINUTES || 30);
const promptVersion = '2026-08-18-v6';

const parseArgs = (argv) => {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) continue;
    const key = value.slice(2);
    options[key] = argv[index + 1] && !argv[index + 1].startsWith('--')
      ? argv[++index]
      : true;
  }
  return options;
};

const readJson = async (path, fallback = null) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
};

const writeJsonAtomic = async (path, value) => {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp-${process.pid}`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, path);
};

const translationPath = (root, locale, slug) => join(root, locale, `${slug}.json`);

const normalizeSourcePost = (post) => ({
  slug: String(post.slug || ''),
  title: String(post.title || ''),
  excerpt: String(post.excerpt || ''),
  category: String(post.category || 'Analysis'),
  published_at: String(post.published_at || ''),
  image: String(post.image || ''),
  tags: Array.isArray(post.tags) ? post.tags.map(String) : [],
  content: String(post.content || ''),
});

export const computeSourceHash = (post) => createHash('sha256')
  .update(JSON.stringify(normalizeSourcePost(post)))
  .digest('hex');

const priorityIndex = (slug) => {
  const index = PRIORITY_SLUGS.indexOf(slug);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

export const sortSourcePosts = (posts) => [...posts].sort((a, b) => {
  const priorityDelta = priorityIndex(a.slug) - priorityIndex(b.slug);
  if (priorityDelta) return priorityDelta;
  const dateDelta = Date.parse(b.published_at || '') - Date.parse(a.published_at || '');
  return Number.isNaN(dateDelta) ? a.slug.localeCompare(b.slug) : dateDelta;
});

export const loadSourcePosts = async () => {
  const server = await createServer({
    root: frontendRoot,
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });
  try {
    const module = await server.ssrLoadModule('/src/lib/blogPosts.ts');
    return sortSourcePosts(
      module.CANONICAL_BLOG_POSTS
        .filter((post) => !module.BLOG_REDIRECTS[post.slug])
        .map(normalizeSourcePost),
    );
  } finally {
    await server.close();
  }
};

const stripModelNoise = (value) => String(value || '')
  .replace(/<think>[\s\S]*?<\/think>/gi, '')
  .replace(/<think>[\s\S]*$/gi, '')
  .replace(/^\s*\[via [^\]]+\]\s*/i, '')
  .replace(/^\s*```(?:json)?\s*/i, '')
  .replace(/\s*```\s*$/i, '')
  .replace(/\n\[via [^\]]+\]\s*$/i, '')
  .trim();

export const extractJsonObject = (value) => {
  const cleaned = stripModelNoise(value);
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('model response did not contain a JSON object');
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('model response JSON was not an object');
  }
  return parsed;
};

const linkTargets = (value) => {
  const targets = new Set();
  const patterns = [
    /https?:\/\/[^\s"'<>\])]+/g,
    /(?:href|src)=["']([^"']+)["']/g,
    /\]\((\/[^)\s]+)\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of String(value || '').matchAll(pattern)) {
      const raw = match[1] || match[0];
      const clean = raw.replace(/[`.,;:!?)]+$/, "");
      if (clean) targets.add(clean);
    }
  }
  return [...targets];
};

const headingCount = (value) => {
  const content = String(value || '');
  return (content.match(/^#{1,3}\s+/gm) || []).length
    + (content.match(/<h[1-3]\b/gi) || []).length;
};

const markdownHeadingPrefixes = (value) => [
  ...new Set(
    [...String(value || '').matchAll(/^(#{1,3}\s+)/gm)]
      .map((match) => match[1]),
  ),
];

const numericTokens = (value) => [
  ...new Set(
    String(value || '')
      .replace(/&#(?:x[0-9a-f]+|\d+);/gi, '')
      .match(/\b\d[\d,.]*(?:%|[a-z]{1,4})?\b/gi) || [],
  ),
];

const numericUnitTokens = (value) => [
  ...new Set(
    String(value || '').match(
      /\b(?:\d[\d,.]*\/\d[\d,.]*|\d[\d,.]*(?:%|[a-z]{1,4}))(?![a-z0-9_])/gi,
    ) || [],
  ),
];

const numericRankTokens = (value) => [
  ...new Set(String(value || '').match(/#\d[\d,.]*/g) || []),
];

const localizedNumericVariants = (token) => {
  const variants = new Set([token]);
  if (/[.,]/.test(token)) {
    variants.add(token.replace(/[.,]/g, (separator) => (separator === ',' ? '.' : ',')));
  }
  return [...variants];
};

const occurrenceCount = (value, token) => String(value || '').split(token).length - 1;

const placeholderLabel = (index) => {
  let value = index + 1;
  let label = '';
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return `__TOFT_KEEP_${label}__`;
};

export const shieldTranslationSource = (post) => {
  const source = normalizeSourcePost(post);
  const translatableText = [source.title, source.excerpt, source.category, ...source.tags, source.content].join('\n');
  const candidates = [...new Set([
    ...linkTargets(source.content),
    ...PROTECTED_NAMES.filter((name) => translatableText.includes(name)),
    ...numericUnitTokens(translatableText),
    ...numericRankTokens(translatableText),
    ...markdownHeadingPrefixes(source.content),
  ])]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const replacements = candidates.map((value, index) => ({
    value,
    placeholder: placeholderLabel(index),
  }));
  const shieldString = (value) => replacements.reduce(
    (result, replacement) => result.split(replacement.value).join(replacement.placeholder),
    String(value || ''),
  );
  const shielded = {
    ...source,
    title: shieldString(source.title),
    excerpt: shieldString(source.excerpt),
    category: shieldString(source.category),
    tags: source.tags.map(shieldString),
    content: shieldString(source.content),
  };
  const shieldedText = [
    shielded.title,
    shielded.excerpt,
    shielded.category,
    ...shielded.tags,
    shielded.content,
  ].join('\n');
  const countedReplacements = replacements.map((replacement) => ({
    ...replacement,
    expectedCount: occurrenceCount(shieldedText, replacement.placeholder),
  }));

  return { shielded, replacements: countedReplacements };
};

export const restoreTranslationTokens = (draft, replacements) => {
  const translatedText = [
    draft?.title,
    draft?.excerpt,
    draft?.category,
    ...(Array.isArray(draft?.tags) ? draft.tags : []),
    draft?.content,
  ].join('\n');
  const missingOrChanged = replacements.filter(({ placeholder, expectedCount }) =>
    occurrenceCount(translatedText, placeholder) !== expectedCount,
  );
  if (missingOrChanged.length) {
    throw new Error(`model changed protected placeholders: ${missingOrChanged.slice(0, 5).map(({ placeholder }) => placeholder).join(', ')}`);
  }

  const restoreString = (value) => replacements.reduce(
    (result, replacement) => result.split(replacement.placeholder).join(replacement.value),
    String(value || ''),
  );
  return {
    ...draft,
    title: restoreString(draft?.title),
    excerpt: restoreString(draft?.excerpt),
    category: restoreString(draft?.category),
    tags: Array.isArray(draft?.tags) ? draft.tags.map(restoreString) : draft?.tags,
    content: restoreString(draft?.content),
  };
};

export const validateTranslationDraft = (draft, source) => {
  const errors = [];
  const title = String(draft?.title || '').trim();
  const excerpt = String(draft?.excerpt || '').trim();
  const category = String(draft?.category || '').trim();
  const content = String(draft?.content || '').trim();
  const tags = Array.isArray(draft?.tags) ? draft.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];
  const sourceText = [source.title, source.excerpt, source.category, ...source.tags, source.content].join('\n');

  if (title.length < 5 || title.length > 180) errors.push('title length is invalid');
  if (excerpt.length < 20 || excerpt.length > 600) errors.push('excerpt length is invalid');
  if (category.length < 2 || category.length > 100) errors.push('category is invalid');
  if (!Array.isArray(draft?.tags)) errors.push('tags must be an array');
  if (tags.length > 20) errors.push('too many tags');
  if (title === String(source.title || '').trim()) errors.push('title was not translated');
  if (excerpt === String(source.excerpt || '').trim()) errors.push('excerpt was not translated');
  if (content === String(source.content || '').trim()) errors.push('content was not translated');

  const sourceLength = String(source.content || '').trim().length;
  if (content.length < Math.max(200, Math.floor(sourceLength * 0.45))) {
    errors.push('translated content is too short');
  }
  if (sourceLength && content.length > sourceLength * 2.6) {
    errors.push('translated content is unexpectedly long');
  }

  const requiredLinks = linkTargets(source.content);
  const missingLinks = requiredLinks.filter((target) => !content.includes(target));
  if (missingLinks.length) errors.push(`missing preserved links: ${missingLinks.slice(0, 3).join(', ')}`);

  const sourceNumbers = numericTokens(`${source.title}\n${source.excerpt}\n${source.content}`);
  const translatedText = [title, excerpt, category, ...tags, content].join('\n');
  const missingNumbers = sourceNumbers.filter((token) =>
    !localizedNumericVariants(token).some((variant) => translatedText.includes(variant)),
  );
  if (missingNumbers.length) errors.push(`missing preserved numbers: ${missingNumbers.slice(0, 5).join(', ')}`);

  const changedProtectedNames = PROTECTED_NAMES.filter((name) =>
    occurrenceCount(source.content, name) > 0
      && occurrenceCount(content, name) < occurrenceCount(source.content, name),
  );
  if (changedProtectedNames.length) {
    errors.push(`missing protected names: ${changedProtectedNames.slice(0, 5).join(', ')}`);
  }

  const sourceHeadings = headingCount(source.content);
  const translatedHeadings = headingCount(content);
  if (sourceHeadings >= 2 && translatedHeadings < Math.floor(sourceHeadings * 0.75)) {
    errors.push('translated content lost too many headings');
  }
  if (/^```/.test(content) || /```$/.test(content)) errors.push('content contains a wrapping code fence');
  for (const pattern of TRANSLATION_LEAK_PATTERNS) {
    if (pattern.test(translatedText) && !pattern.test(sourceText)) {
      errors.push(`content contains model or command leakage: ${pattern.source}`);
      break;
    }
  }
  if (/https?:\/\/[^\s<>"']+`{2,}/i.test(translatedText)) {
    errors.push('content contains malformed URL backticks');
  }
  for (const level of [1, 2, 3]) {
    const openingCount = (content.match(new RegExp(`<h${level}\\b`, 'gi')) || []).length;
    const closingCount = (content.match(new RegExp(`</h${level}>`, 'gi')) || []).length;
    if (openingCount !== closingCount) errors.push(`content has unbalanced h${level} tags`);
  }

  if (errors.length) throw new Error(errors.join('; '));
  return { title, excerpt, category, tags, content };
};

export const splitTranslationChunks = (value, maxChars = 2800) => {
  const chunks = [];
  let remaining = String(value || '').trim();
  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars + 1);
    const minimumBreak = Math.floor(maxChars * 0.55);
    let breakAt = -1;
    const boundaryPattern = /\n{2,}|[.!?](?:["')\]]*)\s+/g;
    for (const match of window.matchAll(boundaryPattern)) {
      const candidate = Number(match.index) + match[0].length;
      if (candidate >= minimumBreak) breakAt = candidate;
    }
    if (breakAt < minimumBreak) breakAt = window.lastIndexOf('\n');
    if (breakAt < minimumBreak) breakAt = window.lastIndexOf(' ');
    if (breakAt < minimumBreak) breakAt = maxChars;
    chunks.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
};

const buildMetadataPrompt = (post, locale) => `Translate this blog metadata into ${LANGUAGE_NAMES[locale]}.

Return ONLY one valid JSON object with exactly these keys:
{
  "title": "translated reader-facing title",
  "excerpt": "translated 1-2 sentence meta description and card summary",
  "category": "translated category label",
  "tags": ["translated tag where natural", "product names unchanged"]
}

Use natural native-language phrasing. The excerpt is the search meta description, so keep it concise and useful. Do not add, remove, summarize, or invent claims. Preserve every numeric value and unit; do not spell numbers out or convert units. Locale-specific comma/period separators are allowed. Tokens beginning with __TOFT_KEEP_ are immutable: copy every occurrence exactly, including underscores. Return JSON only, without Markdown fences.

SOURCE METADATA JSON:
${JSON.stringify({ title: post.title, excerpt: post.excerpt, category: post.category, tags: post.tags })}`;

const buildContentPrompt = (content, locale, index, total) => `Translate blog article segment ${index + 1} of ${total} into ${LANGUAGE_NAMES[locale]}.

Return ONLY the complete translated segment as Markdown/HTML text, without JSON, commentary, translator notes, or wrapping code fences.

Requirements:
- Translate every heading, paragraph, list item, table label, caption, and visible link text.
- Preserve Markdown and HTML structure.
- Do not summarize, shorten, expand, reorder, or invent information.
- Preserve every numeric value and unit. Do not spell numbers out or convert units. Locale-specific comma/period separators are allowed.
- Tokens beginning with __TOFT_KEEP_ are immutable. Copy every occurrence exactly, including underscores.
- A __TOFT_KEEP_ token at the beginning of a line represents Markdown heading syntax. Keep it at the beginning of that same line and translate the heading text after it.
- Use natural native-language phrasing rather than word-for-word syntax.

SOURCE SEGMENT:
${content}`;

const runMiniMax = (prompt, maxTokens = modelMaxTokens) => {
  let lastError;
  for (let attempt = 1; attempt <= modelAttempts; attempt += 1) {
    const result = spawnSync(
      'python3',
      [
        '-m',
        'freecall.cli',
        MODEL,
        prompt,
        '--timeout',
        String(modelTimeoutSeconds),
        '--max-tokens',
        String(maxTokens),
        '--no-fallback',
        '--system',
        'You are a deterministic professional translator. Return only the requested final output in exactly the format requested. Do not include reasoning or commentary.',
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          PYTHONPATH: freecallRoot,
        },
        maxBuffer: 64 * 1024 * 1024,
        timeout: (modelTimeoutSeconds + 60) * 1000,
      },
    );
    if (!result.error && result.status === 0 && String(result.stdout || '').trim()) return result.stdout;

    lastError = result.error || new Error(
      `MiniMax M3 failed (${result.status}): ${(result.stderr || result.stdout || 'empty response').slice(0, 800)}`,
    );
    if (attempt < modelAttempts) {
      console.warn(`  MiniMax attempt ${attempt}/${modelAttempts} failed; retrying`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, modelRetrySeconds * 1000);
    }
  }
  throw lastError;
};

const runMiniMaxCached = (cacheDirectory, cacheKey, prompt, maxTokens = modelMaxTokens) => {
  const promptHash = createHash('sha256')
    .update(JSON.stringify({ model: MODEL, promptVersion, prompt, maxTokens }))
    .digest('hex');
  const cachePath = join(cacheDirectory, `${cacheKey}.json`);
  try {
    const cached = JSON.parse(readFileSync(cachePath, 'utf8'));
    if (cached?.promptHash === promptHash && typeof cached?.output === 'string' && cached.output.trim()) {
      console.log(`  ${cacheKey} (cached)`);
      return cached.output;
    }
  } catch {
    // Missing or invalid checkpoints are regenerated.
  }

  const output = runMiniMax(prompt, maxTokens);
  mkdirSync(cacheDirectory, { recursive: true });
  const temporaryPath = `${cachePath}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, `${JSON.stringify({ promptHash, output })}\n`, 'utf8');
  renameSync(temporaryPath, cachePath);
  return output;
};

const translatedSegment = (value) => {
  const cleaned = stripModelNoise(value);
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (typeof parsed === 'string') return parsed.trim();
    } catch {
      // The segment is plain translated text, not a JSON string.
    }
  }
  return cleaned;
};

const callMiniMax = (post, locale) => {
  const { shielded, replacements } = shieldTranslationSource(post);
  const cacheDirectory = join(stagingRoot, '.segments', computeSourceHash(post), locale, post.slug);
  try {
    const metadataPrompt = buildMetadataPrompt(shielded, locale);
    const metadata = extractJsonObject(runMiniMaxCached(cacheDirectory, 'metadata', metadataPrompt, 4096));
    const chunks = splitTranslationChunks(shielded.content);
    const content = chunks.map((chunk, index) => {
      const cacheKey = `segment-${String(index + 1).padStart(3, '0')}`;
      console.log(`  segment ${index + 1}/${chunks.length}`);
      return translatedSegment(runMiniMaxCached(
        cacheDirectory,
        cacheKey,
        buildContentPrompt(chunk, locale, index, chunks.length),
      ));
    }).join('\n\n');
    return restoreTranslationTokens({ ...metadata, content }, replacements);
  } catch (error) {
    // Cached model output is written before assembly validation. If metadata,
    // JSON, or protected-token validation fails, retaining those checkpoints
    // makes every retry replay the same invalid response forever.
    rmSync(cacheDirectory, { recursive: true, force: true });
    throw new Error(`MiniMax M3 translation assembly failed: ${error?.message || error}`);
  }
};

const clearSegmentCache = (post, locale) => {
  const cacheDirectory = join(stagingRoot, '.segments', computeSourceHash(post), locale, post.slug);
  rmSync(cacheDirectory, { recursive: true, force: true });
};

const readFailures = async () => readJson(failuresPath, {});

const saveFailure = async (key, error) => {
  const failures = await readFailures();
  const previous = failures[key] || { count: 0 };
  failures[key] = {
    count: Number(previous.count || 0) + 1,
    lastFailedAt: new Date().toISOString(),
    retryAfter: new Date(Date.now() + retryDelayMinutes * 60_000).toISOString(),
    error: String(error?.message || error).slice(0, 1000),
  };
  await writeJsonAtomic(failuresPath, failures);
};

const clearFailure = async (key) => {
  const failures = await readFailures();
  if (!(key in failures)) return;
  delete failures[key];
  await writeJsonAtomic(failuresPath, failures);
};

const readCurrentRecord = async (post, locale) => {
  const sourceHash = computeSourceHash(post);
  for (const root of [stagingRoot, outputRoot]) {
    const record = await readJson(translationPath(root, locale, post.slug));
    if (record?.sourceHash === sourceHash && record?.lang === locale) return record;
  }
  return null;
};

const promoteCompletePost = async (post) => {
  const records = [];
  for (const locale of LOCALES) {
    const record = await readCurrentRecord(post, locale);
    if (!record) return false;
    records.push(record);
  }
  for (const record of records) {
    const target = translationPath(outputRoot, record.lang, post.slug);
    await mkdir(dirname(target), { recursive: true });
    const staged = translationPath(stagingRoot, record.lang, post.slug);
    if (existsSync(staged)) await copyFile(staged, target);
  }
  return true;
};

const chooseTask = async (posts, options = {}) => {
  const failures = await readFailures();
  const now = Date.now();
  const requestedSlug = options.slug ? String(options.slug) : '';
  const requestedLocale = options.lang ? String(options.lang) : '';
  if (requestedLocale && !LOCALES.includes(requestedLocale)) {
    throw new Error(`unsupported language: ${requestedLocale}`);
  }

  for (const post of posts) {
    if (requestedSlug && post.slug !== requestedSlug) continue;
    for (const locale of LOCALES) {
      if (requestedLocale && locale !== requestedLocale) continue;
      if (await readCurrentRecord(post, locale)) continue;
      const key = `${post.slug}:${locale}`;
      const retryAfter = Date.parse(failures[key]?.retryAfter || '');
      if (!options.force && Number.isFinite(retryAfter) && retryAfter > now) continue;
      return { post, locale, key };
    }
  }
  return null;
};

const buildStatus = async (posts) => {
  let translated = 0;
  let completePosts = 0;
  for (const post of posts) {
    let complete = true;
    for (const locale of LOCALES) {
      if (await readCurrentRecord(post, locale)) translated += 1;
      else complete = false;
    }
    if (complete) completePosts += 1;
  }
  const failures = await readFailures();
  return {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    totalPosts: posts.length,
    locales: LOCALES,
    totalTranslations: posts.length * LOCALES.length,
    translated,
    remaining: (posts.length * LOCALES.length) - translated,
    completePosts,
    failedTasks: Object.keys(failures).length,
    stagingRoot,
    outputRoot,
  };
};

const saveStatus = async (posts) => {
  const status = await buildStatus(posts);
  await writeJsonAtomic(statusPath, status);
  return status;
};

const translateOne = async (options) => {
  const posts = await loadSourcePosts();
  const task = await chooseTask(posts, options);
  if (!task) {
    const status = await saveStatus(posts);
    console.log(JSON.stringify({ outcome: 'idle', ...status }));
    return;
  }

  const { post, locale, key } = task;
  console.log(`Translating ${post.slug} -> ${locale} with ${MODEL}`);
  try {
    let draft;
    let lastError;
    let lastFailureWasValidation = false;
    for (let attempt = 1; attempt <= draftAttempts; attempt += 1) {
      try {
        const translated = callMiniMax(post, locale);
        try {
          draft = validateTranslationDraft(translated, post);
        } catch (error) {
          const validationError = new Error(String(error?.message || error));
          validationError.translationValidationFailure = true;
          throw validationError;
        }
        break;
      } catch (error) {
        lastError = error;
        lastFailureWasValidation = Boolean(error?.translationValidationFailure);
        clearSegmentCache(post, locale);
        if (attempt < draftAttempts) {
          console.warn(`  translation draft attempt ${attempt}/${draftAttempts} failed; regenerating`);
        }
      }
    }
    if (!draft) {
      const error = new Error(`translation draft failed after ${draftAttempts} attempts: ${lastError?.message || lastError}`);
      if (lastFailureWasValidation) error.exitCode = 75;
      throw error;
    }
    const record = {
      slug: post.slug,
      lang: locale,
      title: draft.title,
      excerpt: draft.excerpt,
      category: draft.category,
      categoryKey: post.category,
      published_at: post.published_at,
      image: post.image,
      tags: draft.tags,
      content: draft.content,
      sourceHash: computeSourceHash(post),
      sourceTitle: post.title,
      translatedAt: new Date().toISOString(),
      model: MODEL,
    };
    await writeJsonAtomic(translationPath(stagingRoot, locale, post.slug), record);
    clearSegmentCache(post, locale);
    await clearFailure(key);
    const promoted = await promoteCompletePost(post);
    const status = await saveStatus(posts);
    console.log(JSON.stringify({ outcome: 'translated', slug: post.slug, locale, promoted, ...status }));
  } catch (error) {
    await saveFailure(key, error);
    await saveStatus(posts);
    throw error;
  }
};

const removeOrphanTranslations = async (posts) => {
  const sourceSlugs = new Set(posts.map((post) => post.slug));
  let removed = 0;

  for (const root of [stagingRoot, outputRoot]) {
    for (const locale of LOCALES) {
      const directory = join(root, locale);
      if (!existsSync(directory)) continue;

      const filenames = await readdir(directory);
      for (const filename of filenames.filter((name) => name.endsWith('.json'))) {
        const slug = filename.slice(0, -'.json'.length);
        if (sourceSlugs.has(slug)) continue;
        rmSync(join(directory, filename));
        removed += 1;
      }
    }
  }

  return removed;
};

const promoteAll = async () => {
  const posts = await loadSourcePosts();
  const removed = await removeOrphanTranslations(posts);
  let promoted = 0;
  for (const post of posts) {
    if (await promoteCompletePost(post)) promoted += 1;
  }
  const status = await saveStatus(posts);
  console.log(JSON.stringify({ outcome: 'promoted', promoted, removed, ...status }));
};

const validateOutput = async () => {
  const posts = await loadSourcePosts();
  const postBySlug = new Map(posts.map((post) => [post.slug, post]));
  const outputBySlug = new Map();
  for (const locale of LOCALES) {
    const directory = join(outputRoot, locale);
    const filenames = existsSync(directory) ? await readdir(directory) : [];
    for (const filename of filenames.filter((name) => name.endsWith('.json'))) {
      const record = await readJson(join(directory, filename));
      const post = postBySlug.get(record?.slug);
      if (!post) throw new Error(`translation has no current source: ${locale}/${filename}`);
      if (record.lang !== locale) throw new Error(`translation locale mismatch: ${locale}/${filename}`);
      if (record.sourceHash !== computeSourceHash(post)) {
        throw new Error(`stale translation source hash: ${locale}/${filename}`);
      }
      validateTranslationDraft(record, post);
      const locales = outputBySlug.get(record.slug) || new Set();
      locales.add(locale);
      outputBySlug.set(record.slug, locales);
    }
  }
  for (const [slug, locales] of outputBySlug) {
    const missing = LOCALES.filter((locale) => !locales.has(locale));
    if (missing.length) throw new Error(`partial published translation set for ${slug}: missing ${missing.join(', ')}`);
  }
  console.log(JSON.stringify({ outcome: 'valid', translatedPosts: outputBySlug.size, files: outputBySlug.size * LOCALES.length }));
};

const quarantineInvalidOutput = async () => {
  const posts = await loadSourcePosts();
  const postBySlug = new Map(posts.map((post) => [post.slug, post]));
  const invalid = [];

  for (const locale of LOCALES) {
    const directory = join(outputRoot, locale);
    const filenames = existsSync(directory) ? await readdir(directory) : [];
    for (const filename of filenames.filter((name) => name.endsWith('.json'))) {
      const record = await readJson(join(directory, filename));
      const post = postBySlug.get(record?.slug);
      try {
        if (!post) throw new Error('translation has no current source');
        if (record.lang !== locale) throw new Error('translation locale mismatch');
        if (record.sourceHash !== computeSourceHash(post)) throw new Error('stale translation source hash');
        validateTranslationDraft(record, post);
      } catch (error) {
        invalid.push({
          locale,
          slug: record?.slug || filename.replace(/\.json$/, ''),
          error: String(error?.message || error),
        });
      }
    }
  }

  const invalidSlugs = [...new Set(invalid.map((entry) => entry.slug))].sort();
  for (const slug of invalidSlugs) {
    const post = postBySlug.get(slug);
    for (const locale of LOCALES) {
      rmSync(translationPath(outputRoot, locale, slug), { force: true });
      rmSync(translationPath(stagingRoot, locale, slug), { force: true });
      if (post) clearSegmentCache(post, locale);
    }
  }

  const failures = await readFailures();
  for (const slug of invalidSlugs) {
    for (const locale of LOCALES) delete failures[`${slug}:${locale}`];
  }
  await writeJsonAtomic(failuresPath, failures);
  const status = await saveStatus(posts);
  console.log(JSON.stringify({
    outcome: 'quarantined',
    invalidFiles: invalid.length,
    invalidSlugs,
    invalid,
    ...status,
  }, null, 2));
};

const main = async () => {
  const [command = 'status', ...rest] = process.argv.slice(2);
  const options = parseArgs(rest);
  if (command === 'translate-one') return translateOne(options);
  if (command === 'promote') return promoteAll();
  if (command === 'validate-output') return validateOutput();
  if (command === 'quarantine-invalid') return quarantineInvalidOutput();
  if (command === 'status') {
    const posts = await loadSourcePosts();
    console.log(JSON.stringify(await saveStatus(posts), null, 2));
    return;
  }
  throw new Error(`unknown command: ${command}`);
};

if (resolve(process.argv[1] || '') === scriptPath) {
  main().catch((error) => {
    console.error(error?.stack || error);
    process.exitCode = Number(error?.exitCode) || 1;
  });
}
