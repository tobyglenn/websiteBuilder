// Explicit category definitions for video filtering
export const CATEGORIES = [
  { id: 'all', name: 'All Videos', slug: 'all', color: 'bg-neutral-800 text-white' },
  { id: 'speediance', name: 'Speediance', slug: 'speediance', color: 'bg-blue-600 text-white' },
  { id: 'bjj', name: 'BJJ & Grappling', slug: 'bjj', color: 'bg-emerald-600 text-white' },
  { id: 'wearables', name: 'Tech & Wearables', slug: 'wearables', color: 'bg-cyan-600 text-white' },
  { id: 'transformation', name: 'Transformation', slug: 'transformation', color: 'bg-green-600 text-white' },
  { id: 'training', name: 'Training Methodology', slug: 'training', color: 'bg-orange-600 text-white' },
  { id: 'coding', name: 'Coding & AI', slug: 'coding', color: 'bg-indigo-600 text-white' },
  { id: 'shorts', name: 'Shorts', slug: 'shorts', color: 'bg-sky-600 text-white' },
];

/**
 * Returns explicit categories for a video based on video data tags/category.
 * No brittle keyword matching.
 */
export function getVideoCategories(video = {}) {
  const cats = [];
  if (video.category && video.category !== 'all') {
    cats.push(video.category);
  }
  if (Array.isArray(video.tags)) {
    video.tags.forEach(tag => {
      const normalized = tag === 'tech' ? 'wearables' : tag === 'methodology' ? 'training' : tag;
      if (CATEGORIES.some(c => c.id === normalized) && !cats.includes(normalized)) {
        cats.push(normalized);
      }
    });
  }
  if (cats.length === 0) cats.push('training');
  return cats;
}

// Backward-compatibility alias
export function categorizeVideo(videoOrTitle) {
  if (typeof videoOrTitle === 'object' && videoOrTitle !== null) {
    return getVideoCategories(videoOrTitle);
  }
  return ['all'];
}

export function getCategoryColor(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return cat?.color || 'bg-neutral-800 text-white';
}
