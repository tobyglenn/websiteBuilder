import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Menu, X, ChevronDown, Globe } from 'lucide-react';
import Search from './Search.jsx';

const SUPPORTED_LOCALES = ['en', 'de', 'es', 'pt', 'hi'];
const LOCALE_LABELS = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  hi: 'हिन्दी',
};
const LOCALE_FLAGS = { en: '🇺🇸', de: '🇩🇪', es: '🇪🇸', pt: '🇧🇷', hi: '🇮🇳' };

const NAV_TRANSLATIONS = {
  en: {
    home: 'Home', videos: 'Videos', blog: 'Blog & Articles', games: 'Games & Apps', about: 'About', faq: 'FAQ',
    startHere: 'Start Here', allArticles: 'All Articles', nutrition: 'Nutrition', consistency: 'Consistency', exercises: 'Exercises',
    transformation: 'Transformation', prBoard: 'PR Board', running: 'Running', heartRate: 'Heart Rate', races: 'Races', speediance: 'Speediance',
    sleep: 'Sleep', whoop: 'WHOOP', training: 'Training', trainingLog: 'Training Log', bjj: 'BJJ', dayInWeek: 'Day in a Week', yearReview: 'Year Review',
    gear: 'Gear', contact: 'Contact', hrZones: 'HR Zones', podcasts: '🎙️ Podcasts', openclaw: '🎙️ OpenClaw Daily', fitness: '💪 Fitness Tech Podcast',
  },
  de: {
    home: 'Startseite', videos: 'Videos', blog: 'Blog & Artikel', games: 'Spiele & Apps', about: 'Über', faq: 'FAQ',
    startHere: 'Hier starten', allArticles: 'Alle Artikel', nutrition: 'Ernährung', consistency: 'Konstanz', exercises: 'Übungen',
    transformation: 'Transformation', prBoard: 'PR-Tafel', running: 'Laufen', heartRate: 'Herzfrequenz', races: 'Rennen', speediance: 'Speediance',
    sleep: 'Schlaf', whoop: 'WHOOP', training: 'Training', trainingLog: 'Trainingsprotokoll', bjj: 'BJJ', dayInWeek: 'Ein Tag in der Woche', yearReview: 'Jahresrückblick',
    gear: 'Ausrüstung', contact: 'Kontakt', hrZones: 'HF-Zonen', podcasts: '🎙️ Podcasts', openclaw: '🎙️ OpenClaw Podcast', fitness: '💪 Fitness-Tech-Podcast',
  },
  es: {
    home: 'Inicio', videos: 'Videos', blog: 'Blog y Artículos', games: 'Juegos y Apps', about: 'Acerca de', faq: 'Preguntas frecuentes',
    startHere: 'Empieza aquí', allArticles: 'Todos los artículos', nutrition: 'Nutrición', consistency: 'Constancia', exercises: 'Ejercicios',
    transformation: 'Transformación', prBoard: 'Tabla PR', running: 'Running', heartRate: 'Frecuencia cardiaca', races: 'Carreras', speediance: 'Speediance',
    sleep: 'Sueño', whoop: 'WHOOP', training: 'Entrenamiento', trainingLog: 'Registro de entrenamiento', bjj: 'BJJ', dayInWeek: 'Un día en la semana', yearReview: 'Resumen del año',
    gear: 'Equipo', contact: 'Contacto', hrZones: 'Zonas FC', podcasts: '🎙️ Podcasts', openclaw: '🎙️ Podcast OpenClaw', fitness: '💪 Podcast Fitness Tech',
  },
  pt: {
    home: 'Início', videos: 'Vídeos', blog: 'Blog e Artigos', games: 'Jogos e Apps', about: 'Sobre', faq: 'FAQ',
    startHere: 'Comece aqui', allArticles: 'Todos os artigos', nutrition: 'Nutrição', consistency: 'Consistência', exercises: 'Exercícios',
    transformation: 'Transformação', prBoard: 'Quadro de PR', running: 'Corrida', heartRate: 'Frequência cardíaca', races: 'Provas', speediance: 'Speediance',
    sleep: 'Sono', whoop: 'WHOOP', training: 'Treino', trainingLog: 'Log de treino', bjj: 'BJJ', dayInWeek: 'Um dia na semana', yearReview: 'Resumo do ano',
    gear: 'Equipamento', contact: 'Contato', hrZones: 'Zonas FC', podcasts: '🎙️ Podcasts', openclaw: '🎙️ Podcast OpenClaw', fitness: '💪 Podcast Fitness Tech',
  },
  hi: {
    home: 'होम', videos: 'वीडियो', blog: 'ब्लॉग और लेख', games: 'गेम्स और ऐप्स', about: 'परिचय', faq: 'FAQ',
    startHere: 'यहाँ से शुरू करें', allArticles: 'सभी लेख', nutrition: 'पोषण', consistency: 'नियमितता', exercises: 'व्यायाम',
    transformation: 'परिवर्तन', prBoard: 'PR बोर्ड', running: 'दौड़', heartRate: 'हार्ट रेट', races: 'रेस', speediance: 'स्पीडियन्स',
    sleep: 'नींद', whoop: 'WHOOP', training: 'ट्रेनिंग', trainingLog: 'ट्रेनिंग लॉग', bjj: 'BJJ', dayInWeek: 'सप्ताह का एक दिन', yearReview: 'साल का रिव्यू',
    gear: 'गियर', contact: 'संपर्क', hrZones: 'HR ज़ोन', podcasts: '🎙️ पॉडकास्ट', openclaw: '🎙️ OpenClaw पॉडकास्ट', fitness: '💪 फिटनेस टेक पॉडकास्ट',
  },
};

