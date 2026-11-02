import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('homepage section denominator requires a qualified view after deduplication', () => {
  const sql = readFileSync(new URL('../../../docs/analytics/queries/homepage-sections.sql', import.meta.url), 'utf8');
  assert.match(sql, /max\(if\(properties\.homepage_section_viewed = true, 1, 0\)\) AS viewed/);
  assert.match(sql, /\)\s*WHERE viewed = 1\s*GROUP BY/);
  assert.match(sql, /max\(toFloat\(properties\.visible_seconds\)\) AS visible_seconds/);
  assert.match(sql, /coalesce\(properties\.\$virt_is_bot, false\) = false/);
});
