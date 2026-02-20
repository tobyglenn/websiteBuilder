import React, { useState, useMemo, useEffect } from 'react';
import { Play, Filter, Clock, SortDesc, SortAsc, Eye, EyeOff } from 'lucide-react';
import { videos as allVideos } from '../data/youtube.js';

const CATEGORIES = [
  { id: 'all', name: 'All Topics', color: 'bg-neutral-800 text-white' },
  { id: 'speediance', name: 'Speediance', color: 'bg-blue-600 text-white' },
  { id: 'bjj', name: 'BJJ & Grappling', color: 'bg-purple-600 text-white' },
  { id: 'transformation', name: 'Transformation', color: 'bg-green-600 text-white' },
  { id: 'tech', name: 'Tech & Gear', color: 'bg-cyan-600 text-white' },
  { id: 'methodology', name: 'Methodology', color: 'bg-orange-600 text-white' },
];

const SORT_OPTIONS = [
  { id: 'newest', name: 'Newest First' },
  { id: 'oldest', name: 'Oldest First' },
  { id: 'shortest', name: 'Shortest First' },
  { id: 'longest', name: 'Longest First' },
];

// Determine if a video is a short based on duration (< 5 minutes)
function isShortVideo(video) {
  if (video.is_live) return false; // live streams are never shorts
  const fmt = video.duration_formatted;
  if (!fmt || fmt === '0:00') return false;
  const parts = fmt.split(':').map(Number);
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
  return totalSeconds < 300; // under 5 minutes
}

function categorizeVideo(title, description = "") {
  if (!title) return ['all'];
  const t = title.toLowerCase();
  const d = description.toLowerCase();
  const text = t + " " + d;
  
  const cats = [];
  if (text.includes('speediance') || text.includes('tonal') || text.includes('home gym') || text.includes('resistance')) cats.push('speediance');
  if (text.includes('bjj') || text.includes('jiu-jitsu') || text.includes('grappling') || text.includes('black belt') || text.includes('israetel') || text.includes('jocko') || text.includes('gordon ryan')) cats.push('bjj');
  if (text.includes('weight loss') || text.includes('transformation') || text.includes('242') || text.includes('188') || text.includes('pounds') || text.includes('obese') || text.includes('fat loss')) cats.push('transformation');
  if (text.includes('whoop') || text.includes('garmin') || text.includes('tracker') || text.includes('wearable') || text.includes('openclaw')) cats.push('tech');
  if (text.includes('training split') || text.includes('workout strategy') || text.includes('method') || text.includes('split') || text.includes('hypertrophy')) cats.push('methodology');
  
  return cats.length > 0 ? cats : ['all'];
}

export default function VideoGrid({ limit, showFilters = true }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showShorts, setShowShorts] = useState(false);

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

  const filteredVideos = useMemo(() => {
    let result = [...processedVideos];

    // Exclude live stream from grid always (they go in the hero instead)
    result = result.filter(v => !v.is_live);

    // Hide shorts by default (anything under 5 minutes)
    if (!showShorts) {
      result = result.filter(v => !isShortVideo(v));
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(v => v.categories?.includes(selectedCategory));
    }

    // Sort
    result = [...result].sort((a, b) => {
        if (sortBy === 'newest') return b.dateObj - a.dateObj;
        if (sortBy === 'oldest') return a.dateObj - b.dateObj;
        if (sortBy === 'shortest') return a.durationSec - b.durationSec;
        if (sortBy === 'longest') return b.durationSec - a.durationSec;
        return 0;
    });

    if (limit) return result.slice(0, limit);
    return result;
  }, [processedVideos, selectedCategory, sortBy, limit, showShorts]);

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
                    ? cat.color 
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-white'
                }`}
              >
                {cat.name}
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
            
            <div className="flex items-center gap-3">
              {/* Shorts Toggle */}
              <button
                onClick={() => setShowShorts(s => !s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  showShorts
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={showShorts ? 'Hide Shorts' : 'Show Shorts'}
              >
                {showShorts ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>Shorts</span>
              </button>

              <div className="text-xs text-neutral-500">
                Showing {filteredVideos.length} videos
              </div>
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
                    {video.viewCount && <span>{parseInt(video.viewCount).toLocaleString()} views</span>}
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
  if (!iso) return 0;
  if (iso === 'P0D') return 0;
  const match = iso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours   = (parseInt(match[1]) || 0) * 3600;
  const minutes = (parseInt(match[2]) || 0) * 60;
  const seconds = parseInt(match[3]) || 0;
  return hours + minutes + seconds;
}
