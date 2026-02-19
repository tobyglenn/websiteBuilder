import React, { useState } from 'react';
import { Play, Calendar, Dumbbell, Users, TrendingDown, ArrowRight } from 'lucide-react';
import { videos as allVideos } from '../data/youtube.js';

export default function Hero() {
  const [status] = useState({ isLive: false, nextScheduled: null });
  
  // Featured video - always use the most recent (first in list, sorted by date)
  const featuredVideo = allVideos[0];
  
  // Mock live status (placeholder logic)
  const mockStatus = { isLive: false, nextScheduled: "2026-02-20T18:00:00Z" };

  const pillars = [
    { icon: Dumbbell, name: 'Speediance Authority', description: '600,000+ lbs lifted. The definitive independent Speediance resource.', href: '/videos?category=speediance' },
    { icon: Users, name: 'BJJ Insight', description: 'Thoughtful commentary on grappling culture and match analysis.', href: '/videos?category=bjj' },
    { icon: TrendingDown, name: 'Transformation', description: '242 → 188 lbs. Real numbers, documented progress.', href: '/about' }
  ];

  return (
    <section className="relative overflow-hidden bg-neutral-950 pt-32 pb-24 md:pt-48 md:pb-32">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none" />
      </div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
        {/* Text Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 px-4 py-1.5 rounded-full text-blue-300 text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Latest Video
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            Serious fitness,<br />
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">real results, zero hype</span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
            For the person who's done with performance and ready for actual progress.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <a href={`/video/${featuredVideo?.id}`} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-blue-900/50">
              <Play size={20} fill="currentColor" /> Watch Latest
            </a>
            <a href="/about" className="px-8 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 rounded-full transition-all hover:border-neutral-600 font-medium flex items-center gap-2">
              About Me <ArrowRight size={16} />
            </a>
          </div>
        </div>

        {/* Featured Video Card */}
        {featuredVideo && (
            <div className="flex-1 w-full max-w-xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-neutral-900 border border-neutral-800">
                <img src={featuredVideo.thumbnail} alt={featuredVideo.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">FEATURED</span>
                    <h3 className="text-xl font-bold text-white mb-1">{featuredVideo.title}</h3>
                    <p className="text-sm text-neutral-300 line-clamp-1">{featuredVideo.description?.slice(0, 80)}...</p>
                </div>
                <a href={`/video/${featuredVideo.id}`} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full border border-white/30 hover:scale-110 transition-transform">
                    <Play size={32} fill="white" className="text-white ml-1" />
                    </div>
                </a>
                </div>
            </div>
            </div>
        )}
      </div>

      {/* Live Status Bar */}
      {mockStatus.nextScheduled && !mockStatus.isLive && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur border border-neutral-800 rounded-full py-2 px-6 flex items-center gap-4 shadow-xl animate-fade-in-up">
          <div className="flex items-center gap-2 text-blue-400">
            <Calendar size={16} />
            <span className="text-sm font-bold">Next Live:</span>
          </div>
          <span className="text-sm text-neutral-300">Feb 20 • 6:00 PM EST</span>
          <div className="h-4 w-px bg-neutral-800" />
          <a href="#" className="text-xs font-semibold text-white hover:text-blue-400 transition-colors uppercase tracking-wider">Set Reminder</a>
        </div>
      )}

      {/* Pillars Section */}
      <div className="container mx-auto px-4 mt-24 md:mt-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <a key={pillar.name} href={pillar.href} className="group relative bg-neutral-900/50 border border-neutral-800 hover:border-blue-500/50 rounded-xl p-6 transition-all duration-300 hover:bg-neutral-800/50">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600/10 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                  <pillar.icon className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{pillar.name}</h3>
                  <p className="text-sm text-neutral-400">{pillar.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
