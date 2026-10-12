import assert from 'node:assert/strict';
import test from 'node:test';

import { assessGscDataQuality } from '../lib/gsc-data-quality.mjs';

test('does not normalize an unresolved collapse after healthy weeks leave the rolling window', () => {
  const result = assessGscDataQuality({
    current: { clicks: 3, impressions: 281 },
    prior: { clicks: 1, impressions: 331 },
    history: [{ clicks: 1, impressions: 400 }],
    reference: { start: '2026-08-09', end: '2026-08-15', clicks: 99, impressions: 13219 },
    daily: Array.from({ length: 7 }, () => ({})),
  });
  assert.equal(result.comparisonSafe, false);
  assert.deepEqual(result.issues.map((issue) => issue.code), ['unresolved_visibility_incident']);
  assert.equal(result.currentToReferenceImpressionRatio, 281 / 13219);
});

test('reference does not hold a recovered, complete comparison', () => {
  const result = assessGscDataQuality({
    current: { clicks: 90, impressions: 12000 },
    prior: { clicks: 85, impressions: 11000 },
    reference: { start: '2026-08-09', end: '2026-08-15', clicks: 99, impressions: 13219 },
    daily: Array.from({ length: 7 }, () => ({})),
  });
  assert.equal(result.comparisonSafe, true);
});

test('allows a complete comparison with plausible period continuity', () => {
  const result = assessGscDataQuality({
    current: { clicks: 90, impressions: 12000 },
    prior: { clicks: 99, impressions: 13219 },
    daily: Array.from({ length: 7 }, () => ({})),
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.comparisonSafe, true);
  assert.deepEqual(result.issues, []);
});

test('holds recommendations when a complete API window has an implausible discontinuity', () => {
  const result = assessGscDataQuality({
    current: { clicks: 0, impressions: 278 },
    prior: { clicks: 99, impressions: 13219 },
    daily: Array.from({ length: 7 }, () => ({})),
  });

  assert.equal(result.status, 'degraded');
  assert.equal(result.comparisonSafe, false);
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ['abrupt_impression_discontinuity', 'zero_click_discontinuity'],
  );
});

test('holds unverified daily coverage without claiming omitted dates are incomplete', () => {
  const result = assessGscDataQuality({
    current: { clicks: 4, impressions: 400 },
    prior: { clicks: 5, impressions: 500 },
    daily: Array.from({ length: 5 }, () => ({})),
  });

  assert.equal(result.issues[0].code, 'daily_coverage_unverified');
  assert.match(result.issues[0].message, /Google omits dates with no data/);
  assert.equal(result.comparisonSafe, false);
});

test('lists exact unobserved dates without filling them with zero activity', () => {
  const daily = [{ keys: ['2026-10-04'], impressions: 5 }, { keys: ['2026-10-06'], impressions: 3 }];
  const result = assessGscDataQuality({ daily, expectedDays: 3, startDate: '2026-10-04', endDate: '2026-10-06' });
  assert.deepEqual(result.unobservedDates, ['2026-10-05']);
  assert.equal(result.observedDailyRows, 2);
  assert.equal(daily.length, 2);
});

test('holds recommendations when two depressed weeks hide a rolling discontinuity', () => {
  const result = assessGscDataQuality({
    current: { clicks: 0, impressions: 205 },
    prior: { clicks: 0, impressions: 278 },
    history: [
      { start: '2026-08-02', end: '2026-08-08', clicks: 83, impressions: 9763 },
      { start: '2026-08-09', end: '2026-08-15', clicks: 99, impressions: 13124 },
      { start: '2026-08-16', end: '2026-08-22', clicks: 0, impressions: 278 },
    ],
    daily: Array.from({ length: 7 }, () => ({})),
  });

  assert.equal(result.status, 'degraded');
  assert.equal(result.comparisonSafe, false);
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ['rolling_impression_discontinuity', 'rolling_zero_click_discontinuity'],
  );
  assert.equal(result.historicalBaseline.impressions, 13124);
});
