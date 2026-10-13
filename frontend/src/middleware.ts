import {defineMiddleware} from 'astro:middleware';
import {releaseRoute, transformReleaseHtml} from './lib/releaseLocaleServer.mjs';
import es from './data/locales/release-es.json';
import de from './data/locales/release-de.json';
import pt from './data/locales/release-pt.json';
import hi from './data/locales/release-hi.json';
const catalogs = {es,de,pt,hi};
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const match = context.url.pathname.match(/^\/(es|de|pt|hi)(\/.*)?$/);
  if (!match || !response.headers.get('content-type')?.includes('text/html')) return response;
  const [,locale,base='/'] = match;
  if (!(releaseRoute(base) || base === '/' || base === '/blog/')) return response;
  let html = transformReleaseHtml(await response.text(), {locale, messages:catalogs[locale]});
  if (base === '/compare/') html = html.replace('</body>', `<script id="comparison-locale" type="application/json">${JSON.stringify(catalogs[locale]).replaceAll('<','\\u003c')}</script></body>`);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, {status:response.status, headers});
});
