import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeRuns, summarizeWhoop, summarizeWeights, summarizeSleep, cleanWorkoutTitle } from '../../src/lib/fitnessMetrics.mjs';
import { firstPersonExcerpt } from '../../src/lib/blogVoice.mjs';

test('running totals exclude other Garmin sports and preserve pre/post additivity', () => {
  const activities = [
    { activityType:'running', date:'2024-01-03', distance_miles:10, duration_min:100 },
    { activityType:'treadmill_running', date:'2024-01-04', distance_miles:2, duration_min:20 },
    { activityType:'cycling', date:'2024-01-04', distance_miles:50 },
  ];
  const all = summarizeRuns(activities);
  assert.equal(all.totalDistMi, 12);
  assert.equal(all.totalRuns, 2);
  assert.equal(all.avgPace, '10:00');
  assert.equal(summarizeRuns([]).longestMi, 0);
  assert.equal(summarizeRuns(activities.slice(0, 1)).totalDistMi + summarizeRuns(activities.slice(1)).totalDistMi, all.totalDistMi);
});

test('WHOOP uses one 30-calendar-day window, deduplicates records and excludes naps', () => {
  const record = (id, date, score) => ({ id, created_at:date, score:{ recovery_score:score, hrv_rmssd_milli:20, resting_heart_rate:60 } });
  const latest = record(1, '2026-10-14T10:00:00Z', 0);
  const result = summarizeWhoop({ recovery:{records:[latest,latest,record(2,'2026-09-15T10:00:00Z',100),record(3,'2026-09-14T10:00:00Z',100)]},
    sleep:{records:[{id:1,start:'2026-10-14',nap:true,score:{sleep_performance_percentage:1}},{id:2,start:'2026-10-14',score:{sleep_performance_percentage:80}}]} });
  assert.equal(result.sampleCount, 2);
  assert.equal(result.windowStart, '2026-09-15');
  assert.equal(result.windowEnd, '2026-10-14');
  assert.equal(result.recoveryAvg, 50);
  assert.equal(result.sleepPerfAvg, 80);
  assert.equal(summarizeWhoop({}).recoveryAvg, null);
});

test('workout labels remove internal flags and dated suffixes without changing workout identity', () => {
  assert.equal(cleanWorkoutTitle('ARIA !OVERRIDE! Barbell Knee-Safe 20260917'), 'Barbell Knee-Safe Workout');
  assert.equal(cleanWorkoutTitle('ARIA Handles Build Stamina 20261013'), 'Handles Build Stamina Workout');
  assert.equal(cleanWorkoutTitle('Upper Body Workout'), 'Upper Body Workout');
});

test('personal excerpts retain meaning in first person and correct the product name', () => {
  assert.equal(firstPersonExcerpt('Toby explains how he built a dashboard.'), 'I explain how I built a dashboard.');
  assert.equal(firstPersonExcerpt('Toby shares his software background and why he covers Gym Monza 2S.'), 'I share my software background and why I cover Gym Monster 2S.');
});

test('weight summaries preserve milestones and date the latest measurement rather than the lowest', () => {
  const result = summarizeWeights([{date:'2026-07-05',weight:216.6},{date:'2023-01-01',weight:242},{date:'2024-01-04',weight:188}]);
  assert.equal(result.start, 242);
  assert.equal(result.lowest, 188);
  assert.equal(result.current, 216.6);
  assert.equal(result.currentDate, '2026-07-05');
  assert.equal(result.totalChange, -25.4);
});

test('sleep averages use the latest dated sample and omit missing measurements', () => {
  const result = summarizeSleep([{date:'2026-08-01',sleep_score:100,time_slept_hours:12},{date:'2026-10-01',sleep_score:60,time_slept_hours:6},{date:'2026-10-13'},{date:'2026-10-14',sleep_score:80,time_slept_hours:8}]);
  assert.equal(result.avgScore, 70);
  assert.equal(result.avgHours, 7);
  assert.equal(result.sampleCount, 3);
  assert.equal(result.windowStart, '2026-10-01');
  assert.equal(result.windowEnd, '2026-10-14');
});
