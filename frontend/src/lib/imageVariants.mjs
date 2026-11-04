// Build-time lookup for resized WebP copies made by scripts/build-image-variants.mjs.
// Server-only: call it from Astro frontmatter or statically rendered components.
// Images without variants (remote URLs, small files, a skipped build step)
// get no extra attributes and load their original file.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { podcastAsset } from './podcastAssets.mjs';

let manifest;

function variantManifest() {
  if (manifest) return manifest;
  try {
    manifest = JSON.parse(readFileSync(resolve('.cache/image-variants.json'), 'utf8')).images || {};
  } catch {
    manifest = {};
  }
  return manifest;
}

/**
 * Returns responsive image attributes. Podcast artwork overrides src with a
 * versioned WebP; its full-size original is hosted on public GitHub.
 *
 * @param {string | undefined} src  Public path such as /images/blog/cover.png
 * @param {string} sizes            The image's rendered width, as for the sizes attribute
 * @returns {{ src?: string, srcset?: string, sizes?: string }}
 */
export function imageVariants(src, sizes) {
  const podcast = podcastAsset(src);
  if (podcast) return {
    src: podcast.variants[0].src,
    srcset: podcast.variants.map((variant) => `${variant.src} ${variant.width}w`).join(', '),
    sizes,
  };
  if (typeof src !== 'string' || !src.startsWith('/')) return {};
  const entry = variantManifest()[src.split(/[?#]/)[0]];
  if (!entry?.variants?.length) return {};
  return {
    srcset: entry.variants.map((variant) => `${variant.src} ${variant.width}w`).join(', '),
    sizes,
  };
}
