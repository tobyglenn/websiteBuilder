import type { APIRoute } from 'astro';
import { CANONICAL_BLOG_POSTS } from '../lib/blogPosts';
import videosData from '../data/videos.json';
import { isLikelyShortVideo } from '../lib/videoMeta.js';

const normalizeSearchText = (parts: unknown[]) =>
  parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export const GET: APIRoute = () => {
  const blogPosts = CANONICAL_BLOG_POSTS.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    tags: post.tags || [],
    published_at: post.published_at,
    searchText: normalizeSearchText([post.title, post.excerpt, post.category, post.tags]),
  }));

  const videos = (videosData.videos || []).map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description,
    category: video.category,
    thumbnail: video.thumbnail,
    duration_formatted: video.duration_formatted,
    kind: isLikelyShortVideo(video) ? 'Short' : 'Video',
    searchText: normalizeSearchText([video.title, video.description, video.category]),
  }));

  return new Response(JSON.stringify({ blogPosts, videos }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
