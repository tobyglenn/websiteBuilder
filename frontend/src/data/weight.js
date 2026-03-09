// Weight journey data - Toby: 242→188→218 transformation
export const weightData = [
  { date: '2023-01-01', weight: 242, note: 'Starting weight' },
  { date: '2023-06-01', weight: 220, note: 'Mid-way progress' },
  { date: '2023-12-01', weight: 195, note: 'Getting closer' },
  { date: '2024-03-01', weight: 188, note: 'Lowest weight - 188 lbs' },
  { date: '2024-06-01', weight: 195, note: 'Started building muscle' },
  { date: '2024-09-01', weight: 205, note: 'Muscle building phase' },
  { date: '2025-01-01', weight: 212, note: 'Continued progress' },
  { date: '2025-06-01', weight: 215, note: 'Strength gains' },
  { date: '2025-12-01', weight: 218, note: 'Current weight' },
  { date: '2026-03-01', weight: 218, note: 'Present day' },
];

export function getStats() {
  const weights = weightData.map(e => e.weight);
  return {
    start: weightData[0].weight,
    lowest: Math.min(...weights),
    current: weightData[weightData.length - 1].weight,
    totalChange: weightData[weightData.length - 1].weight - weightData[0].weight
  };
}
