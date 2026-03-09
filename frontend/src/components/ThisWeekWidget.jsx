import { useMemo } from 'react';
import garminData from '../data/garmin_all_activities.json';
import speedianceData from '../data/speediance_dashboard_data.json';

// Get Monday of the current week (March 2, 2026)
function getWeekBounds(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

// Parse date from Garmin format "2025-02-17 14:58:30"
function parseGarminDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Parse date from Speediance format "2025-09-02"
function parseSpeedianceDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Flatten all Speediance sessions from all workout types
function getAllSpeedianceSessions(data) {
  if (!data?.workoutTypes) return [];
  const sessions = [];
  Object.values(data.workoutTypes).forEach((workoutType) => {
    if (workoutType?.sessions) {
      sessions.push(...workoutType.sessions);
    }
  });
  return sessions;
}

function calculateWeekStats(garminActivities, speedianceSessions, weekStart, weekEnd) {
  let workouts = 0;
  let miles = 0;
  let volume = 0;

  // Count Garmin activities in this week
  garminActivities.forEach((activity) => {
    const activityDate = parseGarminDate(activity.startTimeLocal);
    if (activityDate && activityDate >= weekStart && activityDate <= weekEnd) {
      workouts++;
      miles += activity.distance_miles || 0;
    }
  });

  // Count Speediance sessions in this week
  speedianceSessions.forEach((session) => {
    const sessionDate = parseSpeedianceDate(session.date);
    if (sessionDate && sessionDate >= weekStart && sessionDate <= weekEnd) {
      workouts++;
      volume += session.totalCapacity || 0;
    }
  });

  return { workouts, miles, volume };
}

function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return Math.round(num).toLocaleString();
}

function getComparisonText(current, previous) {
  if (previous === 0) {
    return current > 0 ? '↑ New!' : '—';
  }
  const diff = ((current - previous) / previous) * 100;
  const sign = diff >= 0 ? '↑' : '↓';
  return `${sign} ${Math.abs(Math.round(diff))}%`;
}

export default function ThisWeekWidget() {
  const stats = useMemo(() => {
    const now = new Date('2026-03-06'); // Current date from context
    const { monday: thisWeekStart, sunday: thisWeekEnd } = getWeekBounds(now);
    
    // Last week bounds
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const garminActivities = garminData?.activities || [];
    const speedianceSessions = getAllSpeedianceSessions(speedianceData);

    const thisWeek = calculateWeekStats(
      garminActivities,
      speedianceSessions,
      thisWeekStart,
      thisWeekEnd
    );

    const lastWeek = calculateWeekStats(
      garminActivities,
      speedianceSessions,
      lastWeekStart,
      lastWeekEnd
    );

    return { thisWeek, lastWeek };
  }, []);

  return (
    <section className="py-16 bg-neutral-950 border-t border-neutral-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-2 block">
            This Week in Training
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Weekly Progress</h2>
          <p className="text-neutral-500 mt-3 max-w-xl mx-auto">
            Compare this week&apos;s performance to last week.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
          {/* Workouts */}
          <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <div className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">
              Workouts
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-white">
                  {stats.thisWeek.workouts}
                </div>
                <div className="text-xs text-neutral-500">This Week</div>
              </div>
              <div className="flex flex-col justify-center">
                <div className={`text-lg font-bold ${
                  stats.thisWeek.workouts >= stats.lastWeek.workouts 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  {getComparisonText(stats.thisWeek.workouts, stats.lastWeek.workouts)}
                </div>
                <div className="text-xs text-neutral-500">vs Last Week</div>
              </div>
            </div>
          </div>

          {/* Miles Run */}
          <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <div className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">
              Miles Run
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-white">
                  {stats.thisWeek.miles.toFixed(1)}
                </div>
                <div className="text-xs text-neutral-500">This Week</div>
              </div>
              <div className="flex flex-col justify-center">
                <div className={`text-lg font-bold ${
                  stats.thisWeek.miles >= stats.lastWeek.miles 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  {getComparisonText(stats.thisWeek.miles, stats.lastWeek.miles)}
                </div>
                <div className="text-xs text-neutral-500">vs Last Week</div>
              </div>
            </div>
          </div>

          {/* Lbs Lifted */}
          <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <div className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">
              Lbs Lifted
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-white">
                  {formatNumber(stats.thisWeek.volume)}
                </div>
                <div className="text-xs text-neutral-500">This Week</div>
              </div>
              <div className="flex flex-col justify-center">
                <div className={`text-lg font-bold ${
                  stats.thisWeek.volume >= stats.lastWeek.volume 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  {getComparisonText(stats.thisWeek.volume, stats.lastWeek.volume)}
                </div>
                <div className="text-xs text-neutral-500">vs Last Week</div>
              </div>
            </div>
          </div>
        </div>

        {/* Week Range Display */}
        <div className="text-center mt-6 text-sm text-neutral-500">
          This Week: March 2-8, 2026
        </div>
      </div>
    </section>
  );
}
