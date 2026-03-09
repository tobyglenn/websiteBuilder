import csvContent from './eight_sleep_historical.csv?raw';
const rawData = JSON.parse(csvContent);

const toNumber = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const round = (n, digits = 1) => {
  if (!Number.isFinite(n)) return 0;
  const p = 10 ** digits;
  return Math.round(n * p) / p;
};

const avg = (arr, digits = 1) => {
  if (!arr.length) return 0;
  return round(arr.reduce((s, n) => s + n, 0) / arr.length, digits);
};

const parsed = (Array.isArray(rawData) ? rawData : [])
  .map((row) => ({
    date: row.date,
    sleepScore: toNumber(row.sleep_score),
    sleepQuality: toNumber(row.sleep_quality_score),
    heartRate: toNumber(row.current_heart_rate),
    hrv: toNumber(row.current_hrv),
    respRate: toNumber(row.current_resp_rate),
    hoursSlept: toNumber(row.time_slept_hours),
  }))
  .filter((r) => r.date)
  .sort((a, b) => new Date(a.date) - new Date(b.date));

export const EIGHT_SLEEP_RECORDS = parsed.filter((r) => (r.sleepScore ?? 0) > 0);

const withScore = EIGHT_SLEEP_RECORDS.filter((r) => r.sleepScore != null);
const withQuality = EIGHT_SLEEP_RECORDS.filter((r) => r.sleepQuality != null);
const withHours = EIGHT_SLEEP_RECORDS.filter((r) => r.hoursSlept != null);
const withHrv = EIGHT_SLEEP_RECORDS.filter((r) => r.hrv != null);
const withHr = EIGHT_SLEEP_RECORDS.filter((r) => r.heartRate != null);

export const TOTAL_NIGHTS_TRACKED = EIGHT_SLEEP_RECORDS.length;
export const AVG_SLEEP_SCORE = Math.round(avg(withScore.map((r) => r.sleepScore), 1));
export const AVG_SLEEP_QUALITY = Math.round(avg(withQuality.map((r) => r.sleepQuality), 1));
export const AVG_HOURS_SLEPT = avg(withHours.map((r) => r.hoursSlept), 2);
export const AVG_HRV = avg(withHrv.map((r) => r.hrv), 1);
export const AVG_HEART_RATE = avg(withHr.map((r) => r.heartRate), 1);

export const LATEST_SESSION = EIGHT_SLEEP_RECORDS[EIGHT_SLEEP_RECORDS.length - 1] ?? null;
export const LATEST_SLEEP_SCORE = LATEST_SESSION?.sleepScore ?? 0;

export const LAST_30_NIGHTS = EIGHT_SLEEP_RECORDS.slice(-30);
export const RECENT_NIGHTS = EIGHT_SLEEP_RECORDS.slice(-10).reverse();

const monthMap = new Map();
for (const row of EIGHT_SLEEP_RECORDS) {
  const monthKey = row.date.slice(0, 7);
  if (!monthMap.has(monthKey)) monthMap.set(monthKey, []);
  monthMap.get(monthKey).push(row);
}

export const MONTHLY_AVERAGES = Array.from(monthMap.entries()).map(([month, rows]) => ({
  month,
  avgSleepScore: Math.round(avg(rows.map((r) => r.sleepScore).filter((n) => n != null), 1)),
  avgSleepQuality: Math.round(avg(rows.map((r) => r.sleepQuality).filter((n) => n != null), 1)),
  avgHours: avg(rows.map((r) => r.hoursSlept).filter((n) => n != null), 2),
  avgHrv: avg(rows.map((r) => r.hrv).filter((n) => n != null), 1),
}));

export function getEightSleepData() {
  return {
    records: EIGHT_SLEEP_RECORDS,
    stats: {
      avgSleepScore: AVG_SLEEP_SCORE,
      avgSleepQuality: AVG_SLEEP_QUALITY,
      avgHoursSlept: AVG_HOURS_SLEPT,
      avgHrv: AVG_HRV,
      avgHeartRate: AVG_HEART_RATE,
      totalNightsTracked: TOTAL_NIGHTS_TRACKED,
      latestSleepScore: LATEST_SLEEP_SCORE,
    },
    last30Nights: LAST_30_NIGHTS,
    recentNights: RECENT_NIGHTS,
    monthlyAverages: MONTHLY_AVERAGES,
    latestSession: LATEST_SESSION,
  };
}