const getLocaleFromPath = (path = '') => path.match(/^\/(es|pt|hi|de)(?:\/|$)/)?.[1] || 'en';
const localePrefix = (locale) => (locale === 'en' ? '' : `/${locale}`);
const localizedHref = (locale, href) => {
  if (!href.startsWith('/')) return href;
  if (locale === 'en') return href;
  return href === '/' ? `/${locale}/` : `/${locale}${href}`;
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pathname, setPathname] = useState('');
  const [isBlogDropdownOpen, setIsBlogDropdownOpen] = useState(false);
  const [isPodcastDropdownOpen, setIsPodcastDropdownOpen] = useState(false);
  const [isDesktopBlogOpen, setIsDesktopBlogOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const blogDropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    setPathname(window.location.pathname);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (blogDropdownRef.current && !blogDropdownRef.current.contains(e.target)) setIsDesktopBlogOpen(false);
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(e.target)) setIsLanguageOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname;
    const storedLocale = window.localStorage.getItem('site-lang');
    if (currentPath === '/' && storedLocale && storedLocale !== 'en' && SUPPORTED_LOCALES.includes(storedLocale)) {
      window.location.replace(`/${storedLocale}/`);
    }
  }, []);

  const locale = getLocaleFromPath(pathname);
  const t = NAV_TRANSLATIONS[locale] || NAV_TRANSLATIONS.en;
  const podcastBase = localePrefix(locale);

  const navLinks = useMemo(() => ([
    { name: t.home, href: localizedHref(locale, '/'), icon: '🏠' },
    { name: t.videos, href: localizedHref(locale, '/videos/'), icon: '🎬' },
    { name: t.blog, href: localizedHref(locale, '/blog/'), hasDropdown: true, icon: '📝' },
    { name: t.openclaw, href: `${podcastBase}/podcasts/openclaw/`, icon: '🤖' },
    { name: t.fitness, href: `${podcastBase}/podcasts/fitness-tech/`, icon: '💪' },
    { name: t.games, href: localizedHref(locale, '/games/'), icon: '🎮' },
    { name: t.about, href: localizedHref(locale, '/about/'), icon: '👤' },
    { name: t.faq, href: localizedHref(locale, '/faq/'), icon: '❓' },
  ]), [locale]);

  const subNavItems = useMemo(() => ([
    { name: t.startHere, href: localizedHref(locale, '/start-here/'), icon: '🚀' },
    { name: t.allArticles, href: localizedHref(locale, '/blog/'), icon: '📰' },
    { name: t.nutrition, href: localizedHref(locale, '/nutrition/'), icon: '🥗' },
    { name: t.consistency, href: localizedHref(locale, '/blog/consistency/'), icon: '📅' },
    { name: t.exercises, href: localizedHref(locale, '/blog/exercises/'), icon: '💪' },
    { name: t.transformation, href: localizedHref(locale, '/transformation/'), icon: '🏆' },
    { name: t.prBoard, href: localizedHref(locale, '/prs/'), icon: '🥇' },
    { name: t.running, href: localizedHref(locale, '/running/'), icon: '⏱' },
    { name: t.heartRate, href: localizedHref(locale, '/heart-rate/'), icon: '💓' },
    { name: t.races, href: localizedHref(locale, '/races/'), icon: '🏃' },
    { name: t.speediance, href: localizedHref(locale, '/speediance/'), icon: '💪' },
    { name: t.sleep, href: localizedHref(locale, '/sleep/'), icon: '😴' },
    { name: t.whoop, href: localizedHref(locale, '/whoop/'), icon: '💓' },
    { name: t.training, href: localizedHref(locale, '/training/'), icon: '🏋️' },
    { name: t.trainingLog, href: localizedHref(locale, '/training-log/'), icon: '📈' },
    { name: t.bjj, href: localizedHref(locale, '/bjj/'), icon: '🥋' },
    { name: t.dayInWeek, href: localizedHref(locale, '/day/'), icon: '📅' },
    { name: t.yearReview, href: localizedHref(locale, '/year-in-review/'), icon: '📊' },
    { name: t.gear, href: localizedHref(locale, '/gear/'), icon: '🛠' },
    { name: t.contact, href: localizedHref(locale, '/contact/'), icon: '📧' },
    { name: t.hrZones, href: localizedHref(locale, '/hr-zones/'), icon: '📊' },
  ]), [locale]);

  const languageLinks = SUPPORTED_LOCALES.map((code) => ({
    code,
    label: LOCALE_LABELS[code],
    flag: LOCALE_FLAGS[code],
    href: code === 'en' ? '/' : `/${code}/`,
  }));

  const handleLanguageChoice = (code) => {
    if (typeof window !== 'undefined') window.localStorage.setItem('site-lang', code);
    window.location.href = code === 'en' ? '/' : `/${code}/`;
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <a href={localizedHref(locale, '/')} className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity shrink-0">
            TobyOnFitnessTech
          </a>

          <nav className="hidden lg:flex items-center gap-3 xl:gap-5 mx-4 min-w-0 overflow-x-auto">
            {navLinks.map((link) => link.hasDropdown ? (
              <div key={link.name} className="relative" ref={blogDropdownRef} onMouseEnter={() => setIsDesktopBlogOpen(true)} onMouseLeave={() => setIsDesktopBlogOpen(false)}>
                <button onClick={() => setIsDesktopBlogOpen((o) => !o)} className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/') ? 'text-white border-b border-blue-500 pb-0.5' : 'text-neutral-300 hover:text-white'}`}>
                  {link.icon && <span>{link.icon}</span>}
                  {link.name}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isDesktopBlogOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDesktopBlogOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-80 z-[200] pt-2">
                    <div className="grid grid-cols-2 gap-1.5 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl shadow-black/40">
                      {subNavItems.map((subLink) => (
                        <a key={subLink.href} href={subLink.href} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${pathname === subLink.href || (pathname.startsWith(subLink.href) && subLink.href !== '/') ? 'bg-blue-500/20 text-blue-400' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
                          <span>{subLink.icon}</span><span>{subLink.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a key={link.name} href={link.href} className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href)) ? 'text-white border-b border-blue-500 pb-0.5' : 'text-neutral-300 hover:text-white'}`}>
                {link.icon && <span>{link.icon}</span>}
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <div className="relative" ref={languageDropdownRef}>
              <button onClick={() => setIsLanguageOpen((o) => !o)} className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/90 px-3 py-2 text-sm text-neutral-200 hover:text-white hover:border-neutral-700 transition-colors" aria-label="Choose language">
                <span>🌐</span>
                <span>{LOCALE_FLAGS[locale]}</span>
                <ChevronDown size={14} className={`transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-neutral-800 bg-neutral-900 p-2 shadow-xl shadow-black/40">
                  {languageLinks.map((item) => (
                    <button key={item.code} onClick={() => handleLanguageChoice(item.code)} className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${locale === item.code ? 'bg-blue-500/20 text-blue-400' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'}`}>
                      <span className="inline-flex items-center gap-2">
                        <span>{item.flag}</span>
                        <span>{item.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Search />
          </div>

          <button className="lg:hidden text-neutral-300 hover:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-neutral-950 overflow-y-auto">
          <div className="flex flex-col min-h-full p-6">
            <div className="flex justify-between items-center mb-8">
              <a href={localizedHref(locale, '/')} className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">TobyOnFitnessTech</a>
              <button onClick={() => setIsMenuOpen(false)} className="text-neutral-300 hover:text-white p-2"><X size={24} /></button>
            </div>

            <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-200 mb-3"><Globe size={16} /> {LOCALE_LABELS[locale]}</div>
              <div className="grid grid-cols-2 gap-2">
                {languageLinks.map((item) => (
                  <button key={item.code} onClick={() => handleLanguageChoice(item.code)} className={`rounded-xl px-3 py-2 text-sm text-left transition-colors ${locale === item.code ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-800 text-neutral-300 hover:text-white'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <nav className="flex flex-col space-y-1 mb-6">
              {[
                { name: t.home, href: localizedHref(locale, '/'), icon: '🏠' },
                { name: t.videos, href: localizedHref(locale, '/videos/'), icon: '🎬' },
                { name: t.games, href: localizedHref(locale, '/games/'), icon: '🎮' },
                { name: t.about, href: localizedHref(locale, '/about/'), icon: '👤' },
                { name: t.faq, href: localizedHref(locale, '/faq/'), icon: '❓' },
              ].map((link) => (
                <a key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-lg font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors">
                  {link.icon && <span>{link.icon}</span>}
                  {link.name}
                </a>
              ))}
            </nav>

            <div className="mb-3 border border-neutral-800 rounded-xl overflow-hidden">
              <button onClick={() => setIsBlogDropdownOpen(!isBlogDropdownOpen)} className="w-full flex justify-between items-center px-4 py-3 text-neutral-200 hover:bg-neutral-800 transition-colors">
                <span className="flex items-center gap-2 font-medium">📝 {t.blog}</span>
                <ChevronDown size={18} className={`transition-transform duration-200 ${isBlogDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isBlogDropdownOpen && (
                <div className="border-t border-neutral-800 px-4 py-3 grid grid-cols-2 gap-2">
                  {subNavItems.map((sub) => (
                    <a key={sub.href} href={sub.href} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
                      <span>{sub.icon}</span><span>{sub.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-neutral-800 rounded-xl overflow-hidden">
              <button onClick={() => setIsPodcastDropdownOpen(!isPodcastDropdownOpen)} className="w-full flex justify-between items-center px-4 py-3 text-neutral-200 hover:bg-neutral-800 transition-colors">
                <span className="flex items-center gap-2 font-medium">{t.podcasts}</span>
                <ChevronDown size={18} className={`transition-transform duration-200 ${isPodcastDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isPodcastDropdownOpen && (
                <div className="border-t border-neutral-800 px-4 py-3 space-y-2">
                  <a href={`${podcastBase}/podcasts/openclaw/`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm text-neutral-400 hover:text-white transition-colors">{t.openclaw}</a>
                  <a href={`${podcastBase}/podcasts/fitness-tech/`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm text-neutral-400 hover:text-white transition-colors">{t.fitness}</a>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6"><Search /></div>
          </div>
        </div>
      )}
    </>
  );
}
