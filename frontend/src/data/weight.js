// Weight journey data - Toby: 242→188→218.4 transformation/rebuild.
// Later points use the latest body-composition report measurement available.
export const weightData = [
  { date: '2023-01-01', weight: 242, note: 'Starting weight' },
  { date: '2023-08-04', weight: 230, note: 'Documented progress photo' },
  { date: '2023-09-07', weight: 220, note: 'Cut phase milestone' },
  { date: '2023-10-15', weight: 213, note: 'Continued cut' },
  { date: '2023-11-15', weight: 202, note: 'Late cut phase' },
  { date: '2024-01-04', weight: 188, note: 'Lowest documented weight' },
  { date: '2024-03-01', weight: 198.4, note: 'Garmin measurement' },
  { date: '2024-05-13', weight: 216.2, note: 'Rebuild phase' },
  { date: '2026-02-01', weight: 227.6, note: 'Garmin measurement' },
  { date: '2026-02-13', weight: 218.4, note: 'Latest measured weight in body-composition report' },
];

export function getStats() {
  const weights = weightData.map(e => e.weight);
  const latest = weightData[weightData.length - 1];
  return {
    start: weightData[0].weight,
    lowest: Math.min(...weights),
    current: latest.weight,
    currentDate: latest.date,
    currentNote: latest.note,
    totalChange: Math.round((latest.weight - weightData[0].weight) * 10) / 10
  };
}
