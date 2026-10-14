import siteMetrics from './siteMetrics.json';

export const currentSpeedianceStats = siteMetrics.strength;
export const garminStats = {
  totalMiles: siteMetrics.running.stats.totalDistMi.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  totalRuns: siteMetrics.running.stats.totalRuns,
};
export const whoopStats = siteMetrics.whoop;
export const eightSleepStats = siteMetrics.eightSleep;
export const formatMetric = (value: number | null, digits = 0) => value == null ? 'Unavailable' : value.toFixed(digits);
export const whoopWindowDescription = `${whoopStats.windowStart ?? 'Unavailable'} – ${whoopStats.windowEnd ?? 'Unavailable'} · n=${whoopStats.sampleCount}`;
export const eightSleepWindowDescription = `${eightSleepStats.windowStart ?? 'Unavailable'} – ${eightSleepStats.windowEnd ?? 'Unavailable'} · n=${eightSleepStats.sampleCount}`;
