/**
 * streaks.js — Training streak analysis combining Speediance + Garmin data.
 * Imported at build time by streaks.astro (Node.js context only).
 */
import speedianceData from './speediance_dashboard_data.json';
import garminData from './garmin_all_activities.json';

// Get all unique workout dates from Speediance
function getSpeedianceDates() {
  const sessions = speedianceData.allSessions || [];
  const dateSet = new Set();
  sessions.forEach(s => {
    if (s.date) dateSet.add(s.date);
  });
  return Array.from(dateSet).sort();
}

// Get all unique run dates from Garmin
function getGarminDates() {
  const activities = garminData.activities || [];
  const dateSet = new Set();
  activities.forEach(a => {
    if (a.date) dateSet.add(a.date);
  });
  return Array.from(dateSet).sort();
}

// Combine and deduplicate all active dates
function getAllActiveDates() {
  const speedianceDates = getSpeedianceDates();
  const garminDates = getGarminDates();
  const allDates = new Set([...speedianceDates, ...garminDates]);
  return Array.from(allDates).sort();
}

// Calculate streak statistics
function calculateStreaks(dates) {
  if (dates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      streakHistory: []
    };
  }

  // Create a set for O(1) lookup
  const activeDateSet = new Set(dates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate current streak
  let currentStreak = 0;
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let checkDate = new Date(today);
  if (!activeDateSet.has(todayStr) && !activeDateSet.has(yesterdayStr)) {
    checkDate = new Date(dates[dates.length - 1]);
  }
  checkDate.setHours(0, 0, 0, 0);

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (activeDateSet.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak and build streak history
  let longestStreak = 0;
  const streakHistory = [];
  let streakStart = new Date(dates[0]);
  let streakEnd = new Date(dates[0]);
  let currentRun = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentRun++;
      streakEnd = currDate;
    } else {
      if (currentRun > longestStreak) longestStreak = currentRun;
      streakHistory.push({
        start: streakStart.toISOString().split('T')[0],
        end: streakEnd.toISOString().split('T')[0],
        length: currentRun
      });
      streakStart = currDate;
      streakEnd = currDate;
      currentRun = 1;
    }
  }

  if (currentRun > longestStreak) longestStreak = currentRun;
  streakHistory.push({
    start: streakStart.toISOString().split('T')[0],
    end: streakEnd.toISOString().split('T')[0],
    length: currentRun
  });

  streakHistory.sort((a, b) => b.length - a.length);

  return {
    currentStreak,
    longestStreak,
    totalActiveDays: dates.length,
    streakHistory
  };
}

// Generate weekly data for the contribution graph
function generateWeeklyData(dates) {
  const weeks = [];
  const activeDateSet = new Set(dates);
  
  if (dates.length === 0) return weeks;

  const firstDate = new Date(dates[0]);
  const today = new Date();
  
  const startDate = new Date(firstDate);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    let activeDays = 0;
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const dateStr = dayDate.toISOString().split('T')[0];
      if (activeDateSet.has(dateStr) && dayDate <= today) {
        activeDays++;
      }
    }
    
    let intensity = 0;
    if (activeDays > 0) intensity = 1;
    if (activeDays >= 2) intensity = 2;
    if (activeDays >= 4) intensity = 3;
    if (activeDays >= 6) intensity = 4;
    
    weeks.push({
      date: weekStart.toISOString().split('T')[0],
      activeDays,
      intensity
    });
    
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return weeks;
}

