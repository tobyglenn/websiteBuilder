import { CANONICAL_BLOG_POSTS } from './blogPosts';
import { getLocalizedBlogPosts, type BlogTranslationLocale } from './localizedBlogPosts';
import { homepageWeek, selectWeeklyPost } from './weeklyFeature.mjs';
import { isLongFormVideo } from './videoMeta.js';
import videosData from '../data/videos.json';
import { imageVariants } from './imageVariants.mjs';

export function getHomepageFeature(lang = 'en', now = new Date()) {
  const canonical = selectWeeklyPost(CANONICAL_BLOG_POSTS, now);
  if (!canonical)
    throw new Error('Homepage weekly pick requires a published article with an image.');
  const translated =
    lang === 'en'
      ? undefined
      : getLocalizedBlogPosts(lang as BlogTranslationLocale).find(
          (post) => post.slug === canonical.slug
        );
  const post = translated || canonical;
  const latestVideo = [...videosData.videos]
    .filter((video) => isLongFormVideo(video) && Date.parse(video.publishedAt) <= now.getTime())
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
  return {
    feature: {
      title: post.title,
      description: post.excerpt,
      slug: canonical.slug,
      image: canonical.image,
      // Rendered at 104px (80px on phones); ships a small WebP instead of the full artwork.
      responsiveImage: imageVariants(canonical.image, '104px'),
      imageAlt: post.title,
      href: `${translated ? `/${lang}` : ''}/blog/${canonical.slug}/`,
      week: homepageWeek(now).key,
    },
    latestVideo: latestVideo
      ? { title: latestVideo.title, id: latestVideo.id, href: `/video/${latestVideo.id}/` }
      : null,
  };
}
