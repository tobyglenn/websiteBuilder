import catalog from '../data/podcast-assets.json' with { type: 'json' };
const bySource = new Map(Object.values(catalog.images).map((image) => [image.source, image]));

export function podcastAsset(path) {
  if (typeof path !== 'string') return undefined;
  const key = path.split(/[?#]/)[0].replace(/^https:\/\/(?:www\.)?tobyonfitnesstech\.com(?=\/)/, '');
  return catalog.images[key] || bySource.get(key);
}

export function publicImageUrl(path) {
  return podcastAsset(path)?.source || path;
}

// Social crawlers get a same-origin image/webp response, without a GitHub
// release download redirect or application/octet-stream attachment headers.
export function publicPreviewUrl(path) {
  return podcastAsset(path)?.variants.at(-1)?.src || path;
}
