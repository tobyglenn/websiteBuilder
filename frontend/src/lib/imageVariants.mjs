// Build-time lookup for resized WebP copies made by scripts/build-image-variants.mjs.
// Server-only: call it from Astro frontmatter or statically rendered components.
// Images without variants (remote URLs, small files, a skipped build step)
// get no extra attributes and load their original file.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
 * Returns srcset/sizes attributes to spread next to an existing src. The
 * original src stays as the fallback, so markup that matches on src={...}
 * keeps working; browsers download only the srcset candidate they need.
 *
 * @param {string | undefined} src  Public path such as /images/blog/cover.png
 * @param {string} sizes            The image's rendered width, as for the sizes attribute
 * @returns {{ srcset?: string, sizes?: string }}
 */
export function imageVariants(src, sizes) {
  if (typeof src !== 'string' || !src.startsWith('/')) return {};
  const entry = variantManifest()[src.split(/[?#]/)[0]];
  if (!entry?.variants?.length) return {};
  return {
    srcset: entry.variants.map((variant) => `${variant.src} ${variant.width}w`).join(', '),
    sizes,
  };
}
