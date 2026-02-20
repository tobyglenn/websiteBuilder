/**
 * running.js — server-side data processing for Garmin running activities.
 * Imported at build time by running.astro (Node.js context only).
 */
import fs from 'node:fs';

const DATA_PATH = '/Users/tobyglennpeters/clawd/data/garmin_all_activities.json';

function formatPace(paceDecimal) {
  const min = Math.floor(paceDecimal);
  const sec = Math.round((paceDecimal - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDuration(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getRunningData() {
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const all = raw.activities;

  // Only running / treadmill (exclude swimming)
  const activities = all
    .filter(a => a.activityType === 'running' || a.activityType === 'treadmill_running')
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const totalRuns = activities.length;
  const totalDistance = activities.reduce((s, a) => s + (a.distance_miles || 0), 0);
  const totalDurationMin = activities.reduce((s, a) => s + (a.duration_min || 0), 0);
  const avgPaceDecimal = totalDistance > 0 ? totalDurationMin / totalDistance : 0;
  const totalCalories = activities.reduce((s, a) => s + (a.calories || 0), 0);

  const outdoorRuns = activities.filter(a => a.activityType === 'running').length;
  const treadmillRuns = activities.filter(a => a.activityType === 'treadmill_running').length;

  // Longest run
  const longestRun = [...activities].sort((a, b) => b.distance_miles - a.distance_miles)[0];
  // Best pace (outdoor, distance > 1.5mi)
  const outdoorLong = activities.filter(a => a.activityType === 'running' && a.distance_miles > 1.5);
  const fastestRun = outdoorLong.length
    ? [...outdoorLong].sort((a, b) => (a.duration_min / a.distance_miles) - (b.duration_min / b.distance_miles))[0]
    : null;

  const stats = {
    totalRuns,
    totalDistanceMi: parseFloat(totalDistance.toFixed(1)),
    totalDurationFormatted: formatDuration(totalDurationMin),
    avgPaceFormatted: formatPace(avgPaceDecimal),
    totalCalories: Math.round(totalCalories),
    outdoorRuns,
    treadmillRuns,
    longestRunMi: parseFloat((longestRun?.distance_miles || 0).toFixed(2)),
    longestRunName: longestRun?.activityName || '',
    longestRunDate: longestRun ? formatDate(longestRun.date) : '',
    fastestPaceFormatted: fastestRun
      ? formatPace(fastestRun.duration_min / fastestRun.distance_miles)
      : '—',
    fastestPaceDate: fastestRun ? formatDate(fastestRun.date) : '',
  };

  // ── Chart data (distance per run over time) ──────────────────────────────
  const chartData = activities.map(a => ({
    date: a.date,
    distance: parseFloat(a.distance_miles.toFixed(2)),
    type: a.activityType === 'treadmill_running' ? 'treadmill' : 'outdoor',
  }));

  // ── Monthly rollup for bar chart ─────────────────────────────────────────
  const monthlyMap = {};
  for (const a of activities) {
    const key = a.date.slice(0, 7); // YYYY-MM
    if (!monthlyMap[key]) monthlyMap[key] = { runs: 0, distance: 0 };
    monthlyMap[key].runs++;
    monthlyMap[key].distance += a.distance_miles;
  }
  const monthly = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({
      month,
      label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      runs: d.runs,
      distance: parseFloat(d.distance.toFixed(1)),
    }));

  // ── Recent runs table (last 20, newest first) ────────────────────────────
  const recentRuns = [...activities]
    .reverse()
    .slice(0, 20)
    .map(a => {
      const pace = a.distance_miles > 0 ? a.duration_min / a.distance_miles : 0;
      return {
        date: formatDate(a.date),
        rawDate: a.date,
        name: a.activityName,
        distanceMi: parseFloat(a.distance_miles.toFixed(2)),
        durationFormatted: formatDuration(a.duration_min),
        paceFormatted: formatPace(pace),
        avgHR: a.averageHR ? Math.round(a.averageHR) : null,
        calories: a.calories ? Math.round(a.calories) : null,
        type: a.activityType === 'treadmill_running' ? 'Treadmill' : 'Outdoor',
        activityId: a.activityId,
      };
    });

  return { stats, chartData, monthly, recentRuns };
}
