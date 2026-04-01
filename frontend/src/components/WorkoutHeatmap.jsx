import { useMemo } from 'react';
import homepageFitnessData from '../data/homepageFitnessData.json';

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

export default function WorkoutHeatmap() {
  const { weeks, monthLabels, stats } = useMemo(() => {
    const consistency = homepageFitnessData.consistency || {
      totalActive: 0,
      currentStreak: 0,
      longestStreak: 0,
      rangeStart: null,
      rangeEnd: null,
      days: [],
    };

    const counts = new Map();
    (consistency.days || []).forEach((entry) => {
      counts.set(entry.date, {
        count: entry.count ?? 0,
        runs: entry.runs ?? 0,
        lifting: entry.lifting ?? 0,
        bjj: entry.bjj ?? 0,
      });
    });

    const summaryStats = {
      totalActive: consistency.totalActive ?? 0,
      current: consistency.currentStreak ?? 0,
      longest: consistency.longestStreak ?? 0,
    };

    const end = consistency.rangeEnd ? new Date(`${consistency.rangeEnd}T12:00:00Z`) : new Date();
    end.setHours(0, 0, 0, 0);

    const start = consistency.rangeStart
      ? new Date(`${consistency.rangeStart}T12:00:00Z`)
      : new Date(end);
    start.setHours(0, 0, 0, 0);

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
          count: key ? (counts.get(key)?.count ?? 0) : 0,
          runs: key ? (counts.get(key)?.runs ?? 0) : 0,
          lifting: key ? (counts.get(key)?.lifting ?? 0) : 0,
          bjj: key ? (counts.get(key)?.bjj ?? 0) : 0,
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

    return { weeks: weeksData, monthLabels: labels, stats: summaryStats };
  }, []);
  const headingId = 'training-consistency-heading';

  return (
    <section
      id="training-consistency"
      aria-labelledby={headingId}
      data-section-title="Training Consistency"
      className="py-16 bg-neutral-950 border-t border-neutral-800"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-2 block">Track Your Progress</span>
          <h2 id={headingId} className="text-3xl md:text-4xl font-bold text-white">Training Consistency</h2>
          <p className="text-neutral-500 mt-3 max-w-xl mx-auto">
            A year of training activity from Speediance workouts, Garmin runs, and BJJ sessions.
          </p>
        </div>

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
                  const breakdown = [
                    day.runs > 0 ? `${day.runs} run${day.runs === 1 ? '' : 's'}` : null,
                    day.lifting > 0 ? `${day.lifting} lift${day.lifting === 1 ? '' : 's'}` : null,
                    day.bjj > 0 ? `${day.bjj} BJJ session${day.bjj === 1 ? '' : 's'}` : null,
                  ].filter(Boolean).join(', ');
                  const tooltip = `${day.count} session${day.count === 1 ? '' : 's'} on ${day.date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}${breakdown ? ` (${breakdown})` : ''}`;

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
