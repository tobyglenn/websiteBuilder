// trainingStats.js - compute training activity metrics for homepage
// This runs at build time (Node) in Astro, so we can import JSON directly.
import speedData from '../data/speediance_dashboard_data.json' assert { type: 'json' };
import garminData from '../data/garmin_all_activities.json' assert { type: 'json' };

// Helper to parse date strings (YYYY-MM-DD) into Date objects (UTC)
function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// Collect all Speediance sessions across all workoutTypes
function collectSpeedSessions() {
  const sessions = [];
  const types = speedData.workoutTypes || {};
  for (const [typeName, typeInfo] of Object.entries(types)) {
    const sess = typeInfo.sessions || [];
    for (const s of sess) {
      // ensure date exists
      if (s.date) {
        sessions.push({ date: s.date, type: typeName, totalCapacity: s.totalCapacity });
      }
    }
  }
  return sessions;
}

const speedSessions = collectSpeedSessions();

// Build a Set of dates (ISO string) for quick lookup
const speedDateSet = new Set(speedSessions.map(s => s.date));

// Compute training streak up to today (dynamic — uses current date at build time)
const today = new Date();
let streak = 0;
for (let d = new Date(today); ; d.setUTCDate(d.getUTCDate() - 1)) {
  const iso = d.toISOString().slice(0, 10);
  if (speedDateSet.has(iso)) {
    streak++;
  } else {
    break;
  }
}

// Find most recent workout
let lastWorkout = null;
if (speedSessions.length) {
  speedSessions.sort((a, b) => (a.date < b.date ? 1 : -1)); // descending
  const recent = speedSessions[0];
  lastWorkout = { date: recent.date, type: recent.type };
}

// Calculate this week's total capacity (lbs lifted) – ISO week starting Monday
function getISOWeekStart(date) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 (Sun) - 6
  const diff = (day === 0 ? -6 : 1 - day); // Monday as start
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const weekStart = getISOWeekStart(today);
let weekVolume = 0;
for (const s of speedSessions) {
  const d = parseDate(s.date);
  if (d >= weekStart && d <= today) {
    weekVolume += Number(s.totalCapacity) || 0;
  }
}

// Compute this month's total miles from Garmin data
const month = today.getUTCMonth(); // 0-indexed
const year = today.getUTCFullYear();
let monthMiles = 0;
for (const act of garminData.activities || []) {
  if (act.date) {
    const d = parseDate(act.date);
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month) {
      monthMiles += Number(act.distance_miles) || 0;
    }
  }
}

export const trainingStreak = streak;
export { lastWorkout as lastWorkoutData };
export const thisWeekVolume = Math.round(weekVolume);
export const thisMonthMiles = Number(monthMiles.toFixed(2));
