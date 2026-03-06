import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Load unified training timeline ──────────────────────────────────────────
const UNIFIED_DATA = JSON.parse(
  readFileSync(resolve('/Users/tobyglennpeters/clawd/data/unified_training_timeline.json'), 'utf-8')
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hasWorkout(dayData) {
  // Check Tonal workouts
  if (dayData.tonal && dayData.tonal.workouts && dayData.tonal.workouts.length > 0) {
    return true;
  }
  // Check Garmin activities
  if (dayData.garmin && dayData.garmin.activities && dayData.garmin.activities.length > 0) {
    return true;
  }
  // Check Speediance (if it exists in the data)
  if (dayData.speediance && dayData.speediance.workouts && dayData.speediance.workouts.length > 0) {
    return true;
  }
  return false;
}

// Calculate streaks from sorted workout dates
function calculateStreaks(dates) {
  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort dates
  const sortedDates = [...dates].sort();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Calculate longest streak
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak (working backwards from today/yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastWorkoutDate = new Date(sortedDates[sortedDates.length - 1]);
  lastWorkoutDate.setHours(0, 0, 0, 0);
  
  const daysSinceLast = Math.round((today - lastWorkoutDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLast <= 1) {
    // Streak is ongoing, count backwards
    currentStreak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const curr = new Date(sortedDates[i + 1]);
      const prev = new Date(sortedDates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  return { currentStreak, longestStreak };
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function getHeatmapData() {
  const dates = Object.keys(UNIFIED_DATA).sort();
  
  if (dates.length === 0) {
    return {
      heatmapData: [],
      stats: {
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        thisYear: 0,
      },
      monthlyData: [],
    };
  }

  // Get first and last date for the range
  const firstDate = new Date(dates[0]);
  const lastDate = new Date(dates[dates.length - 1]);
  
  // Generate all dates in range
  const heatmapData = [];
  const workoutDates = new Set();
  const currentYear = new Date().getFullYear();
  let thisYearCount = 0;
  
  const current = new Date(firstDate);
  while (current <= lastDate) {
    const dateStr = current.toISOString().slice(0, 10);
    const dayData = UNIFIED_DATA[dateStr];
    const hasWork = dayData && hasWorkout(dayData);
    
    if (hasWork) {
      workoutDates.add(dateStr);
      if (current.getFullYear() === currentYear) {
        thisYearCount++;
      }
    }
    
    // Day of week: 0 = Sunday in JS, convert to 0 = Monday
    const dow = (current.getUTCDay() + 6) % 7;
    
    heatmapData.push({
      date: dateStr,
      count: hasWork ? 1 : 0,
      dow,
    });
    
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Calculate streaks
  const workoutDateArray = Array.from(workoutDates);
  const { currentStreak, longestStreak } = calculateStreaks(workoutDateArray);

  // Monthly aggregation for bar chart
  const monthlyCounts = {};
  heatmapData.forEach(d => {
    if (d.count > 0) {
      const month = d.date.slice(0, 7); // YYYY-MM
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    }
  });

  // Format monthly data for chart
  const monthLabels = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
  };

  const monthlyData = Object.entries(monthlyCounts)
    .map(([month, count]) => ({
      month,
      label: `${monthLabels[month.slice(5)]} '${month.slice(2, 4)}`,
      count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    heatmapData,
    stats: {
      currentStreak,
      longestStreak,
      totalDays: workoutDates.size,
      thisYear: thisYearCount,
    },
    monthlyData,
  };
}
