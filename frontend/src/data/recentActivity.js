import fs from 'fs';

const GARMIN_PATH = '/Users/tobyglennpeters/clawd/data/garmin_all_activities.json';
const SPEEDIANCE_PATH = '/Users/tobyglennpeters/clawd/data/speediance_dashboard_data.json';
const WHOOP_PATH = '/Users/tobyglennpeters/clawd/data/whoop_v2_latest.json';

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error('Error loading', filePath, e.message);
    return null;
  }
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPace(durationMinutes, distanceMiles) {
  if (!durationMinutes || !distanceMiles) return 'Pace unavailable';
  const paceMinutes = durationMinutes / distanceMiles;
  const mins = Math.floor(paceMinutes);
  const secs = Math.round((paceMinutes - mins) * 60);
  return `${mins}:${String(secs).padStart(2, '0')}/mi`;
}

function formatDuration(minutes) {
  if (!minutes) return 'Duration unavailable';
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

export function getRecentActivity() {
  const items = [];

  const garmin = loadJson(GARMIN_PATH);
  (garmin?.activities || [])
    .filter((activity) => String(activity.activityType || activity.activity_type || '').toLowerCase().includes('running'))
    .forEach((activity) => {
      const dateObj = toDate(activity.startTimeLocal || activity.date);
      if (!dateObj) return;
      const distance = Number(activity.distance_miles || 0);
      const duration = Number(activity.duration_min || 0);
      items.push({
        type: 'run',
        date: formatDate(dateObj),
        dateValue: dateObj,
        title: `${distance.toFixed(2)} mi run`,
        subtitle: `${formatPace(duration, distance)} pace • ${Math.round(duration)} min`,
      });
    });

  const speediance = loadJson(SPEEDIANCE_PATH);
  (speediance?.allSessions || speediance?.workouts || [])
    .forEach((session) => {
      const dateObj = toDate(session.date);
      if (!dateObj) return;
      const volume = Number(session.totalCapacity || session.volume || 0);
      const duration = Number(session.durationMinute || session.duration || 0);
      items.push({
        type: 'workout',
        date: formatDate(dateObj),
        dateValue: dateObj,
        title: session.title || 'Strength workout',
        subtitle: `${formatDuration(duration)} • ${new Intl.NumberFormat('en-US').format(Math.round(volume))} lbs`,
      });
    });

  const whoop = loadJson(WHOOP_PATH);
  const whoopRecoveryRecords = Array.isArray(whoop?.recovery)
    ? whoop.recovery
    : whoop?.recovery?.records || whoop?.recovery?.data || whoop?.recovery?.items || [];

  whoopRecoveryRecords.forEach((entry) => {
    const dateObj = toDate(entry.created_at || entry.updated_at || entry.date);
    if (!dateObj) return;
    const score = entry?.score?.recovery_score ?? entry?.recovery_score;
    const hrv = entry?.score?.hrv_rmssd_milli ?? entry?.hrv_rmssd_milli;
    items.push({
      type: 'recovery',
      date: formatDate(dateObj),
      dateValue: dateObj,
      title: `Recovery ${typeof score === 'number' ? `${score}%` : 'N/A'}`,
      subtitle: `HRV ${typeof hrv === 'number' ? Math.round(hrv) : 'N/A'} ms`,
    });
  });

  return items
    .sort((a, b) => b.dateValue - a.dateValue)
    .slice(0, 5)
    .map(({ dateValue, ...item }) => item);
}

export const recentActivity = getRecentActivity();
