import { useState, useRef, useEffect } from 'react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', path: '/podcasts/openclaw/' },
  { code: 'es', name: 'Español', flag: '🇪🇸', path: '/es/podcasts/openclaw/' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', path: '/pt/podcasts/openclaw/' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', path: '/hi/podcasts/openclaw/' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', path: '/de/podcasts/openclaw/' },
];

/** @type {{ currentLang?: string, currentSlug?: string }} */
export default function LanguageSwitcher({ currentLang = 'en', currentSlug }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only these paths have locale versions — everything else falls back to podcast index
  const LOCALE_PATHS = [
    /^\/podcasts\/openclaw\/?$/,
    /^\/podcasts\/episode-\d+\/?$/,
  ];

  const getTargetPath = (langCode: string) => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    // Strip existing locale prefix to get base path
    const basePath = currentPath.replace(/^\/(es|pt|hi|de)\//, '/');
    // Ensure trailing slash
    const normalized = basePath.endsWith('/') ? basePath : basePath + '/';
    // Check if a locale version of this page exists
    const hasLocale = LOCALE_PATHS.some(re => re.test(normalized.replace(/\/$/, '')));
    // Fall back to podcast index if no locale version exists
    const targetBase = hasLocale ? normalized : '/podcasts/openclaw/';
    return langCode === 'en' ? targetBase : `/${langCode}${targetBase}`;
  };

  // Detect active language from URL path (most reliable source of truth)
  const [activeLang, setActiveLang] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/^\/(es|pt|hi|de)\//);
      return match ? match[1] : (localStorage.getItem('preferredLang') || currentLang);
    }
    return currentLang;
  });
  const currentLanguage = languages.find(l => l.code === activeLang) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
        aria-label="Select language"
      >
        <span className="text-base">🌐</span>
        <span className="hidden sm:inline">{currentLanguage.flag}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="py-1">
            {languages.map((lang) => {
              const isActive = lang.code === activeLang;
              const targetPath = getTargetPath(lang.code);
              
              return (
                <a
                  key={lang.code}
                  href={targetPath}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive 
                      ? 'bg-blue-400/10 text-blue-400 border-l-2 border-blue-400' 
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                  onClick={() => { localStorage.setItem('preferredLang', lang.code); setActiveLang(lang.code); setIsOpen(false); }}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
