// Site navigation: labels, menu items and analytics constants shared by
// Header.astro (markup) and src/scripts/header.js (behaviour).
import {
  Activity,
  BarChart3,
  BookOpen,
  Calculator,
  Clapperboard,
  Cpu,
  Dumbbell,
  FileText,
  Footprints,
  Gamepad2,
  HeartPulse,
  PackageSearch,
  PlaySquare,
  Scale,
  Shield,
  Trophy,
  Watch,
} from 'lucide-react';

export const LOCALE_STORAGE_KEY = 'site-lang';
export const LEGACY_LOCALE_STORAGE_KEY = 'preferredLang';
export const NAVIGATION_SCHEMA_VERSION = 'nav-2026-08-18-comparisons-a';
export const NAVIGATION_TEST_ID = 'primary-slot-7-about-vs-comparisons';
export const NAVIGATION_TEST_VARIANT = 'comparisons';
export const SUPPORTED_LOCALES = ['en', 'de', 'es', 'pt', 'hi'];
export const LOCALE_LABELS = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  hi: 'हिन्दी',
};

export const NAV_TRANSLATIONS = {
  en: {
    reviews: 'Reviews', training: 'Training Data', articles: 'Articles', videos: 'Videos', podcasts: 'Projects', about: 'About', comparisons: 'Comparisons',
    speediance: 'Speediance', wearables: 'Wearables', gear: 'Gear', compare: 'Compare Trackers', calculators: 'Calculators',
    trainingOverview: 'Training Overview', running: 'Running', recovery: 'Recovery', transformation: 'Transformation', bjj: 'BJJ', prs: 'PR Board',
    agentstack: 'AgentStack', fitnessPodcast: 'Fitness Tech Podcast', allPodcasts: 'All Projects', startHere: 'Start Here',
    wildRebellion: 'Wild Rebellion', ironvaneChronicle: 'Ironvane (Roblox)', monstrumWorld: 'Monstrum World',
    mmaRpg: 'MMA RPG', gridboundRealms: 'Gridbound Realms', bjjBuddy: 'BJJ Buddy', nutriTrack: 'NutriTrack', churchSite: '1 Peter Memory Trainer', lilly: 'Lilly Plays', pokemonGo: 'Pokémon GO Automation', ironvane: 'IronVane', liminal: 'Liminal',
  },
  de: {
    reviews: 'Tests', training: 'Trainingsdaten', articles: 'Artikel', videos: 'Videos', podcasts: 'Projekte', about: 'Über mich', comparisons: 'Vergleiche',
    speediance: 'Speediance', wearables: 'Wearables', gear: 'Ausrüstung', compare: 'Tracker vergleichen', calculators: 'Rechner',
    trainingOverview: 'Training', running: 'Laufen', recovery: 'Erholung', transformation: 'Transformation', bjj: 'BJJ', prs: 'PR-Tafel',
    agentstack: 'AgentStack', fitnessPodcast: 'Fitness-Tech-Podcast', allPodcasts: 'Alle Projekte', startHere: 'Hier starten',
    wildRebellion: 'Wild Rebellion', ironvaneChronicle: 'Ironvane (Roblox)', monstrumWorld: 'Monstrum World',
    mmaRpg: 'MMA RPG', gridboundRealms: 'Gridbound Realms', bjjBuddy: 'BJJ Buddy', nutriTrack: 'NutriTrack', churchSite: '1 Peter Memory Trainer', lilly: 'Lilly Plays', pokemonGo: 'Pokémon GO Automation', ironvane: 'IronVane', liminal: 'Liminal',
  },
  es: {
    reviews: 'Reseñas', training: 'Datos de entrenamiento', articles: 'Artículos', videos: 'Videos', podcasts: 'Proyectos', about: 'Acerca de', comparisons: 'Comparaciones',
    speediance: 'Speediance', wearables: 'Wearables', gear: 'Equipo', compare: 'Comparar trackers', calculators: 'Calculadoras',
    trainingOverview: 'Entrenamiento', running: 'Running', recovery: 'Recuperación', transformation: 'Transformación', bjj: 'BJJ', prs: 'Tabla PR',
    agentstack: 'AgentStack', fitnessPodcast: 'Podcast Fitness Tech', allPodcasts: 'Todos los proyectos', startHere: 'Empieza aquí',
    wildRebellion: 'Wild Rebellion', ironvaneChronicle: 'Ironvane (Roblox)', monstrumWorld: 'Monstrum World',
    mmaRpg: 'MMA RPG', gridboundRealms: 'Gridbound Realms', bjjBuddy: 'BJJ Buddy', nutriTrack: 'NutriTrack', churchSite: '1 Peter Memory Trainer', lilly: 'Lilly Plays', pokemonGo: 'Pokémon GO Automation', ironvane: 'IronVane', liminal: 'Liminal',
  },
  pt: {
    reviews: 'Análises', training: 'Dados de treino', articles: 'Artigos', videos: 'Vídeos', podcasts: 'Projetos', about: 'Sobre', comparisons: 'Comparações',
    speediance: 'Speediance', wearables: 'Wearables', gear: 'Equipamento', compare: 'Comparar trackers', calculators: 'Calculadoras',
    trainingOverview: 'Treino', running: 'Corrida', recovery: 'Recuperação', transformation: 'Transformação', bjj: 'BJJ', prs: 'Quadro de PR',
    agentstack: 'AgentStack', fitnessPodcast: 'Podcast Fitness Tech', allPodcasts: 'Todos os projetos', startHere: 'Comece aqui',
    wildRebellion: 'Wild Rebellion', ironvaneChronicle: 'Ironvane (Roblox)', monstrumWorld: 'Monstrum World',
    mmaRpg: 'MMA RPG', gridboundRealms: 'Gridbound Realms', bjjBuddy: 'BJJ Buddy', nutriTrack: 'NutriTrack', churchSite: '1 Peter Memory Trainer', lilly: 'Lilly Plays', pokemonGo: 'Pokémon GO Automation', ironvane: 'IronVane', liminal: 'Liminal',
  },
  hi: {
    reviews: 'समीक्षाएँ', training: 'ट्रेनिंग डेटा', articles: 'लेख', videos: 'वीडियो', podcasts: 'प्रोजेक्ट', about: 'परिचय', comparisons: 'तुलनाएँ',
    speediance: 'Speediance', wearables: 'Wearables', gear: 'गियर', compare: 'Tracker तुलना', calculators: 'कैलकुलेटर',
    trainingOverview: 'ट्रेनिंग', running: 'दौड़', recovery: 'रिकवरी', transformation: 'परिवर्तन', bjj: 'BJJ', prs: 'PR बोर्ड',
    agentstack: 'AgentStack', fitnessPodcast: 'फिटनेस टेक पॉडकास्ट', allPodcasts: 'सभी प्रोजेक्ट', startHere: 'यहाँ से शुरू करें',
    wildRebellion: 'Wild Rebellion', ironvaneChronicle: 'Ironvane (Roblox)', monstrumWorld: 'Monstrum World',
    mmaRpg: 'MMA RPG', gridboundRealms: 'Gridbound Realms', bjjBuddy: 'BJJ Buddy', nutriTrack: 'NutriTrack', churchSite: '1 Peter Memory Trainer', lilly: 'Lilly Plays', pokemonGo: 'Pokémon GO Automation', ironvane: 'IronVane', liminal: 'Liminal',
  },
};


