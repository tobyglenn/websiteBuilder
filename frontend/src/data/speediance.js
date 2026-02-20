/**
 * speediance.js — server-side data processing for Speediance workout data.
 * Imported at build time by speediance.astro (Node.js context only).
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DATA_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'speediance_dashboard_data.json'
);

const MONTH_NAMES = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

export function getSpeedianceData() {
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

  const sessions = raw.allSessions || [];
  const prs = raw.exercisePRs || {};
  const dateRange = raw.dateRange || {};

  const totalVolumeLbs = raw.totalVolumeLbs || 0;
  const totalWorkouts = raw.totalWorkouts || 0;

  const totalCalories = sessions.reduce((sum, s) => sum + (s.calorie || 0), 0);
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinute || 0), 0);
  const totalHours = Math.round(totalMinutes / 60);
  const avgVolume = Math.round(totalVolumeLbs / totalWorkouts);

  const bestSession = sessions.reduce((best, s) =>
    s.totalCapacity > (best?.totalCapacity || 0) ? s : best, null
  );

  // ── Monthly breakdown ──────────────────────────────────────────────────
  const monthlyMap = {};
  for (const s of sessions) {
    const month = s.date.slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { volume: 0, workouts: 0, calories: 0 };
    monthlyMap[month].volume += s.totalCapacity;
    monthlyMap[month].workouts += 1;
    monthlyMap[month].calories += s.calorie || 0;
  }

  const monthly = Object.keys(monthlyMap).sort().map(key => {
    const [year, mo] = key.split('-');
    return {
      key,
      label: `${MONTH_NAMES[mo]} '${year.slice(2)}`,
      volume: Math.round(monthlyMap[key].volume),
      workouts: monthlyMap[key].workouts,
      calories: monthlyMap[key].calories,
    };
  });

  // ── Workout type volume breakdown ──────────────────────────────────────
  const typeVolMap = {};
  for (const s of sessions) {
    if (!typeVolMap[s.title]) typeVolMap[s.title] = { volume: 0, count: 0 };
    typeVolMap[s.title].volume += s.totalCapacity;
    typeVolMap[s.title].count += 1;
  }

  const workoutTypeBreakdown = Object.entries(typeVolMap)
    .sort(([, a], [, b]) => b.volume - a.volume)
    .slice(0, 8)
    .map(([name, data]) => ({
      name,
      volume: Math.round(data.volume),
      count: data.count,
      pct: Math.round((data.volume / totalVolumeLbs) * 100),
    }));

  // ── Exercise PRs ───────────────────────────────────────────────────────
  const exercisePRs = Object.entries(prs)
    .filter(([name]) => !name.startsWith('\u200b'))
    .sort(([, a], [, b]) => b.best1RM - a.best1RM)
    .slice(0, 12)
    .map(([name, data]) => ({
      name: name.trim(),
      weight: data.best1RM,
      workout: data.workout,
    }));

  // ── Recent sessions (most recent 20) ──────────────────────────────────
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)
    .map(s => ({
      date: s.date,
      title: s.title,
      volume: Math.round(s.totalCapacity),
      duration: s.durationMinute,
      calories: s.calorie || 0,
    }));

  // ── Chart data (for client-side chart.js) ──────────────────────────────
  const chartData = monthly.map(m => ({
    label: m.label,
    volume: m.volume,
    workouts: m.workouts,
  }));

  // Donut chart data for workout type breakdown
  const donutData = workoutTypeBreakdown.map(t => ({
    name: t.name,
    volume: t.volume,
    pct: t.pct,
  }));

  return {
    stats: {
      totalVolumeLbs: Math.round(totalVolumeLbs),
      totalVolumeFmt: (totalVolumeLbs / 1_000_000).toFixed(2) + 'M',
      totalWorkouts,
      totalCalories,
      totalHours,
      avgVolume,
      bestSessionVolume: Math.round(bestSession?.totalCapacity || 0),
      bestSessionDate: bestSession?.date || '',
      bestSessionTitle: bestSession?.title || '',
      dateStart: dateRange.start || '',
      dateEnd: dateRange.end || '',
    },
    monthly,
    chartData,
    donutData,
    workoutTypeBreakdown,
    exercisePRs,
    recentSessions,
  };
}
