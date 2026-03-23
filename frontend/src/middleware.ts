import { defineMiddleware } from 'astro/middleware';

const SUPPORTED_LOCALES = ['de', 'es', 'pt', 'hi'] as const;
const SKIP_PREFIXES = ['/api/', '/_astro/', '/de/', '/es/', '/pt/', '/hi/'];

function detectPreferredLocale(header: string | null): (typeof SUPPORTED_LOCALES)[number] | null {
  if (!header) return null;
  const normalized = header.toLowerCase();
  if (normalized.includes('de')) return 'de';
  if (normalized.includes('es')) return 'es';
  if (normalized.includes('pt')) return 'pt';
  if (normalized.includes('hi')) return 'hi';
  return null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (
    pathname === '/favicon.ico' ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.txt') ||
    pathname.endsWith('.json') ||
    SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return next();
  }

  if (pathname !== '/') {
    return next();
  }

  const alreadyRedirected = context.cookies.get('lang-redirected')?.value === '1';
  if (alreadyRedirected) {
    return next();
  }

  const preferredLocale = detectPreferredLocale(context.request.headers.get('accept-language'));
  if (!preferredLocale) {
    const response = await next();
    response.headers.append('Set-Cookie', 'lang-redirected=1; Max-Age=86400; Path=/; SameSite=Lax');
    return response;
  }

  const redirectResponse = Response.redirect(new URL(`/${preferredLocale}/`, context.url), 302);
  redirectResponse.headers.append('Set-Cookie', 'lang-redirected=1; Max-Age=86400; Path=/; SameSite=Lax');
  return redirectResponse;
});
