export function trainingFreshness(data, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const dates = [data.trainingStats?.lastWorkoutData?.date, ...(data.consistency?.days || []).map(day => day.date)]
    .filter(value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= today).sort();
  const latestActivityDate = dates.at(-1) || null;
  const ageDays = latestActivityDate ? Math.floor((Date.parse(today) - Date.parse(latestActivityDate)) / 86400000) : null;
  // Activity age is not proof of inactivity or a successful source sync.
  return { latestActivityDate, ageDays, limited: ageDays === null || ageDays > 3 };
}