export const getLocaleFromPath = (path = '') => path.match(/^\/(es|pt|hi|de)(?:\/|$)/)?.[1] || 'en';
export const localizedHref = (locale, href) => {
  if (!href.startsWith('/') || locale === 'en') return href;
  return href === '/' ? `/${locale}/` : `/${locale}${href}`;
};

export function navigationFor(pathname = '/') {
  const locale = getLocaleFromPath(pathname);
  const t = NAV_TRANSLATIONS[locale] || NAV_TRANSLATIONS.en;
  const reviewItems = [
    { name: t.speediance, href: localizedHref(locale, '/speediance/'), icon: Dumbbell },
    { name: t.wearables, href: '/wearables/', icon: Watch },
    { name: t.gear, href: localizedHref(locale, '/gear/'), icon: PackageSearch },
    { name: t.compare, href: localizedHref(locale, '/compare-trackers/'), icon: Scale },
    { name: t.calculators, href: localizedHref(locale, '/calculators/'), icon: Calculator },
  ];
  const trainingItems = [
    { name: t.trainingOverview, href: localizedHref(locale, '/training/'), icon: Activity },
    { name: t.running, href: localizedHref(locale, '/running/'), icon: Footprints },
    { name: t.recovery, href: localizedHref(locale, '/whoop/'), icon: HeartPulse },
    { name: t.transformation, href: localizedHref(locale, '/transformation/'), icon: Trophy },
    { name: t.bjj, href: localizedHref(locale, '/bjj/'), icon: Shield },
    { name: t.prs, href: localizedHref(locale, '/prs/'), icon: BarChart3 },
  ];
  const projectItems = [
    { name: t.allPodcasts, href: localizedHref(locale, '/projects/'), icon: PackageSearch },
    { name: t.pokemonGo, href: '/projects/pokemon-go-automation/', icon: Cpu },
    { name: t.wildRebellion, href: localizedHref(locale, '/projects/wild-rebellion/'), icon: Gamepad2 },
    { name: t.ironvaneChronicle, href: localizedHref(locale, '/projects/ironvane-chronicle/'), icon: Trophy },
    { name: t.monstrumWorld, href: localizedHref(locale, '/projects/monstrum-world/'), icon: Gamepad2 },
    { name: t.mmaRpg, href: '/projects/mma-rpg/', icon: Gamepad2 },
    { name: t.gridboundRealms, href: '/projects/gridbound-realms/', icon: Gamepad2 },
    { name: t.bjjBuddy, href: '/projects/bjj-buddy/', icon: Shield },
    { name: t.nutriTrack, href: '/projects/nutritrack/', icon: Activity },
    { name: t.churchSite, href: '/projects/one-peter-memory/', icon: BookOpen },
    { name: t.lilly, href: localizedHref(locale, '/projects/lilly/'), icon: PlaySquare },
    { name: t.ironvane, href: '/projects/ironvane/', icon: Clapperboard },
    { name: t.liminal, href: '/projects/liminal/', icon: PlaySquare },
  ];
  const primaryItems = [
    { name: t.articles, href: localizedHref(locale, '/blog/'), icon: FileText },
    { name: t.videos, href: localizedHref(locale, '/videos/'), icon: PlaySquare },
    { name: t.agentstack, href: '/agentstack/', icon: Cpu },
    {
      name: t.comparisons,
      href: localizedHref(locale, '/compare/'),
      icon: Scale,
      navigationTestId: NAVIGATION_TEST_ID,
      navigationTestVariant: NAVIGATION_TEST_VARIANT,
    },
  ];
  return { locale, t, reviewItems, trainingItems, projectItems, primaryItems };
}

export const isActiveHref = (pathname, href) => pathname === href || (href !== '/' && pathname.startsWith(href));
