// Aggregated fitness stats used by gear cards. Currently a thin pass-through;
// individual pages (gear index, whoop detail) compute their own live values
// from the JSON sources so this file only needs to satisfy the import surface.

export const currentSpeedianceStats = {
  totalVolumeLbs: 0,
  totalWorkouts: 0
};

export const garminStats = {
  totalMiles: '0',
  totalRuns: 0
};

export const whoopStats = {
  avgRecovery: 0,
  avgHRV: 0,
  avgRHR: 0
};

export const eightSleepStats = {
  avgScore: 0,
  avgHours: 0
};
