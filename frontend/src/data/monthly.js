// Monthly Progress Data Processing
// Processes Garmin, Speediance, and WHOOP data into monthly aggregated stats

import garminData from './garmin_all_activities.json';
import speedianceData from './speediance_dashboard_data.json';
import whoopData from './whoop_v2_latest.json';

// Helper to parse date from various formats
function parseDate(dateStr) {
  if (!dateStr) return null;
  // Handle "2025-02-17 14:58:30" format
  if (dateStr.includes(' ')) {
    return new Date(dateStr.replace(' ', 'T'));
  }
  return new Date(dateStr);
}

// Get month key (YYYY-MM)
function getMonthKey(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : parseDate(date);
  if (!d || isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Process Garmin data - activities with distance, duration, heart rate
const garminActivities = garminData.activities || [];
const garminByMonth = {};
garminActivities.forEach((activity) => {
  const monthKey = getMonthKey(activity.startTimeLocal);
  if (!monthKey) return;
  
  if (!garminByMonth[monthKey]) {
    garminByMonth[monthKey] = {
      totalDistance: 0,
      totalDuration: 0,
      avgHeartRate: 0,
      heartRateCount: 0,
      activityCount: 0,
    };
  }
  
  const dist = activity.distance || 0;
  const dur = activity.duration || 0;
  const hr = activity.averageHR || activity.avgHR || 0;
  
  garminByMonth[monthKey].totalDistance += dist;
  garminByMonth[monthKey].totalDuration += dur;
  garminByMonth[monthKey].activityCount += 1;
  
  if (hr > 0) {
    garminByMonth[monthKey].avgHeartRate += hr;
    garminByMonth[monthKey].heartRateCount += 1;
  }
});

// Calculate averages for Garmin
Object.keys(garminByMonth).forEach((key) => {
  const m = garminByMonth[key];
  m.avgHeartRate = m.heartRateCount > 0 ? Math.round(m.avgHeartRate / m.heartRateCount) : 0;
  // Convert distance from meters to miles
  m.totalDistanceMiles = (m.totalDistance / 1609.344).toFixed(2);
  // Convert duration from seconds to hours
  m.totalDurationHours = (m.totalDuration / 3600).toFixed(2);
});

// Process Speediance data - workouts with totalCapacity (weight lifted), duration
const speedianceWorkouts = speedianceData.workoutTypes?.['Warrior 1']?.sessions || [];
const speedianceByMonth = {};
speedianceWorkouts.forEach((workout) => {
  const monthKey = getMonthKey(workout.date);
  if (!monthKey) return;
  
  if (!speedianceByMonth[monthKey]) {
    speedianceByMonth[monthKey] = {
      totalWeightLifted: 0,
      totalDuration: 0,
      workoutCount: 0,
      totalCalories: 0,
    };
  }
  
  speedianceByMonth[monthKey].totalWeightLifted += workout.totalCapacity || 0;
  speedianceByMonth[monthKey].totalDuration += workout.durationMinute || 0;
  speedianceByMonth[monthKey].workoutCount += 1;
  speedianceByMonth[monthKey].totalCalories += workout.calorie || 0;
});

// Convert weight to lbs (assuming kg) and duration to hours
Object.keys(speedianceByMonth).forEach((key) => {
  const m = speedianceByMonth[key];
  m.totalWeightLiftedLbs = (m.totalWeightLifted * 2.20462).toFixed(0);
  m.totalDurationHours = (m.totalDuration / 60).toFixed(2);
});

// Process WHOOP data - recovery scores and sleep performance
const whoopRecords = whoopData.recovery?.records || [];
const whoopByMonth = {};
whoopRecords.forEach((record) => {
  const dateStr = record.created_at;
  const monthKey = getMonthKey(dateStr);
  if (!monthKey) return;
  
  if (!whoopByMonth[monthKey]) {
    whoopByMonth[monthKey] = {
      recoveryScores: [],
      sleepPerformances: [],
      hrvValues: [],
      restingHrValues: [],
      daysCount: 0,
    };
  }
  
  const recovery = record.score?.recovery_score || 0;
  const sleepPerf = record.score?.sleep_performance || 0;
  const hrv = record.score?.hrv_rmssd_milli || 0;
  const rhr = record.score?.resting_heart_rate || 0;
  
  whoopByMonth[monthKey].daysCount += 1;
  
  if (recovery > 0) whoopByMonth[monthKey].recoveryScores.push(recovery);
  if (sleepPerf > 0) whoopByMonth[monthKey].sleepPerformances.push(sleepPerf);
  if (hrv > 0) whoopByMonth[monthKey].hrvValues.push(hrv);
  if (rhr > 0) whoopByMonth[monthKey].restingHrValues.push(rhr);
});

// Calculate averages for WHOOP
Object.keys(whoopByMonth).forEach((key) => {
  const m = whoopByMonth[key];
  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  m.avgRecovery = avg(m.recoveryScores);
  m.avgSleepPerformance = avg(m.sleepPerformances);
  m.avgHrv = avg(m.hrvValues);
  m.avgRestingHr = avg(m.restingHrValues);
});

// Get all unique months and sort them
const allMonths = new Set([
  ...Object.keys(garminByMonth),
  ...Object.keys(speedianceByMonth),
  ...Object.keys(whoopByMonth),
]);

const sortedMonths = Array.from(allMonths).sort();

// Group by year
function getYearFromMonthKey(monthKey) {
  return monthKey ? monthKey.split('-')[0] : null;
}

function getAvailableYears() {
  const years = new Set(sortedMonths.map(getYearFromMonthKey).filter(Boolean));
  return Array.from(years).sort().reverse(); // Most recent first
}

function getMonthlyDataForYear(year) {
  return sortedMonths
    .filter((m) => getYearFromMonthKey(m) === String(year))
    .map((monthKey) => ({
      month: monthKey,
      garmin: garminByMonth[monthKey] || null,
      speediance: speedianceByMonth[monthKey] || null,
      whoop: whoopByMonth[monthKey] || null,
    }));
}

// Format month for display (e.g., "2025-01" -> "January 2025")
function formatMonthDisplay(monthKey) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Export everything
export {
  sortedMonths,
  getAvailableYears,
  getMonthlyDataForYear,
  formatMonthDisplay,
  garminByMonth,
  speedianceByMonth,
  whoopByMonth,
};
