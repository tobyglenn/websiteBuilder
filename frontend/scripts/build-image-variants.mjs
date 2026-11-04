// Generates resized WebP copies of local artwork used on cards and article
// heroes, so a 160px thumbnail no longer downloads a 3 MB PNG.
//
// Output (both gitignored, rebuilt as needed):
//   public/_variants/<path>-<width>.webp   copied to dist/ by Astro
//   .cache/image-variants.json            read by src/lib/imageVariants.mjs
//
// Unchanged sources are skipped, so repeat runs are fast. Any image without a
// variant keeps rendering from its original file.
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const publicDir = join(root, 'public');
const outputDir = join(publicDir, '_variants');
const manifestPath = join(root, '.cache', 'image-variants.json');

const SOURCE_DIRS = ['images/blog', 'images/projects', 'images/gear', 'images/about', 'images/comparison', 'progress'];
const WIDTHS = [480, 960, 1600];
const MIN_SOURCE_BYTES = 60 * 1024; // smaller files are already cheap
const QUALITY = 78;

const sources = [];
const walk = (directory) => {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(png|jpe?g|webp)$/i.test(entry.name) && statSync(path).size >= MIN_SOURCE_BYTES) sources.push(path);
  }
};
SOURCE_DIRS.forEach((dir) => walk(join(publicDir, dir)));

const images = {};
let generated = 0;
let failed = 0;

async function processImage(sourcePath) {
  const publicPath = `/${relative(publicDir, sourcePath).split('\\').join('/')}`;
  const sourceMtime = statSync(sourcePath).mtimeMs;
  const base = publicPath.slice(1).replace(/\.[^.]+$/, '');
  try {
    const { width: sourceWidth, height: sourceHeight } = await sharp(sourcePath).metadata();
    if (!sourceWidth || !sourceHeight) return;
    const widths = [...new Set(WIDTHS.map((width) => Math.min(width, sourceWidth)))];
    const variants = [];
    for (const width of widths) {
      const outputPath = join(outputDir, `${base}-${width}.webp`);
      if (!existsSync(outputPath) || statSync(outputPath).mtimeMs < sourceMtime) {
        mkdirSync(dirname(outputPath), { recursive: true });
        await sharp(sourcePath).resize({ width, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(outputPath);
        generated += 1;
      }
      variants.push({ width, src: `/_variants/${base}-${width}.webp` });
    }
    images[publicPath] = { width: sourceWidth, height: sourceHeight, variants };
  } catch (error) {
    failed += 1;
    console.warn(`[image-variants] skipped ${publicPath}: ${error.message}`);
  }
}

const started = Date.now();
const queue = [...sources];
const workers = Array.from({ length: Math.max(1, Math.min(4, availableParallelism())) }, async () => {
  while (queue.length) await processImage(queue.shift());
});
await Promise.all(workers);

mkdirSync(dirname(manifestPath), { recursive: true });
writeFileSync(manifestPath, `${JSON.stringify({ version: 1, images }, null, 0)}\n`);
console.log(
  `[image-variants] ${Object.keys(images).length} images, ${generated} files written, ${failed} failed in ${((Date.now() - started) / 1000).toFixed(1)}s`,
);
