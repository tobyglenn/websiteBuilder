import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const publicDir = join(root, 'public/images/podcast');
if (readdirSync(publicDir).some(name => /\.(?:png|jpe?g)$/i.test(name))) throw Error('Full-size podcast originals must stay on public GitHub');
const catalog = JSON.parse(readFileSync(join(root, 'src/data/podcast-assets.json')));
for (const image of Object.values(catalog.images)) {
  if (!image.source.startsWith('https://github.com/') && !image.source.startsWith('https://raw.githubusercontent.com/')) throw Error('Invalid podcast original URL');
  for (const variant of image.variants) if (!existsSync(join(root, 'public', variant.src))) throw Error(`Missing preview ${variant.src}`);
}
const dist = join(root, 'dist');
let count = 0;
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith('.html')) {
      const html = readFileSync(path, 'utf8');
      const broken = /(?:src|content)=["'](?:https:\/\/tobyonfitnesstech\.com)?\/images\/podcast\/[^"']+\.(?:png|jpe?g)(?:[?#][^"']*)?["']/i;
      if (broken.test(html)) throw Error(`Legacy podcast original still rendered in ${path}`);
      count++;
    }
  }
};
walk(dist);
console.log(`Podcast assets: ${Object.keys(catalog.images).length} public originals, WebP previews present, ${count} HTML pages checked`);
