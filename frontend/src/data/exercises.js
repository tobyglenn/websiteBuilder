/**
 * exercises.js — server-side data processing for Exercise Library.
 * Extracts unique exercises from Speediance workout history and maps to muscle groups.
 * Imported at build time by exercises.astro (Node.js context only).
 */
import rawData from './speediance_dashboard_data.json';

// Map mainMuscle to our categories
const MUSCLE_GROUP_MAP = {
  // Back & Lats
  'Lats': 'Back & Lats',
  'Rear Delts': 'Back & Lats',
  'Trapezius': 'Back & Lats',
  
  // Chest & Triceps
  'Pecs': 'Chest & Triceps',
  'Triceps': 'Chest & Triceps',
  
  // Legs & Glutes
  'Gluteus': 'Legs & Glutes',
  'Quadriceps': 'Legs & Glutes',
  'Hamstrings': 'Legs & Glutes',
  'Calves': 'Legs & Glutes',
  
  // Core & Arms
  'Abs': 'Core & Arms',
  'Biceps': 'Core & Arms',
  'Forearms': 'Core & Arms',
  'Front Delts': 'Core & Arms',
  'Side Delts': 'Core & Arms',
};

function getMuscleGroup(mainMuscle) {
  return MUSCLE_GROUP_MAP[mainMuscle] || 'Core & Arms';
}

function getPRWeight(exerciseName, prData) {
  // Clean up exercise name (remove zero-width spaces)
  const cleanName = exerciseName.replace(/\u200b/g, '').trim();
  
  // Try exact match first
  if (prData[cleanName]) {
    return prData[cleanName].best1RM;
  }
  
  // Try finding a match in the PR data
  for (const [prName, prInfo] of Object.entries(prData)) {
    const cleanPrName = prName.replace(/\u200b/g, '').trim();
    if (cleanPrName.toLowerCase() === cleanName.toLowerCase() ||
        cleanName.toLowerCase().includes(cleanPrName.toLowerCase()) ||
        cleanPrName.toLowerCase().includes(cleanName.toLowerCase())) {
      return prInfo.best1RM;
    }
  }
  
  return 0;
}

export function getExercises() {
  const raw = rawData;
  const workoutTypes = raw.workoutTypes || {};
  const prData = raw.exercisePRs || {};
  
  // Extract all exercises from all workout types
  const exerciseMap = new Map();
  
  for (const [workoutName, workout] of Object.entries(workoutTypes)) {
    if (!workout.exercises || !Array.isArray(workout.exercises)) continue;
    
    for (const exercise of workout.exercises) {
      const name = exercise.name?.replace(/\u200b/g, '').trim();
      if (!name) continue;
      
      // If we already have this exercise, keep the one with higher PR
      if (exerciseMap.has(name)) {
        const existing = exerciseMap.get(name);
        const existingPR = getPRWeight(existing.name, prData);
        const currentPR = getPRWeight(name, prData);
        if (currentPR > existingPR) {
          exerciseMap.set(name, {
            name,
            mainMuscle: exercise.mainMuscle,
            muscleGroup: getMuscleGroup(exercise.mainMuscle),
            prWeight: currentPR || exercise.best1RM || 0,
          });
        }
      } else {
        const prWeight = getPRWeight(name, prData);
        exerciseMap.set(name, {
          name,
          mainMuscle: exercise.mainMuscle,
          muscleGroup: getMuscleGroup(exercise.mainMuscle),
          prWeight: prWeight || exercise.best1RM || 0,
        });
      }
    }
  }
  
  // Convert to array and sort by name
  const exercises = Array.from(exerciseMap.values())
    .filter(e => e.name) // Remove any null/empty
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Group by muscle group
  const grouped = {
    'Back & Lats': exercises.filter(e => e.muscleGroup === 'Back & Lats'),
    'Chest & Triceps': exercises.filter(e => e.muscleGroup === 'Chest & Triceps'),
    'Legs & Glutes': exercises.filter(e => e.muscleGroup === 'Legs & Glutes'),
    'Core & Arms': exercises.filter(e => e.muscleGroup === 'Core & Arms'),
  };
  
  return {
    allExercises: exercises,
    grouped,
    totalCount: exercises.length,
  };
}
