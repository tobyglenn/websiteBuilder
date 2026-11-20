const MIN_DAYS = 3;
const MAX_COUNT = 100_000;
const DAY_MS = 86_400_000;
const GENERIC_ERROR = 'Invalid WHOOP public summary.';
const groups = {
  metrics: ['available', 'windowStart', 'windowEnd', 'sampleCount', 'recoveryAvg',
    'hrvAvg', 'rhrAvg', 'asleepHoursAvg', 'remHoursAvg',
    'deepHoursAvg', 'sleepPerfAvg', 'respiratoryAvg', 'strainAvg', 'totalRecords', 'allTimeRecoveryAvg', 'allTimeGreenPct',
    'allTimeYellowPct', 'allTimeRedPct', 'lastSynced'],
  dashboard: ['avgRecovery', 'avgHrv', 'avgRhr', 'avgSleepPerformance', 'totalDays',
    'green', 'yellow', 'red', 'weekly'],
  fitnessAge: ['avgHrv', 'avgRhr', 'avgRecovery', 'workoutConsistency', 'windowDays'],
  year2025: ['totalDays', 'avgStrain', 'avgRecovery', 'avgSleep', 'avgHRV', 'avgRHR',
    'recoveryRate'],
};

const fail = () => { throw new Error(GENERIC_ERROR); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const exact = (x, keys) => object(x) && Object.keys(x).length === keys.length &&
  keys.every(k => Object.hasOwn(x, k));
const day = x => {
  if (typeof x !== 'string' || !/^20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(x)) return false;
  const t = Date.parse(x);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === x;
};
const utcDay = x => {
  if (day(x)) return x;
  if (typeof x !== 'string' || !day(x.slice(0, 10)) || x[10] !== 'T' || !/(?:Z|[+-]\d\d:\d\d)$/i.test(x)) return null;
  const t = Date.parse(x);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
};
const addDays = (d, n) => new Date(Date.parse(d) + n * DAY_MS).toISOString().slice(0, 10);
const monday = d => addDays(d, -((new Date(d).getUTCDay() + 6) % 7));
const count = (v, max = MAX_COUNT) => Number.isInteger(v) && v >= 0 && v <= max;
const value = (v, max = 100) => typeof v === 'number' && Number.isFinite(v) && v >= 0 &&
  v <= max && Number(v.toFixed(1)) === v;
const nullable = (v, max) => v === null || value(v, max);
const inRange = (v, max = 100) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
const maxima = {
  hrvAvg: 400, rhrAvg: 300, asleepHoursAvg: 48, remHoursAvg: 48,
  deepHoursAvg: 48, strainAvg: 21,
};
const metricValues = groups.metrics.filter(k =>
  !['available', 'windowStart', 'windowEnd', 'sampleCount', 'totalRecords', 'lastSynced'].includes(k));

export function validateWhoopPublicSummary(summary) {
  if (!exact(summary, ['schemaVersion', ...Object.keys(groups)]) || summary.schemaVersion !== 1) fail();
  for (const [key, fields] of Object.entries(groups)) if (!exact(summary[key], fields)) fail();
  const { metrics: m, dashboard: d, fitnessAge: f, year2025: y } = summary;
  const window = day(m.windowStart) && day(m.windowEnd) && addDays(m.windowEnd, -29) === m.windowStart;
  if (typeof m.available !== 'boolean' || !(day(m.lastSynced) || m.lastSynced === null) ||
      !count(m.sampleCount, 30) || !count(m.totalRecords) || m.sampleCount > m.totalRecords ||
      m.available !== (m.sampleCount >= MIN_DAYS) ||
      (m.available ? !window : m.windowStart !== null || m.windowEnd !== null || m.sampleCount !== 0) ||
      !metricValues.every(k => nullable(m[k], maxima[k] ?? 100)) ||
      (!m.available && metricValues.filter(k => !k.startsWith('allTime')).some(k => m[k] !== null)) ||
      (m.totalRecords < MIN_DAYS && metricValues.filter(k => k.startsWith('allTime')).some(k => m[k] !== null))) fail();
  if (!count(d.totalDays) || ![d.green, d.yellow, d.red].every(n => count(n, d.totalDays)) ||
      d.green + d.yellow + d.red !== d.totalDays ||
      !value(d.avgRecovery) || !value(d.avgHrv, 400) || !value(d.avgRhr, 300) ||
      !value(d.avgSleepPerformance) || !Array.isArray(d.weekly) || d.weekly.length > 8) fail();
  let last = '';
  for (const point of d.weekly) {
    if (!exact(point, ['period', 'recovery', 'hrv']) || !day(point.period) ||
        monday(point.period) !== point.period || point.period <= last ||
        !value(point.recovery) || !value(point.hrv, 400) || !m.available ||
        point.period >= monday(m.windowEnd) || point.period < addDays(monday(m.windowEnd), -56)) fail();
    last = point.period;
  }
  if (!value(f.avgHrv, 400) || !value(f.avgRhr, 300) || !value(f.avgRecovery) ||
      !value(f.workoutConsistency) || !count(f.windowDays, 90)) fail();
  if (!count(y.totalDays, 366) || !value(y.avgStrain, 21) ||
      !value(y.avgRecovery) || !value(y.avgSleep, 48) || !value(y.avgHRV, 400) ||
      !value(y.avgRHR, 300) || !value(y.recoveryRate)) fail();
  return summary;
}

export function emptyWhoopPublicSummary() {
  return {
    schemaVersion: 1,
    metrics: Object.fromEntries(groups.metrics.map(k =>
      [k, k === 'available' ? false : ['sampleCount', 'totalRecords'].includes(k) ? 0 : null])),
    dashboard: { avgRecovery: 0, avgHrv: 0, avgRhr: 0, avgSleepPerformance: 0,
      totalDays: 0, green: 0, yellow: 0, red: 0, weekly: [] },
    fitnessAge: { avgHrv: 0, avgRhr: 0, avgRecovery: 0, workoutConsistency: 0, windowDays: 0 },
    year2025: { totalDays: 0, avgStrain: 0, avgRecovery: 0, avgSleep: 0, avgHRV: 0,
      avgRHR: 0, recoveryRate: 0 },
  };
}

// Deduplicate in private memory. Never spread source objects into the public output.
const distinct = (records, date) => [...new Map(records.filter(object).map((r, i) =>
  [r.id ?? r.cycle_id ?? date(r) ?? i, r])).values()];
const sourceDay = r => utcDay(r?.start ?? r?.created_at ?? r?.date);
const recoveryDay = r => utcDay(r?.created_at ?? r?.date ?? r?.start);
const number = (r, k) => r?.score?.[k];
const recovery = r => number(r, 'recovery_score');
const hrv = r => number(r, 'hrv_rmssd_milli');
const rhr = r => number(r, 'resting_heart_rate');
const rounded = x => +x.toFixed(1);
const arithmeticMean = nums => nums.reduce((sum, x) => sum + x, 0) / nums.length;
const averageByDay = (records, date, getter, max = 100, positive = false) => {
  const days = new Map();
  for (const r of records) {
    const d = date(r), n = getter(r);
    if (!d || !inRange(n, max) || (positive && n === 0)) continue;
    const a = days.get(d) ?? [];
    a.push(n);
    days.set(d, a);
  }
  return days.size >= MIN_DAYS ? rounded(arithmeticMean([...days.values()].map(arithmeticMean))) : null;
};
const stage = (r, k) => number(r, 'stage_summary')?.[k] / 3_600_000;
const asleep = r => {
  const fields = ['total_light_sleep_time_milli', 'total_rem_sleep_time_milli', 'total_slow_wave_sleep_time_milli'];
  const hrs = fields.map(k => stage(r, k)).filter(Number.isFinite);
  return hrs.length ? hrs.reduce((sum, x) => sum + x, 0) : null;
};

export function projectWhoopPublicSummary(raw) {
  if (!object(raw) || !Array.isArray(raw.recovery?.records)) fail();
  const records = section => Array.isArray(raw[section]?.records) ? raw[section].records : [];
  const recoveries = distinct(records('recovery'), recoveryDay).filter(r => recoveryDay(r) !== null)
    .sort((a, b) => recoveryDay(a).localeCompare(recoveryDay(b)));
  const datedScores = recoveries.filter(r => inRange(recovery(r)));
  const scoreDays = new Set(datedScores.map(recoveryDay));
  const s = emptyWhoopPublicSummary();
  const { metrics: m, dashboard: d, fitnessAge: f, year2025: y } = s;
  m.lastSynced = utcDay(raw.last_synced);
  const latest = recoveries.at(-1);
  const end = latest && recoveryDay(latest);
  if (!end) return validateWhoopPublicSummary(s);
  const start = addDays(end, -29);
  const inWindow = getDay => r => {
    const dt = getDay(r);
    return dt !== null && dt >= start && dt <= end;
  };
  const recent = recoveries.filter(inWindow(recoveryDay));
  const sleeps = distinct(records('sleep'), sourceDay).filter(r => !r.nap && inWindow(sourceDay)(r));
  const cycles = distinct(records('cycle'), sourceDay).filter(inWindow(sourceDay));
  const recentDays = new Set(recent.map(recoveryDay));
  m.totalRecords = recoveries.length;
  if (recentDays.size >= MIN_DAYS) {
    Object.assign(m, {
      available: true, windowStart: start, windowEnd: end, sampleCount: recentDays.size,
      recoveryAvg: averageByDay(recent, recoveryDay, recovery),
      hrvAvg: averageByDay(recent, recoveryDay, hrv, 400),
      rhrAvg: averageByDay(recent, recoveryDay, rhr, 300),
      asleepHoursAvg: averageByDay(sleeps, sourceDay, asleep, 48),
      remHoursAvg: averageByDay(sleeps, sourceDay, r => stage(r, 'total_rem_sleep_time_milli'), 48),
      deepHoursAvg: averageByDay(sleeps, sourceDay, r => stage(r, 'total_slow_wave_sleep_time_milli'), 48),
      sleepPerfAvg: averageByDay(sleeps, sourceDay, r => number(r, 'sleep_performance_percentage')),
      respiratoryAvg: averageByDay(sleeps, sourceDay, r => number(r, 'respiratory_rate')),
      strainAvg: averageByDay(cycles, sourceDay, r => number(r, 'strain'), 21),
    });
  }
  d.avgRecovery = averageByDay(recoveries, recoveryDay, recovery, 100, true) ?? 0;
  d.avgHrv = averageByDay(recoveries, recoveryDay, hrv, 400, true) ?? 0;
  d.avgRhr = averageByDay(recoveries, recoveryDay, rhr, 300, true) ?? 0;
  d.avgSleepPerformance = m.sleepPerfAvg ?? 0;
  if (scoreDays.size >= MIN_DAYS) {
    d.totalDays = scoreDays.size;
    const byDay = new Map();
    for (const r of datedScores) {
      const key = recoveryDay(r), nums = byDay.get(key) ?? [];
      nums.push(recovery(r));
      byDay.set(key, nums);
    }
    for (const nums of byDay.values()) {
      const score = arithmeticMean(nums);
      d[score >= 67 ? 'green' : score >= 34 ? 'yellow' : 'red']++;
    }
    m.allTimeRecoveryAvg = averageByDay(datedScores, recoveryDay, recovery);
    for (const color of ['Green', 'Yellow', 'Red']) m['allTime' + color + 'Pct'] = rounded(d[color.toLowerCase()] / d.totalDays * 100);
  }
  if (m.available) {
    const latestWeek = monday(end);
    for (let offset = 56; offset >= 7; offset -= 7) {
      const period = addDays(latestWeek, -offset), limit = addDays(period, 6);
      const week = recoveries.filter(r => recoveryDay(r) >= period && recoveryDay(r) <= limit);
      const r = averageByDay(week, recoveryDay, recovery);
      const h = averageByDay(week, recoveryDay, hrv, 400);
      if (r !== null && h !== null) d.weekly.push({ period, recovery: r, hrv: h });
    }
  }
  f.avgHrv = d.avgHrv;
  f.avgRhr = d.avgRhr;
  f.avgRecovery = d.avgRecovery;
  const recentFitness = recoveries.slice(-90);
  f.windowDays = recentFitness.length;
  if (new Set(recentFitness.map(recoveryDay)).size >= MIN_DAYS) {
    const workoutDates = new Set(records('workouts').filter(object).map(r => utcDay(r.start)).filter(Boolean));
    f.workoutConsistency = rounded(recentFitness.filter(r => workoutDates.has(recoveryDay(r))).length /
      recentFitness.length * 100);
  }
  const annual = recoveries.filter(r => recoveryDay(r).startsWith('2025-'));
  const annualDays = new Set(annual.map(recoveryDay));
  if (annualDays.size >= MIN_DAYS) {
    y.totalDays = annualDays.size;
    const whole = (getter, max) => Math.round(averageByDay(annual, recoveryDay, getter, max) ?? 0);
    y.avgRecovery = whole(recovery);
    y.avgHRV = whole(hrv, 400);
    y.avgRHR = whole(rhr, 300);
    const annualSleeps = distinct(records('sleep'), sourceDay).filter(r => !r.nap && sourceDay(r)?.startsWith('2025-'));
    y.avgSleep = averageByDay(annualSleeps, sourceDay, asleep, 48) ?? 0;
    y.recoveryRate = whole(r => inRange(recovery(r)) ? (recovery(r) >= 67 ? 100 : 0) : null);
    // Do not publish the legacy placeholder for strain; aggregate actual 2025 cycle days.
    const annualCycles = distinct(records('cycle'), sourceDay).filter(r => sourceDay(r)?.startsWith('2025-'));
    y.avgStrain = averageByDay(annualCycles, sourceDay, r => number(r, 'strain'), 21) ?? 0;
  }
  return validateWhoopPublicSummary(s);
}
