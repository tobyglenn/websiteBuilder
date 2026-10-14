import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articleTopic } from '../src/lib/blogEditorial.mjs';

// Original publication dates only. A guide revision must not reset rotation.
// Retired URLs still count: merging yesterday's article does not erase its topic.
export function rotationContext(posts, candidates, today) {
  const history = posts.map(post => ({
    slug: post.slug, title: post.title, date: String(post.published_at || '').slice(0, 10),
    topic: articleTopic(post),
  })).filter(post => /^\d{4}-\d{2}-\d{2}$/.test(post.date) && post.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  if (posts.length && !history.length) throw new Error('No dated publication history; refusing to bypass rotation');
  const previous = history.filter(post => post.date === history[0]?.date);
  const blocked = new Set(previous.map(post => post.topic));
  return { previous, candidates: candidates.map(post => {
    const topic = articleTopic(post);
    return { topic, allowed: !blocked.has(topic) };
  }) };
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const { candidates, today } = JSON.parse(input);
  if (!Array.isArray(candidates) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error('Invalid rotation request');
  const { createServer } = await import('vite');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const server = await createServer({ root, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const { BLOG_POSTS } = await server.ssrLoadModule('/src/lib/blogPosts.ts');
    process.stdout.write(JSON.stringify(rotationContext(BLOG_POSTS, candidates, today)));
  } finally { await server.close(); }
}
if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
