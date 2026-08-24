import assert from 'node:assert/strict';
import test from 'node:test';

import { assessGscDataQuality } from '../lib/gsc-data-quality.mjs';

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

test('flags an incomplete set of final daily rows', () => {
  const result = assessGscDataQuality({
    current: { clicks: 4, impressions: 400 },
    prior: { clicks: 5, impressions: 500 },
    daily: Array.from({ length: 5 }, () => ({})),
  });

  assert.equal(result.issues[0].code, 'incomplete_daily_rows');
});
