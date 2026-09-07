import test from 'node:test';
import assert from 'node:assert/strict';
import { trainingFreshness } from '../../src/lib/trainingFreshness.mjs';

test('a fresh build cannot disguise old activity data', () => {
  const result = trainingFreshness({ generatedAt: '2026-09-07', trainingStats: { lastWorkoutData: { date: '2026-08-21' } } }, new Date('2026-09-07T18:00:00Z'));
  assert.deepEqual(result, { latestActivityDate: '2026-08-21', ageDays: 17, limited: true });
});
test('missing and future activity dates do not imply current data', () => {
  assert.equal(trainingFreshness({}, new Date('2026-09-07T18:00:00Z')).limited, true);
  assert.equal(trainingFreshness({ consistency: { days: [{ date: '2099-01-01' }] } }, new Date('2026-09-07T18:00:00Z')).limited, true);
});
test('calendar boundaries use Eastern time, not build server time', () => {
  assert.equal(trainingFreshness({ consistency: { days: [{ date: '2026-09-03' }] } }, new Date('2026-09-07T00:30:00Z')).limited, false);
});
