import assert from 'node:assert/strict';
import test from 'node:test';

import { resolvePublicAsset } from '../../src/lib/publicAssets.ts';

test('uses an existing public asset before the fallback', () => {
  assert.equal(
    resolvePublicAsset(
      ['/images/podcast/show_art_en.png'],
      '/images/podcast/fallback.png',
    ),
    '/images/podcast/show_art_en.png',
  );
});

test('uses the fallback when every candidate is missing', () => {
  assert.equal(
    resolvePublicAsset(
      ['/images/podcast/episode_999_cover.png'],
      '/images/podcast/show_art_en.png',
    ),
    '/images/podcast/show_art_en.png',
  );
});
