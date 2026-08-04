import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from '@astrojs/compiler';

export const LOCALES = ['de', 'es', 'pt', 'hi'];
export const MODEL = 'minimax/MiniMax-M3';

const LANGUAGE_NAMES = {
  de: 'German (de-DE)',
  es: 'Spanish (es-ES)',
  pt: 'Brazilian Portuguese (pt-BR)',
  hi: 'Hindi (hi-IN)',
};

const HTML_LANGS = {
  de: 'de',
  es: 'es',
  pt: 'pt-BR',
  hi: 'hi',
};

export const TARGETS = [
  { source: 'agentstack.astro', route: '/agentstack/' },
  { source: 'wearables/whoop-5-vs-4-vs-oura.astro', route: '/wearables/whoop-5-vs-4-vs-oura/' },
  { source: 'speediance/gym-monster-1-vs-2-vs-2s.astro', route: '/speediance/gym-monster-1-vs-2-vs-2s/' },
  { source: 'wearables.astro', route: '/wearables/' },
  { source: 'projects.astro', route: '/projects/' },
];

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pagesRoot = join(repoRoot, 'src/pages');
const stagingRoot = process.env.PAGE_TRANSLATION_STATE_DIR
  || '/home/toby/.openclaw/state/website-priority-page-translations';
const statusPath = process.env.PAGE_TRANSLATION_STATUS_FILE
  || '/home/toby/.openclaw/logs/analytics/blog-translations/priority-pages-latest.json';
const failuresPath = join(stagingRoot, 'failures.json');
const freecallRoot = process.env.FREECALL_ROOT || '/home/toby/.openclaw/scripts';
const modelTimeoutSeconds = Number(process.env.PAGE_TRANSLATION_MODEL_TIMEOUT || 1200);
const modelMaxTokens = Number(process.env.PAGE_TRANSLATION_MAX_TOKENS || 16384);
const modelAttempts = Math.max(1, Number(process.env.PAGE_TRANSLATION_MODEL_ATTEMPTS || 3));
const draftAttempts = Math.max(1, Number(process.env.PAGE_TRANSLATION_DRAFT_ATTEMPTS || 3));
const retryDelayMinutes = Number(process.env.PAGE_TRANSLATION_RETRY_MINUTES || 30);
const promptVersion = '2026-08-04-v1';

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

const readJson = (path, fallback = null) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
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

const sourcePath = (target) => join(pagesRoot, target.source);
const outputPath = (target, locale) => join(pagesRoot, locale, target.source);
const recordPath = (target, locale) => join(stagingRoot, locale, `${target.source}.json`);

const sourceHash = (target, source) => createHash('sha256')
  .update(JSON.stringify({ target, source, promptVersion }))
  .digest('hex');

const cleanModelOutput = (value) => String(value || '')
  .replace(/<think>[\s\S]*?<\/think>/gi, '')
  .replace(/<think>[\s\S]*$/gi, '')
  .trim()
  .replace(/^```(?:astro)?\s*/i, '')
  .replace(/\s*```$/i, '')
  .trim();

const runMiniMax = (prompt) => {
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
        String(modelMaxTokens),
        '--no-fallback',
        '--system',
        'You are a deterministic website localization engineer. Return only the complete translated Astro source file.',
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, PYTHONPATH: freecallRoot },
        maxBuffer: 64 * 1024 * 1024,
        timeout: (modelTimeoutSeconds + 60) * 1000,
      },
    );

    if (!result.error && result.status === 0 && String(result.stdout || '').trim()) {
      return cleanModelOutput(result.stdout);
    }

    lastError = result.error || new Error(
      `MiniMax M3 failed (${result.status}): ${(result.stderr || result.stdout || 'empty response').slice(0, 800)}`,
    );
  }
  throw lastError;
};

const translationPrompt = (target, locale, source, repairFeedback = '') => `Translate this complete Astro page from English into ${LANGUAGE_NAMES[locale]}.

Return ONLY the complete translated Astro source file. Do not wrap it in a code fence and do not explain anything.

Hard requirements:
- Preserve valid Astro, JavaScript, TypeScript, JSX, HTML, and CSS syntax.
- Preserve imports, component names, variable names, object keys, event names, data attributes, CSS classes, IDs, numbers, dates, units, URLs, and product names.
- Translate every reader-visible string, including title and meta description copy, headings, paragraphs, labels, buttons, table copy, FAQ text, image alt text, breadcrumbs, and JSON-LD reader copy.
- Do not summarize, shorten, expand, reorder, or invent facts.
- Do not translate TobyOnFitnessTech, Toby Glenn Peters, Speediance, Gym Monster, WHOOP, Oura, Garmin, AgentStack, OpenClaw, Voltra, AEKE, BJJ, or model names.
- Keep the source route slug unchanged. Route localization and relative-import depth are applied mechanically after translation.
${repairFeedback ? `
The previous draft failed validation with: ${repairFeedback}
Return a repaired COMPLETE file that corrects every listed validation failure. Do not omit surrounding sections or markup.
` : ''}

SOURCE FILE: src/pages/${target.source}
TARGET LOCALE: ${locale}

${source}`;

