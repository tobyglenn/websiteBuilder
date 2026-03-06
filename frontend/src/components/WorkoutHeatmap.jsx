import { useState, useMemo } from 'react';
import speedianceData from '../data/speediance_dashboard_data.json';
import garminData from '../data/garmin_all_activities.json';

const DAY_MS = 24 * 60 * 60 * 1000;

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
  const { weeks, monthLabels } = useMemo(() => {
    const counts = new Map();

    const speedianceDates = speedianceData?.dashboardData?.allSessions?.map((s) => s?.date) ?? [];
    const garminDates = garminData?.activities?.map((a) => a?.date) ?? [];

    [...speedianceDates, ...garminDates].forEach((date) => {
      const key = toLocalDateKey(date);
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

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

    return { weeks: weeksData, monthLabels: labels };
  }, []);

  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4 md:p-6">
      <div className="mb-6">
        <h3 className="text-2xl md:text-3xl font-bold text-white">Training Consistency</h3>
        <p className="text-neutral-400 mt-2 text-sm md:text-base">
          Last 52 weeks of workouts and runs (Speediance + Garmin).
        </p>
      </div>

      <div className="overflow-x-auto">
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
  );
}
