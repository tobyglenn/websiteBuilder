import React from 'react';
import { Search } from 'lucide-react';

export default function SearchButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
      aria-label="Open search"
    >
      <Search size={14} />
      <span className="hidden lg:inline">Search</span>
    </button>
  );
}
