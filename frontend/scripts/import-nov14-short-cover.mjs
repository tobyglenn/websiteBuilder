// Import the already-published, approved bonus cover. No publication/network mutation.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const base = new URL('../', import.meta.url);
const catalogPath = new URL('src/data/podcast-assets.json', base);
const filename = 'agent-stack-shorts-2026-11-14-cover.png';
const source = `https://github.com/clawdassistant85-netizen/openclaw-podcast-media-en/releases/download/agent-stack-shorts-2026-11-14-v2/${filename}`;
const response = await fetch(source);
if (!response.ok) throw Error(`Cover HTTP ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
const sha256 = createHash('sha256').update(bytes).digest('hex');
if (sha256 !== '14aa108fc3ab4dd51ddef5632fd105ec50006db1c8eee35992bff4912dff635c') throw Error('Published artwork hash mismatch');
const { width, height } = await sharp(bytes).metadata();
const variants = [];
for (const size of [320, 640]) {
  const src = `/images/podcast/${filename.replace('.png', '')}-${size}.webp`;
  await sharp(bytes).resize(size).webp({ quality: 78 }).toFile(new URL(`public${src}`, base).pathname);
  variants.push({ width: size, src });
}
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
catalog.images[`/images/podcast/${filename}`] = { source, sha256, width, height, variants };
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
