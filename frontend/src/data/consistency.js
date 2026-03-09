// Load and process Speediance + Garmin data for consistency analysis
// Data is imported directly from JSON files in the same data directory

import speedianceData from './speediance_dashboard_data.json';
import garminData from './garmin_all_activities.json';

// Get all Speediance workout dates
const speedianceWorkouts = [];
if (speedianceData.workoutTypes) {
  Object.values(speedianceData.workoutTypes).forEach(workoutType => {
    if (workoutType.sessions) {
      workoutType.sessions.forEach(session => {
        if (session.date) {
          speedianceWorkouts.push({ date: session.date });
        }
      });
    }
  });
}

// Get all Garmin activity dates  
const garminActivities = garminData.activities || [];

// Combine all training dates (workouts + runs)
const trainingDates = new Set();

speedianceWorkouts.forEach(w => {
  if (w.date) trainingDates.add(w.date);
});

garminActivities.forEach(a => {
  if (a.date) {
    trainingDates.add(a.date);
  } else if (a.startTimeLocal) {
    // Some activities use startTimeLocal instead of date
    const date = a.startTimeLocal.split(' ')[0];
    trainingDates.add(date);
  }
});

const sortedDates = Array.from(trainingDates).sort();

// Calculate streaks
let currentStreak = 0;
let longestStreak = 0;
let tempStreak = 0;
let lastDate = null;

const oneDay = 24 * 60 * 60 * 1000;

sortedDates.forEach(date => {
  if (lastDate) {
    const diff = (new Date(date) - new Date(lastDate)) / oneDay;
    if (diff <= 7) {
      tempStreak++;
    } else {
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      tempStreak = 1;
    }
  } else {
    tempStreak = 1;
  }
  lastDate = date;
});

if (tempStreak > longestStreak) longestStreak = tempStreak;

// Calculate day of week distribution
const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
sortedDates.forEach(date => {
  const day = new Date(date).getDay();
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
    const dDate = new Date(d);
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
  const date = new Date(d);
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

// Export the data
export const getConsistencyData = () => {
  return {
    totalTrainingDays,
    longestStreak,
    currentStreak: tempStreak,
    bestDay,
    thisMonth,
    dayOfWeekCounts,
    weeks,
    months,
    avgWeekly,
    totalWeeks: uniqueWeeks,
    recentDates: sortedDates.slice(-30)
  };
};
