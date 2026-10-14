const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const numbers = (records, getter) => records.map(getter).filter(value => typeof value === 'number' && Number.isFinite(value));

export function summarizeRuns(activities, locale = 'en-US') {
  const runs = activities.filter(a => ['running', 'treadmill_running'].includes(a.activityType))
    .sort((a, b) => String(a.date || a.startTimeLocal || '').localeCompare(String(b.date || b.startTimeLocal || '')));
  const distance = a => Number(a?.distance_miles ?? a?.distance ?? 0);
  const totalDist = runs.reduce((sum, a) => sum + distance(a), 0);
  const totalMin = runs.reduce((sum, a) => sum + Number(a.duration_min ?? a.duration ?? 0), 0);
  const longest = [...runs].sort((a, b) => distance(b) - distance(a))[0];
  const date = a => a?.date || a?.startTimeLocal || '';
  const formatDate = (value, options) => value ? new Date(value.slice(0, 10) + 'T12:00:00Z').toLocaleDateString(locale, { ...options, timeZone: 'UTC' }) : '';
  const paceSeconds = totalDist ? Math.round(totalMin / totalDist * 60) : 0;
  return {
    totalRuns: runs.length, totalDistMi: +totalDist.toFixed(1), totalDistLabel: Math.round(totalDist).toLocaleString(locale),
    totalHrs: +(totalMin / 60).toFixed(1), totalCal: Math.round(runs.reduce((sum, a) => sum + Number(a.calories || 0), 0)),
    avgPace: `${Math.floor(paceSeconds / 60)}:${String(paceSeconds % 60).padStart(2, '0')}`,
    outdoorRuns: runs.filter(a => a.activityType === 'running').length,
    treadmillRuns: runs.filter(a => a.activityType === 'treadmill_running').length,
    longestMi: +distance(longest).toFixed(2), longestDate: formatDate(date(longest), {month:'short', day:'numeric', year:'numeric'}),
    firstDate: date(runs[0]), lastDate: date(runs.at(-1)),
    rangeLabel: runs.length ? `${formatDate(date(runs[0]), {month:'short', year:'numeric'})} – ${formatDate(date(runs.at(-1)), {month:'short', year:'numeric'})}` : '',
  };
}

export function summarizeWhoop(data) {
  const unique = records => [...new Map((records || []).map(r => [r.id ?? r.cycle_id ?? r.created_at, r])).values()];
  const recoveries = unique(data.recovery?.records);
  const stamp = r => r.start || r.created_at || r.date || '';
  const newest = recoveries.map(stamp).filter(Boolean).sort().at(-1);
  const windowEnd = newest ? newest.slice(0, 10) : null;
  const start = windowEnd ? new Date(windowEnd + 'T12:00:00Z') : null;
  if (start) start.setUTCDate(start.getUTCDate() - 29);
  const windowStart = start?.toISOString().slice(0, 10) ?? null;
  const inWindow = r => windowStart && stamp(r).slice(0, 10) >= windowStart && stamp(r).slice(0, 10) <= windowEnd;
  const recent = recoveries.filter(inWindow);
  const sleeps = unique(data.sleep?.records).filter(r => !r.nap && inWindow(r));
  const cycles = unique(data.cycle?.records).filter(inWindow);
  const mean = (records, getter) => average(numbers(records, getter));
  const score = r => r.score?.recovery_score;
  const allScores = numbers(recoveries, score);
  const stages = s => s.score?.stage_summary;
  const hours = (s, key) => stages(s)?.[key] == null ? null : stages(s)[key] / 3600000;
  const strains = numbers(cycles, c => c.score?.strain);
  return {
    available: recent.length > 0, windowStart, windowEnd, sampleCount: recent.length,
    recoveryAvg: mean(recent, score), hrvAvg: mean(recent, r => r.score?.hrv_rmssd_milli),
    rhrAvg: mean(recent, r => r.score?.resting_heart_rate), spo2Avg: mean(recent, r => r.score?.spo2_percentage),
    inBedHoursAvg: mean(sleeps, s => hours(s, 'total_in_bed_time_milli')),
    asleepHoursAvg: mean(sleeps, s => stages(s) ? ['total_light_sleep_time_milli','total_rem_sleep_time_milli','total_slow_wave_sleep_time_milli'].reduce((sum, key) => sum + (stages(s)[key] || 0), 0) / 3600000 : null),
    remHoursAvg: mean(sleeps, s => hours(s, 'total_rem_sleep_time_milli')),
    deepHoursAvg: mean(sleeps, s => hours(s, 'total_slow_wave_sleep_time_milli')),
    sleepPerfAvg: mean(sleeps, s => s.score?.sleep_performance_percentage),
    sleepEffAvg: mean(sleeps, s => s.score?.sleep_efficiency_percentage),
    respiratoryAvg: mean(sleeps, s => s.score?.respiratory_rate), strainAvg: average(strains), strainMax: strains.length ? Math.max(...strains) : null,
    totalRecords: recoveries.length, allTimeRecoveryAvg: average(allScores),
    allTimeGreenPct: allScores.length ? allScores.filter(v => v >= 67).length / allScores.length * 100 : null,
    allTimeYellowPct: allScores.length ? allScores.filter(v => v >= 34 && v < 67).length / allScores.length * 100 : null,
    allTimeRedPct: allScores.length ? allScores.filter(v => v < 34).length / allScores.length * 100 : null,
    lastSynced: data.last_synced ?? null,
  };
}

export function cleanWorkoutTitle(value) {
  const cleaned = String(value || '').replace(/\bARIA\b/gi, '').replace(/!OVERRIDE!/gi, '')
    .replace(/\b\d{8}\b/g, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Strength Workout';
  return /\bworkout\b/i.test(cleaned) ? cleaned : `${cleaned} Workout`;
}

export function summarizeWeights(records) {
  const history = [...new Map(records.filter(r => r.date && Number(r.weight) > 0)
    .map(r => [r.date, r])).values()].sort((a, b) => a.date.localeCompare(b.date));
  const latest = history.at(-1);
  const start = history[0]?.weight ?? null;
  return {
    start, lowest: history.length ? Math.min(...history.map(r => Number(r.weight))) : null,
    current: latest ? Number(latest.weight) : null, currentDate: latest?.date ?? null,
    currentNote: latest?.note ?? latest?.source ?? '',
    totalChange: latest ? Math.round((Number(latest.weight) - Number(start)) * 10) / 10 : null,
  };
}

export function summarizeSleep(records) {
  const sorted = [...new Map(records.filter(r => r.date).map(r => [r.date, r])).values()]
    .sort((a, b) => a.date.localeCompare(b.date));
  const windowEnd = sorted.at(-1)?.date ?? null;
  const start = windowEnd ? new Date(windowEnd.slice(0, 10) + 'T12:00:00Z') : null;
  if (start) start.setUTCDate(start.getUTCDate() - 29);
  const cutoff = start?.toISOString().slice(0, 10);
  const recent = sorted.filter(r => r.date >= cutoff);
  return { avgScore: average(numbers(recent, r => r.sleep_score ?? r.score)),
    avgHours: average(numbers(recent, r => r.time_slept_hours ?? r.hours)),
    windowStart: recent[0]?.date ?? null, windowEnd, sampleCount: recent.length };
}
