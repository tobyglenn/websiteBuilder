import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { checkArtifact, checkSource } from '../check-whoop-public-boundary.mjs';
import { projectWhoopPublicSummary } from '../../src/lib/whoopPublicSummary.mjs';

const summaryPath = 'frontend/src/data/whoop-public-summary.json';
const rawPath = 'frontend/src/data/whoop_v2_latest.json';
const summary = () => projectWhoopPublicSummary({
  last_synced: '2026-01-10T14:00:00Z',
  recovery: { records: [
    { id: 'synthetic-id-1', created_at: '2026-01-06T12:00:00Z', score: { recovery_score: 60, hrv_rmssd_milli: 30 } },
    { id: 'synthetic-id-2', created_at: '2026-01-07T12:00:00Z', score: { recovery_score: 70, hrv_rmssd_milli: 40 } },
    { id: 'synthetic-id-3', created_at: '2026-01-08T12:00:00Z', score: { recovery_score: 80, hrv_rmssd_milli: 50 } },
  ] },
  sleep: { records: [] }, workouts: { records: [] }, cycle: { records: [] },
});

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'whoop-boundary-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, {
    cwd: root, env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' }, stdio: 'ignore',
  });
  const file = (name, data) => {
    const dest = path.join(root, name);
    mkdirSync(path.dirname(dest), { recursive: true });
    writeFileSync(dest, data);
    return dest;
  };
  git('init', '--initial-branch=main');
  file(summaryPath, JSON.stringify(summary()));
  git('add', '--', summaryPath);
  git('-c', 'user.email=test@example.invalid', '-c', 'user.name=Test', 'commit', '--no-gpg-sign', '-m', 'synthetic clean source');
  return { root, git, file };
}

test('valid worktree, index and committed summary are allowed', t => {
  const { root } = fixture(t);
  assert.doesNotThrow(() => checkSource(root));
  assert.doesNotThrow(() => checkSource(root, 'HEAD'));
});

test('unexpected raw fields in working or staged summary are rejected without logging values', t => {
  const { root, file, git } = fixture(t);
  const forbidden = { ...summary(), raw: { id: 'SYNTHETIC_PRIVATE_VALUE' } };
  const safeError = err => /allowlist schema/.test(err.message) && !err.message.includes('SYNTHETIC_PRIVATE_VALUE');
  file(summaryPath, JSON.stringify(forbidden));
  assert.throws(() => checkSource(root), safeError);
  git('add', '--', summaryPath);
  file(summaryPath, JSON.stringify(summary()));
  assert.throws(() => checkSource(root), safeError);
  git('-c', 'user.email=test@example.invalid', '-c', 'user.name=Test', 'commit', '--no-gpg-sign', '-m', 'synthetic wrong summary');
  assert.throws(() => checkSource(root, 'HEAD'), safeError);
});

test('raw filename is blocked even if untracked, ignored, or already staged', t => {
  const { root, file, git } = fixture(t);
  file('.gitignore', '/frontend/src/data/whoop_v2_latest.json\n');
  const raw = file(rawPath, 'synthetic file; checker should not read this');
  assert.throws(() => checkSource(root), /Raw WHOOP filename/);
  git('add', '-f', '--', rawPath);
  rmSync(raw);
  assert.throws(() => checkSource(root), /Raw WHOOP filename/);
  git('-c', 'user.email=test@example.invalid', '-c', 'user.name=Test', 'commit', '--no-gpg-sign', '-m', 'synthetic legacy exposure');
  assert.throws(() => checkSource(root, 'HEAD'), /Raw WHOOP filename/);
  git('rm', '--cached', '--', rawPath);
  assert.doesNotThrow(() => checkSource(root));
});

test('safe artifact with weekly chart data passes; disguised raw envelope and known raw filenames fail', async t => {
  const { root, file } = fixture(t);
  const artifact = path.join(root, 'dist');
  file('dist/whoop/index.html', '<script type="application/json">' + JSON.stringify(summary()) + '</script>');
  await assert.doesNotReject(() => checkArtifact(artifact));
  const disguised = file('dist/assets/missing-name.js', 'export const a={last_synced:"SYNTHETIC",recovery:{records:[]},sleep:{records:[]},cycle:{records:[]},workouts:{records:[]}};');
  await assert.rejects(() => checkArtifact(artifact), /Raw WHOOP export schema/);
  rmSync(disguised);
  const retained = file('dist/assets/old-build.js', 'export default {whoopDataPath:"SYNTHETIC_PRIVATE_PATH"};');
  await assert.rejects(() => checkArtifact(artifact), err => /Legacy WHOOP private fields/.test(err.message) && !err.message.includes('SYNTHETIC_PRIVATE_PATH'));
  rmSync(retained);
  file('dist/assets/whoop_v2_latest.json', 'synthetic');
  await assert.rejects(() => checkArtifact(artifact), /Raw WHOOP filename/);
});

test('artifact guard does not follow symlinks outside the output boundary', async t => {
  const { root, file } = fixture(t);
  const secret = file('synthetic-private.json', '{}');
  mkdirSync(path.join(root, 'dist'));
  symlinkSync(secret, path.join(root, 'dist/renamed.json'));
  await assert.rejects(() => checkArtifact(path.join(root, 'dist')), /Unexpected symlink/);
});

test('generated summaries cannot retain legacy private path, timestamp or latest daily sample', t => {
  const { root, file, git } = fixture(t);
  const homepage = 'frontend/src/data/homepageFitnessData.json';
  const metrics = 'frontend/src/data/siteMetrics.json';
  const rejected = [
    { source: { whoopDataPath: 'SYNTHETIC_PATH' } },
    { source: { whoopLastSynced: '2026-01-10T14:00:00Z' } },
    { recovery: { currentScore: 51 } },
  ];
  for (const legacy of rejected) {
    file(homepage, JSON.stringify(legacy));
    assert.throws(() => checkSource(root), /Legacy WHOOP private fields/);
  }
  file(homepage, '{}');
  file(metrics, JSON.stringify({ sourceDates: { whoop: '2026-01-10' }, whoop: summary().metrics }));
  assert.doesNotThrow(() => checkSource(root));
  file(metrics, JSON.stringify({ sourceDates: { whoop: '2026-01-10' }, whoop: { ...summary().metrics, records: ['SYNTHETIC'] } }));
  assert.throws(() => checkSource(root), /Generated WHOOP metrics failed the allowlist schema/);
  file(metrics, JSON.stringify({ sourceDates: { whoop: '2026-01-10T14:00:00Z' } }));
  git('add', '--', metrics);
  file(metrics, JSON.stringify({ sourceDates: { whoop: '2026-01-10' } }));
  assert.throws(() => checkSource(root), /Legacy WHOOP sync timestamp/);
  git('-c', 'user.email=test@example.invalid', '-c', 'user.name=Test', 'commit', '--no-gpg-sign', '-m', 'synthetic legacy sync');
  assert.throws(() => checkSource(root, 'HEAD'), /Legacy WHOOP sync timestamp/);
});
