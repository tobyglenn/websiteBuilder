import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  emptyWhoopPublicSummary, projectWhoopPublicSummary, validateWhoopPublicSummary,
} from '../../src/lib/whoopPublicSummary.mjs';

const cli = fileURLToPath(new URL('../derive-whoop-public-summary.mjs', import.meta.url));
const call = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
const rec = (day, score, index = day) => ({
  id: `synthetic-marker-${index}`,
  cycle_id: `cycle-marker-${index}`,
  created_at: `${day}T23:59:58Z`,
  score: { recovery_score: score, resting_heart_rate: 60, hrv_rmssd_milli: 45 },
});
const fixture = () => ({
  last_synced: '2026-11-20T05:38:47+01:00',
  forbiddenPersonalMarker: 'must never be reflected',
  recovery: { records: [
    rec('2026-11-16', 60), rec('2026-11-17', 70), rec('2026-11-18', 80),
    rec('2026-11-09', 94), rec('2026-11-09', 96, 'second-on-one-day'),
    rec('2026-11-09', 99, 'third-on-one-day'), rec('2026-11-10', 92),
    rec('2026-10-26', 20), rec('2026-10-27', 30), rec('2026-10-28', 40),
    rec('2025-07-01', 35), rec('2025-07-02', 65), rec('2025-07-03', 95),
  ] },
  sleep: { records: ['2026-11-16', '2026-11-17', '2026-11-18'].map((date, i) => ({
    id: `synthetic-sleep-${i}`, start: `${date}T03:59:58Z`,
    score: { sleep_performance_percentage: 70 + i * 10, stage_summary: {
      total_in_bed_time_milli: 28_800_000, total_light_sleep_time_milli: 18_000_000,
      total_rem_sleep_time_milli: 3_600_000, total_slow_wave_sleep_time_milli: 3_600_000,
    } },
  })).concat([{ id: 'nap-synthetic', start: '2026-11-18T12:00:00Z', nap: true,
    score: { sleep_performance_percentage: 2 } }]) },
  cycle: { records: [
    { id: 'synthetic-cycle-peak', start: '2026-11-18T02:00:00Z', score: { strain: 20.9 } },
  ] },
  workouts: { records: [{ id: 'synthetic-workout', start: '2026-11-16T15:00:00Z' }] },
});

test('projector only emits allowlisted rounded aggregates and period dates', () => {
  const s = projectWhoopPublicSummary(fixture());
  assert.equal(s.metrics.available, true);
  assert.equal(s.metrics.sampleCount, 8);
  assert.equal(s.metrics.lastSynced, '2026-11-20');
  assert.equal(s.metrics.sleepPerfAvg, 80);
  assert.equal(s.metrics.asleepHoursAvg, 7);
  assert.equal(s.metrics.strainAvg, null);
  assert.equal(Object.hasOwn(s.metrics, 'strainMax'), false);
  assert.equal(s.year2025.totalDays, 3);
  assert.equal(s.year2025.avgRecovery, 65);
  assert.equal(s.year2025.recoveryRate, 33);
  assert.deepEqual(s.dashboard.weekly, [
    { period: '2026-10-26', recovery: 30, hrv: 45 },
  ]);
  const serialized = JSON.stringify(s);
  assert.doesNotMatch(serialized, /marker|"records"|created_at|cycle_id|23:59:58|05:38:47|workouts|20\.9|"id"/i);
});

test('no per-metric average from repeated same-day or two-day observations', () => {
  const data = fixture();
  data.recovery.records = [rec('2026-11-16', 83.8, 1), rec('2026-11-16', 83.8, 2),
    rec('2026-11-17', 83.8, 3)];
  const s = projectWhoopPublicSummary(data);
  assert.equal(s.metrics.available, false);
  assert.equal(s.metrics.recoveryAvg, null);
  assert.equal(s.dashboard.avgRecovery, 0);
  assert.equal(s.fitnessAge.workoutConsistency, 0);
  assert.deepEqual(s.dashboard.weekly, []);
  assert.doesNotMatch(JSON.stringify(s), /83\.8/);
});

