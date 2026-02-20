import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import SearchModal from './SearchModal.jsx';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pathname, setPathname] = useState('');

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

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Videos', href: '/videos' },
    { name: 'Blog', href: '/blog' },
    { name: 'Transformation', href: '/transformation' },
    { name: 'Running', href: '/running' },
    { name: 'Speediance', href: '/speediance' },
    { name: 'Training', href: '/training' },
    { name: 'Sleep', href: '/sleep' },
    { name: 'BJJ', href: '/bjj' },
    { name: 'Day', href: '/day' },
    { name: 'Gear', href: '/gear' },
    { name: 'About', href: '/about' },
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
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
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
          ))}
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
        <div className="md:hidden bg-neutral-950 border-b border-neutral-800 animate-in slide-in-from-top-2">
          <nav className="flex flex-col p-4 space-y-4">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                className={`text-lg font-medium transition-colors ${
                  pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                    ? 'text-white'
                    : 'text-neutral-300 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
             <div className="mt-4">
              <SearchModal />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
