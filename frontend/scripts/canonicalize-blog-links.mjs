import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import redirects from '../src/data/blog-redirects.json' with { type: 'json' };

export function canonicalBlogHref(value) {
  const match = value.match(/^(https?:\/\/(?:www\.)?tobyonfitnesstech\.com)?(\/(?:de\/|es\/|pt\/|hi\/)?blog\/)([^/?#]+)\/?([?#].*)?$/);
  if (!match || !redirects[match[3]]) return value;
  return `${match[1] ? 'https://tobyonfitnesstech.com' : ''}${match[2]}${redirects[match[3]]}/${match[4] || ''}`;
}

async function rewriteDirectory(directory) {
  let changed = 0;
  for (const entry of await readdir(directory, {withFileTypes:true})) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { changed += await rewriteDirectory(path); continue; }
    if (!/\.(html|xml)$/.test(entry.name)) continue;
    const source = await readFile(path, 'utf8');
    // Update link attributes and RSS item URLs, leaving prose and old-route
    // metadata intact. Query strings, fragments and language prefixes survive.
    const output = source.replace(/\bhref=(['"])(.*?)\1/g, (_, quote, href) => `href=${quote}${canonicalBlogHref(href)}${quote}`)
      .replace(/<(link|guid)(\s[^>]*)?>(https?:\/\/[^<]+)<\/\1>/g,
        (_, tag, attrs, url) => `<${tag}${attrs || ''}>${canonicalBlogHref(url)}</${tag}>`);
    if (output !== source) { await writeFile(path, output); changed++; }
  }
  return changed;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify({canonicalizedBlogLinksInFiles:await rewriteDirectory(resolve(process.argv[2] || 'dist'))}));
}
