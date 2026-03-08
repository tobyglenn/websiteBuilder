import React, { useState, useEffect, useCallback } from 'react';
import SearchButton from './SearchButton.jsx';
import SearchModal from './SearchModal.jsx';

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = useCallback(() => setIsOpen(true), []);
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
          openSearch();
        }
      }
      
      // Also support "/" to open search
      if (e.key === '/' && !isInput && !isOpen) {
        e.preventDefault();
        openSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openSearch, closeSearch]);

  return (
    <>
      <SearchButton onClick={openSearch} />
      <SearchModal isOpen={isOpen} onClose={closeSearch} />
    </>
  );
}
