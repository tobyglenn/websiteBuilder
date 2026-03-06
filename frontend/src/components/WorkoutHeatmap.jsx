import { useMemo } from 'react';
import speedianceData from '../data/speediance_dashboard_data.json';
import garminData from '../data/garmin_all_activities.json';

function toLocalDateKey(rawDate) {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return null;
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
}

function getColorClass(count) {
  if (count === 0) return 'bg-neutral-800';
  if (count <= 2) return 'bg-green-600';
  return 'bg-green-500';
}

function calculateStreaks(sortedDates) {
  if (sortedDates.length === 0) return { current: 0, longest: 0, totalActive: 0 };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const totalActive = sortedDates.length;
  
  // Calculate current streak
  let currentStreak = 0;
  const mostRecent = new Date(sortedDates[sortedDates.length - 1]);
  mostRecent.setHours(0, 0, 0, 0);
  
  const daysSinceLast = Math.floor((today - mostRecent) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLast <= 1) {
    let checkDate = new Date(mostRecent);
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const workoutDate = new Date(sortedDates[i]);
      workoutDate.setHours(0, 0, 0, 0);
      const diff = Math.floor((checkDate - workoutDate) / (1000 * 60 * 60 * 24));
      if (diff <= 1) {
        currentStreak++;
        checkDate = new Date(workoutDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  
  // Calculate longest streak
  let longestStreak = 1;
  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    prev.setHours(0, 0, 0, 0);
    curr.setHours(0, 0, 0, 0);
    const diff = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else if (diff > 1) {
      streak = 1;
    }
  }
  
  return { current: currentStreak, longest: longestStreak, totalActive };
}

export default function WorkoutHeatmap() {
  const { weeks, monthLabels, stats } = useMemo(() => {
    const counts = new Map();
    const allDates = [];

    const speedianceDates = speedianceData?.dashboardData?.allSessions?.map((s) => s?.date) ?? [];
    const garminDates = garminData?.activities?.map((a) => a?.date) ?? [];

    [...speedianceDates, ...garminDates].forEach((date) => {
      const key = toLocalDateKey(date);
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (!allDates.includes(key)) {
        allDates.push(key);
      }
    });

    allDates.sort();
    const stats = calculateStreaks(allDates);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - (52 * 7 - 1));

    const startSunday = new Date(start);
    startSunday.setDate(startSunday.getDate() - startSunday.getDay());

    const weeksData = [];
    const cursor = new Date(startSunday);

    for (let w = 0; w < 52; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const key = toLocalDateKey(cursor);
        week.push({
          key,
          date: new Date(cursor),
          count: key ? counts.get(key) ?? 0 : 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeksData.push(week);
    }

    const labels = [];
    let lastMonth = -1;
    weeksData.forEach((week, weekIndex) => {
      const month = week[0].date.getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: week[0].date.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex,
        });
        lastMonth = month;
      }
    });

    return { weeks: weeksData, monthLabels: labels, stats };
  }, []);

  return (
    <section className="py-16 bg-neutral-950 border-t border-neutral-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-2 block">Track Your Progress</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Training Consistency</h2>
          <p className="text-neutral-500 mt-3 max-w-xl mx-auto">
            A year of training activity from Speediance workouts and Garmin runs.
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-400">{stats.totalActive}</div>
            <div className="text-xs md:text-sm font-semibold text-neutral-400 uppercase tracking-wide">Active Days</div>
          </div>
          <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-400">{stats.current}</div>
            <div className="text-xs md:text-sm font-semibold text-neutral-400 uppercase tracking-wide">Current Streak</div>
          </div>
          <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-400">{stats.longest}</div>
            <div className="text-xs md:text-sm font-semibold text-neutral-400 uppercase tracking-wide">Longest Streak</div>
          </div>
        </div>
        
        {/* Heatmap */}
        <div className="bg-neutral-900 rounded-lg p-4 md:p-6 border border-neutral-800 overflow-x-auto">
          <div className="min-w-max">
            <div className="flex mb-2 ml-8 h-4 text-xs text-neutral-500 relative">
              {monthLabels.map((month) => (
                <span
                  key={`${month.label}-${month.weekIndex}`}
                  className="absolute"
                  style={{ left: `${month.weekIndex * 14}px` }}
                >
                  {month.label}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="grid grid-rows-7 h-[98px] text-xs text-neutral-500">
                <span className="h-[14px] leading-[14px]">Sun</span>
                <span className="h-[14px] leading-[14px]"></span>
                <span className="h-[14px] leading-[14px]">Tue</span>
                <span className="h-[14px] leading-[14px]"></span>
                <span className="h-[14px] leading-[14px]">Thu</span>
                <span className="h-[14px] leading-[14px]"></span>
                <span className="h-[14px] leading-[14px]">Sat</span>
              </div>

              <div className="grid grid-rows-7 grid-flow-col gap-0.5">
                {weeks.flat().map((day) => {
                  const tooltip = `${day.count} session${day.count === 1 ? '' : 's'} on ${day.date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}`;

                  return (
                    <div
                      key={day.key + day.date.getTime()}
                      title={tooltip}
                      className={`w-3 h-3 rounded-sm ${getColorClass(day.count)} hover:ring-1 hover:ring-white/40 transition`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-neutral-500">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-neutral-800" title="0 sessions" />
              <div className="w-3 h-3 rounded-sm bg-green-600" title="1-2 sessions" />
              <div className="w-3 h-3 rounded-sm bg-green-500" title="3+ sessions" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
