import { existsSync } from 'node:fs';
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
type RawFallbackBlogPost = Partial<BlogPost> & {
  slug: string;
  id?: string;
  date?: string;
  published?: string;
  publishedAt?: string;
  thumbnail?: string;
  excerpt?: string;
  description?: string;
  tags?: unknown;
};

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
  const title = String(frontmatter.title || fallback?.title || slug);
  const category = String(categories[0] || fallback?.category || 'Analysis');

  return {
    slug,
    title,
    excerpt: String(frontmatter.description || fallback?.excerpt || frontmatter.title || slug),
    category,
    published_at: String(frontmatter.date || fallback?.published_at || ''),
    image: resolveCoverImage(String(frontmatter.image || fallback?.image || ''), slug, title, category),
    tags: tags.map((tag) => String(tag)),
    content,
  };
}

function dateFromId(value: string | undefined): string {
  const match = value?.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  return match?.[1] || '';
}

function imageExists(imagePath: string): boolean {
  if (!imagePath) return false;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return true;
  }
  if (!imagePath.startsWith('/')) {
    return false;
  }

  try {
    return existsSync(new URL(`../../public${imagePath}`, import.meta.url));
  } catch {
    return false;
  }
}

function defaultCoverImage(slug: string, title: string, category: string): string {
  const haystack = `${slug} ${title} ${category}`.toLowerCase();

  const explicitBySlug: Record<string, string> = {
    'transform-your-life-in-just-one-winter': '/progress/progress_188.jpg',
    'post-cruise-reality-broken-ankle-238': '/progress/progress_235.jpg',
    '238-lbs-broken-ankle-post-cruise': '/progress/progress_235.jpg',
    'how-one-month-of-no-training-aged-my-body': '/progress/progress_211.jpg',
    'my-top-3-fitness-priorities-for-2026': '/progress/workout_action.jpg',
    'why-running-might-have-saved-my-life': '/progress/workout_action.jpg',
    'speediance-v3-software-review': '/images/gear/speediance-gym-monster-2s.jpg',
    'speediance-broke-partner-mode-lost-free-lift-feature': '/images/gear/speediance-gym-monster-original.jpg',
    'speediance-broke-partner-mode-lost-freelift-feature-demo-daughter': '/images/gear/speediance-gym-monster-original.jpg',
    'speediance-spotter-modes-explained': '/images/gear/speediance-gym-monster-2s.jpg',
    'speediance-2s-260-lb-lat-pulldown': '/images/gear/speediance-gym-monster-2s.jpg',
    'is-tonal-a-scam-honest-review': '/images/gear/tonal.jpg',
    'whoop-vs-garmin-bjj-review': '/images/gear/garmin-forerunner-265s.jpg',
    'mike-israetel-bjj-black-belt-legit': '/images/about/bjj_comparison.jpg',
    'the-submission-that-could-have-ended-everything': '/images/about/bjj_day4.jpg',
    'full-body-minus-legs-current-training-split-explained': '/progress/workout_action.jpg',
  };

  if (explicitBySlug[slug]) {
    return explicitBySlug[slug];
  }

  if (haystack.includes('speediance')) return '/images/gear/speediance-gym-monster-2s.jpg';
  if (haystack.includes('tonal')) return '/images/gear/tonal.jpg';
  if (haystack.includes('whoop')) return '/images/gear/whoop-5.0.jpg';
  if (haystack.includes('oura')) return '/images/gear/oura-ring.jpg';
  if (haystack.includes('garmin')) return '/images/gear/garmin-forerunner-265s.jpg';
  if (haystack.includes('bjj') || haystack.includes('jiu-jitsu')) return '/images/about/bjj_comparison.jpg';
  if (haystack.includes('transform') || haystack.includes('winter') || haystack.includes('long game')) {
    return '/progress/progress_188.jpg';
  }
  if (haystack.includes('training') || haystack.includes('workout') || haystack.includes('running')) {
    return '/progress/workout_action.jpg';
  }
  if (haystack.includes('review')) return '/images/gear/openclaw-mac-studio.jpg';
  return '';
}

