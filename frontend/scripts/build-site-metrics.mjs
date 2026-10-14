import { readFile, writeFile } from 'node:fs/promises';
import { summarizeRuns, summarizeWhoop, summarizeWeights, summarizeSleep } from '../src/lib/fitnessMetrics.mjs';

const dataDir = new URL('../src/data/', import.meta.url);
const read = async file => JSON.parse(await readFile(new URL(file, dataDir), 'utf8'));
const [homepage, garmin, whoop, speediance, body, milestones] = await Promise.all([
  read('homepageFitnessData.json'), read('garmin_all_activities.json'), read('whoop_v2_latest.json'),
  read('speediance_dashboard_data.json'), read('bodyCompositionData.json'), read('weightMilestones.json'),
]);
const activities = garmin.activities || [];
const sleepRaw = await readFile(new URL('eight_sleep_historical.csv', dataDir), 'utf8');
let sleepRecords;
try { sleepRecords = JSON.parse(sleepRaw); }
catch {
  const [header, ...rows] = sleepRaw.trim().split(/\r?\n/);
  const fields = header.split(',').map(s => s.trim());
  sleepRecords = rows.map(row => Object.fromEntries(row.split(',').map((value, i) => [fields[i], fields[i] === 'date' ? value.trim() : value.trim() === '' ? null : Number(value)])));
}
const running = { stats: summarizeRuns(activities),
  preStats: summarizeRuns(activities.filter(a => (a.date || a.startTimeLocal || '') < '2024-01-04')),
  postStats: summarizeRuns(activities.filter(a => (a.date || a.startTimeLocal || '') >= '2024-01-04')) };
const output = {
  generatedAt: new Date().toISOString(),
  definitions: { running: 'Garmin running and treadmill_running activities only', lifting: 'Lifetime recorded volume across smart cable machines', whoop: '30 calendar days ending on the latest bundled recovery date; duplicate IDs and sleep naps excluded' },
  sourceDates: { fitness: homepage.generatedAt, running: running.stats.lastDate, whoop: whoop.last_synced, weight: body.latest?.date ?? null },
  lifetimeStats: { ...homepage.lifetimeStats, totalMilesRun: running.stats.totalDistMi,
    sourceBreakdown: { ...homepage.lifetimeStats.sourceBreakdown, garminRuns: running.stats.totalRuns } },
  running, whoop: summarizeWhoop(whoop),
  strength: { totalVolumeLbs: speediance.totalVolumeLbs || 0, totalWorkouts: speediance.totalWorkouts || 0, dateRange: speediance.dateRange ?? null },
  eightSleep: summarizeSleep(sleepRecords),
  weight: summarizeWeights([...milestones, ...(body.weights || [])]),
};
await writeFile(new URL('siteMetrics.json', dataDir), JSON.stringify(output, null, 2) + '\n');
console.log(`Built shared metrics: ${running.stats.totalDistMi} running miles; WHOOP ${output.whoop.windowStart}–${output.whoop.windowEnd} (n=${output.whoop.sampleCount}).`);
