import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:tobyonfitnesstech.com';
const SITEMAP_URL = process.env.GSC_SITEMAP_URL || 'https://tobyonfitnesstech.com/sitemap-index.xml';
const API_BASE = 'https://searchconsole.googleapis.com/webmasters/v3';
const STATE_FILE = process.env.GSC_SITEMAP_SUBMISSION_STATE
  || '/home/toby/.openclaw/state/website-gsc-sitemap-submission.json';
const LOCALES = ['de', 'es', 'pt', 'hi'];

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const dryRun = args.has('--dry-run');

const credentialCandidates = [
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  join(homedir(), '.config/gcloud/application_default_credentials.json'),
].filter(Boolean);

const readCredentialMetadata = () => {
  for (const filename of credentialCandidates) {
    if (!existsSync(filename)) continue;
    return JSON.parse(readFileSync(filename, 'utf8'));
  }
  return {};
};

const credentialMetadata = readCredentialMetadata();
const quotaProject = process.env.GSC_QUOTA_PROJECT || credentialMetadata.quota_project_id || '';

const getAccessToken = () => {
  if (process.env.GSC_ACCESS_TOKEN) return process.env.GSC_ACCESS_TOKEN.trim();
  for (const command of ['gcloud', join(homedir(), 'google-cloud-sdk/bin/gcloud')]) {
    try {
      return execFileSync(
        command,
        ['auth', 'application-default', 'print-access-token'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim();
    } catch {
      // Try the next known gcloud location.
    }
  }
  throw new Error('Google Search Console credentials are unavailable.');
};

const extractLocations = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1].replaceAll('&amp;', '&'));

const fetchText = async (url) => {
  const response = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!response.ok) throw new Error(`Unable to fetch ${url}: HTTP ${response.status}`);
  return response.text();
};

const readLiveSitemap = async () => {
  const indexXml = await fetchText(SITEMAP_URL);
  const sitemapUrls = extractLocations(indexXml).filter((url) => url.endsWith('.xml'));
  if (!sitemapUrls.length) throw new Error('Sitemap index contains no child sitemaps.');

  const pageUrls = [];
  for (const sitemapUrl of sitemapUrls) {
    pageUrls.push(...extractLocations(await fetchText(sitemapUrl)));
  }
  const uniqueUrls = [...new Set(pageUrls)].sort();
  if (!uniqueUrls.length) throw new Error('Live child sitemaps contain no page URLs.');

  const localizedBlogCounts = Object.fromEntries(LOCALES.map((locale) => [locale, 0]));
  for (const url of uniqueUrls) {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/^\/(de|es|pt|hi)\/blog\/[^/]+\/$/);
    if (match && !['consistency', 'exercises'].includes(pathname.split('/').at(-2))) {
      localizedBlogCounts[match[1]] += 1;
    }
  }

  const counts = Object.values(localizedBlogCounts);
  if (Math.min(...counts) !== Math.max(...counts)) {
    throw new Error(`Localized blog sitemap counts are unbalanced: ${JSON.stringify(localizedBlogCounts)}`);
  }

  return {
    sitemapUrls,
    pageUrls: uniqueUrls,
    localizedBlogCounts,
    signature: createHash('sha256').update(uniqueUrls.join('\n')).digest('hex'),
  };
};

const readState = () => {
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
};

const writeState = async (value) => {
  await mkdir(dirname(STATE_FILE), { recursive: true });
  const temporaryPath = `${STATE_FILE}.tmp-${process.pid}`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, STATE_FILE);
};

const live = await readLiveSitemap();
const previous = readState();
if (!force && previous?.signature === live.signature) {
  console.log(JSON.stringify({
    outcome: 'unchanged',
    sitemap: SITEMAP_URL,
    pageCount: live.pageUrls.length,
    localizedBlogCounts: live.localizedBlogCounts,
    lastSubmittedAt: previous.submittedAt,
  }));
  process.exit(0);
}

if (dryRun) {
  console.log(JSON.stringify({
    outcome: 'dry-run',
    sitemap: SITEMAP_URL,
    pageCount: live.pageUrls.length,
    localizedBlogCounts: live.localizedBlogCounts,
    changed: previous?.signature !== live.signature,
  }));
  process.exit(0);
}

const token = getAccessToken();
const response = await fetch(
  `${API_BASE}/sites/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
  {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token}`,
      ...(quotaProject ? { 'x-goog-user-project': quotaProject } : {}),
    },
  },
);

if (!response.ok) {
  const body = await response.text();
  throw new Error(`Google sitemap submission failed (${response.status}): ${body.slice(0, 1000)}`);
}

const state = {
  submittedAt: new Date().toISOString(),
  sitemap: SITEMAP_URL,
  signature: live.signature,
  pageCount: live.pageUrls.length,
  localizedBlogCounts: live.localizedBlogCounts,
};
await writeState(state);
console.log(JSON.stringify({ outcome: 'submitted', ...state }));
