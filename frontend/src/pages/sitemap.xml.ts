import type { APIRoute } from 'astro';

// Redirect stub: the custom /sitemap.xml route was removed ~2026-07-29;
// @astrojs/sitemap now emits /sitemap-index.xml + /sitemap-0.xml.
// Renders a meta-refresh redirect page (static hosts can't issue HTTP 301s)
// so /sitemap.xml no longer 404s. Mirrors the HTML Astro generates for the
// `redirects` config in static builds.
export const GET: APIRoute = () => {
  const target = '/sitemap-index.xml';
  return new Response(
    `<!doctype html><title>Redirecting to: ${target}</title>` +
      `<meta http-equiv="refresh" content="0;url=${target}">` +
      `<meta name="robots" content="noindex">` +
      `<link rel="canonical" href="https://tobyonfitnesstech.com${target}">` +
      `<body><a href="${target}">Redirecting from <code>/sitemap.xml</code> to <code>${target}</code></a></body>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  );
};
