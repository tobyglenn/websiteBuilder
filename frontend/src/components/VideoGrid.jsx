import React, { useState, useMemo } from 'react';
import { Play, Filter, Eye, EyeOff } from 'lucide-react';
import { videos as allVideos } from '../data/youtube.js';

const CATEGORIES = [
 { id: 'all', name: 'All', color: 'bg-neutral-800 text-white' },
 { id: 'speediance', name: 'Speediance', color: 'bg-blue-600 text-white' },
 { id: 'bjj', name: 'BJJ', color: 'bg-purple-600 text-white' },
 { id: 'transformation', name: 'Transformation', color: 'bg-green-600 text-white' },
 { id: 'tech', name: 'Tech', color: 'bg-cyan-600 text-white' },
 { id: 'methodology', name: 'Methodology', color: 'bg-orange-600 text-white' }
];

function categorizeVideo(title) {
 if (!title) return ['all'];
 const t = title.toLowerCase();
 const cats = [];
 if (t.includes('speediance') || t.includes('tonal') || t.includes('home gym')) cats.push('speediance');
 if (t.includes('bjj') || t.includes('jiu-jitsu') || t.includes('grappling') || t.includes('black belt') || t.includes('israetel') || t.includes('jocko')) cats.push('bjj');
 if (t.includes('weight loss') || t.includes('transformation') || t.includes('obese') || t.includes('dropped')) cats.push('transformation');
 if (t.includes('whoop') || t.includes('garmin') || t.includes('tracker')) cats.push('tech');
 if (t.includes('training split') || t.includes('workout') || t.includes('method')) cats.push('methodology');
 return cats.length > 0 ? cats : ['all'];
}

export default function VideoGrid({ limit, showFilters = true }) {
 const [selectedCategory, setSelectedCategory] = useState('all');
 const [showShorts, setShowShorts] = useState(false);

 const processedVideos = useMemo(() => {
 return allVideos.map(v => ({
 ...v,
 categories: categorizeVideo(v.title),
 published_at: v.publishedAt?.split('T')[0] || '2026-02-18'
 }));
 }, []);

 const filteredVideos = useMemo(() => {
 let result = processedVideos;
 if (selectedCategory !== 'all') {
 result = result.filter(v => v.categories.includes(selectedCategory));
 }
 if (limit) return result.slice(0, limit);
 return result;
 }, [processedVideos, selectedCategory, limit]);

 return (
 <div className="space-y-6">
 {showFilters && (
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
 <div className="flex flex-wrap gap-2">
 {CATEGORIES.map((cat) => (
 <button
 key={cat.id}
 onClick={() => setSelectedCategory(cat.id)}
 className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
 selectedCategory === cat.id ? cat.color : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-white'
 }`}
 >
 {cat.name}
 </button>
 ))}
 </div>
 </div>
 )}

 {filteredVideos.length === 0 ? (
 <div className="text-center py-16">
 <Filter className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
 <h3 className="text-xl font-bold text-white mb-2">No videos found</h3>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredVideos.map((video) => (
 <a key={video.id} href={`/video/${video.id}`} className="group block bg-neutral-800 rounded-lg overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
 <div className="aspect-video relative overflow-hidden">
 <img src={video.thumbnail} alt={video.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
 <div className="bg-blue-600/90 p-3 rounded-full"><Play className="w-6 h-6 text-white fill-white" /></div>
 </div>
 </div>
 <div className="p-4">
 <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-blue-400">{video.title}</h3>
 <p className="text-sm text-neutral-500 mt-2">{video.published_at}</p>
 </div>
 </a>
 ))}
 </div>
 )}
 </div>
 );
}
