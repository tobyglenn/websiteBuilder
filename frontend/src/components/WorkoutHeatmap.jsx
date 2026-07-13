import { useMemo } from 'react';
import homepageFitnessData from '../data/homepageFitnessData.json';

const WEEK_COUNT = 52;

const HEAT_LEVELS = [
  { label: '0', className: 'bg-neutral-800', title: '0 sessions' },
  { label: '1', className: 'bg-emerald-900/90', title: '1 session' },
  { label: '2', className: 'bg-emerald-700', title: '2 sessions' },
  { label: '3', className: 'bg-green-500', title: '3 sessions' },
  { label: '4+', className: 'bg-lime-400', title: '4+ sessions' },
];

function toDateKey(rawDate) {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function getColorClass(count) {
  const sessions = Number(count) || 0;
  return HEAT_LEVELS[Math.min(Math.max(sessions, 0), HEAT_LEVELS.length - 1)].className;
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
      totalActive: (consistency.days || []).length || consistency.totalActive || 0,
      current: consistency.currentStreak ?? 0,
      longest: consistency.longestStreak ?? 0,
    };

    const end = consistency.rangeEnd ? new Date(`${consistency.rangeEnd}T00:00:00Z`) : new Date();
    end.setUTCHours(0, 0, 0, 0);

    // Anchor to the Saturday ending the current week and render exactly 52
    // Sunday-to-Saturday columns. The old 53-column range leaked the prior
    // partial June week, which made the month labels read like “JunJulAug…”.
    const endSaturday = new Date(end);
    endSaturday.setUTCDate(endSaturday.getUTCDate() + (6 - endSaturday.getUTCDay()));

    const startSunday = new Date(endSaturday);
    startSunday.setUTCDate(startSunday.getUTCDate() - (WEEK_COUNT - 1) * 7 - 6);

    const weeksData = [];
    const cursor = new Date(startSunday);

    for (let w = 0; w < WEEK_COUNT; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const key = toDateKey(cursor);
        week.push({
          key,
          date: new Date(cursor),
          count: key ? (counts.get(key)?.count ?? 0) : 0,
          runs: key ? (counts.get(key)?.runs ?? 0) : 0,
          lifting: key ? (counts.get(key)?.lifting ?? 0) : 0,
          bjj: key ? (counts.get(key)?.bjj ?? 0) : 0,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      weeksData.push(week);
    }

    const labels = [];
    let lastMonthKey = '';
    weeksData.forEach((week, weekIndex) => {
      // Label by the Sunday that starts each column. If a new month begins
      // mid-week, don't put its label over the prior month's Sunday-Tuesday
      // cells; wait until the first full week that starts in that month.
      const labelDate = week[0].date;
      const monthKey = `${labelDate.getUTCFullYear()}-${labelDate.getUTCMonth()}`;
      if (monthKey !== lastMonthKey) {
        labels.push({
          label: labelDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
          weekIndex,
        });
        lastMonthKey = monthKey;
      }
    });

    return { weeks: weeksData, monthLabels: labels, stats: summaryStats };
  }, []);

  const headingId = 'training-consistency-heading';
  const weekGridStyle = { gridTemplateColumns: `repeat(${weeks.length}, minmax(0.85rem, 1fr))` };

  return (
    <section
      id="training-consistency"
      aria-labelledby={headingId}
      data-section-title="Training Consistency"
      className="py-16 bg-neutral-950 border-t border-neutral-800 w-full"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="bg-neutral-900 rounded-lg p-4 md:p-6 border border-neutral-800 w-full overflow-x-auto">
          <div className="min-w-[48rem] w-full">
            <div className="grid mb-2 ml-10 h-4 text-xs text-neutral-500" style={weekGridStyle}>
              {monthLabels.map((month) => (
                <span
                  key={`${month.label}-${month.weekIndex}`}
                  className="truncate leading-4"
                  style={{ gridColumn: `${month.weekIndex + 1} / span 3` }}
                >
                  {month.label}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="grid grid-rows-7 h-[98px] w-8 shrink-0 text-xs text-neutral-500">
                <span className="h-[14px] leading-[14px]">Sun</span>
                <span className="h-[14px] leading-[14px]"></span>
                <span className="h-[14px] leading-[14px]">Tue</span>
                <span className="h-[14px] leading-[14px]"></span>
                <span className="h-[14px] leading-[14px]">Thu</span>
                <span className="h-[14px] leading-[14px]"></span>
                <span className="h-[14px] leading-[14px]">Sat</span>
              </div>

              <div className="grid flex-1 gap-0.5" style={weekGridStyle}>
                {weeks.map((week, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-0.5">
                    {week.map((day) => {
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
                        timeZone: 'UTC',
                      })}${breakdown ? ` (${breakdown})` : ''}`;

                      return (
                        <div
                          key={day.key + day.date.getTime()}
                          title={tooltip}
                          className={`h-3 rounded-sm ${getColorClass(day.count)} hover:ring-1 hover:ring-white/40 transition`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-neutral-500">
              <span>Less</span>
              {HEAT_LEVELS.map((level) => (
                <div key={level.label} className={`w-3 h-3 rounded-sm ${level.className}`} title={level.title} />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
