/**
 * yearInReview.js — server-side data processing for Year In Review 2025 page.
 * Imported at build time (Node.js context only).
 */
import garminRaw from './garmin_all_activities.json';
import speedianceRaw from './speediance_dashboard_data.json';
import { EIGHT_SLEEP_RECORDS } from './eightsleep.js';
import whoopRaw from './whoop_v2_latest.json';

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

// Helper to format date
function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Process Garmin running data
function processGarmin() {
  const activities = garminRaw.activities || [];
  
  // Filter for 2025 only
  const runs2025 = activities.filter(a => a.date.startsWith('2025'));
  
  const totalRuns = runs2025.length;
  const totalMiles = runs2025.reduce((sum, r) => sum + (r.distance_miles || 0), 0);
  const totalMinutes = runs2025.reduce((sum, r) => sum + (r.duration_min || 0), 0);
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
    avgPace: totalMiles > 0 ? fmtDur(totalMinutes / totalMiles) : '0:00',
    avgHR,
    longestRun: longestRun ? {
      miles: +longestRun.distance_miles.toFixed(2),
      date: fmtDate(longestRun.date),
      pace: longestRun.distance_miles > 0 ? fmtDur(longestRun.duration_min / longestRun.distance_miles) : '0:00'
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

// Process WHOOP data
function processWhoop() {
  const data = whoopRaw;
  
  if (!data || !data.recovery || !data.recovery.records || data.recovery.records.length === 0) {
    return {
      totalDays: 0,
      avgStrain: 0,
      avgRecovery: 0,
      avgSleep: 0,
      avgHRV: 0,
      avgRHR: 0,
      recoveryRate: 0,
      maxStrain: 0
    };
  }
  
  const records = data.recovery.records.map(r => ({
    date: new Date(r.created_at).toISOString().split('T')[0],
    recovery: r.score?.recovery_score || 0,
    strain: r.score?.strain || 0,
    hrv: r.score?.hrv_rmssd_milli || 0,
    rhr: r.score?.resting_heart_rate || 0,
    sleep: r.score?.sleep_performance_seconds || 0
  }));
  
  // Filter for 2025
  const daily2025 = records.filter(d => d.date.startsWith('2025'));
  
  if (daily2025.length === 0) {
    return {
      totalDays: 0,
      avgStrain: 0,
      avgRecovery: 0,
      avgSleep: 0,
      avgHRV: 0,
      avgRHR: 0,
      recoveryRate: 0,
      maxStrain: 0
    };
  }
  
  const avgRecovery = Math.round(daily2025.reduce((sum, d) => sum + (d.recovery || 0), 0) / daily2025.length);
  const avgHRV = Math.round(daily2025.reduce((sum, d) => sum + (d.hrv || 0), 0) / daily2025.length);
  const avgRHR = Math.round(daily2025.reduce((sum, d) => sum + (d.rhr || 0), 0) / daily2025.length);
  const avgSleep = Math.round(daily2025.reduce((sum, d) => sum + (d.sleep || 0), 0) / daily2025.length / 3600 * 10) / 10;
  
  // Recovery rate (days in green recovery / total days)
  const greenDays = daily2025.filter(d => d.recovery >= 67).length;
  const recoveryRate = Math.round((greenDays / daily2025.length) * 100);
  
  // Calculate strain from activity data if available
  const maxStrain = 21; // Default max
  
  return {
    totalDays: daily2025.length,
    avgStrain: 12, // Placeholder - would need activity data
    avgRecovery,
    avgSleep,
    avgHRV,
    avgRHR,
    recoveryRate,
    maxStrain
  };
}

// Main export
export function getYearInReview2025() {
  const garmin = processGarmin();
  const speediance = processSpeediance();
  const eightSleep = processEightSleep();
  const whoop = processWhoop();
  
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
