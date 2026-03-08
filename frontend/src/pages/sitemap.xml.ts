export async function GET() {
  const site = 'https://www.tobyonfitnesstech.com';
  
  const pages = [
    { loc: '/', changefreq: 'daily', priority: 1.0 },
    { loc: '/videos', changefreq: 'weekly', priority: 0.9 },
    { loc: '/podcasts', changefreq: 'weekly', priority: 0.9 },
    { loc: '/blog', changefreq: 'daily', priority: 0.8 },
    { loc: '/gear', changefreq: 'monthly', priority: 0.7 },
    { loc: '/about', changefreq: 'monthly', priority: 0.6 },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${site}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
