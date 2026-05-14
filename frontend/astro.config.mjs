// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const EXCLUDED_SITEMAP_PATHS = [
  /^\/(?:de\/|es\/|pt\/|hi\/)?(?:404|500|search)(?:\/|\.html)?$/,
  /^\/(?:mma-rpg|gridbound-realms|bjj-buddy|nutritrack)\/?$/,
  /^\/blog\/(?:2025-09-09-discover-the-truth-behind-workout-tech-transparency|i-pulled-260-pounds-on-the-speediance-2s-did-it-break|speediance-2s-260-lb-lat-pulldown|speediance-broke-partner-mode-lost-free-lift-feature|the-submission-that-could-have-ended-everything|why-running-might-have-saved-my-life)\/$/,
];

const shouldIncludeInSitemap = (page) => {
  const pathname = new URL(page).pathname;
  return !EXCLUDED_SITEMAP_PATHS.some((pattern) => pattern.test(pathname));
};

// https://astro.build/config
export default defineConfig({
  site: 'https://tobyonfitnesstech.com',
  vite: {
    plugins: [tailwindcss()]
  },

  trailingSlash: 'ignore',

  integrations: [
    react(),
    sitemap({
      filter: shouldIncludeInSitemap,
    }),
  ],

  redirects: {
    '/mma-rpg': 'https://clawdassistant85-netizen.github.io/mma-rpg/',
    '/gridbound-realms': 'https://clawdassistant85-netizen.github.io/gridbound-realms/',
    '/bjj-buddy': 'https://bjj-buddy.tobyonfitnesstech.com',
    '/nutritrack': 'https://nutritrack.tobyonfitnesstech.com',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'pt', 'hi', 'de'],
    routing: {
      prefixDefaultLocale: false,
    }
  }
});
