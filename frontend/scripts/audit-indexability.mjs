import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

const SITE_ORIGIN = 'https://tobyonfitnesstech.com';
const DIST_DIR = resolve(process.cwd(), 'dist');

if (!existsSync(DIST_DIR)) {
  console.error('Indexability audit requires a completed Astro build in dist/.');
  process.exit(1);
}

const walk = (directory) => readdirSync(directory).flatMap((name) => {
  const path = join(directory, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

const files = walk(DIST_DIR);
const htmlFiles = files.filter((file) => extname(file) === '.html');
const fileSet = new Set(files.map((file) => relative(DIST_DIR, file).split(sep).join('/')));

const routeForHtml = (file) => {
  const name = relative(DIST_DIR, file).split(sep).join('/');
  if (name === 'index.html') return '/';
  if (name.endsWith('/index.html')) return `/${name.slice(0, -'index.html'.length)}`;
  return `/${name}`;
};

const routeSet = new Set(htmlFiles.map(routeForHtml));
const normalizeRoute = (pathname) => {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Keep the original path so malformed URLs are still reported.
  }
  if (decoded === '/') return '/';
  return decoded.endsWith('/') || extname(decoded) ? decoded : `${decoded}/`;
};

const routeExists = (pathname) => {
  const normalized = normalizeRoute(pathname);
  if (routeSet.has(normalized) || routeSet.has(pathname)) return true;
  const assetPath = pathname.replace(/^\//, '');
  return fileSet.has(assetPath) || fileSet.has(`${assetPath}/index.html`);
};

const sitemapFiles = files.filter((file) => /^sitemap.*\.xml$/.test(relative(DIST_DIR, file)));
const sitemapUrls = new Set();
for (const file of sitemapFiles) {
  const xml = readFileSync(file, 'utf8');
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = new URL(match[1]);
    if (url.origin === SITE_ORIGIN && !url.pathname.endsWith('.xml')) sitemapUrls.add(url.href);
  }
}

const failures = [];
const warnings = [];
const brokenLinks = new Map();

for (const urlString of sitemapUrls) {
  const url = new URL(urlString);
  const route = normalizeRoute(url.pathname);
  if (url.search || /\/(?:404|500|search)(?:\/|\.html)?$/.test(url.pathname)) {
    failures.push(`Junk URL is present in sitemap: ${urlString}`);
  }
  if (!routeExists(route)) {
    failures.push(`Sitemap URL has no generated HTML: ${urlString}`);
    continue;
  }

  const htmlFile = route === '/'
    ? join(DIST_DIR, 'index.html')
    : join(DIST_DIR, route.replace(/^\//, ''), 'index.html');
  const fallbackFile = join(DIST_DIR, route.replace(/^\//, ''));
  const sourceFile = existsSync(htmlFile) ? htmlFile : fallbackFile;
  const html = readFileSync(sourceFile, 'utf8');
  const canonicals = [...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const description = html.match(/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["'][^>]*>/i)?.[1]?.trim();

  if (canonicals.length !== 1) failures.push(`${route} has ${canonicals.length} canonical links; expected 1.`);
  if (canonicals.length === 1 && new URL(canonicals[0], SITE_ORIGIN).pathname !== url.pathname) {
    failures.push(`${route} canonical points to ${canonicals[0]} instead of its sitemap URL.`);
  }
  if (h1Count !== 1) failures.push(`${route} has ${h1Count} H1 elements; expected 1.`);
  if (!description) failures.push(`${route} has no non-empty meta description.`);
}

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const staticHtml = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  const sourceRoute = routeForHtml(file);
  for (const match of staticHtml.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    const href = match[1].trim();
    if (!href || href.startsWith('#') || /^(?:mailto|tel|javascript|data):/i.test(href)) continue;

    let target;
    try {
      target = new URL(href, new URL(sourceRoute, SITE_ORIGIN));
    } catch {
      brokenLinks.set(`${sourceRoute} -> ${href}`, 'malformed URL');
      continue;
    }
    if (target.origin !== SITE_ORIGIN) continue;
    if (!routeExists(target.pathname)) brokenLinks.set(`${sourceRoute} -> ${href}`, target.pathname);
  }
}

for (const [link] of brokenLinks) failures.push(`Broken internal link: ${link}`);

const robotsPath = join(DIST_DIR, 'robots.txt');
if (!existsSync(robotsPath)) {
  failures.push('robots.txt is missing from the build.');
} else {
  const robots = readFileSync(robotsPath, 'utf8');
  if (!robots.includes(`${SITE_ORIGIN}/sitemap-index.xml`)) warnings.push('robots.txt does not advertise sitemap-index.xml.');
}

console.log(`Indexability audit: ${sitemapUrls.size} sitemap URLs, ${htmlFiles.length} HTML files, ${brokenLinks.size} broken internal links.`);
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (failures.length > 0) {
  for (const failure of failures.slice(0, 100)) console.error(`ERROR: ${failure}`);
  if (failures.length > 100) console.error(`ERROR: ${failures.length - 100} additional failures omitted.`);
  process.exit(1);
}

console.log('Indexability audit passed.');
