import { VIDEOS, BLOG_POSTS } from '../data/mock.js';

const SITE_URL = 'https://tobyonfitnesstech.com';

function generateSitemap(items, type) {
  return items.map(item => `
    <url>
      <loc>${SITE_URL}/${type}/${item.id || item.slug}</loc>
      <lastmod>${new Date(item.published_at || new Date()).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `).join('');
}

export async function GET() {
  const staticPages = ['/', '/videos', '/blog', '/about', '/start-here', '/running', '/live', '/search'];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticPages.map(page => `
        <url>
          <loc>${SITE_URL}${page}</loc>
          <changefreq>daily</changefreq>
          <priority>1.0</priority>
        </url>
      `).join('')}
      
      ${generateSitemap(VIDEOS, 'video')}
      
      ${generateSitemap(BLOG_POSTS, 'blog')}
    </urlset>
  `.trim();

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
