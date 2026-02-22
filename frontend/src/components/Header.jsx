import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import SearchModal from './SearchModal.jsx';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pathname, setPathname] = useState('');
  const [isBlogDropdownOpen, setIsBlogDropdownOpen] = useState(false);
  const [isPodcastDropdownOpen, setIsPodcastDropdownOpen] = useState(false);
  const [isDesktopBlogOpen, setIsDesktopBlogOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  // New 6-item nav structure
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Videos', href: '/videos' },
    { name: 'Blog & Articles', href: '/blog', hasDropdown: true },
    { name: 'OpenClaw Podcast', href: '/podcasts/openclaw' },
    { name: 'Fitness Tech Podcast', href: '/podcasts/fitness-tech' },
    { name: 'About', href: '/about' },
  ];

  // Blog dropdown items with icons
  const subNavItems = [
    { name: 'Transformation', href: '/transformation', icon: '🏆' },
    { name: 'Running', href: '/running', icon: '⏱' },
    { name: 'Speediance', href: '/speediance', icon: '💪' },
    { name: 'Training', href: '/training', icon: '🏋️' },
    { name: 'Sleep', href: '/sleep', icon: '😴' },
    { name: 'BJJ', href: '/bjj', icon: '🥋' },
    { name: 'Day in a Week', href: '/day-in-a-week', icon: '📅' },
    { name: 'Gear', href: '/gear', icon: '🛠' },
    { name: 'Start Here', href: '/start-here', icon: '🚀' },
  ];

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            TobyOnFitnessTech
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              if (link.hasDropdown) {
                // Blog & Articles dropdown
                return (
                  <div
                    key={link.name}
                    className="relative"
                    onMouseEnter={() => setIsDesktopBlogOpen(true)}
                    onMouseLeave={() => setIsDesktopBlogOpen(false)}
                  >
                    <a
                      href={link.href}
                      className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                        pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/')
                          ? 'text-white border-b border-blue-500 pb-0.5'
                          : 'text-neutral-300 hover:text-white'
                      }`}
                    >
                      {link.name}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${isDesktopBlogOpen ? 'rotate-180' : ''}`}
                      />
                    </a>
                    {isDesktopBlogOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-80 z-[200] pt-2">
                        <div className="grid grid-cols-2 gap-1.5 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl shadow-black/40">
                          {subNavItems.map((subLink) => (
                            <a
                              key={subLink.href}
                              href={subLink.href}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                                pathname === subLink.href || (pathname.startsWith(subLink.href) && subLink.href !== '/')
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                              }`}
                            >
                              <span>{subLink.icon}</span>
                              <span>{subLink.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              // Regular link
              return (
                <a
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                      ? 'text-white border-b border-blue-500 pb-0.5'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <SearchModal />
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-neutral-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-neutral-950 overflow-y-auto">
          <div className="flex flex-col min-h-full p-6">
            {/* Header row */}
            <div className="flex justify-between items-center mb-8">
              <a href="/" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                TobyOnFitnessTech
              </a>
              <button onClick={() => setIsMenuOpen(false)} className="text-neutral-300 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            {/* Direct links first */}
            <nav className="flex flex-col space-y-1 mb-6">
              {[
                { name: 'Home', href: '/' },
                { name: 'Videos', href: '/videos' },
                { name: 'About', href: '/about' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-lg font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Blog accordion */}
            <div className="mb-3 border border-neutral-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setIsBlogDropdownOpen(!isBlogDropdownOpen)}
                className="w-full flex justify-between items-center px-4 py-3 text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                <span className="flex items-center gap-2 font-medium">📝 Blog & Articles</span>
                <ChevronDown size={18} className={`transition-transform duration-200 ${isBlogDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isBlogDropdownOpen && (
                <div className="border-t border-neutral-800 px-4 py-3 grid grid-cols-2 gap-2">
                  {subNavItems.map((sub) => (
                    <a
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                    >
                      <span>{sub.icon}</span>
                      <span>{sub.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Podcasts accordion */}
            <div className="border border-neutral-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setIsPodcastDropdownOpen(!isPodcastDropdownOpen)}
                className="w-full flex justify-between items-center px-4 py-3 text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                <span className="flex items-center gap-2 font-medium">🎙️ Podcasts</span>
                <ChevronDown size={18} className={`transition-transform duration-200 ${isPodcastDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isPodcastDropdownOpen && (
                <div className="border-t border-neutral-800 px-4 py-3 space-y-2">
                  <a href="/podcasts/openclaw" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
                    🎙️ OpenClaw Daily
                  </a>
                  <a href="/podcasts/fitness-tech" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
                    💪 Fitness Tech Podcast
                  </a>
                </div>
              )}
            </div>

            {/* Search at bottom */}
            <div className="mt-auto pt-6">
              <SearchModal close={() => setIsMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
