import homepageFitnessData from '../data/homepageFitnessData.json';

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

function formatRangeDate(key) {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function ThisWeekWidget() {
  const progress = homepageFitnessData.weeklyProgress || {
    dateRange: {
      thisWeekStart: '1970-01-01',
      thisWeekEnd: '1970-01-07',
    },
    workouts: { thisWeek: 0, lastWeek: 0 },
    miles: { thisWeek: 0, lastWeek: 0 },
    volume: { thisWeek: 0, lastWeek: 0 },
  };

  const stats = {
    thisWeek: {
      workouts: progress.workouts?.thisWeek ?? 0,
      miles: progress.miles?.thisWeek ?? 0,
      volume: progress.volume?.thisWeek ?? 0,
    },
    lastWeek: {
      workouts: progress.workouts?.lastWeek ?? 0,
      miles: progress.miles?.lastWeek ?? 0,
      volume: progress.volume?.lastWeek ?? 0,
    },
  };

  const range = progress.dateRange || {
    thisWeekStart: '1970-01-01',
    thisWeekEnd: '1970-01-07',
  };
  const headingId = 'weekly-progress-heading';

  return (
    <section
      id="weekly-progress"
      aria-labelledby={headingId}
      data-section-title="Weekly Progress"
      className="py-16 bg-neutral-950 border-t border-neutral-800"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-2 block">
            This Week in Training
          </span>
          <h2 id={headingId} className="text-3xl md:text-4xl font-bold text-white">Weekly Progress</h2>
          <p className="text-neutral-500 mt-3 max-w-xl mx-auto">
            Compare this week&apos;s performance to last week.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
          <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <div className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">
              Workouts
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-white">{stats.thisWeek.workouts}</div>
                <div className="text-xs text-neutral-500">This Week</div>
              </div>
              <div className="flex flex-col justify-center">
                <div
                  className={`text-lg font-bold ${
                    stats.thisWeek.workouts >= stats.lastWeek.workouts
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {getComparisonText(stats.thisWeek.workouts, stats.lastWeek.workouts)}
                </div>
                <div className="text-xs text-neutral-500">vs Last Week</div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <div className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">
              Miles Run
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-white">{stats.thisWeek.miles.toFixed(1)}</div>
                <div className="text-xs text-neutral-500">This Week</div>
              </div>
              <div className="flex flex-col justify-center">
                <div
                  className={`text-lg font-bold ${
                    stats.thisWeek.miles >= stats.lastWeek.miles
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {getComparisonText(stats.thisWeek.miles, stats.lastWeek.miles)}
                </div>
                <div className="text-xs text-neutral-500">vs Last Week</div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <div className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">
              Lbs Lifted
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-white">{formatNumber(stats.thisWeek.volume)}</div>
                <div className="text-xs text-neutral-500">This Week</div>
              </div>
              <div className="flex flex-col justify-center">
                <div
                  className={`text-lg font-bold ${
                    stats.thisWeek.volume >= stats.lastWeek.volume
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {getComparisonText(stats.thisWeek.volume, stats.lastWeek.volume)}
                </div>
                <div className="text-xs text-neutral-500">vs Last Week</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-neutral-500">
          {`This Week: ${formatRangeDate(range.thisWeekStart)}–${formatRangeDate(range.thisWeekEnd)}, ${range.thisWeekEnd.slice(0, 4)}`}
        </div>
      </div>
    </section>
  );
}
