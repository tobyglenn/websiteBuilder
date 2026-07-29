import test from 'node:test';
import assert from 'node:assert/strict';

import { formatVolume, normalizeWorkoutImport, sortLeaderboard } from './workoutHub.js';

test('normalizes manager JSON without mutating exercise ids or set data', () => {
  const workout = normalizeWorkoutImport({
    name: 'Community Push Day',
    exercises: [{ id: 101, title: 'Chest Press', preset: -1, sets: [{ reps: 10, weight: 45, mode: 1, rest: 60 }] }],
  });
  assert.equal(workout.name, 'Community Push Day');
  assert.equal(workout.exercises[0].id, 101);
  assert.deepEqual(workout.exercises[0].sets[0], { reps: 10, weight: 45, mode: 1, rest: 60 });
});

test('accepts groupId and preset_id aliases', () => {
  const workout = normalizeWorkoutImport({
    name: 'Alias Format',
    exercises: [{ groupId: 202, title: 'Row', preset_id: 20, sets: [{ reps: 12, weight: 20 }] }],
  });
  assert.equal(workout.exercises[0].id, 202);
  assert.equal(workout.exercises[0].preset, 20);
});

test('rejects a workout with no exercises', () => {
  assert.throws(() => normalizeWorkoutImport({ name: 'Empty', exercises: [] }), /at least one exercise/i);
});

test('leaderboard sorting uses volume descending then earliest completion', () => {
  const entries = sortLeaderboard([
    { display_name: 'Alex', total_volume_lbs: 1000, completed_at: '2026-07-02T10:00:00' },
    { display_name: 'Sam', total_volume_lbs: 1200, completed_at: '2026-07-03T10:00:00' },
    { display_name: 'Jo', total_volume_lbs: 1200, completed_at: '2026-07-01T10:00:00' },
  ]);
  assert.deepEqual(entries.map((entry) => entry.display_name), ['Jo', 'Sam', 'Alex']);
  assert.deepEqual(entries.map((entry) => entry.rank), [1, 2, 3]);
});

test('formats leaderboard volume for compact display', () => {
  assert.equal(formatVolume(9850), '9,850 lb');
  assert.equal(formatVolume(12000), '12,000 lb');
});
