import homepageFitnessData from './homepageFitnessData.json';

export const weeklyProgress = homepageFitnessData.weeklyProgress || {
  dateRange: {
    thisWeekStart: '1970-01-01',
    thisWeekEnd: '1970-01-07',
    lastWeekStart: '1969-12-25',
    lastWeekEnd: '1969-12-31',
  },
  workouts: { thisWeek: 0, lastWeek: 0 },
  runs: { thisWeek: 0, lastWeek: 0 },
  volume: { thisWeek: 0, lastWeek: 0 },
  miles: { thisWeek: 0, lastWeek: 0 },
  bjj: { thisWeek: 0, lastWeek: 0 },
};

export default weeklyProgress;
