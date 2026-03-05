import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { BLOG_POSTS } from '../data/mock.js';

export async function GET(context: APIContext) {
  return rss({
    title: 'Toby on Fitness Tech — Blog',
    description: 'Independent reviews and analysis of fitness technology: Speediance, Tonal, Whoop, Garmin, and more. Real data from a real athlete.',
    site: context.site ?? 'https://tobyonfitnesstech.com',
    items: BLOG_POSTS.map((post) => ({
      title: post.title,
      pubDate: new Date(post.published_at || post.date || '2025-01-01'),
      description: post.excerpt || post.title,
      link: `/blog/${post.slug}/`,
      categories: post.tags || [],
      author: 'Toby Glenn Peters',
    })),
    customData: `<language>en-us</language><managingEditor>toby@tobyonfitnesstech.com (Toby Glenn Peters)</managingEditor><webMaster>toby@tobyonfitnesstech.com (Toby Glenn Peters)</webMaster><ttl>60</ttl>`,
    stylesheet: false,
  });
}
