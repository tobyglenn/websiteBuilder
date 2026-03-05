// ═══════════════════════════════════════════════════════════════════════════
//  SLEEP DATA — extracted from 8Sleep exports
//  Generated from full historical dataset
// ═══════════════════════════════════════════════════════════════════════════

export const SLEEP_DATA = [
  { date: "2026-02-11", score: 61, quality: 93, hrv: 27.9, hr: 76, hours: 3.48 },
  { date: "2026-02-12", score: 47, quality: 23, hrv: 21.8, hr: 78, hours: 5.87 },
  { date: "2026-02-13", score: 78, quality: 80, hrv: 174.7, hr: 66, hours: 6.31 },
  { date: "2026-02-17", score: 50, quality: 62, hrv: 56.8, hr: 71, hours: 4.77 },
  { date: "2026-02-18", score: 88, quality: 95, hrv: 22.7, hr: 75, hours: 6.7 },
  { date: "2026-02-19", score: 88, quality: 93, hrv: 26.3, hr: 69, hours: 6.66 },
  { date: "2026-02-20", score: 77, quality: 89, hrv: 24.8, hr: 64, hours: 5.63 },
  { date: "2026-02-21", score: 54, quality: 52, hrv: 22.6, hr: 69, hours: 4.82 },
  { date: "2026-02-23", score: 75, quality: 83, hrv: 24.0, hr: 67, hours: 5.87 },
  { date: "2026-02-24", score: 82, quality: 75, hrv: 18.4, hr: 73, hours: 7.28 },
  { date: "2026-02-25", score: 55, quality: 57, hrv: 68.7, hr: 74, hours: 5.17 },
];

// Filter out zeros (no sleep recorded)
export const NIGHTS_WITH_SLEEP = SLEEP_DATA.filter(n => n.score > 0);

// Summary stats
export const AVG_SLEEP_SCORE = Math.round(
  NIGHTS_WITH_SLEEP.reduce((sum, n) => sum + n.score, 0) / NIGHTS_WITH_SLEEP.length
);

export const AVG_SLEEP_QUALITY = Math.round(
  NIGHTS_WITH_SLEEP.filter(n => n.quality != null).reduce((sum, n) => sum + n.quality, 0) / 
  NIGHTS_WITH_SLEEP.filter(n => n.quality != null).length
);

export const AVG_HRV = Math.round(
  NIGHTS_WITH_SLEEP.filter(n => n.hrv != null).reduce((sum, n) => sum + n.hrv, 0) / NIGHTS_WITH_SLEEP.filter(n => n.hrv != null).length * 10
) / 10;

export const AVG_HOURS = Math.round(
  NIGHTS_WITH_SLEEP.filter(n => n.hours != null).reduce((sum, n) => sum + n.hours, 0) / NIGHTS_WITH_SLEEP.filter(n => n.hours != null).length * 10
) / 10;

export const TOTAL_NIGHTS = NIGHTS_WITH_SLEEP.length;

// Last 30 nights (for table)
export const RECENT_NIGHTS = NIGHTS_WITH_SLEEP.slice(-30).reverse();

// 30-day trend (use available data)
export const TREND_DATA = NIGHTS_WITH_SLEEP.map(n => ({
  date: n.date.slice(5),
  score: n.score,
  hours: n.hours,
  quality: n.quality || 0,
}));

// Key insights
export const INSIGHTS = [
  `Average sleep score: ${AVG_SLEEP_SCORE} (based on ${TOTAL_NIGHTS} nights)`,
  "Best night: 2026-02-18 with score 88 (6.7h slept)",
  "Most challenging night: 2026-02-12 with score 47 (5.87h slept)",
  "Overall trend: sleep score improved from 65 (first half) to 72 (second half)",
  "Last 30 nights average sleep score: 69",
  `Average ${AVG_HOURS} hours per night with ${AVG_HRV}ms HRV`,
];

// WHOOP correlation data (from daily report)
export const WHOOP_CORRELATION = [
  { date: "2026-02-11", eight_score: 61, whoop_recovery: 18 },
];
