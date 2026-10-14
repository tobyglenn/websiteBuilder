import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { staticTranslationRoutes } from '../../src/lib/staticTranslationRoutes.mjs';

test('static alternates include only real translations with an English counterpart', () => {
  const root = mkdtempSync(join(tmpdir(), 'toft-hreflang-'));
  try {
    for (const path of ['index.astro', 'de/index.astro', 'es/index.astro', 'about.astro', 'de/about.astro', 'hi/orphan.astro', 'blog/example.md', 'pt/blog/example.astro', '[locale]/video/[id].astro', 'video/[id].astro', 'gear.astro']) {
      mkdirSync(dirname(join(root,path)), {recursive:true});
      writeFileSync(join(root,path), '');
    }
    const routes = staticTranslationRoutes(root);
    assert.deepEqual(routes.get('/'), ['en','es','de']);
    assert.deepEqual(routes.get('/about/'), ['en','de']);
    assert.deepEqual(routes.get('/blog/example/'), ['en','pt']);
    assert.equal(routes.has('/orphan/'), false);
    assert.equal(routes.has('/gear/'), false);
    assert.equal(routes.has('/video/[id]/'), false);
    assert.equal(routes.size, 3);
  } finally { rmSync(root, {recursive:true, force:true}); }
});
