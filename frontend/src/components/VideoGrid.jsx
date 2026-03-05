import React, { useState, useMemo, useEffect } from 'react';
import { Play, Filter, Clock, SortDesc, Eye } from 'lucide-react';
import { videos as allVideos } from '../data/youtube.js';

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'speediance', name: 'Speediance' },
  { id: 'bjj', name: 'BJJ' },
  { id: 'wearables', name: 'Wearables' },
  { id: 'openclaw', name: 'OpenClaw' },
  { id: 'training', name: 'Training' },
  { id: 'shorts', name: 'Shorts' },
];

const CATEGORY_BADGE_STYLES = {
  speediance: 'bg-blue-600 text-white',
  bjj: 'bg-emerald-600 text-white',
  wearables: 'bg-cyan-600 text-white',
  openclaw: 'bg-indigo-600 text-white',
  training: 'bg-neutral-700 text-white',
  shorts: 'bg-sky-600 text-white',
  all: 'bg-neutral-800 text-neutral-300',
};

const SORT_OPTIONS = [
  { id: 'newest', name: 'Newest First' },
  { id: 'oldest', name: 'Oldest First' },
  { id: 'shortest', name: 'Shortest First' },
  { id: 'longest', name: 'Longest First' },
];

function parseDuration(value) {
  if (!value) return 0;

  const text = String(value).trim();
  if (!text || text === '0:00' || text.toUpperCase() === 'LIVE' || text === 'P0D') {
    return 0;
  }

  // ISO 8601 duration
  const isoMatch = text.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (isoMatch) {
    const hours = Number(isoMatch[1] || 0) * 3600;
    const minutes = Number(isoMatch[2] || 0) * 60;
    const seconds = Number(isoMatch[3] || 0);
    return hours + minutes + seconds;
  }

  // HH:MM:SS or MM:SS
  const parts = text.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

function isShortVideo(video) {
  if (video.is_live) return false;
  if (video.is_short === true) return true;
  if (video.is_short === false) return false;

  const totalSeconds = parseDuration(video.duration_iso || video.duration);
  return totalSeconds > 0 && totalSeconds < 180;
}

function categorizeVideo(title, description = '') {
  if (!title) return ['training'];

  const t = title.toLowerCase();
  const d = description.toLowerCase();
  const text = `${t} ${d}`;
  const cats = [];

  if (text.includes('speediance') || text.includes('tonal') || text.includes('home gym') || text.includes('resistance')) {
    cats.push('speediance');
  }
  if (text.includes('bjj') || text.includes('jiu-jitsu') || text.includes('grappling') || text.includes('black belt') || text.includes('mat')) {
    cats.push('bjj');
  }
  if (text.includes('whoop') || text.includes('garmin') || text.includes('8sleep') || text.includes('sleep') || text.includes('recovery')) {
    cats.push('wearables');
  }
  if (text.includes('openclaw') || text.includes('ai') || text.includes('app') || text.includes('automation')) {
    cats.push('openclaw');
  }

  if (cats.length === 0) cats.push('training');
  return cats;
}

function resolveThumbnail(video) {
  if (video.thumbnail) return video.thumbnail;
  if (video.id) {
    return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  }
  return null;
}

function resolveDurationLabel(video) {
  const raw = String(video.duration_formatted || video.duration || '').trim();
  if (!raw || raw === '0:00' || raw === 'P0D') return null;
  if (raw.toUpperCase() === 'LIVE') return 'LIVE';
  return raw;
}

function isLiveVideo(video) {
  return Boolean(video.is_live) || String(video.duration_formatted || video.duration || '').trim().toUpperCase() === 'LIVE';
}

export default function VideoGrid({ limit, showFilters = true, videos }) {
  const sourceVideos = videos || allVideos;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Read ?category= from URL on mount and apply filter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat && CATEGORIES.some(c => c.id === cat)) {
      setSelectedCategory(cat);
    }
  }, []);

  // Debounce search input for smoother client-side filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const processedVideos = useMemo(() => {
    return sourceVideos.map(v => {
      const title = v.title || '';
      const description = v.description || '';
      const publishedRaw = v.publishedAt || v.published_at || v.publishedAt || '2026-02-18';
      const publishedDate = String(publishedRaw).split('T')[0] || '2026-02-18';

      const isLive = isLiveVideo(v);
      const durationLabel = resolveDurationLabel(v);

      return {
        ...v,
        title,
        description,
        categories: categorizeVideo(title, description),
        thumbnail: resolveThumbnail(v),
        published_at: publishedDate,
        dateObj: new Date(publishedRaw || '2026-02-18T00:00:00Z'),
        durationSec: parseDuration(v.duration_iso || v.duration || 'PT0S'),
        durationLabel,
        durationBadgeText: isLive ? 'LIVE' : durationLabel,
        is_live: isLive,
        is_short: isShortVideo(v),
        viewCount: Number(v.viewCount ?? v.view_count ?? 0),
      };
    });
  }, [sourceVideos]);

  // Count videos per category for UI badges
  const categoryCounts = useMemo(() => {
    const counts = {
      all: processedVideos.length,
      shorts: processedVideos.filter(v => v.is_short).length,
    };

    CATEGORIES.forEach(cat => {
      if (cat.id !== 'all' && cat.id !== 'shorts') {
        counts[cat.id] = processedVideos.filter(v => v.categories.includes(cat.id)).length;
      }
    });

    return counts;
  }, [processedVideos]);

  const filteredVideos = useMemo(() => {
    let result = [...processedVideos];

    // Keep stream cards, since LIVE badge is now shown in-grid.

    // Category filter logic
    if (selectedCategory === 'shorts') {
      result = result.filter(v => v.is_short);
    } else if (selectedCategory !== 'all') {
      result = result.filter(v => v.categories?.includes(selectedCategory));
    }

    // Search filter (title + description, case-insensitive)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v => {
        const title = v.title?.toLowerCase() || '';
        const description = v.description?.toLowerCase() || '';
        return title.includes(query) || description.includes(query);
      });
    }

    // Sort
    result = result.sort((a, b) => {
      if (sortBy === 'newest') return b.dateObj - a.dateObj;
      if (sortBy === 'oldest') return a.dateObj - b.dateObj;
      if (sortBy === 'shortest') return a.durationSec - b.durationSec;
      if (sortBy === 'longest') return b.durationSec - a.durationSec;
      return 0;
    });

    if (limit) return result.slice(0, limit);
    return result;
  }, [processedVideos, selectedCategory, sortBy, searchQuery, limit]);

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="flex flex-col gap-6 pb-6 border-b border-neutral-800">
          {/* Top Row: Categories */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-white'
                }`}
              >
                {cat.name} ({categoryCounts[cat.id] ?? 0})
              </button>
            ))}
          </div>

          {/* Bottom Row: Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search title or description..."
                  className="w-72 max-w-[80vw] bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 py-2 pl-4 pr-20 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setSearchQuery('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs rounded-md bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative group">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="appearance-none bg-neutral-900 border border-neutral-800 text-neutral-300 py-2 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:border-blue-500 cursor-pointer hover:text-white"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                  <SortDesc size={14} />
                </div>
              </div>
            </div>

            <div className="text-xs text-neutral-500 text-right">
              {searchQuery ? (
                <>
                  Searching for <span className="text-blue-400">“{searchQuery}”</span> • {filteredVideos.length} result{filteredVideos.length === 1 ? '' : 's'}
                </>
              ) : (
                <>Showing {filteredVideos.length} videos</>
              )}
            </div>
          </div>
        </div>
      )}

      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/30 rounded-xl border border-neutral-800 border-dashed">
          <Filter className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No videos found</h3>
          <p className="text-neutral-400">Try adjusting filters or categories.</p>
          {selectedCategory !== 'all' && (
            <button onClick={() => setSelectedCategory('all')} className="mt-4 text-blue-400 hover:underline">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => {
            const primaryCategory = video.categories?.[0];
            const categoryStyle = CATEGORY_BADGE_STYLES[primaryCategory] || 'bg-neutral-800 text-white';
            const isLive = Boolean(video.is_live);

            return (
              <a
                key={video.id}
                href={`/video/${video.id}`}
                className="group block bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:border-neutral-700"
              >
                {/* Thumbnail Container */}
                <div className="aspect-video relative overflow-hidden bg-neutral-950">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-all duration-500 transform group-hover:scale-105 group-hover:brightness-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-950 flex items-center justify-center">
                      <Play className="w-10 h-10 text-neutral-600" />
                    </div>
                  )}

                  {/* Soft edge + hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                    <div className="bg-blue-600 p-3 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>

                  {/* Duration / LIVE badge */}
                  {video.durationBadgeText && (
                    <div
                      className={`absolute bottom-2 right-2 rounded px-2 py-1 text-[11px] font-semibold tracking-wide flex items-center gap-1.5 ${
                        isLive
                          ? 'bg-red-500/90 text-white border border-red-400/60'
                          : 'bg-black/75 text-white border border-white/10'
                      }`}
                    >
                      {isLive ? (
                        <>
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-100 animate-pulse" />
                          <span>LIVE</span>
                        </>
                      ) : (
                        <>
                          <Clock size={12} className="stroke-current" />
                          <span>{video.durationBadgeText}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Category Badge (Top Left) */}
                  {primaryCategory && primaryCategory !== 'all' && (
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm ${categoryStyle}`}>
                        {CATEGORIES.find(c => c.id === primaryCategory)?.name || primaryCategory}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-base font-bold text-white line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors mb-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{video.published_at}</span>
                    {video.viewCount > 0 && (
                      <div className="flex items-center space-x-1 text-neutral-400 text-xs">
                        <Eye size={12} className="stroke-current" />
                        <span>{formatViews(video.viewCount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Format view counts (e.g., 1200 -> 1.2K, 1500000 -> 1.5M)
function formatViews(count) {
  const num = Number(count);
  if (isNaN(num)) return '';

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return num.toString();
}
