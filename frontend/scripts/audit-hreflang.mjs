import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const dist = resolve(process.argv[2] || 'dist');
const origin = 'https://tobyonfitnesstech.com';
const urls = new Set(readdirSync(dist).filter(name => /^sitemap.*\.xml$/.test(name)).flatMap(name =>
  [...readFileSync(join(dist, name), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
).filter(url => !new URL(url).pathname.endsWith('.xml')));
if (!urls.size) throw new Error('Hreflang audit requires a completed build with sitemap URLs.');
const pages = new Map();
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)=["']([^"']*)["']/g)].map(m => [m[1], m[2]]));
for (const url of urls) {
  const path = new URL(url).pathname;
  const html = readFileSync(join(dist, path, 'index.html'), 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  const alternates = [...head.matchAll(/<link\b[^>]*>/g)].map(m => attributes(m[0])).filter(a => a.rel === 'alternate' && a.hreflang && a.hreflang !== 'x-default');
  pages.set(url, { alternates, lang: html.match(/<html\b[^>]*\blang="([^"]+)"/)?.[1]?.split('-')[0] });
}
const failures = [];
let edges = 0;
for (const [url, page] of pages) {
  if (page.alternates.length && !page.alternates.some(a => a.href === url && a.hreflang.split('-')[0] === page.lang)) failures.push(`${url}: missing self alternate`);
  for (const alternate of page.alternates) {
    edges++;
    const target = pages.get(alternate.href);
    if (!target) { failures.push(`${url}: alternate is not an indexable sitemap page: ${alternate.href}`); continue; }
    if (target.lang !== alternate.hreflang.split('-')[0]) failures.push(`${url}: wrong language for ${alternate.href}`);
    if (!target.alternates.some(a => a.href === url && a.hreflang.split('-')[0] === page.lang)) failures.push(`${url}: missing return link from ${alternate.href}`);
  }
}
console.log(`Hreflang audit: ${pages.size} sitemap pages, ${edges} language links, ${failures.length} failures.`);
if (failures.length) { console.error(failures.slice(0, 30).join('\n')); process.exitCode = 1; }
