// Import approved, already-published cover artwork. Only small WebP derivatives
// enter the website repository; the full-size source stays on public GitHub.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const catalogPath = resolve(root, 'src/data/podcast-assets.json');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function importPodcastCover({ filename, bytes, source, catalog, publicDir, fetchSource = fetch }) {
  if (basename(filename) !== filename || !/^episode_\d{3,}_cover(?:_(?:de|es|hi|pt))?\.png$/.test(filename)) throw Error(`Invalid podcast cover filename: ${filename}`);
  const url = new URL(source);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !/^\/clawdassistant85-netizen\/openclaw-podcast-media-(?:en|de|es|hi|pt)\/releases\/download\/ep\d+\/episode_\d+_cover\.png$/.test(url.pathname)) throw Error('Cover source must be an existing public podcast release asset');
  const response = await fetchSource(source, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(`Published cover is unavailable: HTTP ${response.status}`);
  const published = Buffer.from(await response.arrayBuffer());
  if (hash(published) !== hash(bytes)) throw Error(`Staged ${filename} differs from the published GitHub cover`);
  const { width, height } = await sharp(bytes).metadata();
  const variants = [];
  const paths = [];
  for (const requested of [320, 640]) {
    const size = Math.min(requested, width);
    if (variants.some((variant) => variant.width === size)) continue;
    const src = `/images/podcast/${filename.replace(/\.png$/, '')}-${size}.webp`;
    const path = resolve(publicDir, `.${src}`);
    mkdirSync(dirname(path), { recursive: true });
    await sharp(bytes).resize({ width: size, withoutEnlargement: true }).webp({ quality: 78 }).toFile(path);
    variants.push({ width: size, src });
    paths.push(`frontend/public${src}`);
  }
  catalog.images[`/images/podcast/${filename}`] = { source, sha256: hash(bytes), width, height, variants };
  return paths;
}

async function main() {
  const args = process.argv.slice(2);
  const value = (name) => { const i = args.indexOf(name); return i < 0 || args[i + 1]?.startsWith('--') ? undefined : args[i + 1]; };
  const episode = Number(value('--episode'));
  const staging = value('--staging-dir');
  const names = args.flatMap((arg, i) => arg === '--cover' ? [args[i + 1]] : []);
  if (!Number.isInteger(episode) || episode < 0 || !staging || !names.length) throw Error('Provide --episode, --staging-dir and --cover');
  const catalog = existsSync(catalogPath) ? JSON.parse(readFileSync(catalogPath, 'utf8')) : { version: 1, images: {} };
  const paths = [];
  for (const filename of names) {
    const match = filename.match(/^episode_(\d{3,})_cover(?:_(de|es|hi|pt))?\.png$/);
    if (!match || Number(match[1]) !== episode) throw Error(`Cover does not belong to episode ${episode}`);
    const language = match[2] || 'en';
    const source = `https://github.com/clawdassistant85-netizen/openclaw-podcast-media-${language}/releases/download/ep${match[1]}/episode_${match[1]}_cover.png`;
    paths.push(...await importPodcastCover({ filename, bytes: readFileSync(resolve(staging, filename)), source, catalog, publicDir: resolve(root, 'public') }));
  }
  catalog.images = Object.fromEntries(Object.entries(catalog.images).sort(([a], [b]) => a.localeCompare(b)));
  const temporary = `${catalogPath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(catalog, null, 2)}\n`);
  renameSync(temporary, catalogPath);
  console.log(JSON.stringify({ paths: ['frontend/src/data/podcast-assets.json', ...paths] }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
