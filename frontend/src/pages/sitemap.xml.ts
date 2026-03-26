export async function GET() {
  const site = 'https://tobyonfitnesstech.com';
  
  // Import data for dynamic pages
  const { VIDEOS } = await import('../data/mock.js');
  const { CANONICAL_BLOG_POSTS } = await import('../lib/blogPosts');
  const { gearItems } = await import('../data/gearItems.ts');
  
  // Main static pages
  const mainPages = [
    { loc: '/', changefreq: 'daily', priority: 1.0 },
    { loc: '/videos/', changefreq: 'weekly', priority: 0.9 },
    { loc: '/podcasts/', changefreq: 'weekly', priority: 0.9 },
    { loc: '/blog/', changefreq: 'daily', priority: 0.8 },
    { loc: '/gear/', changefreq: 'monthly', priority: 0.7 },
    { loc: '/about/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/running/', changefreq: 'weekly', priority: 0.7 },
    { loc: '/prs/', changefreq: 'weekly', priority: 0.7 },
    { loc: '/transformation/', changefreq: 'monthly', priority: 0.7 },
    { loc: '/timeline/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/day/', changefreq: 'weekly', priority: 0.7 },
    { loc: '/start-here/', changefreq: 'monthly', priority: 0.7 },
    { loc: '/calculators/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/fitness-age/', changefreq: 'monthly', priority: 0.7 },
    { loc: '/roi/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/compare/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/compare-trackers/', changefreq: 'monthly', priority: 0.6 },
    { loc: '/sleep/', changefreq: 'monthly', priority: 0.6 },
  ];

  // Blog posts
  const blogPages = (CANONICAL_BLOG_POSTS || []).map((post: { slug?: string }) => ({
    loc: `/blog/${post.slug}/`,
    changefreq: 'weekly',
    priority: 0.7
  }));

  // Videos
  const videoPages = (VIDEOS || []).map((video: { id?: string | number }) => ({
    loc: `/video/${video.id}/`,
    changefreq: 'weekly',
    priority: 0.7
  }));

  // Gear items
  const gearPages = (gearItems || []).map((item: { slug?: string }) => ({
    loc: `/gear/${item.slug}/`,
    changefreq: 'monthly',
    priority: 0.7
  }));

  // Combine all pages
  const allPages = [...mainPages, ...blogPages, ...videoPages, ...gearPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
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
