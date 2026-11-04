import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { podcastAsset, publicImageUrl, publicPreviewUrl } from '../../src/lib/podcastAssets.mjs';
import { imageVariants } from '../../src/lib/imageVariants.mjs';
import { importPodcastCover } from '../sync-podcast-assets.mjs';

const root = resolve(import.meta.dirname, '../..');
const catalog = JSON.parse(readFileSync(join(root, 'src/data/podcast-assets.json')));

test('every migrated image has public GitHub provenance and small local WebP previews', async () => {
  assert.ok(Object.keys(catalog.images).length >= 642);
  const previewHashes = new Map();
  for (const [legacy, image] of Object.entries(catalog.images)) {
    assert.match(legacy, /^\/images\/podcast\/[\w.-]+\.(?:png|jpe?g)$/);
    assert.match(image.source, /^https:\/\/(?:github\.com\/clawdassistant85-netizen\/openclaw-podcast-media-(?:en|de|es|hi|pt)\/releases\/download\/|raw\.githubusercontent\.com\/(?:grayking-creator\/openclaw-podcast|tobyglenn\/websiteBuilder)\/[a-f0-9]{40}\/)/);
    assert.match(image.sha256, /^[a-f0-9]{64}$/);
    assert.equal(publicImageUrl(legacy), image.source);
    assert.equal(publicPreviewUrl(legacy), image.variants.at(-1).src);
    assert.deepEqual(podcastAsset(image.source), image);
    for (const variant of image.variants) {
      if (previewHashes.has(variant.src)) assert.equal(previewHashes.get(variant.src), image.sha256, `Different originals share ${variant.src}`);
      previewHashes.set(variant.src, image.sha256);
      assert.match(variant.src, /^\/images\/podcast\/[\w-]+-(?:320|640)\.webp$/);
      const file = join(root, 'public', variant.src);
      const meta = await sharp(file).metadata();
      assert.equal(meta.width, variant.width);
      assert.equal(meta.format, 'webp');
      assert.ok(readFileSync(file).length < 100000);
    }
    assert.equal(imageVariants(legacy, '176px').src, image.variants[0].src);
  }
  assert.equal(readdirSync(join(root, 'public/images/podcast')).some(name => /\.(?:png|jpe?g)$/i.test(name)), false);
});

test('import verifies published bytes before writing and never stores the original', async (t) => {
  const publicDir = mkdtempSync(join(tmpdir(), 'podcast-import-'));
  t.after(() => rmSync(publicDir, { recursive: true, force: true }));
  const bytes = await sharp({ create: { width: 1400, height: 1400, channels: 3, background: '#224466' } }).png().toBuffer();
  const filename = 'episode_127_cover_de.png';
  const source = 'https://github.com/clawdassistant85-netizen/openclaw-podcast-media-de/releases/download/ep127/episode_127_cover.png';
  const imported = { version: 1, images: {} };
  const args = { filename, bytes, source, catalog: imported, publicDir };
  await assert.rejects(importPodcastCover({ ...args, fetchSource: async () => new Response('wrong image') }), /differs/);
  assert.deepEqual(imported.images, {});
  await assert.rejects(importPodcastCover({ ...args, fetchSource: async () => new Response('', { status: 404 }) }), /HTTP 404/);
  await assert.rejects(importPodcastCover({ ...args, filename: '../escape.png' }), /Invalid/);
  await assert.rejects(importPodcastCover({ ...args, source: 'https://example.org/cover.png' }), /public podcast release/);
  const paths = await importPodcastCover({ ...args, fetchSource: async () => new Response(bytes) });
  assert.equal(paths.length, 2);
  assert.equal(existsSync(join(publicDir, 'images/podcast', filename)), false);
  assert.equal(imported.images[`/images/podcast/${filename}`].source, source);
  assert.equal((await sharp(join(publicDir, 'images/podcast/episode_127_cover_de-640.webp')).metadata()).width, 640);
});
