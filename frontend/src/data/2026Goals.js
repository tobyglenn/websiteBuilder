import homepageFitnessData from './homepageFitnessData.json';

export const goals2026 = homepageFitnessData.yearlyGoals || {
  running: {
    icon: '🏃',
    current: 0,
    target: 365,
    unit: 'miles',
  },
  lifting: {
    icon: '🏋️',
    current: 0,
    target: 500000,
    unit: 'lbs',
  },
  workouts: {
    icon: '💪',
    current: 0,
    target: 200,
    unit: 'workouts',
  },
  bjj: {
    icon: '🥋',
    current: 10,
    target: 100,
    unit: 'sessions',
    comingSoon: false,
  },
};

export default goals2026;
