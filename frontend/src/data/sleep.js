// 8Sleep Data Processing
// Processes raw 8Sleep data into usable stats and chart data

// Embedded latest data (synced from 8Sleep)
const eightSleepLatest = {
  "synced_at": "2026-02-25T09:07:38.924049",
  "date_range": {
    "from": "2025-12-27",
    "to": "2026-02-25"
  },
  "users": {
    "right": {
      "user_id": "13a5b55b34654a78987acbe73d52b7a9",
      "side": "right",
      "sleep_score": 73,
      "sleep_quality_score": 48,
      "bed_presence": true,
      "current_heart_rate": 78,
      "current_hrv": 54.2,
      "current_resp_rate": 20.1,
      "last_sleep_score": 7,
      "current_sleep_quality_score": 48,
      "current_bed_temp": 31,
      "current_room_temp": 21.77750062942505,
      "current_sleep_stage": "light",
      "current_sleep_breakdown": {
        "light": 23430,
        "deep": 6030,
        "rem": 2760,
        "awake": 7050
      },
      "time_slept": 32220,
      "time_slept_hours": 8.95
    },
    "left": {
      "user_id": "814083f2a02948088dfb7b97e1a0abd3",
      "side": "left",
      "sleep_score": 55,
      "sleep_quality_score": 57,
      "bed_presence": false,
      "current_heart_rate": 74,
      "current_hrv": 68.7,
      "current_resp_rate": 18.3,
      "last_sleep_score": 82,
      "current_sleep_quality_score": 57,
      "current_bed_temp": 21,
      "current_room_temp": 21.93192327939547,
      "current_sleep_stage": "awake",
      "current_sleep_breakdown": {
        "light": 14040,
        "deep": 990,
        "rem": 3600,
        "awake": 7680
      },
      "time_slept": 18630,
      "time_slept_hours": 5.17
    }
  },
  "device": {
    "has_water": true,
    "is_priming": false,
    "needs_priming": null,
    "water_level": null
  }
};

// Parse historical CSV data (embedded for simplicity)
const historicalCsvRaw = `date,sleep_score,last_sleep_score,sleep_quality_score,current_heart_rate,current_hrv,current_resp_rate,time_slept_hours
2026-02-11,61,98,93,76,27.9,17.1,3.48
2026-02-12,47,61,23,78,21.8,19.1,5.87
2026-02-13,78,47,80,66,174.7,18.4,6.31
2026-02-14,0,47,null,66,174.7,18.4,6.31
2026-02-15,0,47,null,66,174.7,18.4,6.31
2026-02-17,50,78,62,71,56.8,19.1,4.77
2026-02-18,88,50,95,75,22.7,17.4,6.7
2026-02-19,88,88,93,69,26.3,17.5,6.66
2026-02-20,77,88,89,64,24.8,19.4,5.63
2026-02-21,54,77,52,69,22.6,18.6,4.82
2026-02-23,75,78,83,67,24,19.4,5.87
2026-02-24,82,75,75,73,18.4,19.5,7.28
2026-02-25,55,82,57,74,68.7,18.3,5.17`;

function parseCsv(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => {
      const val = values[i];
      obj[header] = val === '' || val === 'null' ? null : (isNaN(val) ? val : parseFloat(val));
    });
    return obj;
  });
}

// Use the "right" side user data (toby)
const userData = eightSleepLatest.users?.right || eightSleepLatest.users?.left || {};

// Current sleep data
const currentData = {
  sleep_score: userData.sleep_score || 0,
  sleep_quality_score: userData.sleep_quality_score || 0,
  heart_rate: userData.current_heart_rate || 0,
  hrv: userData.current_hrv || 0,
  resp_rate: userData.current_resp_rate || 0,
  bed_temp: userData.current_bed_temp || 0,
  room_temp: userData.current_room_temp || 0,
  time_slept_hours: userData.time_slept_hours || 0,
  sleep_stage: userData.current_sleep_stage || 'unknown',
  sleep_breakdown: userData.current_sleep_breakdown || { light: 0, deep: 0, rem: 0, awake: 0 },
};

