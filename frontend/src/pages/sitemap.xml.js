import { VIDEOS } from '../data/mock.js';
import { CANONICAL_BLOG_POSTS } from '../lib/blogPosts';

const SITE_URL = 'https://tobyonfitnesstech.com';

// Gear review pages — individual product review pages at /gear/[slug]
const GEAR_SLUGS = [
  'speediance-gym-monster-2s',
  'speediance-gym-monster-original',
  'doorway-pull-up-bar',
  'whoop-5',
  'garmin-forerunner-265s',
  'apple-watch-series-11',
  '8sleep-pod',
  'cronometer',
  'openclaw-m1-mac-mini',
  'openclaw-mac-studio',
  'tonal',
  'apple-watch-gen-1-2',
  'motorola-watch-2r',
  'oura-ring-gen-1-2',
];

// Fetch podcast episode pages from RSS feeds (build-time, same sources as [slug].astro)
async function fetchPodcastEpisodePaths() {
  const today = new Date().toISOString().slice(0, 10);
  const paths = [];

  // OpenClaw Daily RSS — English + translated (episode-N slugs)
  const openclawFeeds = [
    { locale: 'en', url: 'https://grayking-creator.github.io/openclaw-podcast/feed.xml' },
    { locale: 'de', url: 'https://raw.githubusercontent.com/grayking-creator/openclaw-podcast/main/translations/feed_de.xml' },
    { locale: 'es', url: 'https://raw.githubusercontent.com/grayking-creator/openclaw-podcast/main/translations/feed_es.xml' },
    { locale: 'hi', url: 'https://raw.githubusercontent.com/grayking-creator/openclaw-podcast/main/translations/feed_hi.xml' },
    { locale: 'pt', url: 'https://raw.githubusercontent.com/grayking-creator/openclaw-podcast/main/translations/feed_pt.xml' },
  ];

  await Promise.all(openclawFeeds.map(async ({ locale, url }) => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return;
      const xml = await res.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];
      items.forEach((item, i) => {
        const epNum = i + 1; // episodes listed newest-first; use index+1 as fallback
        // Try to extract episode number from itunes:episode tag
        const itunesMatch = item.match(/<itunes:episode>(\d+)<\/itunes:episode>/);
        const num = itunesMatch ? parseInt(itunesMatch[1], 10) : epNum;
        const pubDateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);
        const lastmod = pubDateMatch ? new Date(pubDateMatch[1]).toISOString().slice(0, 10) : today;
        const urlPath = locale === 'en' ? `/podcasts/episode-${num}` : `/${locale}/podcasts/episode-${num}`;
        paths.push({ path: urlPath, changefreq: 'monthly', priority: 0.7, lastmod });
      });
    } catch {
      // Feed unreachable at build time — skip silently
    }
  }));

  return paths;
}

// Static pages with their metadata
const staticPages = [
  { path: '/', changefreq: 'daily', priority: 1.0, lastmod: new Date().toISOString().slice(0,10) },
  { path: '/about', changefreq: 'monthly', priority: 0.9, lastmod: '2026-02-25' },
  { path: '/blog', changefreq: 'daily', priority: 0.9, lastmod: new Date().toISOString().slice(0,10) },
  { path: '/videos', changefreq: 'daily', priority: 0.9, lastmod: new Date().toISOString().slice(0,10) },
  { path: '/podcasts', changefreq: 'weekly', priority: 0.8, lastmod: new Date().toISOString().slice(0,10) },
  { path: '/podcasts/fitness-tech', changefreq: 'weekly', priority: 0.8, lastmod: new Date().toISOString().slice(0,10) },
  { path: '/podcasts/openclaw', changefreq: 'weekly', priority: 0.8, lastmod: new Date().toISOString().slice(0,10) },
  { path: '/speediance', changefreq: 'weekly', priority: 0.85, lastmod: new Date().toISOString().slice(0,10) },
  { path: '/gear', changefreq: 'monthly', priority: 0.8, lastmod: '2026-02-24' },
  { path: '/transformation', changefreq: 'monthly', priority: 0.85, lastmod: '2026-02-25' },
  { path: '/training', changefreq: 'monthly', priority: 0.7, lastmod: '2026-02-25' },
  { path: '/bjj', changefreq: 'monthly', priority: 0.7, lastmod: '2026-02-25' },
  { path: '/running', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString().slice(0,10) },
  { path: '/sleep', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString().slice(0,10) },
  { path: '/day', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString().slice(0,10) },
  { path: '/start-here', changefreq: 'monthly', priority: 0.8, lastmod: '2026-02-25' },
  { path: '/fitness-age', changefreq: 'monthly', priority: 0.7, lastmod: '2026-03-08' },
  { path: '/live', changefreq: 'weekly', priority: 0.6, lastmod: '2026-02-24' },
  { path: '/search', changefreq: 'monthly', priority: 0.5, lastmod: '2026-02-01' },
  { path: '/affiliate', changefreq: 'monthly', priority: 0.4, lastmod: '2026-02-01' },
  { path: '/privacy', changefreq: 'yearly', priority: 0.3, lastmod: '2026-01-01' },
  { path: '/terms', changefreq: 'yearly', priority: 0.3, lastmod: '2026-01-01' },
];

// Translated pages (de, es, hi, pt) — podcast landing pages
const locales = ['de', 'es', 'hi', 'pt'];
const translatedPages = locales.flatMap(locale => [
  { path: `/${locale}/podcasts/openclaw`, changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString().slice(0,10) },
]);

function urlEntry({ path, changefreq, priority, lastmod }) {
  return `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

function videoEntry(video) {
  const lastmod = (video.published_at || new Date().toISOString().slice(0,10)).slice(0,10);
  return `  <url>
    <loc>${SITE_URL}/video/${video.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
}

function blogEntry(post) {
  const lastmod = (post.published_at || new Date().toISOString().slice(0,10)).slice(0,10);
  return `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
}

function gearEntry(slug) {
  return `  <url>
    <loc>${SITE_URL}/gear/${slug}</loc>
    <lastmod>2026-03-04</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
}

export async function GET() {
  const podcastEpisodes = await fetchPodcastEpisodePaths();

  const allUrls = [
    ...staticPages.map(urlEntry),
    ...translatedPages.map(urlEntry),
    ...GEAR_SLUGS.map(gearEntry),
    ...VIDEOS.map(videoEntry),
    ...CANONICAL_BLOG_POSTS.map(blogEntry),
    ...podcastEpisodes.map(urlEntry),
  ].join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
