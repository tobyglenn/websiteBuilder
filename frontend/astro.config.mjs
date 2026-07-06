// @ts-check
import { defineConfig } from 'astro/config';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const SITE_URL = 'https://tobyonfitnesstech.com';
const BUILD_LASTMOD = new Date();
const BUILD_LASTMOD_ISO = BUILD_LASTMOD.toISOString();

const EXCLUDED_SITEMAP_PATHS = [
  /^\/(?:de\/|es\/|pt\/|hi\/)?(?:404|500|search)(?:\/|\.html)?$/,
  /^\/(?:mma-rpg|gridbound-realms|bjj-buddy|nutritrack)\/?$/,
  /^\/blog\/(?:2025-09-09-discover-the-truth-behind-workout-tech-transparency|i-pulled-260-pounds-on-the-speediance-2s-did-it-break|speediance-2s-260-lb-lat-pulldown|speediance-broke-partner-mode-lost-free-lift-feature|the-submission-that-could-have-ended-everything|why-running-might-have-saved-my-life)\/$/,
];

const shouldIncludeInSitemap = (page) => {
  const pathname = new URL(page).pathname;
  return !EXCLUDED_SITEMAP_PATHS.some((pattern) => pattern.test(pathname));
};

const sourceUrl = (path) => new URL(path, import.meta.url);

const isoFromDateOnly = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const fileLastmod = (path) => {
  try {
    const file = sourceUrl(path);
    return existsSync(file) ? statSync(file).mtime.toISOString() : undefined;
  } catch {
    return undefined;
  }
};

const sitemapLastmodByPath = new Map();

const addLastmod = (pathname, lastmod) => {
  if (!pathname || !lastmod) return;
  sitemapLastmodByPath.set(pathname, lastmod);
};

const loadMarkdownBlogLastmods = () => {
  const blogDir = sourceUrl('./src/pages/blog/');
  if (!existsSync(blogDir)) return;

  for (const filename of readdirSync(blogDir)) {
    if (!filename.endsWith('.md')) continue;

    const slug = filename.replace(/\.md$/, '');
    const file = sourceUrl(`./src/pages/blog/${filename}`);
    const raw = readFileSync(file, 'utf8');
    const dateMatch = raw.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m);
    addLastmod(`/blog/${slug}/`, isoFromDateOnly(dateMatch?.[1]) ?? statSync(file).mtime.toISOString());
  }
};

const loadMockBlogLastmods = () => {
  const mockFile = sourceUrl('./src/data/mock.js');
  if (!existsSync(mockFile)) return;

  const raw = readFileSync(mockFile, 'utf8');
  const slugMatches = [...raw.matchAll(/["']?slug["']?\s*:\s*["']([^"']+)["']/g)];

  for (let i = 0; i < slugMatches.length; i += 1) {
    const slug = slugMatches[i][1];
    const start = slugMatches[i].index ?? 0;
    const end = slugMatches[i + 1]?.index ?? raw.length;
    const entry = raw.slice(start, end);
    const dateMatch = entry.match(/["']?(?:published_at|date)["']?\s*:\s*["'](\d{4}-\d{2}-\d{2})["']/);

    addLastmod(`/blog/${slug}/`, isoFromDateOnly(dateMatch?.[1]) ?? statSync(mockFile).mtime.toISOString());
  }
};

loadMarkdownBlogLastmods();
loadMockBlogLastmods();

const LIVE_DATA_LASTMOD = [
  './src/data/homepageFitnessData.json',
  './src/data/bodyCompositionData.json',
  './src/data/garmin_processed_activities.json',
  './src/data/garmin_all_activities.json',
  './src/data/whoop_v2_latest.json',
  './src/data/recentActivity.js',
].map(fileLastmod).filter(Boolean).sort().at(-1) ?? BUILD_LASTMOD_ISO;

const sitemapLastmod = (item) => {
  const pathname = new URL(item.url).pathname;

  if (sitemapLastmodByPath.has(pathname)) {
    return sitemapLastmodByPath.get(pathname);
  }

  if (
    pathname === '/' ||
    pathname === '/about/' ||
    pathname === '/day/' ||
    pathname === '/fitness-age/' ||
    pathname === '/running/' ||
    pathname === '/transformation/' ||
    pathname === '/year-in-review/'
  ) {
    return LIVE_DATA_LASTMOD;
  }

  return item.lastmod || BUILD_LASTMOD_ISO;
};

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  vite: {
    plugins: [tailwindcss()]
  },

  trailingSlash: 'ignore',

  integrations: [
    react(),
    sitemap({
      filter: shouldIncludeInSitemap,
      lastmod: BUILD_LASTMOD,
      serialize(item) {
        return {
          ...item,
          lastmod: sitemapLastmod(item),
        };
      },
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
