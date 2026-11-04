// Fails the build when a page or script grows past the performance budget, so
// regressions like inlining a data catalog into HTML get caught before deploy.
//
//   HTML page: 300 KB uncompressed
//   Script chunk in dist/_astro: 100 KB gzipped
//
// Raise a limit only with a reason in EXCEPTIONS.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = process.argv[2] || 'dist';
const HTML_LIMIT = 300 * 1024;
const SCRIPT_GZIP_LIMIT = 100 * 1024;

// Known heavy pages, capped near today's size so they can't grow unnoticed.
const EXCEPTIONS = [
  { pattern: /^(?:(?:de|es|pt|hi)\/)?blog\/index\.html$/, limit: 600 * 1024, reason: 'lists every article; needs pagination' },
  { pattern: /^(?:(?:de|es|pt|hi)\/)?compare\/index\.html$/, limit: 460 * 1024, reason: 'localized copies embed the whole release catalog' },
  { pattern: /^(?:(?:de|es|pt|hi)\/)?races\/index\.html$/, limit: 340 * 1024, reason: 'renders every race in one table' },
];
const limitFor = (path, fallback) => EXCEPTIONS.find((rule) => rule.pattern.test(path))?.limit ?? fallback;

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
const failures = [];
let pages = 0;
let largestPage = { path: '', size: 0 };

const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'pagefind' || entry.name === '_variants') continue;
      walk(path);
    } else if (entry.name.endsWith('.html')) {
      pages += 1;
      const rel = relative(dist, path);
      const size = statSync(path).size;
      if (size > largestPage.size) largestPage = { path: rel, size };
      const limit = limitFor(rel, HTML_LIMIT);
      if (size > limit) failures.push(`${rel}: ${kb(size)} HTML (limit ${kb(limit)})`);
    }
  }
};
walk(dist);

const astroDir = join(dist, '_astro');
let largestScript = { path: '', size: 0 };
for (const name of readdirSync(astroDir)) {
  if (!/\.m?js$/.test(name)) continue;
  const rel = `_astro/${name}`;
  const size = gzipSync(readFileSync(join(astroDir, name))).length;
  if (size > largestScript.size) largestScript = { path: rel, size };
  const limit = limitFor(rel, SCRIPT_GZIP_LIMIT);
  if (size > limit) failures.push(`${rel}: ${kb(size)} gzipped script (limit ${kb(limit)})`);
}

console.log(
  `Page budget: ${pages} pages, largest ${largestPage.path} (${kb(largestPage.size)}); ` +
    `largest script ${largestScript.path} (${kb(largestScript.size)} gzipped).`,
);
if (failures.length) {
  console.error(`Over budget:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