// Calculate achievements/badges
function calculateAchievements(totalWorkouts, streakData) {
  const achievements = [];
  
  // First workout
  achievements.push({
    id: 'first-workout',
    name: 'First Step',
    description: 'Completed your first workout',
    icon: '🚀',
    earned: totalWorkouts >= 1,
    progress: Math.min(totalWorkouts, 1),
    target: 1
  });
  
  // 10 workouts
  achievements.push({
    id: 'ten-workouts',
    name: 'Getting Started',
    description: 'Completed 10 workouts',
    icon: '💪',
    earned: totalWorkouts >= 10,
    progress: Math.min(totalWorkouts, 10),
    target: 10
  });
  
  // 25 workouts
  achievements.push({
    id: 'twenty-five-workouts',
    name: 'Consistent',
    description: 'Completed 25 workouts',
    icon: '⭐',
    earned: totalWorkouts >= 25,
    progress: Math.min(totalWorkouts, 25),
    target: 25
  });
  
  // 50 workouts
  achievements.push({
    id: 'fifty-workouts',
    name: 'Dedicated',
    description: 'Completed 50 workouts',
    icon: '🏆',
    earned: totalWorkouts >= 50,
    progress: Math.min(totalWorkouts, 50),
    target: 50
  });
  
  // 100 workouts
  achievements.push({
    id: 'hundred-workouts',
    name: 'Century Club',
    description: 'Completed 100 workouts',
    icon: '👑',
    earned: totalWorkouts >= 100,
    progress: Math.min(totalWorkouts, 100),
    target: 100
  });
  
  // 7-day streak
  achievements.push({
    id: 'week-streak',
    name: 'Week Warrior',
    description: '7-day workout streak',
    icon: '🔥',
    earned: streakData.longestStreak >= 7,
    progress: Math.min(streakData.longestStreak, 7),
    target: 7
  });
  
  // 14-day streak
  achievements.push({
    id: 'fortnight-streak',
    name: 'Fortnight Fighter',
    description: '14-day workout streak',
    icon: '⚡',
    earned: streakData.longestStreak >= 14,
    progress: Math.min(streakData.longestStreak, 14),
    target: 14
  });
  
  // 30-day streak
  achievements.push({
    id: 'month-streak',
    name: 'Monthly Machine',
    description: '30-day workout streak',
    icon: '💎',
    earned: streakData.longestStreak >= 30,
    progress: Math.min(streakData.longestStreak, 30),
    target: 30
  });
  
  // 60-day streak
  achievements.push({
    id: 'sixty-streak',
    name: 'Unstoppable',
    description: '60-day workout streak',
    icon: '🌟',
    earned: streakData.longestStreak >= 60,
    progress: Math.min(streakData.longestStreak, 60),
    target: 60
  });
  
  return achievements;
}

// Calculate weekly consistency
function calculateWeeklyConsistency(dates) {
  const today = new Date();
  const weeks = [];
  const activeSet = new Set(dates);
  
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    let activeDays = 0;
    
    for (let d = 0; d < 7; d++) {
      const checkDate = new Date(weekStart);
      checkDate.setDate(weekStart.getDate() + d);
      if (checkDate <= today) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (activeSet.has(dateStr)) {
          activeDays++;
        }
      }
    }
    
    const percentage = Math.round((activeDays / 7) * 100);
    weeks.push({
      week: `Week ${4 - i}`,
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
      activeDays,
      percentage
    });
  }
  
  return weeks;
}

// Main export function
export function getStreakData() {
  const allDates = getAllActiveDates();
  const speedianceDates = getSpeedianceDates();
  const garminDates = getGarminDates();
  
  const streakData = calculateStreaks(allDates);
  const weeklyData = generateWeeklyData(allDates);
  const achievements = calculateAchievements(
    speedianceDates.length + garminDates.length,
    streakData
  );
  const weeklyConsistency = calculateWeeklyConsistency(allDates);
  
  return {
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    totalActiveDays: streakData.totalActiveDays,
    speedianceWorkouts: speedianceDates.length,
    garminRuns: garminDates.length,
    totalWorkouts: speedianceDates.length + garminDates.length,
    firstActiveDate: allDates[0] || null,
    lastActiveDate: allDates[allDates.length - 1] || null,
    weeklyData,
    streakHistory: streakData.streakHistory.slice(0, 10),
    achievements,
    weeklyConsistency
  };
}
