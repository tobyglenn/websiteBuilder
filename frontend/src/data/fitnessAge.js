import whoopData from './whoop_v2_latest.json';
import garminData from './garmin_all_activities.json';

const ACTUAL_AGE = 44;

const recoveryRecords = whoopData?.recovery?.records ?? [];
const workoutRecords = whoopData?.workouts?.records ?? [];
const garminActivities = garminData?.activities ?? [];

const safeDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const average = (arr) => {
  if (!arr.length) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
};

const sortedRecovery = recoveryRecords
  .map((r) => ({
    date: safeDate(r.created_at),
    hrv: toNumber(r?.score?.hrv_rmssd_milli),
    rhr: toNumber(r?.score?.resting_heart_rate),
    recovery: toNumber(r?.score?.recovery_score),
  }))
  .filter((r) => r.date)
  .sort((a, b) => a.date - b.date);

const avgHRV = average(sortedRecovery.map((r) => r.hrv).filter((v) => v > 0));
const avgRHR = average(sortedRecovery.map((r) => r.rhr).filter((v) => v > 0));
const avgRecovery = average(sortedRecovery.map((r) => r.recovery).filter((v) => v > 0));

const recoveryWindowDays = Math.min(90, sortedRecovery.length || 1);
const recentRecovery = sortedRecovery.slice(-recoveryWindowDays);

const latestRecoveryDate = recentRecovery.length
  ? recentRecovery[recentRecovery.length - 1].date
  : new Date();

const windowStart = new Date(latestRecoveryDate);
windowStart.setDate(windowStart.getDate() - (recoveryWindowDays - 1));

const workoutDates = new Set(
  workoutRecords
    .map((w) => safeDate(w?.start))
    .filter(Boolean)
    .map((d) => d.toISOString().split('T')[0])
);

const workoutDaysInWindow = recentRecovery.filter((r) => workoutDates.has(r.date.toISOString().split('T')[0])).length;
const workoutConsistency = recoveryWindowDays > 0 ? (workoutDaysInWindow / recoveryWindowDays) * 100 : 0;
const weeklyWorkouts = (workoutConsistency / 100) * 7;

const runningActivities = garminActivities.filter((a) => {
  const type = (a?.activityType ?? '').toLowerCase();
  const name = (a?.activityName ?? '').toLowerCase();
  return type.includes('running') || name.includes('run');
});

const recentRuns = runningActivities
  .map((run) => ({
    date: safeDate(run?.startTimeLocal || run?.date),
    miles: toNumber(run?.distance_miles),
    durationMin: toNumber(run?.duration_min),
  }))
  .filter((r) => r.date)
  .sort((a, b) => a.date - b.date);

const runWindowDays = 84;
const runCutoff = new Date();
runCutoff.setDate(runCutoff.getDate() - runWindowDays);

const runWindow = recentRuns.filter((r) => r.date >= runCutoff);
const runMiles = runWindow.reduce((sum, r) => sum + r.miles, 0);
const runCount = runWindow.length;

const totalRunDuration = runWindow.reduce((sum, r) => sum + r.durationMin, 0);
const avgPaceMinPerMile = runMiles > 0 ? totalRunDuration / runMiles : 0;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hrvNormFor40s = 45;
const rhrNormFor40s = 60;

const hrvScore = clamp(50 + ((avgHRV - hrvNormFor40s) / 20) * 50, 0, 100);
const rhrScore = clamp(50 + ((rhrNormFor40s - avgRHR) / 15) * 50, 0, 100);
const recoveryScoreNorm = clamp(avgRecovery, 0, 100);
const consistencyScore = clamp(workoutConsistency, 0, 100);
const cardioScore = clamp((runMiles / 35) * 100, 0, 100);

const compositeScore =
  hrvScore * 0.3 +
  rhrScore * 0.25 +
  consistencyScore * 0.2 +
  cardioScore * 0.15 +
  recoveryScoreNorm * 0.1;

const fitnessAge = Math.round(clamp(ACTUAL_AGE - (compositeScore - 50) * 0.24, 28, 65));

const ageDelta = ACTUAL_AGE - fitnessAge;

const FITNESS_AGE_DATA = {
  actualAge: ACTUAL_AGE,
  fitnessAge,
  ageDelta,
  avgHRV: Number(avgHRV.toFixed(1)),
  avgRHR: Number(avgRHR.toFixed(1)),
  avgRecovery: Number(avgRecovery.toFixed(1)),
  workoutConsistency: Number(workoutConsistency.toFixed(1)),
  weeklyWorkouts: Number(weeklyWorkouts.toFixed(1)),
  runningMiles: Number(runMiles.toFixed(1)),
  runCount,
  avgPaceMinPerMile: Number(avgPaceMinPerMile.toFixed(2)),
  cardioScore: Number(cardioScore.toFixed(1)),
  hrvScore: Number(hrvScore.toFixed(1)),
  rhrScore: Number(rhrScore.toFixed(1)),
  compositeScore: Number(compositeScore.toFixed(1)),
  dataWindows: {
    whoopDays: recoveryWindowDays,
    runningDays: runWindowDays,
  },
};

export { FITNESS_AGE_DATA };