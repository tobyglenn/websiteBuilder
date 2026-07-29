import test from "node:test";
import assert from "node:assert/strict";

import {
  formatVolume,
  normalizeWorkoutImport,
  sortLeaderboard,
} from "./workoutHub.js";

test("normalizes manager JSON without mutating exercise ids or set data", () => {
  const workout = normalizeWorkoutImport({
    name: "Community Push Day",
    exercises: [
      {
        id: 101,
        title: "Chest Press",
        preset: -1,
        sets: [{ reps: 10, weight: 45, mode: 1, rest: 60 }],
      },
    ],
  });
  assert.equal(workout.name, "Community Push Day");
  assert.equal(workout.exercises[0].id, 101);
  assert.deepEqual(workout.exercises[0].sets[0], {
    reps: 10,
    weight: 45,
    mode: 1,
    rest: 60,
  });
});

test("accepts groupId and preset_id aliases", () => {
  const workout = normalizeWorkoutImport({
    name: "Alias Format",
    exercises: [
      {
        groupId: 202,
        title: "Row",
        preset_id: 20,
        sets: [{ reps: 12, weight: 20 }],
      },
    ],
  });
  assert.equal(workout.exercises[0].id, 202);
  assert.equal(workout.exercises[0].preset, 20);
});

test("rejects a workout with no exercises", () => {
  assert.throws(
    () => normalizeWorkoutImport({ name: "Empty", exercises: [] }),
    /at least one exercise/i,
  );
});

test("leaderboard sorting uses volume descending then earliest completion", () => {
  const entries = sortLeaderboard([
    {
      display_name: "Alex",
      total_volume_lbs: 1000,
      completed_at: "2026-07-02T10:00:00",
    },
    {
      display_name: "Sam",
      total_volume_lbs: 1200,
      completed_at: "2026-07-03T10:00:00",
    },
    {
      display_name: "Jo",
      total_volume_lbs: 1200,
      completed_at: "2026-07-01T10:00:00",
    },
  ]);
  assert.deepEqual(
    entries.map((entry) => entry.display_name),
    ["Jo", "Sam", "Alex"],
  );
  assert.deepEqual(
    entries.map((entry) => entry.rank),
    [1, 2, 3],
  );
});

test("formats leaderboard volume for compact display", () => {
  assert.equal(formatVolume(9850), "9,850 lb");
  assert.equal(formatVolume(12000), "12,000 lb");
});

test("preserves enriched time-based and Vita workout fields", () => {
  const workout = normalizeWorkoutImport({
    name: "Vita Timer",
    exercises: [
      {
        groupId: 303,
        dataStatType: 6,
        preset_id: -1,
        sets: [{ reps: 45, weight: 7, mode: 1, rest: 15, unit: "sec" }],
      },
    ],
  });

  assert.equal(workout.exercises[0].data_stat_type, 6);
  assert.equal(workout.exercises[0].sets[0].unit, "sec");
  assert.equal(workout.exercises[0].sets[0].weight, 7);
});

test("rejects non-finite workout numbers", () => {
  assert.throws(
    () =>
      normalizeWorkoutImport({
        name: "Unsafe",
        exercises: [
          {
            id: 101,
            sets: [{ reps: 10, weight: "Infinity", mode: 1, rest: 60 }],
          },
        ],
      }),
    /non-finite/,
  );
});

test("keeps legacy Manager metadata absent for provider-side derivation", () => {
  const workout = normalizeWorkoutImport({
    name: "Legacy Manager Export",
    exercises: [
      {
        id: 303,
        sets: [{ reps: 45, weight: 7, mode: 1, rest: 15 }],
      },
    ],
  });

  assert.equal("data_stat_type" in workout.exercises[0], false);
  assert.equal("unit" in workout.exercises[0].sets[0], false);
});

test("preserves declared source weight unit", () => {
  const workout = normalizeWorkoutImport({
    name: "Metric Export",
    weight_unit: 0,
    exercises: [
      {
        id: 101,
        sets: [{ reps: 10, weight: 20, mode: 1, rest: 60 }],
      },
    ],
  });
  assert.equal(workout.weight_unit, 0);
});

test("rejects excessive set counts", () => {
  assert.throws(
    () =>
      normalizeWorkoutImport({
        name: "Too Large",
        exercises: [
          {
            id: 101,
            sets: Array.from({ length: 101 }, () => ({
              reps: 10,
              weight: 20,
              mode: 1,
              rest: 60,
            })),
          },
        ],
      }),
    /more than 100 sets/,
  );
});
