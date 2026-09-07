import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const audit = fileURLToPath(new URL('../audit-indexability.mjs', import.meta.url));
const context = 'https://schema.org';
const person = { '@context': context, '@type': 'Person', name: 'Example' };
const website = { '@context': context, '@type': 'WebSite', url: 'https://tobyonfitnesstech.com/' };

function runAudit(schemas) {
  const cwd = mkdtempSync(join(tmpdir(), 'indexability-test-'));
  try {
    mkdirSync(join(cwd, 'dist'));
    writeFileSync(join(cwd, 'dist', 'index.html'), schemas.map((schema) => (
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    )).join('\n'));
    writeFileSync(join(cwd, 'dist', 'robots.txt'), 'Sitemap: https://tobyonfitnesstech.com/sitemap-index.xml\n');
    return spawnSync(process.execPath, [audit], { cwd, encoding: 'utf8' });
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

test('accepts separate context-bearing objects without changing their schema data', () => {
  const result = runAudit([person, website]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /2 JSON-LD scripts/);
});

test('rejects the former top-level array that triggers the Safari TypeError', () => {
  const result = runAudit([[person, website]]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Safari compatibility/);
});

test('rejects empty arrays, absent contexts, and non-string contexts', () => {
  for (const schema of [[], null, 'invalid', {}, { '@context': [] }, { '@context': ' ' }]) {
    const result = runAudit([schema]);
    assert.equal(result.status, 1, JSON.stringify(schema));
    assert.match(result.stderr, /Safari compatibility/);
  }
});

test('allows nested arrays and graph nodes that inherit the root context', () => {
  const result = runAudit([{
    '@context': context,
    '@graph': [{ '@type': 'Person', name: 'Example', sameAs: ['https://example.com/'] }],
  }]);
  assert.equal(result.status, 0, result.stderr);
});

test('still inspects nested Product nodes for existing eligibility failures', () => {
  const result = runAudit([{
    '@context': context,
    '@graph': [{ '@type': 'Product', name: 'Example' }],
  }]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /neither review nor aggregateRating/);
});