const rewriteRelativeImports = (content, target, locale) => {
  const sourceDirectory = dirname(sourcePath(target));
  const outputDirectory = dirname(outputPath(target, locale));
  const rewrite = (specifier) => {
    const absoluteTarget = resolve(sourceDirectory, specifier);
    let rewritten = relative(outputDirectory, absoluteTarget).split(sep).join('/');
    if (!rewritten.startsWith('.')) rewritten = `./${rewritten}`;
    return rewritten;
  };

  return content
    .replace(/(\bfrom\s+["'])(\.{1,2}\/[^"']+)(["'])/g, (_, prefix, specifier, suffix) => (
      `${prefix}${rewrite(specifier)}${suffix}`
    ))
    .replace(/(\bimport\s+["'])(\.{1,2}\/[^"']+)(["'])/g, (_, prefix, specifier, suffix) => (
      `${prefix}${rewrite(specifier)}${suffix}`
    ));
};

const routeCandidates = (locale, pathname) => {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  if (!trimmed) return [join(pagesRoot, locale, 'index.astro')];
  const segments = trimmed.split('/');
  return [
    join(pagesRoot, locale, `${trimmed}.astro`),
    join(pagesRoot, locale, trimmed, 'index.astro'),
    join(pagesRoot, locale, ...segments.slice(0, -1), '[slug].astro'),
  ];
};

const targetRoutes = new Set(TARGETS.map((target) => target.route));
const nonPagePrefixes = ['/api/', '/audio/', '/fonts/', '/images/', '/scripts/', '/_astro/'];

const shouldLocalizeRoute = (pathname, locale) => {
  if (pathname === '/') return true;
  if (nonPagePrefixes.some((prefix) => pathname.startsWith(prefix))) return false;
  if (/^\/(?:favicon|og-|robots|sitemap)/.test(pathname)) return false;
  if (/^\/blog\/[^/]+\/$/.test(pathname)) return true;
  if (/^\/podcasts\/[^/]+\/$/.test(pathname)) return true;
  if (targetRoutes.has(pathname)) return true;
  return routeCandidates(locale, pathname).some(existsSync);
};

