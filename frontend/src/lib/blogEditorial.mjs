export const BLOG_CATEGORIES = ['Speediance','Wearables','BJJ','Reviews','Build Logs','Field Reports','Training Tips','The Numbers','The Long Game','Transformation','Signal vs. Noise'];
// Shared category and reader-intent policy. A source video is not itself a topic.
export function articleTopic({ category = '', title = '', slug = '', tags = [] } = {}) {
  const c = category.toLowerCase();
  const text = `${title} ${slug} ${tags.join(' ')}`.toLowerCase();
  if (['build logs', 'ai tech'].includes(c)) return 'ai';
  if (['bjj', 'mat science'].includes(c)) return 'bjj';
  if (c === 'wearables') return 'wearables';
  if (/openclaw|agentstack|hermes|codex|claude|anthropic|ai coding|ai assistant/.test(text)) return 'ai';
  if (/jiu.jitsu|\bbjj\b|grappl|belt progression/.test(text)) return 'bjj';
  if (/speediance|tonal|gym monster|smart gym|voltra|aeke|oxfit/.test(text)) return 'gym';
  if (/whoop|oura|garmin|wearable|recovery|sleep|hrv/.test(text)) return 'wearables';
  return 'training';
}
export function normalizeBlogCategory(category = '', context = {}) {
  const c = category.toLowerCase().trim();
  const aliases = {'ai tech':'Build Logs', 'gear reviews':'Reviews', 'tips & guides':'Training Tips', 'mat science':'BJJ', 'fitness':'Training Tips', 'training':'Training Tips'};
  if (aliases[c]) return aliases[c];
  if (c === 'fitness tech') {
    const topic = articleTopic(context);
    return topic === 'wearables' ? 'Wearables' : topic === 'ai' ? 'Build Logs' : 'Reviews';
  }
  const core = BLOG_CATEGORIES;
  return core.find(value => value.toLowerCase() === c) || 'Field Reports';
}

// Choose the newest article in each reader topic; never fill empty slots with
// another article about the same subject. Callers pass canonical posts only.
export function selectDiverseBlogPosts(posts, limit = 3) {
  const timestamp = post => Date.parse(post.updated_at || post.published_at) || 0;
  const sorted = [...posts].sort((a, b) => timestamp(b) - timestamp(a)
    || (Date.parse(b.published_at) || 0) - (Date.parse(a.published_at) || 0)
    || a.slug.localeCompare(b.slug));
  const seenTopics = new Set();
  const seenSlugs = new Set();
  return sorted.filter(post => {
    const topic = articleTopic({...post, category:post.categoryKey || post.category,
      title:post.sourceTitle || post.title});
    if (seenTopics.has(topic) || seenSlugs.has(post.slug)) return false;
    seenTopics.add(topic);
    seenSlugs.add(post.slug);
    return true;
  }).slice(0, Math.max(0, limit));
}
