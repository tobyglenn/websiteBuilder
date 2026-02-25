import { VIDEOS, BLOG_POSTS } from '../data/mock.js';

const SITE_URL = 'https://tobyonfitnesstech.com';

// All podcast episode slugs (matching getStaticPaths in [slug].astro)
// These are fetched from RSS at build time — we hardcode the known slugs for sitemap
// The slug is derived from: episode title → lowercase → spaces to hyphens → remove special chars
// Since episodes come from RSS (dynamic at build), we reference the TOFT video transcript keys
// which are episodes 1-14 of the TOFT podcast

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

export async function GET() {
  const allUrls = [
    ...staticPages.map(urlEntry),
    ...translatedPages.map(urlEntry),
    ...VIDEOS.map(videoEntry),
    ...BLOG_POSTS.map(blogEntry),
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