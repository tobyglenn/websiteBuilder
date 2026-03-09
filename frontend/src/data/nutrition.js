// Cronometer nutrition data - parsed from CSV export
// Data source: /Users/tobyglennpeters/clawd/data/cronometer/dailysummary.csv

// Raw data parsed from CSV (only rows with actual nutrition data)
const rawData = [
  { date: '2025-03-29', calories: 3926.99, protein: 350.48, carbs: 373.19, fat: 138.20, water: 1488.84 },
  { date: '2025-03-30', calories: 3733.18, protein: 239.11, carbs: 356.92, fat: 149.07, water: 1756.33 },
  { date: '2025-03-31', calories: 3536.83, protein: 267.72, carbs: 321.38, fat: 133.18, water: 1613.78 },
  { date: '2025-04-01', calories: 1232.80, protein: 215.73, carbs: 16.00, fat: 29.51, water: 991.03 },
  { date: '2025-04-04', calories: 170.00, protein: 26.00, carbs: 13.50, fat: 3.00, water: 375.80 },
  { date: '2025-04-08', calories: 940.00, protein: 138.00, carbs: 59.00, fat: 21.50, water: 1211.38 },
  { date: '2025-04-09', calories: 890.00, protein: 136.00, carbs: 46.00, fat: 21.50, water: 1211.38 },
  { date: '2025-04-17', calories: 710.00, protein: 110.00, carbs: 39.00, fat: 17.00, water: 836.42 },
  { date: '2025-05-06', calories: 335.00, protein: 52.50, carbs: 13.50, fat: 8.00, water: 285.14 },
  { date: '2025-05-08', calories: 180.00, protein: 30.00, carbs: 5.00, fat: 4.50, water: 0 },
  { date: '2025-05-17', calories: 180.00, protein: 32.00, carbs: 10.00, fat: 2.00, water: 284.77 },
  { date: '2025-06-01', calories: 761.84, protein: 119.98, carbs: 33.99, fat: 18.02, water: 743.00 },
  { date: '2025-08-05', calories: 945.00, protein: 106.00, carbs: 74.00, fat: 33.11, water: 968.92 },
  { date: '2025-12-07', calories: 2409.35, protein: 302.97, carbs: 207.48, fat: 77.11, water: 919.87 },
  { date: '2025-12-08', calories: 2207.40, protein: 280.27, carbs: 218.50, fat: 61.17, water: 1582.98 },
  { date: '2025-12-09', calories: 2900.53, protein: 319.51, carbs: 198.29, fat: 108.90, water: 1817.01 },
  { date: '2025-12-10', calories: 5984.57, protein: 569.71, carbs: 256.02, fat: 328.04, water: 2740.99 },
  { date: '2025-12-11', calories: 1660.00, protein: 229.00, carbs: 100.50, fat: 48.50, water: 1303.95 },
  { date: '2025-12-12', calories: 2283.25, protein: 321.12, carbs: 118.00, fat: 61.49, water: 2308.69 },
  { date: '2026-01-06', calories: 3133.06, protein: 351.74, carbs: 94.56, fat: 141.40, water: 1825.14 },
  { date: '2026-01-07', calories: 3325.40, protein: 325.07, carbs: 132.20, fat: 165.71, water: 1892.17 },
  { date: '2026-01-08', calories: 3457.12, protein: 343.13, carbs: 90.27, fat: 191.71, water: 1351.23 },
  { date: '2026-01-09', calories: 3776.86, protein: 234.84, carbs: 325.07, fat: 162.08, water: 1142.82 },
  { date: '2026-01-10', calories: 4421.55, protein: 360.42, carbs: 316.57, fat: 201.19, water: 1906.22 },
  { date: '2026-01-11', calories: 5309.52, protein: 503.36, carbs: 598.46, fat: 93.06, water: 2015.92 },
  { date: '2026-01-12', calories: 3674.92, protein: 349.85, carbs: 248.11, fat: 152.43, water: 1247.03 },
  { date: '2026-01-13', calories: 5265.12, protein: 484.34, carbs: 427.91, fat: 190.56, water: 1692.83 },
  { date: '2026-01-14', calories: 4597.47, protein: 339.35, carbs: 240.87, fat: 259.07, water: 1573.16 },
  { date: '2026-01-15', calories: 2529.60, protein: 246.00, carbs: 184.00, fat: 111.50, water: 1477.95 },
  { date: '2026-01-16', calories: 2119.24, protein: 199.38, carbs: 159.40, fat: 103.21, water: 549.14 },
  { date: '2026-01-17', calories: 3858.89, protein: 463.60, carbs: 206.56, fat: 125.35, water: 2137.84 },
  { date: '2026-01-18', calories: 3215.85, protein: 256.65, carbs: 269.49, fat: 131.70, water: 1391.81 },
  { date: '2026-01-19', calories: 3250.06, protein: 249.38, carbs: 349.00, fat: 145.04, water: 1003.87 },
  { date: '2026-01-20', calories: 2753.06, protein: 300.13, carbs: 197.42, fat: 109.55, water: 1040.15 },
  { date: '2026-01-22', calories: 3650.00, protein: 391.43, carbs: 189.00, fat: 152.51, water: 2086.21 },
  { date: '2026-01-24', calories: 4287.30, protein: 335.68, carbs: 312.29, fat: 179.36, water: 1525.43 },
  { date: '2026-01-25', calories: 400.00, protein: 18.00, carbs: 4.00, fat: 3.00, water: 0 },
  { date: '2026-01-31', calories: 3835.00, protein: 290.00, carbs: 359.00, fat: 136.00, water: 550.81 },
  { date: '2026-02-01', calories: 3133.59, protein: 359.42, carbs: 225.00, fat: 118.10, water: 1078.68 },
  { date: '2026-02-02', calories: 2207.50, protein: 254.52, carbs: 196.90, fat: 62.70, water: 835.58 },
  { date: '2026-02-03', calories: 3429.96, protein: 430.62, carbs: 207.00, fat: 100.90, water: 1477.82 },
  { date: '2026-02-04', calories: 2397.84, protein: 236.87, carbs: 172.33, fat: 98.59, water: 2778.71 },
  { date: '2026-02-05', calories: 1970.48, protein: 189.44, carbs: 210.69, fat: 45.69, water: 689.35 },
  { date: '2026-02-06', calories: 2196.47, protein: 324.58, carbs: 74.00, fat: 71.91, water: 1449.79 },
  { date: '2026-02-08', calories: 3006.43, protein: 261.82, carbs: 244.49, fat: 108.12, water: 482.33 },
  { date: '2026-02-09', calories: 3043.52, protein: 267.21, carbs: 264.01, fat: 104.02, water: 1866.59 },
  { date: '2026-02-10', calories: 1539.83, protein: 205.28, carbs: 111.07, fat: 33.33, water: 1140.45 },
  { date: '2026-02-11', calories: 4132.87, protein: 469.98, carbs: 125.00, fat: 192.18, water: 1727.05 },
  { date: '2026-02-12', calories: 2424.59, protein: 297.88, carbs: 144.80, fat: 73.19, water: 1262.60 },
  { date: '2026-02-17', calories: 2406.43, protein: 287.30, carbs: 187.49, fat: 57.40, water: 1351.67 },
  { date: '2026-02-18', calories: 2540.00, protein: 300.00, carbs: 212.00, fat: 69.00, water: 1671.16 },
  { date: '2026-02-19', calories: 2667.96, protein: 363.41, carbs: 131.00, fat: 82.11, water: 1066.90 },
  { date: '2026-02-28', calories: 140.00, protein: 30.00, carbs: 6.00, fat: 1.00, water: 0 },
  { date: '2026-03-01', calories: 519.00, protein: 75.90, carbs: 17.20, fat: 17.50, water: 356.47 },
];

