import {parse, serialize} from 'parse5';
import {messageKey, translateText} from './releaseLocale.js';
export const releaseLocales = ['es','de','pt','hi'];
export const localizedProjects = ['wild-rebellion','monstrum-world','ironvane-chronicle','lilly'];
export function releaseRoute(path) {
  return /^\/(?:compare|games(?:\/journal(?:\/[^/]+)?)?|projects)\/?$/.test(path)
    || localizedProjects.some(slug => path === `/projects/${slug}/`);
}
export function localeLink(value, locale) {
  const origin = 'https://tobyonfitnesstech.com';
  if (!(value.startsWith('/') || value.startsWith(origin+'/')) || value.startsWith('//')) return value;
  const absolute = value.startsWith(origin);
  const url = new URL(value, origin);
  if (/^\/(?:es|de|pt|hi)(?:\/|$)/.test(url.pathname)) return value;
  const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  if (!(path === '/' || releaseRoute(path) || ['/blog/','/about/','/videos/','/speediance/','/wearables/','/agentstack/','/running/','/sleep/','/training/','/bjj/','/transformation/','/prs/','/whoop/','/fitness-age/','/gear/','/faq/','/contact/','/privacy/','/terms/'].includes(path) || path === '/games/journal/rss.xml/')) return value;
  return `${absolute?origin:''}/${locale}${url.pathname}${url.search}${url.hash}`;
}
export function transformReleaseHtml(html, {locale, messages = {}, collect} = {}) {
  const tree = parse(html);
  function text(value) {
    if (collect && /[A-Za-z]/.test(value)) collect.add(messageKey(value).key);
    return locale ? translateText(value, messages) : value;
  }
  function schema(value, key = '') {
    if (Array.isArray(value)) return value.map(v => schema(v, key));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,schema(v,k)]));
    if (typeof value !== 'string') return value;
    if (['name','headline','description','caption'].includes(key)) return text(value);
    if (locale && ['url','mainEntityOfPage','item'].includes(key)) return localeLink(value, locale);
    if (locale && key === 'inLanguage' && value === 'en') return locale === 'pt' ? 'pt-BR' : locale;
    return value;
  }
  function visit(node) {
    const attrs = node.attrs || [];
    const attr = name => attrs.find(a => a.name === name)?.value;
    // Explicit English notices stay English, including their destination links.
    if (attrs.some(a => a.name === 'data-translation-pending')) return;
    if (node.tagName === 'script') {
      if (attr('type') === 'application/ld+json') {
        try {node.childNodes[0].value = JSON.stringify(schema(JSON.parse(node.childNodes[0].value))).replaceAll('<','\\u003c');} catch {}
      }
      return;
    }
    if (['style','code','pre','astro-island'].includes(node.tagName)) return;
    if (node.nodeName === '#text') node.value = text(node.value);
    for (const a of attrs) {
      if (['alt','title','aria-label','placeholder'].includes(a.name) || (node.tagName === 'meta' && a.name === 'content' && /description|title/.test(attr('name') || attr('property') || ''))) a.value = text(a.value);
      if (locale && a.name === 'href' && node.tagName === 'a') a.value = localeLink(a.value, locale);
    }
    for (const child of node.childNodes || []) visit(child);
    if (locale && node.tagName === 'time' && /^\d{4}-\d{2}-\d{2}$/.test(attr('datetime') || '') && node.childNodes?.length === 1 && node.childNodes[0].nodeName === '#text') {
      node.childNodes[0].value = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : locale, {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${attr('datetime')}T12:00:00Z`));
    }
  }
  visit(tree);
  return serialize(tree);
}
