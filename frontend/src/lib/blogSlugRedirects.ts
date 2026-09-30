// Single source of truth for manual blog slug renames (old slug -> new slug).
// Used by the English blog template (merged into BLOG_REDIRECTS in blogPosts.ts)
// and by the localized [lang]/blog/[slug].astro template.
// The map is language-agnostic: the same old slug redirects in every locale.
//
// When adding a rename here, ALSO add the old slug to EXCLUDED_SITEMAP_PATHS
// in frontend/astro.config.mjs (English + /de|es|pt|hi/ variants), or the
// deploy's indexability audit will fail: a sitemap URL whose canonical
// points elsewhere is an error.
export const MANUAL_REDIRECTS: Record<string, string> = {
  "2025-09-09-discover-the-truth-behind-workout-tech-transparency": "2026-04-08-discover-the-truth-behind-workout-tech-transparency",
  "mflx3omqzw": "speediance-gym-nano-vs-voltra-clone-controversy",  // slug renamed 2026-09-30
};
