import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Calculator,
  ChevronDown,
  Cpu,
  Dumbbell,
  FileText,
  Footprints,
  Globe,
  HeartPulse,
  Menu,
  Mic2,
  PackageSearch,
  PlaySquare,
  Scale,
  Shield,
  Trophy,
  User,
  Watch,
  X,
} from 'lucide-react';
import Search from './Search.jsx';
import { captureEvent } from '../lib/analytics.js';

const LOCALE_STORAGE_KEY = 'site-lang';
const LEGACY_LOCALE_STORAGE_KEY = 'preferredLang';
const SUPPORTED_LOCALES = ['en', 'de', 'es', 'pt', 'hi'];
const LOCALE_LABELS = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  hi: 'हिन्दी',
};

const NAV_TRANSLATIONS = {
  en: {
    reviews: 'Reviews', training: 'Training Data', articles: 'Articles', videos: 'Videos', podcasts: 'Podcasts', about: 'About',
    speediance: 'Speediance', wearables: 'Wearables', gear: 'Gear', compare: 'Compare Trackers', calculators: 'Calculators',
    trainingOverview: 'Training Overview', running: 'Running', recovery: 'Recovery', transformation: 'Transformation', bjj: 'BJJ', prs: 'PR Board',
    agentstack: 'AgentStack', fitnessPodcast: 'Fitness Tech Podcast', allPodcasts: 'All Podcasts', startHere: 'Start Here',
  },
  de: {
    reviews: 'Tests', training: 'Trainingsdaten', articles: 'Artikel', videos: 'Videos', podcasts: 'Podcasts', about: 'Über mich',
    speediance: 'Speediance', wearables: 'Wearables', gear: 'Ausrüstung', compare: 'Tracker vergleichen', calculators: 'Rechner',
    trainingOverview: 'Training', running: 'Laufen', recovery: 'Erholung', transformation: 'Transformation', bjj: 'BJJ', prs: 'PR-Tafel',
    agentstack: 'AgentStack', fitnessPodcast: 'Fitness-Tech-Podcast', allPodcasts: 'Alle Podcasts', startHere: 'Hier starten',
  },
  es: {
    reviews: 'Reseñas', training: 'Datos de entrenamiento', articles: 'Artículos', videos: 'Videos', podcasts: 'Podcasts', about: 'Acerca de',
    speediance: 'Speediance', wearables: 'Wearables', gear: 'Equipo', compare: 'Comparar trackers', calculators: 'Calculadoras',
    trainingOverview: 'Entrenamiento', running: 'Running', recovery: 'Recuperación', transformation: 'Transformación', bjj: 'BJJ', prs: 'Tabla PR',
    agentstack: 'AgentStack', fitnessPodcast: 'Podcast Fitness Tech', allPodcasts: 'Todos los podcasts', startHere: 'Empieza aquí',
  },
  pt: {
    reviews: 'Análises', training: 'Dados de treino', articles: 'Artigos', videos: 'Vídeos', podcasts: 'Podcasts', about: 'Sobre',
    speediance: 'Speediance', wearables: 'Wearables', gear: 'Equipamento', compare: 'Comparar trackers', calculators: 'Calculadoras',
    trainingOverview: 'Treino', running: 'Corrida', recovery: 'Recuperação', transformation: 'Transformação', bjj: 'BJJ', prs: 'Quadro de PR',
    agentstack: 'AgentStack', fitnessPodcast: 'Podcast Fitness Tech', allPodcasts: 'Todos os podcasts', startHere: 'Comece aqui',
  },
  hi: {
    reviews: 'समीक्षाएँ', training: 'ट्रेनिंग डेटा', articles: 'लेख', videos: 'वीडियो', podcasts: 'पॉडकास्ट', about: 'परिचय',
    speediance: 'Speediance', wearables: 'वेयरेबल्स', gear: 'गियर', compare: 'ट्रैकर तुलना', calculators: 'कैलकुलेटर',
    trainingOverview: 'ट्रेनिंग', running: 'दौड़', recovery: 'रिकवरी', transformation: 'परिवर्तन', bjj: 'BJJ', prs: 'PR बोर्ड',
    agentstack: 'AgentStack', fitnessPodcast: 'फिटनेस टेक पॉडकास्ट', allPodcasts: 'सभी पॉडकास्ट', startHere: 'यहाँ से शुरू करें',
  },
};

