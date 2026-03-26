// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const EXCLUDED_SITEMAP_PATH = /^\/(?:de\/|es\/|pt\/|hi\/)?(?:404|500|search)\/$/;

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
      filter: (page) => !EXCLUDED_SITEMAP_PATH.test(new URL(page).pathname),
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
