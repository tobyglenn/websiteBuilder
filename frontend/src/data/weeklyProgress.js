import speedianceData from './speediance_dashboard_data.json';
import garminData from './garmin_all_activities.json';

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(date) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

const now = new Date();
const thisWeekStart = getWeekStart(now);
const thisWeekEnd = getWeekEnd(now);
const lastWeekStart = new Date(thisWeekStart);
lastWeekStart.setDate(lastWeekStart.getDate() - 7);
const lastWeekEnd = new Date(thisWeekStart);
lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
lastWeekEnd.setHours(23, 59, 59, 999);

const speedianceSessions = speedianceData.allSessions || [];

const speedianceThisWeek = speedianceSessions.filter(s => {
  const date = new Date(s.date);
  return date >= thisWeekStart && date <= thisWeekEnd;
});

const speedianceLastWeek = speedianceSessions.filter(s => {
  const date = new Date(s.date);
  return date >= lastWeekStart && date <= lastWeekEnd;
});

const garminActivities = garminData.activities || [];

const garminThisWeek = garminActivities.filter(a => {
  const date = new Date(a.startTimeLocal || a.date);
  return date >= thisWeekStart && date <= thisWeekEnd && (a.activityType === 'running' || a.activityType === 'treadmill_running');
});

const garminLastWeek = garminActivities.filter(a => {
  const date = new Date(a.startTimeLocal || a.date);
  return date >= lastWeekStart && date <= lastWeekEnd && (a.activityType === 'running' || a.activityType === 'treadmill_running');
});

const thisWeekVolume = speedianceThisWeek.reduce((sum, s) => sum + (s.totalCapacity || s.totalWeight || s.volume || 0), 0);
const lastWeekVolume = speedianceLastWeek.reduce((sum, s) => sum + (s.totalCapacity || s.totalWeight || s.volume || 0), 0);
const thisWeekMiles = garminThisWeek.reduce((sum, a) => sum + (a.distance_miles || a.distance || 0), 0);
const lastWeekMiles = garminLastWeek.reduce((sum, a) => sum + (a.distance_miles || a.distance || 0), 0);

export const weeklyProgress = {
  workouts: { thisWeek: speedianceThisWeek.length, lastWeek: speedianceLastWeek.length },
  runs: { thisWeek: garminThisWeek.length, lastWeek: garminLastWeek.length },
  volume: { thisWeek: Math.round(thisWeekVolume), lastWeek: Math.round(lastWeekVolume) },
  miles: { thisWeek: parseFloat(thisWeekMiles.toFixed(1)), lastWeek: parseFloat(lastWeekMiles.toFixed(1)) }
};

export default weeklyProgress;
