import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import SearchButton from './SearchButton.jsx';
import { captureEvent } from '../lib/analytics.js';

const SearchModal = lazy(() => import('./SearchModal.jsx'));

class SearchErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Keep the original exception visible while offering a non-JS search route.
    window.posthog?.captureException(error, { search_surface: 'site_modal' });
    captureEvent('search_load_failed', { search_surface: 'site_modal' });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (!this.props.isOpen) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 pt-20 px-4">
        <div role="dialog" aria-modal="true" aria-label="Search unavailable" className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-lg p-6 text-white">
          <p role="alert">Search could not load.</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <a href="/search/" className="underline">Open search page</a>
            <button type="button" onClick={() => window.location.reload()} className="underline">Reload</button>
            <button type="button" autoFocus onClick={this.props.onClose} className="underline">Close search</button>
          </div>
        </div>
      </div>
    );
  }
}

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

export default function Search({ keyboardShortcuts = true }) {
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
    if (!keyboardShortcuts) return;
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
  }, [isOpen, openSearch, closeSearch, keyboardShortcuts]);

  return (
    <>
      <SearchButton onClick={() => openSearch('button')} />
      {hasLoadedModal && typeof document !== 'undefined' && createPortal(
        <SearchErrorBoundary isOpen={isOpen} onClose={closeSearch}>
          <Suspense fallback={isOpen ? <SearchModalFallback onClose={closeSearch} /> : null}>
            <SearchModal isOpen={isOpen} onClose={closeSearch} />
          </Suspense>
        </SearchErrorBoundary>, document.body
      )}
    </>
  );
}
