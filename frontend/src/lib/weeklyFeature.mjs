const DAY_MS = 86_400_000;
const FIRST_WEEK = Date.UTC(2026, 9, 5); // Monday; the first week uses the newest article.

export function homepageWeek(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type) => Number(parts.find((part) => part.type === type).value);
  const day = new Date(Date.UTC(value('year'), value('month') - 1, value('day')));
  const monday = day.getTime() - ((day.getUTCDay() + 6) % 7) * DAY_MS;
  return {
    key: new Date(monday).toISOString().slice(0, 10),
    index: Math.floor((monday - FIRST_WEEK) / (7 * DAY_MS)),
  };
}

// Only existing published articles enter the pool. No new article is implied by a weekly pick.
export function selectWeeklyPost(posts, now = new Date()) {
  const eligible = [
    ...new Map(
      posts
        .filter(
          (post) =>
            post.slug &&
            post.title &&
            post.excerpt &&
            post.image &&
            post.content &&
            Number.isFinite(Date.parse(post.published_at)) &&
            Date.parse(post.published_at) <= now.getTime()
        )
        .map((post) => [post.slug, post])
    ).values(),
  ]
    .sort(
      (a, b) =>
        Date.parse(b.published_at) - Date.parse(a.published_at) || a.slug.localeCompare(b.slug)
    )
    .slice(0, 6);
  if (!eligible.length) return null;
  const { index } = homepageWeek(now);
  return eligible[((index % eligible.length) + eligible.length) % eligible.length];
}
