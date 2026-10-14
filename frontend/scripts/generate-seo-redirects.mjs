import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const dist = resolve(process.argv[2] || 'dist');
const output = resolve(process.argv[3] || 'seo-redirects.csv');
const origin = 'https://tobyonfitnesstech.com';
const host = new URL(origin).host;
const locales = ['de','es','pt','hi'];
const urls = new Set(readdirSync(dist).filter(name => /^sitemap.*\.xml$/.test(name)).flatMap(name =>
  [...readFileSync(join(dist, name), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
).filter(url => new URL(url).origin === origin && !new URL(url).pathname.endsWith('.xml')));
if (!urls.size) throw new Error('Build the site before generating redirects.');
const redirects = new Map();
const add = (source, target) => {
  if (redirects.has(source) && redirects.get(source) !== target) throw new Error(`Conflicting source: ${source}`);
  if (source === target || `https://${source}` === target) throw new Error(`Redirect loop: ${source}`);
  redirects.set(source, target);
};
for (const url of urls) {
  const path = new URL(url).pathname;
  add(`www.${host}${path}`, url);
  if (path !== '/' && path.endsWith('/')) {
    add(`${host}${path.slice(0,-1)}`, url);
    add(`www.${host}${path.slice(0,-1)}`, url);
  }
}
const aliases = new Map();
const alias = (path, target, requirePage = true) => {
  if (urls.has(`${origin}${path}`)) throw new Error(`Would redirect live page: ${path}`);
  if (requirePage && !urls.has(`${origin}${target}`)) throw new Error(`Missing alias destination: ${target}`);
  aliases.set(path, target);
};
for (const locale of locales) {
  alias(`/podcasts/${locale}/`, `/${locale}/podcasts/`);
}
for (const locale of ['', ...locales]) {
  const prefix = locale ? `/${locale}` : '';
  alias(`${prefix}/podcasts/openclaw/`, `${prefix}/podcasts/agentstack/`);
}
// Localized TOFT aliases never had localized episode content. Preserve the
// episode identity by going to the actual English episode, not a show index.
for (const url of urls) {
  const path = new URL(url).pathname;
  if (/^\/podcasts\/toft-[^/]+\/$/.test(path)) {
    for (const locale of locales) {
      if (!urls.has(`${origin}/${locale}${path}`)) alias(`/${locale}${path}`, path);
    }
  }
}
alias('/gear/openclaw-mac-studio/', '/gear/openclaw-m1-mac-mini/');
alias('/activity/sleep', '/sleep/');
alias('/activity/workout', '/training-log/');
for (const path of ['/feed','/feed/','/blog/rss.xml']) alias(path, '/rss.xml', false);
const malformed = JSON.parse(readFileSync(new URL('./seo-malformed-podcast-paths.json', import.meta.url), 'utf8'));
for (const path of malformed) {
  const target = path.match(/^(\/(?:de\/|es\/|pt\/|hi\/)?podcasts\/episode-\d+\/)/)?.[1];
  if (!target) throw new Error(`Invalid malformed-path mapping: ${path}`);
  alias(path, target);
}
// Read redirect stubs from the actual build to include automatic and manual aliases.
for (const locale of ['', ...locales]) {
  const prefix = locale ? `/${locale}` : '';
  const directory = join(dist, prefix, 'blog');
  for (const entry of readdirSync(directory, {withFileTypes:true})) {
    if (!entry.isDirectory()) continue;
    const htmlPath = join(directory, entry.name, 'index.html');
    if (!existsSync(htmlPath)) continue;
    const html = readFileSync(htmlPath, 'utf8');
    if (!/http-equiv=["']refresh["']/i.test(html)) continue;
    const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
    if (!canonical || new URL(canonical).origin !== origin) throw new Error(`Invalid blog redirect: ${htmlPath}`);
    alias(`${prefix}/blog/${entry.name}/`, new URL(canonical).pathname);
  }
}
for (const [path, target] of aliases) {
  const variants = new Set([path]);
  if (path.endsWith('/')) variants.add(path.slice(0,-1));
  // These historical activity aliases were directory URLs.
  if (path.startsWith('/activity/')) variants.add(`${path}/`);
  for (const variant of variants) {
    const encoded = new URL(variant, origin).pathname;
    for (const sourceHost of [host, `www.${host}`]) add(`${sourceHost}${encoded}`, `${origin}${target}`);
  }
}
// Cloudflare CSV: source,target,status,preserve query,include subdomains,
// subpath matching,preserve suffix. No scheme matches HTTP and HTTPS.
const csv = [...redirects].sort(([a],[b]) => a.localeCompare(b)).map(([source,target]) =>
  [source,target,'301','TRUE','FALSE','FALSE','FALSE'].map(v => `"${v.replaceAll('"','""')}"`).join(',')
).join('\n')+'\n';
writeFileSync(output, csv);
console.log(JSON.stringify({sitemapPages:urls.size,legacyPaths:aliases.size,redirectRows:redirects.size,output}));