const localizeUrl = (rawUrl, locale) => {
  let pathname = rawUrl;
  let absolute = false;
  if (rawUrl.startsWith('https://tobyonfitnesstech.com/')) {
    pathname = rawUrl.slice('https://tobyonfitnesstech.com'.length);
    absolute = true;
  } else if (!rawUrl.startsWith('/')) {
    return rawUrl;
  }

  if (new RegExp(`^/(${LOCALES.join('|')})(/|$)`).test(pathname)) return rawUrl;
  const suffixIndex = pathname.search(/[?#]/);
  const suffix = suffixIndex >= 0 ? pathname.slice(suffixIndex) : '';
  const basePath = suffixIndex >= 0 ? pathname.slice(0, suffixIndex) : pathname;
  const normalizedPath = basePath.endsWith('/') || extname(basePath) ? basePath : `${basePath}/`;
  if (!shouldLocalizeRoute(normalizedPath, locale)) return rawUrl;

  const localized = `/${locale}${basePath === '/' ? '/' : basePath}${suffix}`;
  return absolute ? `https://tobyonfitnesstech.com${localized}` : localized;
};

const localizeInternalUrls = (content, locale) => content.replace(
  /(["'])(https:\/\/tobyonfitnesstech\.com\/[^"']*|\/[^"']*)\1/g,
  (match, quote, url) => `${quote}${localizeUrl(url, locale)}${quote}`,
);

const addLayoutLocalization = (content, target, locale) => {
  const match = content.match(/<Layout\b[\s\S]*?>/);
  if (!match) throw new Error('translated page is missing its Layout component');

  let tag = match[0]
    .replace(/\s+lang\s*=\s*["'][^"']*["']/g, '')
    .replace(/\s+translationBase\s*=\s*["'][^"']*["']/g, '');
  tag = tag.replace(/>$/, `\n  lang="${HTML_LANGS[locale]}"\n  translationBase="${target.route}"\n>`);
  return content.replace(match[0], tag);
};

const externalUrls = (value) => [...new Set(
  [...String(value).matchAll(/https?:\/\/[^\s"'<>\])]+/g)]
    .map((match) => match[0])
    .filter((url) => !url.startsWith('https://tobyonfitnesstech.com/')),
)];

const numericTokens = (value) => [...new Set(
  String(value).match(/\b\d[\d,.]*(?:%|[a-z]{1,4})?\b/gi) || [],
)];

const resolveImport = (fromFile, specifier) => {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [base, `${base}.js`, `${base}.jsx`, `${base}.ts`, `${base}.tsx`, `${base}.astro`, `${base}.json`, join(base, 'index.js')];
  return candidates.some(existsSync);
};

const validateTranslation = async (content, source, target, locale) => {
  const errors = [];
  if (!content.startsWith('---')) errors.push('missing Astro frontmatter');
  if (!content.includes('<Layout')) errors.push('missing Layout component');
  if (content.includes('```') || /<think>/i.test(content)) errors.push('contains model wrapper text');
  if (content === source) errors.push('translation is identical to English source');
  if (content.length < source.length * 0.62) errors.push('translation is unexpectedly short');
  if (content.length > source.length * 1.9) errors.push('translation is unexpectedly long');
  if (!content.includes(`lang="${HTML_LANGS[locale]}"`)) errors.push('missing locale language');
  if (!content.includes(`translationBase="${target.route}"`)) errors.push('missing translation base');

  const missingUrls = externalUrls(source).filter((url) => !content.includes(url));
  if (missingUrls.length) errors.push(`missing external URLs: ${missingUrls.slice(0, 3).join(', ')}`);

  const missingNumbers = numericTokens(source).filter((token) => !content.includes(token));
  if (missingNumbers.length) errors.push(`missing numeric tokens: ${missingNumbers.slice(0, 8).join(', ')}`);

  for (const match of content.matchAll(/\b(?:from|import)\s+["'](\.{1,2}\/[^"']+)["']/g)) {
    if (!resolveImport(outputPath(target, locale), match[1])) {
      errors.push(`unresolved import: ${match[1]}`);
    }
  }

  try {
    await parse(content, { position: true });
  } catch (error) {
    errors.push(`Astro parse failed: ${error?.message || error}`);
  }

  if (errors.length) throw new Error(errors.join('; '));
  return content;
};

const translate = async (target, locale) => {
  const source = await readFile(sourcePath(target), 'utf8');
  let lastError;

  for (let attempt = 1; attempt <= draftAttempts; attempt += 1) {
    try {
      const repairFeedback = lastError ? String(lastError?.message || lastError).slice(0, 1200) : '';
      const translated = runMiniMax(translationPrompt(target, locale, source, repairFeedback));
      const postProcessed = addLayoutLocalization(
        localizeInternalUrls(rewriteRelativeImports(translated, target, locale), locale),
        target,
        locale,
      );
      await validateTranslation(postProcessed, source, target, locale);
      return {
        sourceHash: sourceHash(target, source),
        promptVersion,
        model: MODEL,
        locale,
        source: target.source,
        route: target.route,
        translatedAt: new Date().toISOString(),
        content: postProcessed,
      };
    } catch (error) {
      lastError = error;
      if (attempt < draftAttempts) {
        console.warn(`Translation draft attempt ${attempt}/${draftAttempts} failed; regenerating`);
      }
    }
  }

  throw new Error(
    `Translation draft failed validation after ${draftAttempts} attempts: ${lastError?.message || lastError}`,
  );
};

const currentRecord = async (target, locale) => {
  const source = await readFile(sourcePath(target), 'utf8');
  const record = readJson(recordPath(target, locale));
  if (!record || record.sourceHash !== sourceHash(target, source)) return null;
  if (record.model !== MODEL || record.promptVersion !== promptVersion) return null;
  return record;
};

const readFailures = () => readJson(failuresPath, {});

const saveFailure = async (key, error) => {
  const failures = readFailures();
  const previous = failures[key] || { count: 0 };
  failures[key] = {
    count: Number(previous.count || 0) + 1,
    lastFailedAt: new Date().toISOString(),
    retryAfter: new Date(Date.now() + retryDelayMinutes * 60_000).toISOString(),
    error: String(error?.message || error).slice(0, 1200),
  };
  await writeJsonAtomic(failuresPath, failures);
};

const clearFailure = async (key) => {
  const failures = readFailures();
  if (!(key in failures)) return;
  delete failures[key];
  await writeJsonAtomic(failuresPath, failures);
};

const chooseTask = async (options) => {
  const failures = readFailures();
  const now = Date.now();
  for (const target of TARGETS) {
    if (options.source && options.source !== target.source) continue;
    for (const locale of LOCALES) {
      if (options.lang && options.lang !== locale) continue;
      if (!options.force && await currentRecord(target, locale)) continue;
      const key = `${target.source}:${locale}`;
      const retryAfter = Date.parse(failures[key]?.retryAfter || '');
      if (!options.force && Number.isFinite(retryAfter) && retryAfter > now) continue;
      return { target, locale, key };
    }
  }
  return null;
};

const buildStatus = async () => {
  let translated = 0;
  let completePages = 0;
  let publishedPages = 0;
  for (const target of TARGETS) {
    let complete = true;
    let published = true;
    for (const locale of LOCALES) {
      if (await currentRecord(target, locale)) translated += 1;
      else complete = false;
      if (!existsSync(outputPath(target, locale))) published = false;
    }
    if (complete) completePages += 1;
    if (published) publishedPages += 1;
  }
  const failures = readFailures();
  return {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    pages: TARGETS.length,
    locales: LOCALES,
    totalTranslations: TARGETS.length * LOCALES.length,
    translated,
    remaining: (TARGETS.length * LOCALES.length) - translated,
    completePages,
    publishedPages,
    failedTasks: Object.keys(failures).length,
    stagingRoot,
  };
};

const saveStatus = async () => {
  const status = await buildStatus();
  await writeJsonAtomic(statusPath, status);
  return status;
};

const translateOne = async (options) => {
  const task = await chooseTask(options);
  if (!task) {
    console.log(JSON.stringify({ outcome: 'idle', ...await saveStatus() }));
    return;
  }

  const { target, locale, key } = task;
  console.log(`Translating ${target.source} -> ${locale} with ${MODEL}`);
  try {
    const record = await translate(target, locale);
    await writeJsonAtomic(recordPath(target, locale), record);
    await clearFailure(key);
    console.log(JSON.stringify({ outcome: 'translated', source: target.source, locale, ...await saveStatus() }));
  } catch (error) {
    await saveFailure(key, error);
    await saveStatus();
    throw error;
  }
};

const promote = async () => {
  let promotedPages = 0;
  for (const target of TARGETS) {
    const records = [];
    for (const locale of LOCALES) records.push(await currentRecord(target, locale));
    if (records.some((record) => !record)) continue;

    const source = await readFile(sourcePath(target), 'utf8');
    for (let index = 0; index < LOCALES.length; index += 1) {
      const locale = LOCALES[index];
      const record = records[index];
      await validateTranslation(record.content, source, target, locale);
      const destination = outputPath(target, locale);
      await mkdir(dirname(destination), { recursive: true });
      const temporaryPath = `${destination}.tmp-${process.pid}`;
      await writeFile(temporaryPath, record.content, 'utf8');
      await rename(temporaryPath, destination);
    }
    promotedPages += 1;
  }
  console.log(JSON.stringify({ outcome: 'promoted', promotedPages, ...await saveStatus() }));
};

const validateOutput = async () => {
  let validatedPages = 0;
  for (const target of TARGETS) {
    const existing = LOCALES.filter((locale) => existsSync(outputPath(target, locale)));
    if (existing.length === 0) continue;
    if (existing.length !== LOCALES.length) {
      throw new Error(`${target.source} is only published for: ${existing.join(', ')}`);
    }
    const source = await readFile(sourcePath(target), 'utf8');
    for (const locale of LOCALES) {
      const content = await readFile(outputPath(target, locale), 'utf8');
      await validateTranslation(content, source, target, locale);
    }
    validatedPages += 1;
  }
  console.log(JSON.stringify({ outcome: 'valid', validatedPages, ...await saveStatus() }));
};

const command = process.argv[2] || 'status';
const options = parseArgs(process.argv.slice(3));
mkdirSync(stagingRoot, { recursive: true });

if (command === 'translate-one') await translateOne(options);
else if (command === 'promote') await promote();
else if (command === 'validate-output') await validateOutput();
else if (command === 'status') console.log(JSON.stringify(await saveStatus(), null, 2));
else if (command === 'clear') {
  rmSync(stagingRoot, { recursive: true, force: true });
  console.log(JSON.stringify({ outcome: 'cleared', stagingRoot }));
} else {
  throw new Error(`Unknown command: ${command}`);
}
