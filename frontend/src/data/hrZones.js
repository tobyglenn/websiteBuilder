import garminData from './garmin_all_activities.json';
import { zoneSecs } from './garminZones.js';

const activities = garminData.activities || [];

const hrZoneData = activities.reduce((acc, activity) => {
  const z1 = zoneSecs(activity, 1);
  const z2 = zoneSecs(activity, 2);
  const z3 = zoneSecs(activity, 3);
  const z4 = zoneSecs(activity, 4);
  const z5 = zoneSecs(activity, 5);
  
  acc.totalTime.z1 += z1;
  acc.totalTime.z2 += z2;
  acc.totalTime.z3 += z3;
  acc.totalTime.z4 += z4;
  acc.totalTime.z5 += z5;
  acc.totalRuns++;
  acc.avgHR += activity.averageHR || 0;
  acc.totalDistance += activity.distance || 0;
  
  const start = activity.startTimeLocal || activity.date;
  const month = start ? start.slice(0, 7) : 'unknown';
  if (!acc.monthly[month]) {
    acc.monthly[month] = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0, runs: 0 };
  }
  acc.monthly[month].z1 += z1;
  acc.monthly[month].z2 += z2;
  acc.monthly[month].z3 += z3;
  acc.monthly[month].z4 += z4;
  acc.monthly[month].z5 += z5;
  acc.monthly[month].runs++;
  
  return acc;
}, { totalTime: { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }, totalRuns: 0, avgHR: 0, totalDistance: 0, monthly: {} });

const totalSeconds = hrZoneData.totalTime.z1 + hrZoneData.totalTime.z2 + hrZoneData.totalTime.z3 + hrZoneData.totalTime.z4 + hrZoneData.totalTime.z5;

const totalHours = totalSeconds / 3600;

// Convert monthly object to sorted array
const monthlyArray = Object.entries(hrZoneData.monthly)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([month, data]) => ({
    month,
    z1: Math.round(data.z1 / 60),
    z2: Math.round(data.z2 / 60),
    z3: Math.round(data.z3 / 60),
    z4: Math.round(data.z4 / 60),
    z5: Math.round(data.z5 / 60),
    runs: data.runs
  }));

export const hrZones = {
  totalRuns: hrZoneData.totalRuns,
  avgHR: hrZoneData.totalRuns > 0 ? Math.round(hrZoneData.avgHR / hrZoneData.totalRuns) : 0,
  avgDistance: hrZoneData.totalRuns > 0 ? hrZoneData.totalDistance / hrZoneData.totalRuns : 0,
  totalHours: Math.round(totalHours * 10) / 10,
  totalTimeInMinutes: {
    z1: Math.round(hrZoneData.totalTime.z1 / 60),
    z2: Math.round(hrZoneData.totalTime.z2 / 60),
    z3: Math.round(hrZoneData.totalTime.z3 / 60),
    z4: Math.round(hrZoneData.totalTime.z4 / 60),
    z5: Math.round(hrZoneData.totalTime.z5 / 60),
  },
  zonePercentages: {
    z1: totalSeconds > 0 ? Math.round((hrZoneData.totalTime.z1 / totalSeconds) * 100) : 0,
    z2: totalSeconds > 0 ? Math.round((hrZoneData.totalTime.z2 / totalSeconds) * 100) : 0,
    z3: totalSeconds > 0 ? Math.round((hrZoneData.totalTime.z3 / totalSeconds) * 100) : 0,
    z4: totalSeconds > 0 ? Math.round((hrZoneData.totalTime.z4 / totalSeconds) * 100) : 0,
    z5: totalSeconds > 0 ? Math.round((hrZoneData.totalTime.z5 / totalSeconds) * 100) : 0,
  },
  monthly: hrZoneData.monthly,
  monthlyArray,
  recentRuns: [...activities].sort((a, b) => String(b.startTimeLocal || b.date).localeCompare(String(a.startTimeLocal || a.date))).slice(0, 10).map(a => ({
    title: a.activityName,
    date: a.startTimeLocal || a.date,
    avgHR: a.averageHR,
    maxHR: a.maxHR,
    distance: a.distance,
    z1: Math.round(zoneSecs(a, 1) / 60),
    z2: Math.round(zoneSecs(a, 2) / 60),
    z3: Math.round(zoneSecs(a, 3) / 60),
    z4: Math.round(zoneSecs(a, 4) / 60),
    z5: Math.round(zoneSecs(a, 5) / 60),
  }))
};
