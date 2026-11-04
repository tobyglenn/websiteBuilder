// Behaviour for Header.astro: menus, theme, language, scroll state and search.
// Runs once per full page load; per-page wiring re-runs on astro:page-load
// because the ClientRouter swaps in a fresh header on every navigation.
import { captureEvent } from '../lib/analytics.js';

const LOCALE_STORAGE_KEY = 'site-lang';
const LEGACY_LOCALE_STORAGE_KEY = 'preferredLang';
const SUPPORTED_LOCALES = ['en', 'de', 'es', 'pt', 'hi'];

const header = () => document.querySelector('[data-site-header]');
const mobileMenu = () => document.querySelector('[data-mobile-menu]');
const versionOf = (el) => el?.dataset.navigationVersion || '';

function menuOpened(menuName, surface, trigger, itemCount) {
  captureEvent('navigation_menu_opened', {
    menu_name: menuName,
    navigation_surface: surface,
    navigation_trigger: trigger,
    navigation_item_count: itemCount,
    navigation_schema_version: versionOf(header()),
  });
}

// ---- Theme -------------------------------------------------------------------
function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function syncThemeButtons() {
  const label = currentTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
  });
}

function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  const root = document.documentElement;
  root.setAttribute('data-theme', next);
  root.classList.toggle('dark', next === 'dark');
  root.classList.toggle('light', next === 'light');
  try {
    localStorage.setItem('toft-theme', next);
  } catch {}
  syncThemeButtons();
  captureEvent('theme_toggled', { theme: next });
}

// ---- Language ----------------------------------------------------------------
function chooseLanguage(code) {
  const locale = header()?.dataset.locale || 'en';
  captureEvent('language_switch', { previous_language: locale, next_language: code });
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, code);
    localStorage.setItem(LEGACY_LOCALE_STORAGE_KEY, code);
  } catch {}
  const basePath = window.location.pathname.replace(/^\/(en|de|es|pt|hi)(\/|$)/, '/');
  if (/^\/video\/[^/]+\/?$/.test(basePath)) {
    const alternate = document.querySelector(`link[rel="alternate"][hreflang="${code}"]`);
    window.location.href = alternate ? new URL(alternate.href).pathname : code === 'en' ? basePath : `/${code}/videos/`;
    return;
  }
  // Keep translated showcase routes; other guides return to the translated index.
  const translatedProject = /^\/projects\/(?:wild-rebellion|monstrum-world|ironvane-chronicle|lilly)\/?$/.test(basePath);
  const localePath = /^\/projects\/[^/]+\/?$/.test(basePath) && !translatedProject ? '/projects/' : basePath || '/';
  window.location.href = code === 'en' ? basePath || '/' : `/${code}${localePath}`;
}

// ---- Disclosure helpers ------------------------------------------------------
function setOpen(button, panel, open) {
  button.setAttribute('aria-expanded', String(open));
  panel.hidden = !open;
}

function closeDesktopMenus(except) {
  document.querySelectorAll('[data-desktop-menu]').forEach((menu) => {
    if (menu === except) return;
    setOpen(menu.querySelector('[data-desktop-menu-button]'), menu.querySelector('[data-desktop-menu-panel]'), false);
  });
}

const SECTION_BUTTON_CLASS = 'group flex w-full items-center justify-between px-1 py-4 text-left font-semibold text-white';

// The drawer reuses the desktop links, re-labelled for the mobile surface.
function mobileLink(link, position) {
  const copy = link.cloneNode(true);
  copy.dataset.navigationSurface = 'mobile';
  copy.dataset.navigationPosition = String(position);
  return copy;
}

