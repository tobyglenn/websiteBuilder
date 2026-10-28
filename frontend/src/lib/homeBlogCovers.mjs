import { usesWildRacingAiReviewImage } from './wildRacingAiBlogPresentation.mjs';
import { usesWildRacingReviewImage } from './wildRacingBlogPresentation.mjs';
import { usesPokemonFeatureImage } from './pokemonBlogPresentation.mjs';
import { articleTopic } from './blogEditorial.mjs';

// Reviewed topic photography for homepage cards. Keep headline graphics out of
// this small surface; the article title is already real, localized text below.
export function homeBlogCover(post) {
  if (usesWildRacingAiReviewImage(post)) return [{ src: post.image, fit: 'contain', position: '50% 50%' }];
  if (usesWildRacingReviewImage(post)) return [{ src: post.image, fit: 'contain', position: '50% 50%' }];
  if (post.slug === 'what-changed-my-mind-about-muse' && post.image === '/images/blog/what-changed-my-mind-about-muse-aria-review.jpg') return [{ src: post.image, fit: 'contain', position: '50% 50%' }];
  if (usesPokemonFeatureImage(post)) return [{ src: post.image, fit: "contain", position: "50% 50%" }];
  if (post.slug === "wild-rebellion-guidance-without-open-panels") return [{ src: "/images/blog/wild-rebellion-guidance-without-open-panels-wild-racing-aria-review.png", fit: "contain", position: "50% 50%" }];
  const topic = articleTopic({ ...post, category: post.categoryKey || post.category,
    title: post.sourceTitle || post.title });
  const covers = {
    gym: [
      { src: '/images/comparison/speediance-v3.png', fit: 'cover', position: '50% 50%', background: '#929292' },
      { src: '/images/gear/tonal.jpg', fit: 'cover', position: '50% 50%', background: '#c6e9ec' },
    ],
    training: [{ src: '/progress/workout_action.jpg', fit: 'cover', position: '50% 42%' }],
    bjj: [{ src: '/images/about/bjj_day4.jpg', fit: 'cover', position: '50% 50%' }],
    wearables: [{ src: '/images/gear/whoop-5.0.jpg', fit: 'contain', position: '50% 50%', background: '#fff' }],
    games: [{ src: '/images/projects/monstrum-world/hero.webp', fit: 'cover', position: '50% 50%' }],
    creator: [{ src: '/images/projects/ironvane-chronicle/hero.webp', fit: 'cover', position: '50% 50%' }],
    projects: [{ src: '/images/projects/pokemon-go-automation/hero.png', fit: 'cover', position: '50% 50%' }],
    ai: [{ src: '/images/gear/openclaw-mac-studio.jpg', fit: 'contain', position: '50% 50%', background: '#fff' }],
  };
  return covers[topic] || covers.training;
}
