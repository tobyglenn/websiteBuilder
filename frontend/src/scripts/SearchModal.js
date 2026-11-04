// Site search modal (opened from the header). Queries the Pagefind index built
// at deploy time, which loads only the small index chunks a query needs, in the
// language of the current page. Article and video pages carry
// data-pagefind-filter="type:…" plus title/image/date/duration metadata.
import { captureEvent, cleanAnalyticsText } from '../lib/analytics.js';

const RESULTS_PER_TYPE = 5;
const SETTLE_MS = 300;
const ICONS = {
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  close: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  file: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>',
  video: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 11"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

let pagefindPromise;
function loadPagefind() {
  const url = '/pagefind/pagefind.js';
  pagefindPromise ||= import(/* @vite-ignore */ url).then(async (pagefind) => {
    await pagefind.options?.({ excerptLength: 18 });
    return pagefind;
  });
  pagefindPromise.catch(() => {
    pagefindPromise = undefined;
  });
  return pagefindPromise;
}

async function searchType(pagefind, query, type) {
  const search = await pagefind.search(query, { filters: { type } });
  // Pagefind can return pages without a single word hit; those aren't matches.
  const results = (search?.results || []).filter((result) => !Array.isArray(result.words) || result.words.length > 0);
  const pages = await Promise.all(results.slice(0, RESULTS_PER_TYPE).map((result) => result.data()));
  return { total: results.length, pages };
}

const slugFromUrl = (url, kind) =>
  decodeURIComponent(url.match(kind === 'blog' ? /\/blog\/([^/?#]+)/ : /\/video\/([^/?#]+)/)?.[1] || url);

function renderPost(page, index) {
  const meta = page.meta || {};
  return `<a href="${escapeHtml(page.url)}" data-result-type="blog" data-result-slug="${escapeHtml(slugFromUrl(page.url, 'blog'))}" data-result-position="${index + 1}" class="flex items-start gap-3 p-3 rounded-md hover:bg-neutral-800 transition-colors group">
    <div class="flex-1 min-w-0">
      <h4 class="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">${escapeHtml(meta.title)}</h4>
      <p class="text-xs text-neutral-500 mt-1 line-clamp-2">${page.excerpt || ''}</p>
      <div class="flex items-center gap-2 mt-2 text-xs text-neutral-600">
        ${meta.category ? `<span class="bg-neutral-800 px-2 py-0.5 rounded">${escapeHtml(meta.category)}</span><span>•</span>` : ''}
        <span>${escapeHtml(meta.date || 'Undated')}</span>
      </div>
    </div>
  </a>`;
}

function renderVideo(page, index, offset) {
  const meta = page.meta || {};
  const thumb = meta.image
    ? `<img src="${escapeHtml(meta.image)}" alt="" loading="lazy" decoding="async" class="w-full h-full object-cover" />`
    : `<div class="w-full h-full flex items-center justify-center text-neutral-600">${ICONS.video}</div>`;
  return `<a href="${escapeHtml(page.url)}" data-result-type="video" data-result-slug="${escapeHtml(slugFromUrl(page.url, 'video'))}" data-result-position="${offset + index + 1}" class="flex items-start gap-3 p-3 rounded-md hover:bg-neutral-800 transition-colors group">
    <div class="w-24 h-16 bg-neutral-800 rounded-md overflow-hidden flex-shrink-0">${thumb}</div>
    <div class="flex-1 min-w-0">
      <h4 class="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">${escapeHtml(meta.title)}</h4>
      <p class="text-xs text-neutral-500 mt-1 line-clamp-1">${page.excerpt || ''}</p>
      <div class="flex items-center gap-2 mt-2 text-xs text-neutral-600">
        ${meta.duration ? `<span class="flex items-center gap-1">${ICONS.clock}${escapeHtml(meta.duration)}</span><span>•</span>` : ''}
        <span class="bg-neutral-800 px-2 py-0.5 rounded">${escapeHtml(meta.kind || 'Video')}</span>
      </div>
    </div>
  </a>`;
}

const message = (title, detail = '') =>
  `<div class="p-8 text-center text-neutral-500"><p>${title}</p>${detail ? `<p class="text-sm mt-2">${detail}</p>` : ''}</div>`;

export function openSearchModal({ onClose }) {
  const searchPage = document.documentElement.lang && document.documentElement.lang !== 'en'
    ? `/${document.documentElement.lang}/search/`
    : '/search/';
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4';
  overlay.innerHTML = `
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" data-backdrop></div>
    <div role="dialog" aria-modal="true" aria-label="Search" class="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden z-10">
      <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <span class="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Search</span>
        <button type="button" data-close class="text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800" aria-label="Close search">${ICONS.close}</button>
      </div>
      <div class="p-4 border-b border-neutral-800">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">${ICONS.search}</span>
          <input type="text" data-query autocomplete="off" aria-label="Search blog posts and videos" placeholder="Search blog posts and videos..." class="w-full bg-neutral-800 border border-neutral-700 rounded-md py-3 pl-10 pr-10 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
          <button type="button" data-clear hidden class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white" aria-label="Clear search">${ICONS.close}</button>
        </div>
      </div>
      <div class="max-h-[60vh] overflow-y-auto" data-results aria-live="polite"></div>
    </div>`;

  const input = overlay.querySelector('[data-query]');
  const clear = overlay.querySelector('[data-clear]');
  const resultsEl = overlay.querySelector('[data-results]');
  let timer;
  let token = 0;
  let lastSearchKey = '';
  let lastResultCount = 0;
  let resultClicked = false;

  const showIdle = () => {
    resultsEl.innerHTML = `<div class="p-8 text-center text-neutral-500"><span class="inline-block mb-3 opacity-50">${ICONS.search.replace(/18/g, '32')}</span><p>Start typing to search...</p><p class="text-sm mt-2">Search through blog posts and videos</p></div>`;
  };

  async function runSearch() {
    const query = input.value.trim();
    const current = ++token;
    if (query.length < 2) {
      lastResultCount = 0;
      if (!query) {
        lastSearchKey = '';
        showIdle();
      }
      return;
    }
    resultsEl.innerHTML = '<div class="p-8 text-center text-neutral-500"><div class="animate-pulse">Searching...</div></div>';
    try {
      const pagefind = await loadPagefind();
      const [blog, videos] = await Promise.all([
        searchType(pagefind, query, 'article'),
        searchType(pagefind, query, 'video'),
      ]);
      if (current !== token) return;
      const resultCount = blog.pages.length + videos.pages.length;
      lastResultCount = resultCount;
      const searchKey = `${query}:${resultCount}`;
      if (searchKey !== lastSearchKey) {
        lastSearchKey = searchKey;
        const base = { search_surface: 'site_modal', search_query: cleanAnalyticsText(query, 80), search_settle_ms: SETTLE_MS, content_type: 'site' };
        captureEvent('search_performed', {
          ...base,
          result_count: resultCount,
          blog_result_count: blog.pages.length,
          video_result_count: videos.pages.length,
          blog_total_count: blog.total,
          video_total_count: videos.total,
          search_engine: 'pagefind',
        });
        if (resultCount === 0) captureEvent('search_no_results', base);
      }
      if (resultCount === 0) {
        resultsEl.innerHTML = message(`No results found for "${escapeHtml(query)}"`, 'Try different keywords');
        return;
      }
      const allLink = `<a href="${searchPage}?q=${encodeURIComponent(query)}" class="block px-3 py-3 text-sm font-medium text-blue-400 hover:text-blue-300">See all results →</a>`;
      resultsEl.innerHTML = `<div class="p-2">
        ${blog.pages.length ? `<div class="mb-4"><div class="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">${ICONS.file} Blog Posts</div><div class="space-y-1">${blog.pages.map(renderPost).join('')}</div></div>` : ''}
        ${videos.pages.length ? `<div><div class="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">${ICONS.video} Videos</div><div class="space-y-1">${videos.pages.map((page, index) => renderVideo(page, index, blog.pages.length)).join('')}</div></div>` : ''}
        ${allLink}
      </div>`;
    } catch {
      if (current !== token) return;
      lastResultCount = 0;
      resultsEl.innerHTML = message('Search is unavailable right now.', `Try again in a moment, or <a class="underline" href="${searchPage}?q=${encodeURIComponent(query)}">open the search page</a>.`);
      captureEvent('search_error', { search_surface: 'site_modal', content_type: 'site' });
    }
  }

  let closed = false;
  function close(reason) {
    if (closed) return;
    closed = true;
    const query = input.value.trim();
    if (query && !resultClicked) {
      captureEvent('search_abandoned', {
        search_surface: 'site_modal',
        search_query: cleanAnalyticsText(query, 80),
        result_count: lastResultCount,
        close_reason: reason,
        content_type: 'site',
      });
    }
    clearTimeout(timer);
    token += 1;
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('astro:before-swap', onSwap);
    document.body.style.overflow = '';
    overlay.remove();
    onClose?.();
  }

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close('escape');
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      event.stopPropagation();
      close('shortcut');
    }
  };
  const onSwap = () => close('navigation');

  input.addEventListener('input', () => {
    clear.hidden = !input.value;
    clearTimeout(timer);
    timer = setTimeout(runSearch, SETTLE_MS);
  });
  clear.addEventListener('click', () => {
    captureEvent('search_cleared', { search_surface: 'site_modal', content_type: 'site' });
    input.value = '';
    clear.hidden = true;
    runSearch();
    input.focus();
  });
  overlay.querySelector('[data-close]').addEventListener('click', () => close('close_button'));
  overlay.querySelector('[data-backdrop]').addEventListener('click', () => close('backdrop'));
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close('overlay');
    const link = event.target instanceof Element ? event.target.closest('a[data-result-type]') : null;
    if (!link) return;
    resultClicked = true;
    captureEvent('search_result_click', {
      search_surface: 'site_modal',
      search_query: cleanAnalyticsText(input.value, 80),
      content_type: link.dataset.resultType,
      content_slug: link.dataset.resultSlug,
      position: Number(link.dataset.resultPosition),
    });
    // Let the router handle the click first; the modal closes right after.
    setTimeout(() => close('result'), 0);
  });
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('astro:before-swap', onSwap);

  showIdle();
  document.body.style.overflow = 'hidden';
  document.body.append(overlay);
  setTimeout(() => input.focus(), 30);
  // Warm the index while the visitor types.
  loadPagefind().catch(() => {});
}