function buildMobileNav(drawer) {
  if (drawer.dataset.built) return;
  const nav = document.querySelector('nav[aria-label="Primary navigation"]');
  if (!nav) return;
  const primary = drawer.querySelector('[data-mobile-primary]');
  [...nav.querySelectorAll(':scope > a[data-navigation-item]')].forEach((link, index) => primary.append(mobileLink(link, index + 1)));
  const sections = drawer.querySelector('[data-mobile-sections]');
  nav.querySelectorAll('[data-desktop-menu]').forEach((menu) => {
    const desktopButton = menu.querySelector('[data-desktop-menu-button]');
    const section = document.createElement('div');
    section.className = 'border-b border-neutral-800';
    section.dataset.mobileSection = menu.dataset.desktopMenu;
    section.dataset.itemCount = menu.dataset.itemCount;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = SECTION_BUTTON_CLASS;
    button.setAttribute('aria-expanded', 'false');
    button.dataset.mobileSectionButton = '';
    button.append(desktopButton.textContent.trim());
    const chevron = desktopButton.querySelector('svg')?.cloneNode(true);
    if (chevron) {
      chevron.setAttribute('width', '18');
      chevron.setAttribute('height', '18');
      button.append(chevron);
    }
    const panel = document.createElement('div');
    panel.className = 'grid gap-1 pb-4 sm:grid-cols-2';
    panel.dataset.mobileSectionPanel = '';
    panel.hidden = true;
    menu.querySelectorAll('a[data-navigation-item]').forEach((link, index) => panel.append(mobileLink(link, index + 1)));
    section.append(button, panel);
    sections.append(section);
  });
  drawer.dataset.built = 'true';
}

function setMobileMenu(open, { track = true } = {}) {
  const drawer = mobileMenu();
  if (open && drawer) buildMobileNav(drawer);
  const toggle = document.querySelector('[data-mobile-menu-open]');
  if (!drawer || !toggle) return;
  const wasOpen = !drawer.hidden;
  drawer.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
  if (open && !wasOpen && track) {
    menuOpened('primary', 'mobile', 'click', Number(header()?.dataset.primaryCount || 0));
  }
  if (open) drawer.querySelector('[data-mobile-menu-close]')?.focus();
  else if (wasOpen) toggle.focus();
}

// ---- Search ------------------------------------------------------------------
let searchModalPromise;
let searchOpen = false;

async function openSearch(trigger) {
  if (searchOpen) return;
  searchOpen = true;
  setMobileMenu(false, { track: false });
  captureEvent('search_opened', { search_surface: 'site_modal', trigger });
  const returnFocus = document.activeElement;
  try {
    searchModalPromise ||= import('./SearchModal.js');
    const { openSearchModal } = await searchModalPromise;
    openSearchModal({
      onClose: () => {
        searchOpen = false;
        if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus();
      },
    });
  } catch (error) {
    searchModalPromise = undefined;
    window.posthog?.captureException?.(error, { search_surface: 'site_modal' });
    captureEvent('search_load_failed', { search_surface: 'site_modal' });
    showSearchUnavailable(() => {
      searchOpen = false;
    });
  }
}

function showSearchUnavailable(onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[100] flex items-start justify-center bg-black/70 pt-20 px-4';
  overlay.innerHTML = `
    <div role="dialog" aria-modal="true" aria-label="Search unavailable" class="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-lg p-6 text-white">
      <p role="alert">Search could not load.</p>
      <div class="mt-4 flex flex-wrap gap-4">
        <a href="/search/" class="underline">Open search page</a>
        <button type="button" data-reload class="underline">Reload</button>
        <button type="button" data-close class="underline">Close search</button>
      </div>
    </div>`;
  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    onClose();
  };
  const onKey = (event) => {
    if (event.key === 'Escape') close();
  };
  overlay.querySelector('[data-reload]').addEventListener('click', () => window.location.reload());
  overlay.querySelector('[data-close]').addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  overlay.querySelector('[data-close]').focus();
}

// ---- Global listeners (attached once) ----------------------------------------
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  if (target.closest('[data-theme-toggle]')) return toggleTheme();
  if (target.closest('[data-search-open]')) return void openSearch('button');
  if (target.closest('[data-mobile-menu-open]')) return setMobileMenu(mobileMenu()?.hidden ?? false);
  if (target.closest('[data-mobile-menu-close]')) return setMobileMenu(false);

  const choice = target.closest('[data-language-choice]');
  if (choice) return chooseLanguage(choice.dataset.languageChoice);

  const languageButton = target.closest('[data-language-button]');
  if (languageButton) {
    const panel = document.querySelector('[data-language-panel]');
    return setOpen(languageButton, panel, panel.hidden);
  }

  const desktopButton = target.closest('[data-desktop-menu-button]');
  if (desktopButton) {
    const menu = desktopButton.closest('[data-desktop-menu]');
    const panel = menu.querySelector('[data-desktop-menu-panel]');
    // Pointer entry already opened the menu; the first click must not undo it.
    if (menu.dataset.openedByHover === 'true' && !panel.hidden && event.detail > 0) {
      menu.dataset.openedByHover = 'false';
      return;
    }
    menu.dataset.openedByHover = 'false';
    const open = panel.hidden;
    closeDesktopMenus(menu);
    setOpen(desktopButton, panel, open);
    if (open) menuOpened(menu.dataset.desktopMenu, 'desktop', 'click', Number(menu.dataset.itemCount));
    return;
  }

  const sectionButton = target.closest('[data-mobile-section-button]');
  if (sectionButton) {
    const section = sectionButton.closest('[data-mobile-section]');
    const panel = section.querySelector('[data-mobile-section-panel]');
    const open = panel.hidden;
    setOpen(sectionButton, panel, open);
    if (open) menuOpened(section.dataset.mobileSection, 'mobile', 'click', Number(section.dataset.itemCount));
    return;
  }

  if (target.closest('[data-nav-close]')) {
    closeDesktopMenus();
    if (!mobileMenu()?.hidden) setMobileMenu(false, { track: false });
  }
});