// Parse historical data
const HISTORICAL_DATA = parseCsv(historicalCsvRaw);

// Calculate averages from historical data (excluding 0/null values)
const validSleepScores = HISTORICAL_DATA.filter(d => d.sleep_score > 0).map(d => d.sleep_score);
const validHRV = HISTORICAL_DATA.filter(d => d.current_hrv > 0).map(d => d.current_hrv);
const validHeartRate = HISTORICAL_DATA.filter(d => d.current_heart_rate > 0).map(d => d.current_heart_rate);
const validTimeSlept = HISTORICAL_DATA.filter(d => d.time_slept_hours > 0).map(d => d.time_slept_hours);
const validQualityScores = HISTORICAL_DATA.filter(d => d.sleep_quality_score > 0).map(d => d.sleep_quality_score);

const avgSleepScore = validSleepScores.length 
  ? (validSleepScores.reduce((a, b) => a + b, 0) / validSleepScores.length).toFixed(1)
  : 0;

const avgHRV = validHRV.length 
  ? (validHRV.reduce((a, b) => a + b, 0) / validHRV.length).toFixed(1)
  : 0;

const avgHeartRate = validHeartRate.length 
  ? (validHeartRate.reduce((a, b) => a + b, 0) / validHeartRate.length).toFixed(1)
  : 0;

const avgTimeSlept = validTimeSlept.length 
  ? (validTimeSlept.reduce((a, b) => a + b, 0) / validTimeSlept.length).toFixed(1)
  : 0;

const avgSleepQuality = validQualityScores.length 
  ? (validQualityScores.reduce((a, b) => a + b, 0) / validQualityScores.length).toFixed(1)
  : 0;

// Sleep breakdown in hours and percentages
const totalSeconds = (currentData.sleep_breakdown.light || 0) + 
                      (currentData.sleep_breakdown.deep || 0) + 
                      (currentData.sleep_breakdown.rem || 0) + 
                      (currentData.sleep_breakdown.awake || 0);

const toHours = (seconds) => (seconds / 3600).toFixed(2);
const toPct = (seconds) => totalSeconds > 0 ? ((seconds / totalSeconds) * 100).toFixed(1) : 0;

const SLEEP_STAGES = {
  light: {
    hours: toHours(currentData.sleep_breakdown.light || 0),
    pct: toPct(currentData.sleep_breakdown.light || 0),
  },
  deep: {
    hours: toHours(currentData.sleep_breakdown.deep || 0),
    pct: toPct(currentData.sleep_breakdown.deep || 0),
  },
  rem: {
    hours: toHours(currentData.sleep_breakdown.rem || 0),
    pct: toPct(currentData.sleep_breakdown.rem || 0),
  },
  awake: {
    hours: toHours(currentData.sleep_breakdown.awake || 0),
    pct: toPct(currentData.sleep_breakdown.awake || 0),
  },
};

// Last 7 days for table
const RECENT_SLEEP = HISTORICAL_DATA.slice(-7).reverse();

// Trend data for chart (all historical)
const TREND_DATA = HISTORICAL_DATA.map(d => ({
  date: d.date,
  sleep_score: d.sleep_score,
  sleep_quality: d.sleep_quality_score,
  time_slept: d.time_slept_hours,
}));

// Last synced
const LAST_SYNCED = eightSleepLatest.synced_at;

// Total nights tracked
const TOTAL_NIGHTS = HISTORICAL_DATA.length;

export {
  currentData,
  HISTORICAL_DATA,
  RECENT_SLEEP,
  TREND_DATA,
  SLEEP_STAGES,
  LAST_SYNCED,
  TOTAL_NIGHTS,
  avgSleepScore,
  avgHRV,
  avgHeartRate,
  avgTimeSlept,
  avgSleepQuality,
};
