import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { VIDEOS } from '../data/mock.js';
import { CANONICAL_BLOG_POSTS } from '../lib/blogPosts';

export async function GET(context: APIContext) {
  const siteUrl = 'https://tobyonfitnesstech.com';

  // Filter out any posts that might have issues
  const validPosts = (CANONICAL_BLOG_POSTS || []).filter((post): post is typeof post & { title: string; slug: string } => {
    return post != null && typeof post === 'object' && typeof post.title === 'string' && typeof post.slug === 'string';
  });

  const blogItems = validPosts.map((post) => {
    const postDate = post.published_at || '2025-01-01';
    return {
      title: post.title,
      pubDate: new Date(postDate),
      description: post.excerpt || post.title,
      link: `/blog/${post.slug}/`,
      categories: post.category ? [post.category] : [],
    };
  });

  // Add video items - handle any edge cases
  let videoItems: any[] = [];
  try {
    if (VIDEOS && Array.isArray(VIDEOS)) {
      videoItems = VIDEOS
        .filter((v) => v && v.id && v.title)
        .map((video) => ({
          title: `[Video] ${video.title}`,
          pubDate: new Date(video.published_at || '2025-01-01'),
          description: video.description?.slice(0, 300) || video.title,
          link: `/video/${video.id}/`,
          categories: ['Video'] as const,
        }));
    }
  } catch (e) {
    console.error('Error processing videos for RSS:', e);
  }

  // Combine and sort all items
  const allItems = [...blogItems, ...videoItems].sort((a, b) => 
    b.pubDate.getTime() - a.pubDate.getTime()
  );

  return rss({
    title: 'Toby on Fitness Tech',
    description: 'Independent fitness tech reviews, videos, and podcasts from a real athlete.',
    site: siteUrl,
    items: allItems,
    customData: `<language>en-us</language>`,
  });
}
