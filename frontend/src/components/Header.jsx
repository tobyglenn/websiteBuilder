import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import SearchModal from './SearchModal.jsx';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pathname, setPathname] = useState('');
  const [isBlogDropdownOpen, setIsBlogDropdownOpen] = useState(false);
  const [isPodcastDropdownOpen, setIsPodcastDropdownOpen] = useState(false);

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
                <div key={link.name} className="relative group">
                  <a
                    href={link.href}
                    className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                      pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/')
                        ? 'text-white border-b border-blue-500 pb-0.5'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    {link.name}
                    <ChevronDown size={14} className="transition-transform duration-200 group-hover:rotate-180" />
                  </a>
                  {/* Dropdown panel */}
                  <div className="absolute top-full pt-3 left-1/2 -translate-x-1/2 w-80 opacity-0 invisible
                                  group-hover:opacity-100 group-hover:visible
                                  transition-all duration-200 z-50">
                    <div className="grid grid-cols-2 gap-1.5 p-3 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-xl shadow-black/40">
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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md">
          <div className="flex flex-col h-full p-6">
            {/* Close button */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                TobyOnFitnessTech
              </span>
              <button onClick={() => setIsMenuOpen(false)} className="text-neutral-300 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable nav */}
            <nav className="flex flex-col space-y-4 overflow-y-auto flex-grow">
              {/* Blog Dropdown */}
              <div className="border border-neutral-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setIsBlogDropdownOpen(!isBlogDropdownOpen)}
                  className="w-full flex justify-between items-center p-4 hover:bg-neutral-900 transition-colors">
                  <span className="flex items-center gap-2 text-neutral-300">
                    📝 Blog & Articles
                  </span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${isBlogDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isBlogDropdownOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {subNavItems.map((subLink) => (
                      <a
                        key={subLink.href}
                        href={subLink.href}
                        className={`block py-2 text-neutral-400 hover:text-white transition-colors ${
                          pathname === subLink.href || pathname.startsWith(subLink.href)
                            ? 'text-white'
                            : ''
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="mr-2">{subLink.icon}</span>
                        {subLink.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Podcast Dropdown */}
              <div className="border border-neutral-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setIsPodcastDropdownOpen(!isPodcastDropdownOpen)}
                  className="w-full flex justify-between items-center p-4 hover:bg-neutral-900 transition-colors">
                  <span className="flex items-center gap-2 text-neutral-300">
                    🎙️ Podcasts
                  </span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${isPodcastDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isPodcastDropdownOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    <a
                      href="/podcasts/openclaw"
                      className={`block py-2 text-neutral-400 hover:text-white transition-colors ${
                        pathname === '/podcasts/openclaw'
                          ? 'text-white'
                          : ''
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      🎙️ OpenClaw Daily
                    </a>
                    <a
                      href="/podcasts/fitness-tech"
                      className={`block py-2 text-neutral-400 hover:text-white transition-colors ${
                        pathname === '/podcasts/fitness-tech'
                          ? 'text-white'
                          : ''
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      💪 Fitness Tech Podcast
                    </a>
                  </div>
                )}
              </div>

              {/* Direct Links */}
              <a
                href="/"
                className="block py-2 text-lg font-medium transition-colors text-neutral-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="/videos"
                className={`block py-2 text-lg font-medium transition-colors ${
                  pathname === '/videos'
                    ? 'text-white'
                    : 'text-neutral-300 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Videos
              </a>
              <a
                href="/about"
                className={`block py-2 text-lg font-medium transition-colors ${
                  pathname === '/about'
                    ? 'text-white'
                    : 'text-neutral-300 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
            </nav>

            {/* Search Modal */}
            <div className="mt-4">
              <SearchModal close={() => setIsMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