const getLocaleFromPath = (path = '') => path.match(/^\/(es|pt|hi|de)(?:\/|$)/)?.[1] || 'en';
const localePrefix = (locale) => (locale === 'en' ? '' : `/${locale}`);
const localizedHref = (locale, href) => {
  if (!href.startsWith('/') || locale === 'en') return href;
  return href === '/' ? `/${locale}/` : `/${locale}${href}`;
};

function NavAnchor({ item, pathname, surface = 'desktop', onNavigate }) {
  const Icon = item.icon;
  const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

  return (
    <a
      href={item.href}
      onClick={onNavigate}
      data-analytics-event="navigation_click"
      data-analytics-content-type="navigation"
      data-analytics-content-slug={item.href}
      data-analytics-content-title={`${surface}:${item.name}`}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
      }`}
    >
      {Icon && <Icon size={16} aria-hidden="true" />}
      <span>{item.name}</span>
    </a>
  );
}

function DesktopMenu({ label, items, pathname, menuName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const toggle = () => {
    setOpen((current) => !current);
    if (!open) {
      captureEvent('navigation_menu_opened', { menu_name: menuName, navigation_surface: 'desktop' });
    }
  };

  return (
    <div className="relative" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1 rounded-md px-2 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white"
        aria-expanded={open}
      >
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-[200] w-72 -translate-x-1/2 pt-2">
          <div className="grid gap-1 rounded-lg border border-neutral-800 bg-neutral-950 p-2 shadow-2xl shadow-black/50">
            {items.map((item) => (
              <NavAnchor key={item.href} item={item} pathname={pathname} onNavigate={() => setOpen(false)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileSection({ label, items, pathname, menuName, onNavigate }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-neutral-800">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          if (!open) captureEvent('navigation_menu_opened', { menu_name: menuName, navigation_surface: 'mobile' });
        }}
        className="flex w-full items-center justify-between px-1 py-4 text-left font-semibold text-white"
        aria-expanded={open}
      >
        {label}
        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="grid gap-1 pb-4 sm:grid-cols-2">
          {items.map((item) => (
            <NavAnchor key={item.href} item={item} pathname={pathname} surface="mobile" onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pathname, setPathname] = useState('');
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    setPathname(window.location.pathname);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (languageRef.current && !languageRef.current.contains(event.target)) setIsLanguageOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY) || window.localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY);
    if (window.location.pathname === '/' && storedLocale && storedLocale !== 'en' && SUPPORTED_LOCALES.includes(storedLocale)) {
      window.location.replace(`/${storedLocale}/`);
    }
  }, []);

  const locale = getLocaleFromPath(pathname);
  const t = NAV_TRANSLATIONS[locale] || NAV_TRANSLATIONS.en;
  const podcastBase = localePrefix(locale);

  const reviewItems = useMemo(() => [
    { name: t.speediance, href: localizedHref(locale, '/speediance/'), icon: Dumbbell },
    { name: t.wearables, href: '/wearables/', icon: Watch },
    { name: t.gear, href: localizedHref(locale, '/gear/'), icon: PackageSearch },
    { name: t.compare, href: localizedHref(locale, '/compare-trackers/'), icon: Scale },
    { name: t.calculators, href: localizedHref(locale, '/calculators/'), icon: Calculator },
  ], [locale, t]);

  const trainingItems = useMemo(() => [
    { name: t.trainingOverview, href: localizedHref(locale, '/training/'), icon: Activity },
    { name: t.running, href: localizedHref(locale, '/running/'), icon: Footprints },
    { name: t.recovery, href: localizedHref(locale, '/whoop/'), icon: HeartPulse },
    { name: t.transformation, href: localizedHref(locale, '/transformation/'), icon: Trophy },
    { name: t.bjj, href: localizedHref(locale, '/bjj/'), icon: Shield },
    { name: t.prs, href: localizedHref(locale, '/prs/'), icon: BarChart3 },
  ], [locale, t]);

  const podcastItems = useMemo(() => [
    { name: t.agentstack, href: `${podcastBase}/podcasts/agentstack/`, icon: Cpu },
    { name: t.fitnessPodcast, href: `${podcastBase}/podcasts/fitness-tech/`, icon: Mic2 },
    { name: t.allPodcasts, href: `${podcastBase}/podcasts/`, icon: Mic2 },
  ], [podcastBase, t]);

  const primaryItems = useMemo(() => [
    { name: t.articles, href: localizedHref(locale, '/blog/'), icon: FileText },
    { name: t.videos, href: localizedHref(locale, '/videos/'), icon: PlaySquare },
    { name: t.agentstack, href: '/agentstack/', icon: Cpu },
    { name: t.about, href: localizedHref(locale, '/about/'), icon: User },
  ], [locale, t]);

  const handleLanguageChoice = (code) => {
    captureEvent('language_switch', { previous_language: locale, next_language: code });
    window.localStorage.setItem(LOCALE_STORAGE_KEY, code);
    window.localStorage.setItem(LEGACY_LOCALE_STORAGE_KEY, code);
    const basePath = window.location.pathname.replace(/^\/(en|de|es|pt|hi)(\/|$)/, '/');
    window.location.href = code === 'en' ? basePath || '/' : `/${code}${basePath || '/'}`;
  };

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 border-b transition-colors ${isScrolled ? 'border-neutral-800 bg-neutral-950/95 backdrop-blur-md' : 'border-transparent bg-neutral-950/75 backdrop-blur-sm'}`}>
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a
            href={localizedHref(locale, '/')}
            className="shrink-0 text-lg font-bold text-white transition-colors hover:text-blue-400"
            data-analytics-event="navigation_click"
            data-analytics-content-type="navigation"
            data-analytics-content-slug="/"
            data-analytics-content-title="brand"
          >
            TobyOnFitnessTech
          </a>

          <nav className="mx-4 hidden min-w-0 items-center gap-1 xl:flex" aria-label="Primary navigation">
            <DesktopMenu label={t.reviews} items={reviewItems} pathname={pathname} menuName="reviews" />
            <DesktopMenu label={t.training} items={trainingItems} pathname={pathname} menuName="training" />
            <NavAnchor item={primaryItems[0]} pathname={pathname} />
            <NavAnchor item={primaryItems[1]} pathname={pathname} />
            <DesktopMenu label={t.podcasts} items={podcastItems} pathname={pathname} menuName="podcasts" />
            <NavAnchor item={primaryItems[2]} pathname={pathname} />
            <NavAnchor item={primaryItems[3]} pathname={pathname} />
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <div className="relative" ref={languageRef}>
              <button
                type="button"
                onClick={() => setIsLanguageOpen((current) => !current)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white"
                aria-label="Choose language"
                title="Choose language"
              >
                <Globe size={17} />
              </button>
              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-neutral-800 bg-neutral-950 p-2 shadow-2xl shadow-black/50">
                  {SUPPORTED_LOCALES.map((code) => (
                    <button
                      type="button"
                      key={code}
                      onClick={() => handleLanguageChoice(code)}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm ${locale === code ? 'bg-blue-600 text-white' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'}`}
                    >
                      {LOCALE_LABELS[code]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Search />
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-neutral-300 hover:bg-neutral-900 hover:text-white xl:hidden"
            onClick={() => {
              setIsMenuOpen((current) => !current);
              if (!isMenuOpen) captureEvent('navigation_menu_opened', { menu_name: 'primary', navigation_surface: 'mobile' });
            }}
            aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-neutral-950 xl:hidden">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col px-5 pb-8 pt-5">
            <div className="mb-6 flex items-center justify-between">
              <a href={localizedHref(locale, '/')} className="text-lg font-bold text-white">TobyOnFitnessTech</a>
              <button type="button" onClick={() => setIsMenuOpen(false)} className="rounded-md p-2 text-neutral-300 hover:bg-neutral-900 hover:text-white" aria-label="Close navigation">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 border-y border-neutral-800 py-3 sm:grid-cols-4">
              {primaryItems.map((item) => (
                <NavAnchor key={item.href} item={item} pathname={pathname} surface="mobile" onNavigate={() => setIsMenuOpen(false)} />
              ))}
            </div>

            <MobileSection label={t.reviews} items={reviewItems} pathname={pathname} menuName="reviews" onNavigate={() => setIsMenuOpen(false)} />
            <MobileSection label={t.training} items={trainingItems} pathname={pathname} menuName="training" onNavigate={() => setIsMenuOpen(false)} />
            <MobileSection label={t.podcasts} items={podcastItems} pathname={pathname} menuName="podcasts" onNavigate={() => setIsMenuOpen(false)} />

            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-300"><Globe size={16} /> Language</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {SUPPORTED_LOCALES.map((code) => (
                  <button
                    type="button"
                    key={code}
                    onClick={() => handleLanguageChoice(code)}
                    className={`rounded-md px-3 py-2 text-sm ${locale === code ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-300 hover:text-white'}`}
                  >
                    {LOCALE_LABELS[code]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-8"><Search /></div>
          </div>
        </div>
      )}
    </>
  );
}
