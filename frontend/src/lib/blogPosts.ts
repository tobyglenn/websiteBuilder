import { BLOG_POSTS as FALLBACK_BLOG_POSTS } from '../data/mock.js';

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published_at: string;
  image?: string;
  tags: string[];
  content: string;
};

type PartialBlogPost = Partial<BlogPost> & { slug: string };

const markdownRawModules = import.meta.glob('../pages/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: {}, content: raw.trim() };
  }

  const frontmatter: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf(':');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (!value) {
      frontmatter[key] = '';
      continue;
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        frontmatter[key] = JSON.parse(value);
        continue;
      } catch {
        frontmatter[key] = value;
        continue;
      }
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      try {
        frontmatter[key] = JSON.parse(value.replace(/^'/, '"').replace(/'$/, '"'));
      } catch {
        frontmatter[key] = value.slice(1, -1);
      }
      continue;
    }

    frontmatter[key] = value;
  }

  return {
    frontmatter,
    content: raw.slice(match[0].length).trim(),
  };
}

function markdownPostFromRaw(path: string, raw: string, fallback?: PartialBlogPost): BlogPost {
  const slug = path.split('/').pop()?.replace(/\.md$/, '') || '';
  const { frontmatter, content } = parseFrontmatter(raw);
  const categories = Array.isArray(frontmatter.categories) ? frontmatter.categories : [];
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];

  return {
    slug,
    title: String(frontmatter.title || fallback?.title || slug),
    excerpt: String(frontmatter.description || fallback?.excerpt || frontmatter.title || slug),
    category: String(categories[0] || fallback?.category || 'Analysis'),
    published_at: String(frontmatter.date || fallback?.published_at || ''),
    image: String(frontmatter.image || fallback?.image || ''),
    tags: tags.map((tag) => String(tag)),
    content,
  };
}

const fallbackBySlug = new Map(
  (FALLBACK_BLOG_POSTS as BlogPost[]).map((post) => [post.slug, post])
);

const markdownPosts = Object.entries(markdownRawModules).map(([path, raw]) =>
  markdownPostFromRaw(path, raw, fallbackBySlug.get(path.split('/').pop()?.replace(/\.md$/, '') || ''))
);

const markdownSlugs = new Set(markdownPosts.map((post) => post.slug));

export const BLOG_POSTS: BlogPost[] = [
  ...markdownPosts,
  ...(FALLBACK_BLOG_POSTS as BlogPost[]).filter((post) => !markdownSlugs.has(post.slug)),
];

