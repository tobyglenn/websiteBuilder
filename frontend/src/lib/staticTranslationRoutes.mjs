import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// Build-time inventory: advertise only real static pages, including partial
// language sets. Dynamic blog, video and podcast routes retain their explicit
// translationBase/translationLocales contract in Layout.
const inventories = new Map();
export function staticTranslationRoutes(pagesDirectory) {
  if (inventories.has(pagesDirectory)) return inventories.get(pagesDirectory);
  const groups = new Map();
  const walk = (directory, prefix = '') => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const name = `${prefix}${entry.name}`;
      if (entry.isDirectory()) { walk(join(directory, entry.name), `${name}/`); continue; }
      if (!/\.(astro|md)$/.test(name) || name.includes('[')) continue;
      const route = '/' + name.replace(/\.(astro|md)$/, '').replace(/(?:^|\/)index$/, '');
      const pathname = route.endsWith('/') ? route : `${route}/`;
      const match = pathname.match(/^\/(de|es|pt|hi)(?=\/)/);
      const locale = match?.[1] || 'en';
      const base = match ? pathname.slice(match[0].length) || '/' : pathname;
      if (!groups.has(base)) groups.set(base, new Set());
      groups.get(base).add(locale);
    }
  };
  walk(pagesDirectory);
  const result = new Map([...groups].filter(([, langs]) => langs.has('en') && langs.size > 1)
    .map(([base, langs]) => [base, ['en', 'es', 'pt', 'hi', 'de'].filter(lang => langs.has(lang))]));
  inventories.set(pagesDirectory, result);
  return result;
}

