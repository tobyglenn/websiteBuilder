// Explicit owner-review assets must survive legacy slug-based image repair.
export function resolveReviewCover(rawImage, exists, resolveLegacy) {
  const versioned = /^\/images\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*-aria-review\.(?:webp|png|jpe?g)$/.test(rawImage);
  return versioned && exists(rawImage) ? rawImage : resolveLegacy();
}
