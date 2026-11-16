import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { refreshReport, validateReport } from '../refresh-gsc-report.mjs';

const now = new Date('2026-11-16T14:00:00Z');
const fixture = () => ({
  site: 'sc-domain:tobyonfitnesstech.com', generatedAt: now.toISOString(),
  periods: {
    current: { start: '2026-11-08', end: '2026-11-14', clicks: 0, impressions: 0, ctr: 0, position: 0 },
    prior: { start: '2026-11-01', end: '2026-11-07', clicks: 0, impressions: 0, ctr: 0, position: 0 },
  },
  sitemaps: [], dataQuality: { comparisonSafe: false },
});
test('retains a valid zero-activity degraded report without claiming comparison safety', () => {
  assert.equal(validateReport(fixture(), now).dataQuality.comparisonSafe, false);
});
test('rejects wrong property, stale timestamps, invalid windows and missing quality', () => {
  for (const mutate of [d => { d.site = 'another-site'; }, d => { d.generatedAt = '2026-10-19'; }, d => { d.generatedAt = 'invalid'; }, d => { d.periods.current.end = '2026-11-12'; }, d => { delete d.dataQuality; }, d => { d.sitemaps = {}; }]) {
    const data = fixture(); mutate(data); assert.throws(() => validateReport(data, now));
  }
});
test('rejects negative and nonnumeric aggregate values', () => {
  for (const value of [-1, '0', null, NaN, Infinity]) {
    const data = fixture(); data.periods.current.impressions = value;
    assert.throws(() => validateReport(data, now));
  }
});
test('writes matching dated and latest private snapshots atomically', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'gsc-refresh-'));
  try {
    const result = await refreshReport({ directory, now: () => now, collect: async () => JSON.stringify(fixture()) });
    assert.equal(readFileSync(result.latest, 'utf8'), readFileSync(result.dated, 'utf8'));
    assert.equal(statSync(result.latest).mode & 0o777, 0o600);
    assert.equal(result.comparisonSafe, false);
    assert.equal(readdirSync(directory).length, 2);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('provider and validation failures leave last-known evidence unchanged', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'gsc-refresh-'));
  try {
    writeFileSync(join(directory, 'latest.json'), 'last-known');
    for (const collect of [async () => { throw new Error('provider unavailable'); }, async () => '{bad json', async () => JSON.stringify({})]) {
      await assert.rejects(refreshReport({ directory, now: () => now, collect }));
      assert.equal(readFileSync(join(directory, 'latest.json'), 'utf8'), 'last-known');
      assert.deepEqual(readdirSync(directory), ['latest.json']);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