test('validator rejects unknown keys at every level and rejects raw strings safely', () => {
  const mutations = [
    s => { s.recovery = { records: [] }; },
    s => { s.metrics.secretDeviceId = 'marker'; },
    s => { s.year2025.raw_timestamp = 'marker'; },
    s => { s.fitnessAge.private = 'marker'; },
    s => { s.dashboard.weekly[0].records = []; },
    s => { s.metrics.lastSynced = '2026-11-20T01:00:00Z'; },
    s => { s.metrics.strainMax = 9; },
    s => { s.dashboard.weekly[0].period = '2026-10-27'; },
    s => { s.dashboard.weekly[0].period = '2026-02-30'; },
    s => { s.dashboard.weekly[0].recovery = 0.12345; },
    s => { s.dashboard.weekly.unshift({ ...s.dashboard.weekly[0], period: '2026-11-16' }); },
    s => { s.dashboard.weekly = Array(9).fill(s.dashboard.weekly[0]); },
    s => { s.metrics.recoveryAvg = Infinity; },
  ];
  for (const mutate of mutations) {
    const s = projectWhoopPublicSummary(fixture());
    mutate(s);
    assert.throws(() => validateWhoopPublicSummary(s), /^Error: Invalid WHOOP public summary\.$/);
  }
  assert.doesNotThrow(() => validateWhoopPublicSummary(emptyWhoopPublicSummary()));
});

test('CLI isolates private input, atomically outputs a checkable summary, and never logs raw fragments', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'whoop-projection-tests-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const input = join(dir, 'input.json'), output = join(dir, 'output.json');
  await writeFile(input, JSON.stringify(fixture()));
  assert.equal(call('--input', input, '--output', output).status, 0);
  assert.equal(call('--check', output).status, 0);
  const good = await readFile(output, 'utf8');
  assert.deepEqual(JSON.parse(good), projectWhoopPublicSummary(fixture()));

  const repo = join(dir, 'nested-git-repo');
  await mkdir(join(repo, '.git'), { recursive: true });
  await writeFile(join(repo, '.git', 'HEAD'), 'ref: refs/heads/main\n');
  const forbidden = join(repo, 'source.json');
  await writeFile(forbidden, JSON.stringify(fixture()));
  const alias = join(dir, 'alias.json');
  await symlink(forbidden, alias);
  assert.equal(call('--input', forbidden, '--output', output).status, 1);
  assert.equal(call('--input', alias, '--output', output).status, 1);
  assert.equal(call('--input', input, '--output', input).status, 1);

  await writeFile(input, 'private-marker-broken-JSON');
  const broken = call('--input', input, '--output', output);
  assert.equal(broken.status, 1);
  assert.doesNotMatch(broken.stderr, /private-marker|input\.json|SyntaxError/);
  assert.equal(await readFile(output, 'utf8'), good);
  await writeFile(input, JSON.stringify({ recovery: { records: [rec('2026-11-18', 80)] } }));
  assert.equal(call('--input', input, '--output', output).status, 1);
  assert.equal(await readFile(output, 'utf8'), good);
  assert.equal(call('--check', input).status, 1);
});


test('the exact local DGX data-lake path is allowed only while untracked and without remotes', async t => {
  const home = await mkdtemp(join(tmpdir(), 'whoop-home-tests-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  const lake = join(home, 'clawd/data');
  await mkdir(lake, { recursive: true });
  const git = (...args) => execFileSync('git', args, { cwd: lake, stdio: 'ignore' });
  git('init');
  const input = join(lake, 'whoop_v2_latest.json'), output = join(home, 'out.json');
  await writeFile(input, JSON.stringify(fixture()));
  const run = () => spawnSync(process.execPath, [cli, '--input', input, '--output', output],
    { encoding: 'utf8', env: { ...process.env, HOME: home } });
  assert.equal(run().status, 0);
  git('remote', 'add', 'origin', 'https://example.invalid/no-network-during-test');
  assert.equal(run().status, 1);
  git('remote', 'remove', 'origin');
  git('add', 'whoop_v2_latest.json');
  assert.equal(run().status, 1);
});
