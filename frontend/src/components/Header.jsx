import React, { useState, useEffect } from 'react';
import { Menu, X, Search } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Videos', href: '/videos' },
    { name: 'Blog', href: '/blog' },
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
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <div className="relative group">
            <form action="/search" method="GET" className="relative">
                <input 
                    type="text" 
                    name="q"
                    placeholder="Search..." 
                    className="bg-neutral-900 border border-neutral-800 rounded-full py-1.5 pl-4 pr-10 text-sm focus:outline-none focus:border-blue-500 w-32 focus:w-48 transition-all duration-300"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 group-hover:text-white">
                    <Search size={16} />
                </button>
            </form>
          </div>
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
                className="text-lg font-medium text-neutral-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
             <form action="/search" method="GET" className="relative mt-4">
                <input 
                    type="text" 
                    name="q"
                    placeholder="Search content..." 
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Search size={16} />
                </button>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}
