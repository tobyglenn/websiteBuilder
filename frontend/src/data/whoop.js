// WHOOP Data Processing
// Processes raw WHOOP recovery data into usable stats and chart data

import whoopData from './whoop_v2_latest.json';

const recoveryRecords = whoopData.recovery?.records || [];

// Process records into clean format
const RECOVERY_RECORDS = recoveryRecords
  .map((r) => ({
    date: new Date(r.created_at).toISOString().split('T')[0],
    recovery_score: r.score?.recovery_score || 0,
    hrv: r.score?.hrv_rmssd_milli || 0,
    resting_hr: r.score?.resting_heart_rate || 0,
    sleep_performance: r.score?.spo2_percentage || 0,
  }))
  .sort((a, b) => new Date(a.date) - new Date(b.date));

// Calculate averages
const recoveryScores = RECOVERY_RECORDS.map((r) => r.recovery_score).filter(Boolean);
const hrvValues = RECOVERY_RECORDS.map((r) => r.hrv).filter(Boolean);
const rhrValues = RECOVERY_RECORDS.map((r) => r.resting_hr).filter(Boolean);
const sleepPerfValues = RECOVERY_RECORDS.map((r) => r.sleep_performance).filter((v) => v > 0);

const AVG_RECOVERY = recoveryScores.length
  ? (recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length).toFixed(1)
  : 0;

const AVG_HRV = hrvValues.length
  ? (hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length).toFixed(1)
  : 0;

const AVG_RHR = rhrValues.length
  ? (rhrValues.reduce((a, b) => a + b, 0) / rhrValues.length).toFixed(1)
  : 0;

const AVG_SLEEP_PERF = sleepPerfValues.length
  ? (sleepPerfValues.reduce((a, b) => a + b, 0) / sleepPerfValues.length).toFixed(1)
  : 0;

const TOTAL_DAYS = RECOVERY_RECORDS.length;

// Last 10 days reversed (most recent first)
const RECENT_RECORDS = RECOVERY_RECORDS.slice(-10).reverse();

// Trend data for charts (last 30 days)
const TREND_DATA = RECOVERY_RECORDS.slice(-30).map((r) => ({
  date: r.date,
  recovery: r.recovery_score,
  hrv: r.hrv,
}));

// Last synced timestamp
const LAST_SYNCED = whoopData?.last_synced;

// Recovery breakdown for donut chart
const greenDays = RECOVERY_RECORDS.filter((r) => r.recovery_score >= 67).length;
const yellowDays = RECOVERY_RECORDS.filter((r) => r.recovery_score >= 34 && r.recovery_score < 67).length;
const redDays = RECOVERY_RECORDS.filter((r) => r.recovery_score < 34).length;

const RECOVERY_BREAKDOWN = {
  green: greenDays,
  yellow: yellowDays,
  red: redDays,
  total: TOTAL_DAYS,
};

export {
  RECOVERY_RECORDS,
  AVG_RECOVERY,
  AVG_HRV,
  AVG_RHR,
  AVG_SLEEP_PERF,
  TOTAL_DAYS,
  RECENT_RECORDS,
  TREND_DATA,
  RECOVERY_BREAKDOWN,
  LAST_SYNCED,
};
