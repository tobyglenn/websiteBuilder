import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import SearchButton from './SearchButton.jsx';
import { captureEvent } from '../lib/analytics.js';

const SearchModal = lazy(() => import('./SearchModal.jsx'));

function SearchModalFallback({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden z-10">
        <div className="p-8 text-center text-neutral-500">
          <div className="animate-pulse">Loading search...</div>
        </div>
      </div>
    </div>
  );
}

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoadedModal, setHasLoadedModal] = useState(false);

  const openSearch = useCallback((source = 'button') => {
    setHasLoadedModal(true);
    setIsOpen(true);
    captureEvent('search_opened', {
      search_surface: 'site_modal',
      trigger: source,
    });
  }, []);
  const closeSearch = useCallback(() => setIsOpen(false), []);

  // Keyboard shortcut: Cmd/Ctrl+K to open
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if not typing in an input
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          closeSearch();
        } else {
          openSearch('keyboard');
        }
      }
      
      // Also support "/" to open search
      if (e.key === '/' && !isInput && !isOpen) {
        e.preventDefault();
        openSearch('keyboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openSearch, closeSearch]);

  return (
    <>
      <SearchButton onClick={() => openSearch('button')} />
      {hasLoadedModal && (
        <Suspense fallback={isOpen ? <SearchModalFallback onClose={closeSearch} /> : null}>
          <SearchModal isOpen={isOpen} onClose={closeSearch} />
        </Suspense>
      )}
    </>
  );
}
