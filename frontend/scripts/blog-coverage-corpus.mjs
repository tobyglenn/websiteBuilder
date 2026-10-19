// Read every legacy article, including retired posts and Markdown overrides.
// New bounded publications are checked by their committed source_section ledger.
import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({ root, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
try {
  const { BLOG_POSTS } = await server.ssrLoadModule('/src/data/mock.js');
  const corpus = {};
  for (const post of BLOG_POSTS) {
    if (post.source_section || post.source_bundle) continue;
    const key = `mock:${post.slug}`;
    (corpus[key] ??= []).push({ title: post.title, content: post.content || '' });
  }
  const directory = resolve(root, 'src/pages/blog');
  for (const file of (await readdir(directory)).filter(name => name.endsWith('.md')).sort()) {
    corpus[`markdown:${file.slice(0, -3)}`] = await readFile(resolve(directory, file), 'utf8');
  }
  corpus['config:consolidations'] = JSON.parse(await readFile(resolve(root, 'src/data/blog-consolidations.json'), 'utf8'));
  process.stdout.write(JSON.stringify(corpus));
} finally { await server.close(); }
