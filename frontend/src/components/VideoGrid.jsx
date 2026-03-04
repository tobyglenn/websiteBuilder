import React, { useState, useMemo, useEffect } from 'react';
import { Play, Filter, Clock, SortDesc, Eye, EyeOff } from 'lucide-react';
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

const SORT_OPTIONS = [
  { id: 'newest', name: 'Newest First' },
  { id: 'oldest', name: 'Oldest First' },
  { id: 'shortest', name: 'Shortest First' },
  { id: 'longest', name: 'Longest First' },
];

// Determine if a video is a short based on duration (< 3 minutes)
function isShortVideo(video) {
  if (video.is_live) return false; // live streams are never shorts
  const dur = video.duration;
  // Treat null, undefined, "LIVE" as not a short
  if (!dur || dur === 'LIVE') return false;
  const parts = dur.split(':').map(Number);
  let totalSeconds;
  if (parts.length === 2) {
    // M:SS
    totalSeconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // H:MM:SS
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else {
    return false;
  }
  return totalSeconds < 180; // under 3 minutes
}

function categorizeVideo(title, description = "") {
  if (!title) return ['training'];
  const t = title.toLowerCase();
  const d = description.toLowerCase();
  const text = t + " " + d;
  const cats = [];
  // Speediance related
  if (text.includes('speediance') || text.includes('tonal') || text.includes('home gym') || text.includes('resistance')) cats.push('speediance');
  // BJJ related
  if (text.includes('bjj') || text.includes('jiu-jitsu') || text.includes('grappling') || text.includes('black belt') || text.includes('mat')) cats.push('bjj');
  // Wearables related
  if (text.includes('whoop') || text.includes('garmin') || text.includes('8sleep') || text.includes('sleep') || text.includes('recovery')) cats.push('wearables');
  // OpenClaw related
  if (text.includes('openclaw') || text.includes('ai') || text.includes('app') || text.includes('automation')) cats.push('openclaw');
  // If none matched, default to training
  if (cats.length === 0) cats.push('training');
  return cats;
}

export default function VideoGrid({ limit, showFilters = true }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Read ?category= from URL on mount and apply filter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat && CATEGORIES.some(c => c.id === cat)) {
      setSelectedCategory(cat);
    }
  }, []);

  const processedVideos = useMemo(() => {
    return allVideos.map(v => ({
      ...v,
      categories: categorizeVideo(v.title, v.description),
      published_at: v.publishedAt?.split('T')[0] || '2026-02-18',
      dateObj: new Date(v.publishedAt || '2026-02-18'),
      durationSec: parseDuration(v.duration_iso || 'PT0S')
    }));
  }, []);

  // Count videos per category for UI badges
  const categoryCounts = useMemo(() => {
    const counts = { all: processedVideos.length, shorts: processedVideos.filter(v => v.is_short).length };
    CATEGORIES.forEach(cat => {
      if (cat.id !== 'all' && cat.id !== 'shorts') {
        counts[cat.id] = processedVideos.filter(v => v.categories.includes(cat.id)).length;
      }
    });
    return counts;
  }, [processedVideos]);

  const filteredVideos = useMemo(() => {
    let result = [...processedVideos];

    // Exclude live stream from grid always (they go in the hero instead)
    result = result.filter(v => !v.is_live);

    // Category filter logic
    if (selectedCategory === 'shorts') {
      result = result.filter(v => v.is_short);
    } else if (selectedCategory !== 'all') {
      result = result.filter(v => v.categories?.includes(selectedCategory));
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
  }, [processedVideos, selectedCategory, sortBy, limit]);

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="flex flex-col gap-6 pb-6 border-b border-neutral-800">
          {/* Top Row: Categories */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
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
            <div className="flex items-center gap-4">
                {/* Sort Dropdown */}
                <div className="relative group">
                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-neutral-900 border border-neutral-800 text-neutral-300 py-2 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:border-blue-500 cursor-pointer hover:text-white"
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                        <SortDesc size={14} />
                    </div>
                </div>
            </div>
            
            <div className="text-xs text-neutral-500">
                Showing {filteredVideos.length} videos
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
             <button onClick={() => setSelectedCategory('all')} className="mt-4 text-blue-400 hover:underline">Clear Filters</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <a key={video.id} href={`/video/${video.id}`} className="group block bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:border-neutral-700">
              {/* Thumbnail Container */}
              <div className="aspect-video relative overflow-hidden bg-neutral-950">
                <img 
                    src={video.thumbnail}
                    alt={video.title} 
                    loading="lazy" 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                  <div className="bg-blue-600 p-3 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-md">
                  {(video.duration_formatted && video.duration_formatted !== '0:00') && (
                    <span>{video.duration_formatted}</span>
                  )}
                </div>

                {/* Category Badge (Top Left) */}
                {video.categories[0] !== 'all' && (
                    <div className="absolute top-2 left-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                            CATEGORIES.find(c => c.id === video.categories[0])?.color || 'bg-neutral-800 text-white'
                        }`}>
                            {CATEGORIES.find(c => c.id === video.categories[0])?.name || video.categories[0]}
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
                    {video.viewCount && (
                <div className="flex items-center space-x-1 text-neutral-400 text-xs mt-1">
                  <Eye size={12} className="stroke-current" />
                  <span>{formatViews(video.viewCount)}</span>
                </div>
              )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to parse ISO duration (e.g. PT15M33S) into seconds for sorting
function parseDuration(iso) {
  // existing code
}

// Format view counts (e.g., 1200 -> 1.2K, 1500000 -> 1.5M)
function formatViews(count) {
  const num = Number(count);
  if (isNaN(num)) return '';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}
