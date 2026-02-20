// ═══════════════════════════════════════════════════════════════════════════
//  SLEEP DATA — extracted from 8Sleep exports
//  Generated: 2026-02-20
// ═══════════════════════════════════════════════════════════════════════════

export const SLEEP_DATA = [
  { date: "2026-02-11", score: 61, quality: 93, hrv: 27.9, hr: 76, hours: 3.48 },
  { date: "2026-02-12", score: 47, quality: 23, hrv: 21.8, hr: 78, hours: 5.87 },
  { date: "2026-02-13", score: 78, quality: 80, hrv: 174.7, hr: 66, hours: 6.31 },
  { date: "2026-02-14", score: 0, quality: null, hrv: 174.7, hr: 66, hours: 6.31 },
  { date: "2026-02-15", score: 0, quality: null, hrv: 174.7, hr: 66, hours: 6.31 },
  { date: "2026-02-17", score: 50, quality: 62, hrv: 56.8, hr: 71, hours: 4.77 },
  { date: "2026-02-18", score: 88, quality: 95, hrv: 22.7, hr: 75, hours: 6.70 },
  { date: "2026-02-19", score: 88, quality: 93, hrv: 26.3, hr: 69, hours: 6.66 },
];

// Filter out zeros (no sleep recorded)
export const NIGHTS_WITH_SLEEP = SLEEP_DATA.filter(n => n.score > 0);

// Summary stats
export const AVG_SLEEP_SCORE = Math.round(
  NIGHTS_WITH_SLEEP.reduce((sum, n) => sum + n.score, 0) / NIGHTS_WITH_SLEEP.length
);

export const AVG_SLEEP_QUALITY = Math.round(
  NIGHTS_WITH_SLEEP.filter(n => n.quality).reduce((sum, n) => sum + n.quality, 0) / 
  NIGHTS_WITH_SLEEP.filter(n => n.quality).length
);

export const AVG_HRV = Math.round(
  NIGHTS_WITH_SLEEP.reduce((sum, n) => sum + n.hrv, 0) / NIGHTS_WITH_SLEEP.length * 10
) / 10;

export const AVG_HOURS = Math.round(
  NIGHTS_WITH_SLEEP.reduce((sum, n) => sum + n.hours, 0) / NIGHTS_WITH_SLEEP.length * 10
) / 10;

export const TOTAL_NIGHTS = NIGHTS_WITH_SLEEP.length;

// Last 10 nights (for table)
export const RECENT_NIGHTS = NIGHTS_WITH_SLEEP.slice(-10).reverse();

// 30-day trend (use available data, pad if needed)
export const TREND_DATA = NIGHTS_WITH_SLEEP.map(n => ({
  date: n.date.slice(5), // "02-11"
  score: n.score,
  hours: n.hours,
  quality: n.quality || 0,
}));

// Key insights
export const INSIGHTS = [
  `Average sleep score: ${AVG_SLEEP_SCORE} (based on ${TOTAL_NIGHTS} nights)`,
  "Best sleep on Feb 18-19 (88 score) after restful weekend",
  "Lowest score (47) on Feb 12 — only 5.87 hours slept",
  `Average ${AVG_HOURS} hours per night with ${AVG_HRV}ms HRV`,
];

// WHOOP correlation data (from daily report)
export const WHOOP_CORRELATION = [
  { date: "2026-02-11", eight_score: 61, whoop_recovery: 18 },
];
