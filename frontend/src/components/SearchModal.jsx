import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, Video, Clock } from 'lucide-react';
import { captureEvent, cleanAnalyticsText } from '../lib/analytics.js';

const EMPTY_RESULTS = { blogPosts: [], videos: [] };
let searchIndexPromise;

function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fetch('/search-index.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Search index failed with ${response.status}`);
        }
        return response.json();
      });
  }

  return searchIndexPromise;
}

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

function searchContent(searchIndex, query) {
  if (!query || query.trim().length === 0) {
    return EMPTY_RESULTS;
  }

  const lowerQuery = query.toLowerCase().trim();
  
  // Search blog posts
  const blogResults = (searchIndex.blogPosts || []).filter(post => {
    return post.searchText?.includes(lowerQuery);
  }).slice(0, 5);

  // Search videos
  const videoResults = (searchIndex.videos || []).filter(video => {
    return video.searchText?.includes(lowerQuery);
  }).slice(0, 5);

  return {
    blogPosts: blogResults,
    videos: videoResults
  };
}

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const lastSearchEvent = useRef('');
  const resultClicked = useRef(false);
  
  const debouncedQuery = useDebounce(query, 200);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      resultClicked.current = false;
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Perform search when query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults(EMPTY_RESULTS);
      setError('');
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setError('');

    loadSearchIndex()
      .then((searchIndex) => {
        if (!isCurrent) return;
        const nextResults = searchContent(searchIndex, debouncedQuery);
        setResults(nextResults);
        const resultCount = nextResults.blogPosts.length + nextResults.videos.length;
        const searchKey = `${debouncedQuery}:${resultCount}`;
        if (lastSearchEvent.current !== searchKey) {
          lastSearchEvent.current = searchKey;
          captureEvent('search_performed', {
            search_surface: 'site_modal',
            search_query: cleanAnalyticsText(debouncedQuery, 80),
            result_count: resultCount,
            blog_result_count: nextResults.blogPosts.length,
            video_result_count: nextResults.videos.length,
            content_type: 'site',
          });
          if (resultCount === 0) {
            captureEvent('search_no_results', {
              search_surface: 'site_modal',
              search_query: cleanAnalyticsText(debouncedQuery, 80),
              content_type: 'site',
            });
          }
        }
      })
      .catch(() => {
        if (!isCurrent) return;
        setResults(EMPTY_RESULTS);
        setError('Search is unavailable right now.');
        captureEvent('search_error', {
          search_surface: 'site_modal',
          content_type: 'site',
        });
      })
      .finally(() => {
        if (!isCurrent) return;
        setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery]);

  const closeWithTracking = useCallback((reason) => {
    if (query.trim() && !resultClicked.current) {
      captureEvent('search_abandoned', {
        search_surface: 'site_modal',
        search_query: cleanAnalyticsText(query, 80),
        result_count: results.blogPosts.length + results.videos.length,
        close_reason: reason,
        content_type: 'site',
      });
    }
    setQuery('');
    onClose();
  }, [onClose, query, results]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        closeWithTracking('escape');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeWithTracking]);

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
      closeWithTracking('overlay');
    }
  };

  const handleResultClick = ({ contentType, slug, position }) => {
    resultClicked.current = true;
    captureEvent('search_result_click', {
      search_surface: 'site_modal',
      search_query: cleanAnalyticsText(query, 80),
      content_type: contentType,
      content_slug: slug,
      position,
    });
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => closeWithTracking('backdrop')} />

      {/* Modal panel */}
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <span className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Search</span>
          <button
            onClick={() => closeWithTracking('close_button')}
            className="text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
            aria-label="Close search"
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
              className="w-full bg-neutral-800 border border-neutral-700 rounded-md py-3 pl-10 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {query && (
              <button
                onClick={() => {
                  captureEvent('search_cleared', {
                    search_surface: 'site_modal',
                    content_type: 'site',
                  });
                  setQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                aria-label="Clear search"
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
          ) : error ? (
            <div className="p-8 text-center text-neutral-500">
              <p>{error}</p>
              <p className="text-sm mt-2">Try again in a moment.</p>
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
                    {results.blogPosts.map((post, index) => (
                      <a
                        key={post.slug}
                        href={`/blog/${post.slug}/`}
                        onClick={() => handleResultClick({
                          contentType: 'blog',
                          slug: post.slug,
                          position: index + 1,
                        })}
                        className="flex items-start gap-3 p-3 rounded-md hover:bg-neutral-800 transition-colors group"
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
                    {results.videos.map((video, index) => (
                      <a
                        key={video.id}
                        href={`/video/${video.id}/`}
                        onClick={() => handleResultClick({
                          contentType: 'video',
                          slug: video.id,
                          position: results.blogPosts.length + index + 1,
                        })}
                        className="flex items-start gap-3 p-3 rounded-md hover:bg-neutral-800 transition-colors group"
                      >
                        <div className="w-24 h-16 bg-neutral-800 rounded-md overflow-hidden flex-shrink-0">
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
                              {video.kind}
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

      </div>
    </div>
  );
}