document.addEventListener('pointerdown', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  closeDesktopMenus(target?.closest('[data-desktop-menu]') || undefined);
  const language = document.querySelector('[data-language-menu]');
  if (language && (!target || !language.contains(target))) {
    const button = language.querySelector('[data-language-button]');
    const panel = language.querySelector('[data-language-panel]');
    if (!panel.hidden) setOpen(button, panel, false);
  }
});

document.addEventListener('keydown', (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (!searchOpen) openSearch('keyboard');
    return;
  }
  if (event.key === '/' && !typing && !searchOpen) {
    event.preventDefault();
    openSearch('keyboard');
    return;
  }
  if (event.key === 'Escape') {
    if (mobileMenu() && !mobileMenu().hidden) setMobileMenu(false);
    closeDesktopMenus();
  }
});

let scrolled = null;
function syncScrolled() {
  const el = header();
  if (!el) return;
  const next = window.scrollY > 20;
  if (next === scrolled && el.dataset.scrollState) return;
  scrolled = next;
  el.dataset.scrollState = next ? 'scrolled' : 'top';
  el.classList.toggle('border-neutral-800', next);
  el.classList.toggle('bg-neutral-950/95', next);
  el.classList.toggle('backdrop-blur-md', next);
  el.classList.toggle('border-transparent', !next);
  el.classList.toggle('bg-neutral-950/75', !next);
  el.classList.toggle('backdrop-blur-sm', !next);
}
window.addEventListener('scroll', syncScrolled, { passive: true });

// ---- Per-page wiring -----------------------------------------------------------
function setupHeader() {
  const el = header();
  if (!el || el.dataset.headerReady) return;
  scrolled = null;
  syncScrolled();
  syncThemeButtons();
  document.body.style.overflow = '';

  el.querySelectorAll('[data-desktop-menu]').forEach((menu) => {
    const button = menu.querySelector('[data-desktop-menu-button]');
    const panel = menu.querySelector('[data-desktop-menu-panel]');
    menu.addEventListener('mouseenter', () => {
      if (!panel.hidden) return;
      menu.dataset.openedByHover = 'true';
      closeDesktopMenus(menu);
      setOpen(button, panel, true);
      menuOpened(menu.dataset.desktopMenu, 'desktop', 'hover', Number(menu.dataset.itemCount));
    });
    menu.addEventListener('mouseleave', () => setOpen(button, panel, false));
  });

  const locale = el.dataset.locale || 'en';
  let storedLocale = null;
  try {
    storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) || localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY);
  } catch {}
  if (window.location.pathname === '/' && storedLocale && storedLocale !== 'en' && SUPPORTED_LOCALES.includes(storedLocale)) {
    window.location.replace(`/${storedLocale}/`);
    return;
  }

  captureEvent('navigation_header_viewed', {
    navigation_surface: window.matchMedia('(min-width: 1280px)').matches ? 'desktop' : 'mobile',
    navigation_schema_version: versionOf(el),
    navigation_top_level_items: 7,
    navigation_menu_groups: 3,
    navigation_language: locale,
    navigation_test_id: el.dataset.navigationTestId || '',
    navigation_test_variant: el.dataset.navigationTestVariant || '',
  });
  el.dataset.headerReady = 'true';
}

setupHeader();
document.addEventListener('astro:page-load', setupHeader);
