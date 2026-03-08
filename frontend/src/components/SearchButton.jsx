import React from 'react';
import { Search } from 'lucide-react';

export default function SearchButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full py-1.5 pl-4 pr-3 text-sm text-neutral-400 hover:text-white hover:border-neutral-600 transition-all duration-200 group"
      aria-label="Open search"
    >
      <Search size={14} />
      <span className="hidden lg:inline">Search</span>
      <kbd className="hidden lg:inline text-xs bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
    </button>
  );
}
