import garminData from './garmin_all_activities.json';

// Distance category thresholds
const DISTANCE_RANGES = {
  '5K': { min: 3.1, max: 3.5 },
  '10K': { min: 6.2, max: 6.5 },
  'Half Marathon': { min: 12.0, max: 14.0 },
  'Marathon': { min: 25.0, max: 27.0 }
};

// Format duration from minutes to HH:MM:SS
function formatDuration(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.round((minutes % 1) * 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format pace to MM:SS per mile
function formatPace(pace) {
  const mins = Math.floor(pace);
  const secs = Math.round((pace % 1) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Categorize a run by distance
function categorizeByDistance(miles) {
  for (const [category, range] of Object.entries(DISTANCE_RANGES)) {
    if (miles >= range.min && miles <= range.max) {
      return category;
    }
  }
  return null;
}

// Filter for running activities only
function getRunningActivities() {
  return garminData.activities.filter(activity => 
    activity.activityType.includes('running') || activity.activityType.includes('treadmill')
  );
}


function cleanRunName(name) {
  if (!name) return 'Run';
  if (name === 'Running' || name === 'Treadmill Running') return name;
  const types = ['Base', 'Tempo', 'Recovery', 'Threshold', 'Anaerobic', 'Long Run'];
  for (const t of types) {
    if (name.includes(t)) return t;
  }
  if (name.toLowerCase().includes('running')) return 'Outdoor Run';
  return name;
}

export function getRaceData() {
  const runningActivities = getRunningActivities();
  
  // Filter and map race-distance activities
  const races = runningActivities
    .map(activity => {
      const category = categorizeByDistance(activity.distance_miles);
      if (!category) return null;
      
      const pace = activity.duration_min / activity.distance_miles;
      
      return {
        date: activity.date,
        name: cleanRunName(activity.activityName),
        distance: activity.distance_miles,
        distanceCategory: category,
        duration: activity.duration_min,
        durationFormatted: formatDuration(activity.duration_min),
        pace: pace,
        paceFormatted: formatPace(pace),
        hr: activity.averageHR || null,
        calories: activity.calories || null,
        type: activity.activityType.includes('treadmill') ? 'Treadmill' : 'Outdoor'
      };
    })
    .filter(r => r !== null)
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
  
  return races;
}

export function getPRs() {
  const races = getRaceData();
  
  const prs = {};
  
  // Find fastest pace for each distance category
  for (const category of ['5K', '10K', 'Half Marathon', 'Marathon']) {
    const categoryRaces = races.filter(r => r.distanceCategory === category);
    if (categoryRaces.length > 0) {
      // Sort by pace (lowest = fastest)
      const fastest = categoryRaces.sort((a, b) => a.pace - b.pace)[0];
      prs[category] = {
        pace: fastest.paceFormatted,
        paceValue: fastest.pace,
        date: fastest.date,
        distance: fastest.distance,
        duration: fastest.durationFormatted,
        name: cleanRunName(fastest.name),
        type: fastest.type
      };
    }
  }
  
  return prs;
}

export function getStats() {
  const races = getRaceData();
  
  return {
    totalRaces: races.length,
    byCategory: {
      '5K': races.filter(r => r.distanceCategory === '5K').length,
      '10K': races.filter(r => r.distanceCategory === '10K').length,
      'Half Marathon': races.filter(r => r.distanceCategory === 'Half Marathon').length,
      'Marathon': races.filter(r => r.distanceCategory === 'Marathon').length
    }
  };
}
