import summary from './whoop-public-summary.json';

const { dashboard, metrics } = summary;
const displayAvg = value => value == null ? '—' : value.toFixed(1);

export const AVG_RECOVERY = displayAvg(dashboard.avgRecovery);
export const AVG_HRV = displayAvg(dashboard.avgHrv);
export const AVG_RHR = displayAvg(dashboard.avgRhr);
export const AVG_SLEEP_PERF = displayAvg(dashboard.avgSleepPerformance);
export const TOTAL_DAYS = dashboard.totalDays;
export const TREND_DATA = dashboard.weekly;
export const RECOVERY_BREAKDOWN = {
  green: dashboard.green,
  yellow: dashboard.yellow,
  red: dashboard.red,
  total: dashboard.totalDays,
};
export const LAST_SYNC_DAY = metrics.lastSynced;

// Shared by the English and localized weekly charts. A single point is centered.
export function whoopTrendPoints(weekly, field, width, height, padding) {
  const dated = weekly.map((row, index) => ({ ...row, index }));
  const max = field === 'recovery' ? 100 : Math.max(100, ...dated.map(row => row[field] ?? 0));
  return { max, points: dated.filter(row => row[field] != null).map(row => ({
    x: padding + (weekly.length > 1 ? row.index / (weekly.length - 1) : 0.5) * (width - 2 * padding),
    y: height - padding - (row[field] / max) * (height - 2 * padding),
  })) };
}
