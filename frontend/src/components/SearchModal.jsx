import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, Video, Clock } from 'lucide-react';
import { CANONICAL_BLOG_POSTS } from '../lib/blogPosts';
import videosData from '../data/videos.json';

// Flatten videos from the JSON structure
const VIDEOS = videosData.videos || [];

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Search function
function searchContent(query) {
  if (!query || query.trim().length === 0) {
    return { blogPosts: [], videos: [] };
  }

  const lowerQuery = query.toLowerCase().trim();
  
  // Search blog posts
  const blogResults = CANONICAL_BLOG_POSTS.filter(post => {
    const titleMatch = post.title?.toLowerCase().includes(lowerQuery);
    const excerptMatch = post.excerpt?.toLowerCase().includes(lowerQuery);
    const categoryMatch = post.category?.toLowerCase().includes(lowerQuery);
    const tagsMatch = post.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
    return titleMatch || excerptMatch || categoryMatch || tagsMatch;
  }).slice(0, 5);

  // Search videos
  const videoResults = VIDEOS.filter(video => {
    const titleMatch = video.title?.toLowerCase().includes(lowerQuery);
    const descriptionMatch = video.description?.toLowerCase().includes(lowerQuery);
    const categoryMatch = video.category?.toLowerCase().includes(lowerQuery);
    return titleMatch || descriptionMatch || categoryMatch;
  }).slice(0, 5);

  return {
    blogPosts: blogResults,
    videos: videoResults
  };
}

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ blogPosts: [], videos: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  
  const debouncedQuery = useDebounce(query, 200);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Perform search when query changes
  useEffect(() => {
    if (debouncedQuery) {
      setIsLoading(true);
      // Small delay to show loading state
      setTimeout(() => {
        const searchResults = searchContent(debouncedQuery);
        setResults(searchResults);
        setIsLoading(false);
      }, 50);
    } else {
      setResults({ blogPosts: [], videos: [] });
    }
  }, [debouncedQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleResultClick = () => {
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  const hasResults = results.blogPosts.length > 0 || results.videos.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4"
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <span className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Search</span>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-neutral-800">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search blog posts and videos..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-500">
              <div className="animate-pulse">Searching...</div>
            </div>
          ) : !query ? (
            <div className="p-8 text-center text-neutral-500">
              <Search size={32} className="mx-auto mb-3 opacity-50" />
              <p>Start typing to search...</p>
              <p className="text-sm mt-2">Search through blog posts and videos</p>
            </div>
          ) : !hasResults ? (
            <div className="p-8 text-center text-neutral-500">
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-2">Try different keywords</p>
            </div>
          ) : (
            <div className="p-2">
              {/* Blog Posts Section */}
              {results.blogPosts.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <FileText size={14} />
                    Blog Posts
                  </div>
                  <div className="space-y-1">
                    {results.blogPosts.map((post) => (
                      <a
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        onClick={handleResultClick}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-800 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                            {post.title}
                          </h4>
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                            {post.excerpt?.slice(0, 100)}...
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-600">
                            <span className="bg-neutral-800 px-2 py-0.5 rounded">{post.category}</span>
                            <span>•</span>
                            <span>{post.published_at || 'Undated'}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos Section */}
              {results.videos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <Video size={14} />
                    Videos
                  </div>
                  <div className="space-y-1">
                    {results.videos.map((video) => (
                      <a
                        key={video.id}
                        href={`/video/${video.id}`}
                        onClick={handleResultClick}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-800 transition-colors group"
                      >
                        <div className="w-24 h-16 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
                          {video.thumbnail ? (
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video size={20} className="text-neutral-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                            {video.title}
                          </h4>
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                            {video.description?.slice(0, 80)}...
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-600">
                            {video.duration_formatted && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {video.duration_formatted}
                                </span>
                                <span>•</span>
                              </>
                            )}
                            <span className="bg-neutral-800 px-2 py-0.5 rounded">
                              {video.is_short ? 'Short' : 'Video'}
                            </span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>Press <kbd className="bg-neutral-800 px-1.5 py-0.5 rounded">Esc</kbd> to close</span>
            <span>Search by title, description, or category</span>
          </div>
        </div>
      </div>
    </div>
  );
}
