/**
 * heartRate.js — server-side HR data for /heart-rate page.
 * Runs at build time in Node.js context only.
 */
import rawData from './garmin_all_activities.json';

export function fmtDur(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDateLong(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getHeartRateData() {
  const raw = rawData;
  const all = raw.activities || [];

  // Filter to only activities with HR data
  const activities = all.filter(a => a.averageHR && a.maxHR).sort((a, b) => b.date.localeCompare(a.date));

  // Calculate overall stats
  const avgHR = Math.round(activities.reduce((s, a) => s + a.averageHR, 0) / activities.length);
  const maxHR = Math.max(...activities.map(a => a.maxHR));
  const avgAerobic = +(activities.reduce((s, a) => s + (a.aerobicTrainingEffect || 0), 0) / activities.length).toFixed(1);
  const totalTrainingLoad = Math.round(activities.reduce((s, a) => s + (a.activityTrainingLoad || 0), 0));

  // Total time in each zone (in seconds)
  const zoneTotals = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const a of activities) {
    for (let z = 1; z <= 5; z++) {
      zoneTotals[z] += a[`hrTimeInZone_${z}`] || 0;
    }
  }
  const totalZoneTime = Object.values(zoneTotals).reduce((s, v) => s + v, 0);

  // Zone percentages
  const zonePercentages = {};
  for (let z = 1; z <= 5; z++) {
    zonePercentages[z] = totalZoneTime > 0 ? Math.round((zoneTotals[z] / totalZoneTime) * 100) : 0;
  }

  // Monthly trends (2025-2026)
  const monthMap = {};
  for (const a of activities) {
    const k = a.date.slice(0, 7); // YYYY-MM
    if (!monthMap[k]) monthMap[k] = { hrSum: 0, count: 0, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
    monthMap[k].hrSum += a.averageHR || 0;
    monthMap[k].count++;
    for (let z = 1; z <= 5; z++) {
      monthMap[k][`z${z}`] += a[`hrTimeInZone_${z}`] || 0;
    }
  }

  const monthlyTrends = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => {
      const [y, mo] = month.split('-');
      const label = new Date(+y, +mo - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const fullLabel = new Date(+y, +mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const avg = d.count > 0 ? Math.round(d.hrSum / d.count) : 0;
      const total = d.z1 + d.z2 + d.z3 + d.z4 + d.z5;
      return {
        month,
        label,
        fullLabel,
        avgHR: avg,
        z1Pct: total > 0 ? Math.round((d.z1 / total) * 100) : 0,
        z2Pct: total > 0 ? Math.round((d.z2 / total) * 100) : 0,
        z3Pct: total > 0 ? Math.round((d.z3 / total) * 100) : 0,
        z4Pct: total > 0 ? Math.round((d.z4 / total) * 100) : 0,
        z5Pct: total > 0 ? Math.round((d.z5 / total) * 100) : 0,
      };
    });

  // Recent activities with HR details
  const recentActivities = activities.slice(0, 10).map(a => {
    const totalZoneTime = (a.hrTimeInZone_1 || 0) + (a.hrTimeInZone_2 || 0) + (a.hrTimeInZone_3 || 0) + (a.hrTimeInZone_4 || 0) + (a.hrTimeInZone_5 || 0);
    return {
      date: fmtDate(a.date),
      dateLong: fmtDateLong(a.date),
      name: a.activityName,
      distance: +(a.distance_miles || 0).toFixed(2),
      duration: fmtDur(a.duration),
      avgHR: a.averageHR,
      maxHR: a.maxHR,
      aerobicEffect: +(a.aerobicTrainingEffect || 0).toFixed(1),
      trainingLoad: Math.round(a.activityTrainingLoad || 0),
      zones: {
        z1: Math.round(a.hrTimeInZone_1 || 0),
        z2: Math.round(a.hrTimeInZone_2 || 0),
        z3: Math.round(a.hrTimeInZone_3 || 0),
        z4: Math.round(a.hrTimeInZone_4 || 0),
        z5: Math.round(a.hrTimeInZone_5 || 0),
      },
      zonePcts: {
        z1: totalZoneTime > 0 ? Math.round(((a.hrTimeInZone_1 || 0) / totalZoneTime) * 100) : 0,
        z2: totalZoneTime > 0 ? Math.round(((a.hrTimeInZone_2 || 0) / totalZoneTime) * 100) : 0,
        z3: totalZoneTime > 0 ? Math.round(((a.hrTimeInZone_3 || 0) / totalZoneTime) * 100) : 0,
        z4: totalZoneTime > 0 ? Math.round(((a.hrTimeInZone_4 || 0) / totalZoneTime) * 100) : 0,
        z5: totalZoneTime > 0 ? Math.round(((a.hrTimeInZone_5 || 0) / totalZoneTime) * 100) : 0,
      },
    };
  });

  return {
    stats: {
      avgHR,
      maxHR,
      avgAerobic,
      totalTrainingLoad,
      zoneTotals,
      zonePercentages,
      totalActivities: activities.length,
    },
    monthlyTrends,
    recentActivities,
  };
}
