/**
 * running.js — server-side Garmin data for /running & /about pages.
 * Runs at build time in Node.js context only.
 */
import rawData from './garmin_all_activities.json';

function durMin(r) {
  return (r?.duration_min ?? r?.duration ?? 0) || 0;
}

function getDist(r) {
  return (r?.distance_miles ?? r?.distance ?? 0) || 0;
}

function fmtPace(paceDecimal) {
  if (!paceDecimal || !isFinite(paceDecimal)) return '0:00';
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
  if (!dateStr) return '';
  const d = new Date(dateStr.slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  if (fmt === 'short') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function cleanRunName(name) {
  if (!name) return 'Run';
  if (name === 'Running' || name === 'Treadmill Running') return name;

  const types = ['Base', 'Tempo', 'Recovery', 'Threshold', 'Anaerobic', 'Long Run'];
  for (const type of types) {
    if (name.includes(type)) return type;
  }

  if (name.toLowerCase().includes('running')) return 'Outdoor Run';
  return name;
}

function calcStatsGroup(runsList, locale = 'en-US') {
  const totalRuns = runsList.length;
  const totalDist = runsList.reduce((s, r) => s + getDist(r), 0);
  const totalMin = runsList.reduce((s, r) => s + durMin(r), 0);
  const totalCal = runsList.reduce((s, r) => s + (r.calories || 0), 0);
  const avgPace = totalDist > 0 ? totalMin / totalDist : 0;
  const outdoorRuns = runsList.filter(r => r.activityType === 'running').length;
  const treadmillRuns = runsList.filter(r => r.activityType === 'treadmill_running').length;
  const longest = [...runsList].sort((a, b) => getDist(b) - getDist(a))[0];

  const firstRun = runsList[0];
  const lastRun = runsList[runsList.length - 1];

  const monthYear = (d) =>
    new Date((d || '').slice(0, 10) + 'T00:00:00').toLocaleDateString(locale, { month: 'short', year: 'numeric' });

  return {
    totalRuns,
    totalDistMi: +totalDist.toFixed(1),
    totalDistLabel: Math.round(totalDist).toLocaleString(locale),
    totalHrs: +(totalMin / 60).toFixed(1),
    totalCal: Math.round(totalCal),
    avgPace: fmtPace(avgPace),
    outdoorRuns,
    treadmillRuns,
    longestMi: +(getDist(longest)).toFixed(2),
    longestDate: longest ? fmtDate(longest.date || longest.startTimeLocal, 'long') : '',
    firstDate: firstRun?.date || firstRun?.startTimeLocal || '',
    lastDate: lastRun?.date || lastRun?.startTimeLocal || '',
    rangeLabel: firstRun && lastRun ? `${monthYear(firstRun.date || firstRun.startTimeLocal)} – ${monthYear(lastRun.date || lastRun.startTimeLocal)}` : '',
  };
}

export function getRunningData(locale = 'en-US') {
  const raw = rawData;
  const all = raw.activities || [];

  const runs = all
    .filter(a => a.activityType === 'running' || a.activityType === 'treadmill_running')
    .sort((a, b) => (a.date || a.startTimeLocal || '').localeCompare(b.date || b.startTimeLocal || ''));

  const preRuns = runs.filter(r => (r.date || r.startTimeLocal || '') < '2024-01-04');
  const postRuns = runs.filter(r => (r.date || r.startTimeLocal || '') >= '2024-01-04');

  const stats = calcStatsGroup(runs, locale);
  const preStats = calcStatsGroup(preRuns, locale);
  const postStats = calcStatsGroup(postRuns, locale);

  // Monthly rollup
  const monthMap = {};
  for (const r of runs) {
    const k = (r.date || r.startTimeLocal || '').slice(0, 7);
    if (!k) continue;
    if (!monthMap[k]) monthMap[k] = { runs: 0, distance: 0 };
    monthMap[k].runs++;
    monthMap[k].distance += getDist(r);
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
    const k = (r.date || r.startTimeLocal || '').slice(0, 10);
    if (k) dailyMap[k] = (dailyMap[k] || 0) + getDist(r);
  }

  // PRs by distance bracket
  function prFor(lo, hi) {
    const cands = runs.filter(r => getDist(r) >= lo && getDist(r) < hi && durMin(r) > 0);
    if (!cands.length) return null;
    const best = cands.reduce((b, r) => (durMin(r) / getDist(r)) < (durMin(b) / getDist(b)) ? r : b);
    const pace = durMin(best) / getDist(best);
    return {
      label: `${lo} mi`,
      dist: `${getDist(best).toFixed(2)} mi`,
      duration: fmtDur(durMin(best)),
      pace: fmtPace(pace),
      date: fmtDate(best.date || best.startTimeLocal, 'long'),
      type: best.activityType === 'running' ? 'Outdoor' : 'Treadmill',
    };
  }

  const prs = [prFor(1, 1.5), prFor(2, 2.5), prFor(3, 3.5), prFor(4, 4.5)].filter(Boolean);

  // Recent 10 runs
  const recentRuns = [...runs].reverse().slice(0, 10).map(r => {
    const d = getDist(r);
    const pace = d > 0 ? durMin(r) / d : 0;
    const tz = {
      z1: r.hrTimeInZone_1 || 0,
      z2: r.hrTimeInZone_2 || 0,
      z3: r.hrTimeInZone_3 || 0,
      z4: r.hrTimeInZone_4 || 0,
      z5: r.hrTimeInZone_5 || 0,
    };
    const tzTotal = Object.values(tz).reduce((s, v) => s + v, 0) || 1;
    return {
      date: fmtDate(r.date || r.startTimeLocal),
      name: cleanRunName(r.activityName),
      dist: +d.toFixed(2),
      pace: fmtPace(pace),
      dur: fmtDur(durMin(r)),
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

  return { stats, preStats, postStats, monthly, dailyMap, prs, recentRuns };
}