// Calculate aggregate statistics
function calculateStats() {
  const validData = rawData.filter(d => d.calories > 0);
  
  if (validData.length === 0) {
    return {
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
      avgWater: 0,
      totalDays: 0,
    };
  }

  const total = validData.length;
  
  const avgCalories = Math.round(validData.reduce((sum, d) => sum + d.calories, 0) / total);
  const avgProtein = Math.round(validData.reduce((sum, d) => sum + d.protein, 0) / total);
  const avgCarbs = Math.round(validData.reduce((sum, d) => sum + d.carbs, 0) / total);
  const avgFat = Math.round(validData.reduce((sum, d) => sum + d.fat, 0) / total);
  
  // Water in liters (convert from grams, excluding zeros)
  const waterData = validData.filter(d => d.water > 0);
  const avgWater = waterData.length > 0 
    ? (waterData.reduce((sum, d) => sum + d.water, 0) / waterData.length / 1000).toFixed(2)
    : 0;

  return {
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    avgWater: parseFloat(avgWater),
    totalDays: total,
  };
}

// Calculate monthly trends
function calculateMonthlyTrends() {
  const monthlyData = {};
  
  rawData.forEach(d => {
    if (d.calories > 0) {
      const month = d.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
      }
      monthlyData[month].calories += d.calories;
      monthlyData[month].protein += d.protein;
      monthlyData[month].carbs += d.carbs;
      monthlyData[month].fat += d.fat;
      monthlyData[month].count += 1;
    }
  });

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      avgCalories: Math.round(data.calories / data.count),
      avgProtein: Math.round(data.protein / data.count),
      avgCarbs: Math.round(data.carbs / data.count),
      avgFat: Math.round(data.fat / data.count),
      days: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Get recent records (last 10)
function getRecentRecords(limit = 10) {
  return [...rawData]
    .filter(d => d.calories > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

// Export stats
export const NUTRITION_STATS = calculateStats();
export const MONTHLY_TRENDS = calculateMonthlyTrends();
export const RECENT_RECORDS = getRecentRecords(10);
export const TOTAL_DAYS_TRACKED = NUTRITION_STATS.totalDays;

// Last synced date (most recent record)
export const LAST_SYNCED = RECENT_RECORDS.length > 0 ? RECENT_RECORDS[0].date : null;
