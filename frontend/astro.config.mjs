// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://tobyonfitnesstech.com',
  vite: {
    plugins: [tailwindcss()]
  },

  trailingSlash: 'always',

  integrations: [react(), sitemap()],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'pt', 'hi', 'de'],
    routing: {
      prefixDefaultLocale: false,
    }
  }
});
