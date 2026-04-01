import homepageFitnessData from '../data/homepageFitnessData.json';

const trainingStats = homepageFitnessData.trainingStats || {
  trainingStreak: 0,
  lastWorkoutData: null,
  thisWeekVolume: 0,
  thisMonthMiles: 0,
};

export const trainingStreak = trainingStats.trainingStreak ?? 0;
export const lastWorkoutData = trainingStats.lastWorkoutData ?? null;
export const thisWeekVolume = trainingStats.thisWeekVolume ?? 0;
export const thisMonthMiles = trainingStats.thisMonthMiles ?? 0;
