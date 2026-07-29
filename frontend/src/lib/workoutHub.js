const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function normalizeWorkoutImport(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Workout JSON must be an object.');
  const name = String(payload.name || '').trim();
  if (!name) throw new Error('Workout name is required.');
  if (!Array.isArray(payload.exercises) || payload.exercises.length === 0) {
    throw new Error('Workout must contain at least one exercise.');
  }
  if (payload.exercises.length > 60) throw new Error('Workout cannot contain more than 60 exercises.');

  const exercises = payload.exercises.map((exercise, exerciseIndex) => {
    const rawId = exercise.id ?? exercise.groupId;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) throw new Error(`Exercise ${exerciseIndex + 1} needs a valid Speediance exercise ID.`);
    if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
      throw new Error(`Exercise ${exerciseIndex + 1} must contain at least one set.`);
    }
    return {
      id,
      title: String(exercise.title || `Exercise ${id}`).trim(),
      preset: Number(exercise.preset ?? exercise.preset_id ?? -1),
      isUnilateralExpanded: Boolean(exercise.isUnilateralExpanded),
      sets: exercise.sets.map((set, setIndex) => {
        const normalized = {
          reps: Math.trunc(asNumber(set.reps)),
          weight: asNumber(set.weight),
          mode: Math.trunc(asNumber(set.mode, 1)),
          rest: Math.trunc(asNumber(set.rest, 60)),
        };
        if (normalized.reps < 1 || normalized.weight < 0 || normalized.rest < 0) {
          throw new Error(`Exercise ${exerciseIndex + 1}, set ${setIndex + 1} contains invalid values.`);
        }
        return normalized;
      }),
    };
  });

  return {
    format: 'tobyonfitnesstech.speediance-workout.v1',
    name: name.slice(0, 80),
    description: String(payload.description || '').trim().slice(0, 500),
    exercises,
  };
}

export function sortLeaderboard(entries = []) {
  return [...entries]
    .sort((a, b) => Number(b.total_volume_lbs) - Number(a.total_volume_lbs)
      || String(a.completed_at).localeCompare(String(b.completed_at)))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function formatVolume(value) {
  return `${Math.round(Number(value) || 0).toLocaleString('en-US')} lb`;
}

export function downloadWorkout(workout) {
  const safeName = String(workout.name || 'speediance-workout').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const blob = new Blob([JSON.stringify(workout, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeName || 'speediance-workout'}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
