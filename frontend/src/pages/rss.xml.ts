import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { BLOG_POSTS } from '../data/mock.js';

export async function GET(context: APIContext) {
  const siteUrl = 'https://tobyonfitnesstech.com';

  // Filter out any posts that might have issues
  const validPosts = (BLOG_POSTS || []).filter((post): post is typeof post & { title: string; slug: string } => {
    return post != null && typeof post === 'object' && typeof post.title === 'string' && typeof post.slug === 'string';
  });

  const items = validPosts.map((post) => {
    const postDate = post.date || (post as any).publishedAt || (post as any).published_at || '2025-01-01';
    return {
      title: post.title,
      pubDate: new Date(postDate),
      description: post.excerpt || post.title,
      link: `/blog/${post.slug}/`,
      categories: post.category ? [post.category] : [],
    };
  });

  return rss({
    title: 'Toby on Fitness Tech',
    description: 'Independent fitness tech reviews from a real athlete. Speediance, Tonal, Whoop, Garmin, BJJ, and transformation data.',
    site: siteUrl,
    items: items,
    customData: `<language>en-us</language>`,
  });
}
