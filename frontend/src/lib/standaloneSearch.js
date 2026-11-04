// Client logic for the /search/ pages (all locales).
//
// The catalog comes from /search-index.json, the same cached file the header
// search modal uses, so the page HTML stays small. Article bodies are matched
// through the Pagefind index built at deploy time, which loads only the small
// chunks a query needs. If Pagefind is unavailable (dev server, blocked fetch),
// articles still match on title, excerpt, category and tags.

const PAGEFIND_RESULT_LIMIT = 40;

let searchIndexPromise;
function loadSearchIndex() {
  searchIndexPromise ||= fetch('/search-index.json').then((response) => {
    if (!response.ok) throw new Error(`Search index failed with ${response.status}`);
    return response.json();
  });
  searchIndexPromise.catch(() => {
    searchIndexPromise = undefined;
  });
  return searchIndexPromise;
}

let pagefindPromise;
function loadPagefind() {
  // A variable keeps bundlers from trying to resolve the deploy-time file.
  const pagefindUrl = '/pagefind/pagefind.js';
  pagefindPromise ||= import(/* @vite-ignore */ pagefindUrl).catch(() => null);
  return pagefindPromise;
}

async function pagefindBlogSlugs(query) {
  try {
    const pagefind = await loadPagefind();
    if (!pagefind) return new Set();
    const search = await pagefind.search(query);
    const pages = await Promise.all(
      (search?.results || [])
        .filter((result) => !Array.isArray(result.words) || result.words.length > 0)
        .slice(0, PAGEFIND_RESULT_LIMIT)
        .map((result) => result.data()),
    );
    const slugs = pages
      .map((page) => page?.url?.match(/^\/(?:(?:de|es|pt|hi)\/)?blog\/([^/?#]+)\/?/)?.[1])
      .filter(Boolean)
      .map((slug) => decodeURIComponent(slug));
    return new Set(slugs);
  } catch {
    return new Set();
  }
}

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);

function formatTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
}

function captureSearch(event, properties) {
  const payload = {
    search_surface: 'standalone_page',
    $current_url: `${location.origin}${location.pathname}`,
    ...properties,
  };
  if (window.toftAnalytics) window.toftAnalytics.capture(event, payload);
  else (window.__TOFT_ANALYTICS_QUEUE__ ||= []).push([event, payload]);
}

function renderVideo(video) {
  const published = video.published_at ? new Date(video.published_at).toLocaleDateString() : '';
  return `<a href="/video/${encodeURIComponent(video.id)}/" class="flex gap-4 group bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/50 hover:border-neutral-700 hover:bg-neutral-900 transition-all">
    <div class="relative w-40 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-neutral-800">
      <img src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" decoding="async" />
    </div>
    <div class="flex-1 min-w-0">
      <h3 class="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">${escapeHtml(video.title)}</h3>
      <p class="text-sm text-neutral-400 line-clamp-2 mb-2">${escapeHtml(video.description)}</p>
      <span class="text-xs text-neutral-500">${escapeHtml(published)}</span>
    </div>
  </a>`;
}

function renderPost(post, readLabel) {
  return `<a href="/blog/${encodeURIComponent(post.slug)}/" class="flex gap-4 group bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/50 hover:border-neutral-700 hover:bg-neutral-900 transition-all">
    <div class="flex-1">
      <span class="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1 block">${escapeHtml(post.category)}</span>
      <h3 class="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">${escapeHtml(post.title)}</h3>
      <p class="text-sm text-neutral-400 line-clamp-2 mb-3">${escapeHtml(post.excerpt)}</p>
      <span class="text-xs text-neutral-500">${escapeHtml(readLabel)}</span>
    </div>
  </a>`;
}

function mountStandaloneSearch() {
  const form = document.getElementById('standalone-search-form');
  if (!(form instanceof HTMLFormElement) || form.dataset.searchReady) return;
  form.dataset.searchReady = 'true';

  const copy = {
    prompt: form.dataset.copyPrompt || '',
    loading: form.dataset.copyLoading || '',
    found: form.dataset.copyFound || '{total}',
    failed: form.dataset.copyFailed || '',
    read: form.dataset.copyRead || '',
  };
  const input = document.getElementById('standalone-query');
  const summary = document.getElementById('search-summary');
  const noResults = document.getElementById('no-results');
  const videoSection = document.getElementById('video-results-section');
  const blogSection = document.getElementById('blog-results-section');
  const videoResults = document.getElementById('video-results');
  const blogResults = document.getElementById('blog-results');
  const resultsGrid = document.getElementById('results-grid');

  let lastSearchKey = '';
  let renderToken = 0;

  const hideAll = () => {
    noResults.classList.add('hidden');
    videoSection.classList.add('hidden');
    blogSection.classList.add('hidden');
  };

  async function renderResults() {
    const token = ++renderToken;
    const q = new URLSearchParams(window.location.search).get('q') || '';
    input.value = q;

    if (!q.trim()) {
      lastSearchKey = '';
      summary.textContent = copy.prompt;
      hideAll();
      return;
    }

    // URL search terms are untrusted text, never HTML.
    summary.textContent = copy.loading;
    const lower = q.toLowerCase().trim();

    let index;
    let contentSlugs;
    try {
      [index, contentSlugs] = await Promise.all([loadSearchIndex(), pagefindBlogSlugs(q)]);
    } catch {
      if (token !== renderToken) return;
      summary.textContent = copy.failed;
      hideAll();
      return;
    }
    if (token !== renderToken) return;

    const videos = (index.videos || []).filter((video) => video.searchText?.includes(lower));
    const blog = (index.blogPosts || []).filter(
      (post) => post.searchText?.includes(lower) || contentSlugs.has(post.slug),
    );
    const total = videos.length + blog.length;

    summary.textContent = formatTemplate(copy.found, { total, q });

    const searchKey = JSON.stringify([q, total]);
    if (searchKey !== lastSearchKey) {
      lastSearchKey = searchKey;
      const properties = {
        search_query_length: q.trim().length,
        result_count: total,
        blog_result_count: blog.length,
        video_result_count: videos.length,
      };
      captureSearch('search_performed', properties);
      if (total === 0) captureSearch('search_no_results', properties);
    }

    if (total === 0) {
      hideAll();
      noResults.classList.remove('hidden');
      return;
    }

    noResults.classList.add('hidden');
    videoSection.classList.toggle('hidden', videos.length === 0);
    videoResults.innerHTML = videos.map(renderVideo).join('');
    blogSection.classList.toggle('hidden', blog.length === 0);
    blogResults.innerHTML = blog.map((post) => renderPost(post, copy.read)).join('');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const url = new URL(location.href);
    const query = input.value.trim();
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    renderResults();
  });

  resultsGrid.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    const section = link?.closest('#video-results, #blog-results');
    if (!section) return;
    captureSearch('search_result_click', {
      content_type: section.id === 'video-results' ? 'video' : 'blog',
      content_slug: new URL(link.href).pathname,
      position: [...section.querySelectorAll('a')].indexOf(link) + 1,
      search_query_length: (new URLSearchParams(location.search).get('q') || '').trim().length,
    });
  });

  window.addEventListener('popstate', renderResults);
  document.addEventListener(
    'astro:before-swap',
    () => window.removeEventListener('popstate', renderResults),
    { once: true },
  );

  renderResults();
}

mountStandaloneSearch();
document.addEventListener('astro:page-load', mountStandaloneSearch);