function repairLegacyImagePath(imagePath: string, slug: string, title: string, category: string): string {
  const repairs: Record<string, string> = {
    '/images/default-blog.jpg': '/progress/progress_188.jpg',
    '/images/transformation.jpg': '/progress/progress_188.jpg',
    '/images/speediance-2s.jpg': '/images/gear/speediance-gym-monster-2s.jpg',
    '/images/speediance-comparison.jpg': '/images/gear/speediance-gym-monster-2s.jpg',
    '/images/speediance-modes.jpg': '/images/gear/speediance-gym-monster-2s.jpg',
  };

  if (repairs[imagePath]) {
    return repairs[imagePath];
  }

  return defaultCoverImage(slug, title, category);
}

function resolveCoverImage(rawImage: string, slug: string, title: string, category: string): string {
  if (imageExists(rawImage)) {
    return rawImage;
  }

  const repaired = repairLegacyImagePath(rawImage, slug, title, category);
  if (imageExists(repaired)) {
    return repaired;
  }

  const fallback = defaultCoverImage(slug, title, category);
  return imageExists(fallback) ? fallback : '';
}

function normalizeFallbackPost(post: RawFallbackBlogPost): BlogPost {
  const published_at = String(
    post.published_at || post.publishedAt || post.published || post.date || dateFromId(post.id) || ''
  );
  const tags = Array.isArray(post.tags) ? post.tags.map((tag) => String(tag)) : [];
  const slug = String(post.slug || '');
  const title = String(post.title || post.slug || '');
  const category = String(post.category || 'Analysis');
  const image = resolveCoverImage(String(post.image || post.thumbnail || ''), slug, title, category);

  return {
    slug,
    title,
    excerpt: String(post.excerpt || post.description || post.title || post.slug || ''),
    category,
    published_at,
    image,
    tags,
    content: String(post.content || ''),
  };
}

const fallbackPosts = (FALLBACK_BLOG_POSTS as RawFallbackBlogPost[]).map(normalizeFallbackPost);
const fallbackBySlug = new Map(
  fallbackPosts.map((post) => [post.slug, post])
);

const markdownPosts = Object.entries(markdownRawModules).map(([path, raw]) =>
  markdownPostFromRaw(path, raw, fallbackBySlug.get(path.split('/').pop()?.replace(/\.md$/, '') || ''))
);

const markdownSlugs = new Set(markdownPosts.map((post) => post.slug));

export const BLOG_POSTS: BlogPost[] = [
  ...markdownPosts,
  ...fallbackPosts.filter((post) => !markdownSlugs.has(post.slug)),
];

function listingIdentity(post: BlogPost): string {
  const normalizedTitle = String(post.title || '')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const publishedAt = String(post.published_at || '');
  return `${publishedAt}|${normalizedTitle}`;
}

function listingQualityScore(post: BlogPost): number {
  let score = 0;
  if (post.image) score += 10;
  score += Math.min(10000, String(post.content || '').length) / 100;
  score += Math.min(300, String(post.excerpt || '').length) / 10;
  score += Math.min(120, String(post.title || '').length) / 10;
  return score;
}

const listingPostsByIdentity = new Map<string, BlogPost>();
for (const post of BLOG_POSTS) {
  const key = listingIdentity(post);
  const existing = listingPostsByIdentity.get(key);
  if (!existing || listingQualityScore(post) > listingQualityScore(existing)) {
    listingPostsByIdentity.set(key, post);
  }
}

export const CANONICAL_BLOG_POSTS: BlogPost[] = Array.from(listingPostsByIdentity.values());
export const LISTING_BLOG_POSTS: BlogPost[] = CANONICAL_BLOG_POSTS;

export const BLOG_REDIRECTS: Record<string, string> = Object.fromEntries(
  BLOG_POSTS.flatMap((post) => {
    const canonical = listingPostsByIdentity.get(listingIdentity(post));
    if (!canonical || canonical.slug === post.slug) {
      return [];
    }
    return [[post.slug, canonical.slug] as const];
  })
);
