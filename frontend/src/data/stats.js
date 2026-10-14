import siteMetrics from './siteMetrics.json';

export const lifetimeStats = siteMetrics.lifetimeStats || {
  totalLbsLifted: 0,
  totalMilesRun: 0,
  totalWorkouts: 0,
};

export default lifetimeStats;
