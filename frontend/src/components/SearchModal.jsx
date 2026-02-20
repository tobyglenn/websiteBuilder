import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  // Keyboard shortcut: Cmd/Ctrl+K or /
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(o => !o);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Load Pagefind assets once when modal first opens
  useEffect(() => {
    if (!isOpen || initialized) return;

    // Load Pagefind CSS
    if (!document.querySelector('link[href="/pagefind/pagefind-ui.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/pagefind/pagefind-ui.css';
      document.head.appendChild(link);
    }

    // Load Pagefind JS and init
    const script = document.createElement('script');
    script.src = '/pagefind/pagefind-ui.js';
    script.type = 'text/javascript';
    script.onload = () => {
      if (window.PagefindUI) {
        new window.PagefindUI({
          element: '#pagefind-search',
          showImages: true,
          showSubResults: false,
          resetStyles: false,
          excerptLength: 15,
        });
        // Auto-focus the input after init
        setTimeout(() => {
          document.querySelector('#pagefind-search input')?.focus();
        }, 100);
      }
    };
    document.head.appendChild(script);
    setInitialized(true);
  }, [isOpen, initialized]);

  // Auto-focus when reopened after init
  useEffect(() => {
    if (isOpen && initialized) {
      setTimeout(() => {
        document.querySelector('#pagefind-search input')?.focus();
      }, 50);
    }
  }, [isOpen, initialized]);

  return (
    <>
      {/* Trigger button — matches existing header style */}
      <button
        onClick={openModal}
        className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full py-1.5 pl-4 pr-3 text-sm text-neutral-400 hover:text-white hover:border-neutral-600 transition-all duration-200 group"
        aria-label="Open search"
      >
        <Search size={14} />
        <span className="hidden lg:inline">Search</span>
        <kbd className="hidden lg:inline text-xs bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal panel */}
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <span className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Search</span>
              <button
                onClick={closeModal}
                className="text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
              >
                <X size={16} />
              </button>
            </div>

            {/* Pagefind widget */}
            <div className="p-4" id="pagefind-search" />
          </div>
        </div>
      )}
    </>
  );
}
