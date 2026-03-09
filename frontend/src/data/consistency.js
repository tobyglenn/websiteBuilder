// Load and process Speediance + Garmin data for consistency analysis
import speedianceData from './speediance_dashboard_data.json';
import garminData from './garmin_all_activities.json';

const speedianceWorkouts = speedianceData.workouts || [];
const garminActivities = garminData.activities || [];

// Combine all training dates (workouts + runs)
const trainingDates = new Set();

speedianceWorkouts.forEach(w => {
  if (w.date) trainingDates.add(w.date);
});

garminActivities.forEach(a => {
  if (a.startTime) {
    const date = a.startTime.split('T')[0];
    trainingDates.add(date);
  }
});

const sortedDates = Array.from(trainingDates).sort();

// Calculate streaks - count consecutive weeks with at least 1 training day
let currentStreak = 0;
let longestStreak = 0;
let tempStreak = 0;
let lastWeek = null;

sortedDates.forEach(date => {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
  const week = Math.floor(days / 7);
  
  if (lastWeek !== null) {
    if (week === lastWeek + 1 || (lastWeek === 51 && week === 0)) {
      tempStreak++;
    } else {
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      tempStreak = 1;
    }
  } else {
    tempStreak = 1;
  }
  lastWeek = week;
});

if (tempStreak > longestStreak) longestStreak = tempStreak;
currentStreak = tempStreak;

// Calculate day of week distribution
const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
sortedDates.forEach(date => {
  const day = new Date(date + 'T00:00:00').getDay();
  dayOfWeekCounts[day]++;
});

// Calculate weekly consistency (last 52 weeks)
const now = new Date();
const weeks = [];
for (let i = 51; i >= 0; i--) {
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  let count = 0;
  sortedDates.forEach(d => {
    const dDate = new Date(d + 'T00:00:00');
    if (dDate >= weekStart && dDate <= weekEnd) count++;
  });
  
  weeks.push({
    week: i,
    start: weekStart.toISOString().split('T')[0],
    count
  });
}

// Calculate monthly consistency
const months = {};
sortedDates.forEach(date => {
  const month = date.substring(0, 7); // YYYY-MM
  months[month] = (months[month] || 0) + 1;
});

// Stats
const totalTrainingDays = sortedDates.length;
const uniqueWeeks = new Set(sortedDates.map(d => {
  const date = new Date(d + 'T00:00:00');
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.floor(days / 7);
})).size;

const avgWeekly = (totalTrainingDays / Math.max(uniqueWeeks, 1)).toFixed(1);

// This month count
const nowMonth = now.toISOString().substring(0, 7);
const thisMonth = months[nowMonth] || 0;

// Best day of week
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const bestDayIndex = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
const bestDay = days[bestDayIndex];

export function getConsistencyData() {
  return {
    totalTrainingDays,
    longestStreak,
    currentStreak,
    bestDay,
    thisMonth,
    dayOfWeekCounts,
    weeks,
    months,
    avgWeekly,
    totalWeeks: uniqueWeeks,
    recentDates: sortedDates.slice(-30)
  };
}
