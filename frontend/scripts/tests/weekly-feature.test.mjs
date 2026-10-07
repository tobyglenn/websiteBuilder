import assert from 'node:assert/strict';
import test from 'node:test';
import { homepageWeek, selectWeeklyPost } from '../../src/lib/weeklyFeature.mjs';

const posts = Array.from({ length: 8 }, (_, i) => ({
  slug: `post-${i}`,
  title: `Article ${i}`,
  excerpt: 'Useful summary',
  image: '/cover.jpg',
  content: 'Published content',
  published_at: `2026-09-${String(30 - i).padStart(2, '0')}`,
}));

test('one pick throughout a New York week; six different picks across six weeks', () => {
  assert.equal(selectWeeklyPost(posts, new Date('2026-10-07T16:00:00Z')).slug, 'post-0');
  assert.equal(selectWeeklyPost(posts, new Date('2026-10-11T23:00:00-04:00')).slug, 'post-0');
  const picks = Array.from(
    { length: 6 },
    (_, i) => selectWeeklyPost(posts, new Date(Date.UTC(2026, 9, 5 + 7 * i, 12))).slug
  );
  assert.equal(new Set(picks).size, 6);
  assert.equal(selectWeeklyPost(posts, new Date('2026-11-16T12:00:00Z')).slug, picks[0]);
});

test('Monday boundary follows New York across daylight saving time', () => {
  assert.equal(homepageWeek(new Date('2026-10-12T03:59:59Z')).key, '2026-10-05');
  assert.equal(homepageWeek(new Date('2026-10-12T04:00:00Z')).key, '2026-10-12');
  assert.equal(homepageWeek(new Date('2026-11-02T04:59:59Z')).key, '2026-10-26');
  assert.equal(homepageWeek(new Date('2026-11-02T05:00:00Z')).key, '2026-11-02');
});

test('ignores incomplete and future articles and is independent of catalog order', () => {
  const now = new Date('2026-10-07T16:00:00Z');
  const invalid = [
    { ...posts[0], slug: 'future', published_at: '2099-01-01' },
    { ...posts[0], slug: 'undated', published_at: '' },
    { ...posts[0], slug: 'no-cover', image: '' },
    { ...posts[0], slug: 'no-content', content: '' },
  ];
  assert.equal(selectWeeklyPost([...invalid, ...posts].reverse(), now).slug, 'post-0');
  assert.equal(selectWeeklyPost(invalid, now), null);
  assert.equal(selectWeeklyPost([posts[0]], now).slug, 'post-0');
});
