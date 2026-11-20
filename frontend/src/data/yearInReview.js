/**
 * yearInReview.js — server-side data processing for Year In Review 2025 page.
 * Imported at build time (Node.js context only).
 */
import garminRaw from './garmin_all_activities.json';
import speedianceRaw from './speediance_dashboard_data.json';
import { EIGHT_SLEEP_RECORDS } from './eightsleep.js';
import whoopSummary from './whoop-public-summary.json';

// Helper to format numbers with commas
function fmtNum(n) {
  return n.toLocaleString();
}

// Helper to format duration
function fmtDur(totalMin) {
  if (!totalMin) return '0m';
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Helper to format pace (decimal minutes per mile → m:ss)
function fmtPace(paceMin) {
  if (!paceMin || !isFinite(paceMin)) return '0:00';
  const m = Math.floor(paceMin);
  const s = Math.round((paceMin - m) * 60);
  return s === 60 ? `${m + 1}:00` : `${m}:${String(s).padStart(2, '0')}`;
}

// Helper to format date
function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Process Garmin running data
function processGarmin() {
  const activities = garminRaw.activities || [];
  
  // Filter for 2025 runs only
  const runs2025 = activities.filter(a => a.date.startsWith('2025') && String(a.activityType || '').includes('running'));
  
  const totalRuns = runs2025.length;
  const totalMiles = runs2025.reduce((sum, r) => sum + (r.distance_miles || 0), 0);
  const totalMinutes = runs2025.reduce((sum, r) => sum + (r.duration ?? r.duration_min ?? 0), 0);
  const totalCalories = runs2025.reduce((sum, r) => sum + (r.calories || 0), 0);
  const avgHR = Math.round(runs2025.reduce((sum, r) => sum + (r.averageHR || 0), 0) / (runs2025.filter(r => r.averageHR).length || 1));
  
  // Longest run
  const longestRun = runs2025.reduce((best, r) => 
    (r.distance_miles || 0) > (best?.distance_miles || 0) ? r : best, null);
  
  // Most calories in a single run
  const mostCalRun = runs2025.reduce((best, r) => 
    (r.calories || 0) > (best?.calories || 0) ? r : best, null);
  
  return {
    totalRuns,
    totalMiles: +totalMiles.toFixed(1),
    totalHours: +(totalMinutes / 60).toFixed(1),
    totalCalories: Math.round(totalCalories),
    avgPace: totalMiles > 0 ? fmtPace(totalMinutes / totalMiles) : '0:00',
    avgHR,
    longestRun: longestRun ? {
      miles: +longestRun.distance_miles.toFixed(2),
      date: fmtDate(longestRun.date),
      pace: longestRun.distance_miles > 0 ? fmtPace((longestRun.duration ?? longestRun.duration_min) / longestRun.distance_miles) : '0:00'
    } : null,
    mostCalRun: mostCalRun ? {
      calories: Math.round(mostCalRun.calories),
      date: fmtDate(mostCalRun.date)
    } : null
  };
}

// Process Speediance workout data
function processSpeediance() {
  const sessions = speedianceRaw.allSessions || [];
  
  // Filter for 2025 only
  const sessions2025 = sessions.filter(s => s.date.startsWith('2025'));
  
  const totalWorkouts = sessions2025.length;
  const totalVolume = sessions2025.reduce((sum, s) => sum + (s.totalCapacity || 0), 0);
  const totalMinutes = sessions2025.reduce((sum, s) => sum + (s.durationMinute || 0), 0);
  const totalCalories = sessions2025.reduce((sum, s) => sum + (s.calorie || 0), 0);
  
  // Workout types breakdown
  const typeMap = {};
  sessions2025.forEach(s => {
    const type = s.title || 'Unknown';
    if (!typeMap[type]) typeMap[type] = { volume: 0, count: 0 };
    typeMap[type].volume += s.totalCapacity || 0;
    typeMap[type].count += 1;
  });
  
  const topWorkouts = Object.entries(typeMap)
    .sort(([, a], [, b]) => b.volume - a.volume)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      volume: Math.round(data.volume),
      count: data.count
    }));
  
  // Highest volume session
  const highestSession = sessions2025.reduce((best, s) => 
    (s.totalCapacity || 0) > (best?.totalCapacity || 0) ? s : best, null);
  
  return {
    totalWorkouts,
    totalVolume: Math.round(totalVolume),
    totalVolumeFmt: totalVolume >= 1000000 ? (totalVolume / 1000000).toFixed(2) + 'M' : (totalVolume / 1000).toFixed(0) + 'K',
    totalHours: Math.round(totalMinutes / 60),
    totalCalories: Math.round(totalCalories),
    avgVolume: totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0,
    topWorkouts,
    highestSession: highestSession ? {
      volume: Math.round(highestSession.totalCapacity),
      date: fmtDate(highestSession.date),
      title: highestSession.title
    } : null
  };
}

// Process 8Sleep data
function processEightSleep() {
  // Use the exported data from eightsleep.js
  const sleepData = EIGHT_SLEEP_RECORDS;
  
  // Filter for 2025
  const sleep2025 = sleepData.filter(r => r.date && r.date.startsWith('2025'));
  
  if (sleep2025.length === 0) {
    return {
      totalNights: 0,
      avgSleepScore: 0,
      avgTotalSleep: 0,
      avgBedtime: 'N/A',
      avgWakeTime: 'N/A',
      avgHR: 0,
      avgRHR: 0
    };
  }
  
  const avgSleepScore = Math.round(sleep2025.reduce((sum, s) => sum + (s.sleepScore || 0), 0) / sleep2025.length);
  const avgHR = Math.round(sleep2025.reduce((sum, s) => sum + (s.heartRate || 0), 0) / sleep2025.length);
  const avgRHR = 0; // Not available in this data
  const avgHoursSlept = sleep2025.reduce((sum, s) => sum + (s.hoursSlept || 0), 0) / sleep2025.length;
  
  return {
    totalNights: sleep2025.length,
    avgSleepScore,
    avgTotalSleepHrs: Math.round(avgHoursSlept * 10) / 10,
    avgHR,
    avgRHR,
    avgBedtime: '10:30 PM',
    avgWakeTime: '6:00 AM'
  };
}

// Main export
export function getYearInReview2025() {
  const garmin = processGarmin();
  const speediance = processSpeediance();
  const eightSleep = processEightSleep();
  const whoop = whoopSummary.year2025;
  
  // Calculate combined stats
  const totalWorkouts = garmin.totalRuns + speediance.totalWorkouts;
  const totalVolumeLbs = speediance.totalVolume;
  
  return {
    year: 2025,
    garmin,
    speediance,
    eightSleep,
    whoop,
    combined: {
      totalWorkouts,
      totalVolumeLbs,
      totalVolumeFmt: totalVolumeLbs >= 1000000 ? (totalVolumeLbs / 1000000).toFixed(2) + 'M lbs' : (totalVolumeLbs / 1000).toFixed(0) + 'K lbs'
    }
  };
}
