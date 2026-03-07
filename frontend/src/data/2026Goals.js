// 2026 Goals Data
// Calculated from Garmin and Speediance data as of March 7, 2026
// Running: 31 runs, 60.9 miles
// Lifting: 30 sessions, 327,780 lbs
// Workouts: 61 total (31 runs + 30 lifting sessions)
// BJJ: Coming Soon (no data)

export const goals2026 = {
  running: {
    icon: '🏃',
    current: 60.9,
    target: 365,
    unit: 'miles'
  },
  lifting: {
    icon: '🏋️',
    current: 327780,
    target: 500000,
    unit: 'lbs'
  },
  workouts: {
    icon: '💪',
    current: 61,
    target: 200,
    unit: 'workouts'
  },
  bjj: {
    icon: '🥋',
    current: 0,
    target: 100,
    unit: 'sessions',
    comingSoon: true
  }
};

export default goals2026;
