/**
 * running.js — server-side Garmin data for /running page.
 * Runs at build time in Node.js context only.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DATA_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'garmin_all_activities.json'
);

function fmtPace(paceDecimal) {
  const m = Math.floor(paceDecimal);
  const s = Math.round((paceDecimal - m) * 60);
  return s === 60 ? `${m + 1}:00` : `${m}:${String(s).padStart(2, '0')}`;
}

function fmtDur(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDate(dateStr, fmt = 'short') {
  const d = new Date(dateStr + 'T00:00:00');
  if (fmt === 'short') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getRunningData() {
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const all = raw.activities || [];

  const runs = all
    .filter(a => a.activityType === 'running' || a.activityType === 'treadmill_running')
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalRuns = runs.length;
  const totalDist = runs.reduce((s, r) => s + (r.distance_miles || 0), 0);
  const totalMin = runs.reduce((s, r) => s + (r.duration_min || 0), 0);
  const totalCal = runs.reduce((s, r) => s + (r.calories || 0), 0);
  const avgPace = totalDist > 0 ? totalMin / totalDist : 0;
  const outdoorRuns = runs.filter(r => r.activityType === 'running').length;
  const treadmillRuns = runs.filter(r => r.activityType === 'treadmill_running').length;
  const longest = [...runs].sort((a, b) => b.distance_miles - a.distance_miles)[0];

  const stats = {
    totalRuns,
    totalDistMi: +totalDist.toFixed(1),
    totalHrs: +(totalMin / 60).toFixed(1),
    totalCal: Math.round(totalCal),
    avgPace: fmtPace(avgPace),
    outdoorRuns,
    treadmillRuns,
    longestMi: +(longest?.distance_miles || 0).toFixed(2),
    longestDate: longest ? fmtDate(longest.date, 'long') : '',
  };

  // Monthly rollup
  const monthMap = {};
  for (const r of runs) {
    const k = r.date.slice(0, 7);
    if (!monthMap[k]) monthMap[k] = { runs: 0, distance: 0 };
    monthMap[k].runs++;
    monthMap[k].distance += r.distance_miles || 0;
  }
  const monthly = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => {
      const [y, mo] = month.split('-');
      const label = new Date(+y, +mo - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return { month, label, runs: d.runs, distance: +d.distance.toFixed(1) };
    });

  // Daily miles (for heatmap)
  const dailyMap = {};
  for (const r of runs) {
    dailyMap[r.date] = (dailyMap[r.date] || 0) + (r.distance_miles || 0);
  }

  // PRs by distance bracket
  function prFor(lo, hi) {
    const cands = runs.filter(r => r.distance_miles >= lo && r.distance_miles < hi && r.duration_min > 0);
    if (!cands.length) return null;
    const best = cands.reduce((b, r) => (r.duration_min / r.distance_miles) < (b.duration_min / b.distance_miles) ? r : b);
    const pace = best.duration_min / best.distance_miles;
    return {
      label: `${lo} mi`,
      dist: `${best.distance_miles.toFixed(2)} mi`,
      duration: fmtDur(best.duration_min),
      pace: fmtPace(pace),
      date: fmtDate(best.date, 'long'),
      type: best.activityType === 'running' ? 'Outdoor' : 'Treadmill',
    };
  }

  const prs = [prFor(1, 1.5), prFor(2, 2.5), prFor(3, 3.5), prFor(4, 4.5)].filter(Boolean);

  // Recent 10 runs
  const recentRuns = [...runs].reverse().slice(0, 10).map(r => {
    const pace = r.distance_miles > 0 ? r.duration_min / r.distance_miles : 0;
    const tz = {
      z1: r.hrTimeInZone_1 || 0,
      z2: r.hrTimeInZone_2 || 0,
      z3: r.hrTimeInZone_3 || 0,
      z4: r.hrTimeInZone_4 || 0,
      z5: r.hrTimeInZone_5 || 0,
    };
    const tzTotal = Object.values(tz).reduce((s, v) => s + v, 0) || 1;
    return {
      date: fmtDate(r.date),
      name: r.activityName || 'Run',
      dist: +r.distance_miles.toFixed(2),
      pace: fmtPace(pace),
      dur: fmtDur(r.duration_min),
      hr: r.averageHR ? Math.round(r.averageHR) : null,
      cal: r.calories ? Math.round(r.calories) : null,
      type: r.activityType === 'treadmill_running' ? 'Treadmill' : 'Outdoor',
      z1pct: Math.round((tz.z1 / tzTotal) * 100),
      z2pct: Math.round((tz.z2 / tzTotal) * 100),
      z3pct: Math.round((tz.z3 / tzTotal) * 100),
      z4pct: Math.round((tz.z4 / tzTotal) * 100),
      z5pct: Math.round((tz.z5 / tzTotal) * 100),
    };
  });

  return { stats, monthly, dailyMap, prs, recentRuns };
}
