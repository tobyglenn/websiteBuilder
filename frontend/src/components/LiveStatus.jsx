import React, { useState, useEffect } from 'react';
import { Play, Calendar, Clock } from 'lucide-react';

export default function LiveStatus() {
  const [status, setStatus] = useState({ isLive: false, nextScheduled: null });

  // Placeholder for fetching live status from Backend
  // useEffect(() => { fetch('http://localhost:8000/videos/live')... }, []);

  // Mock data for display
  const mockStatus = {
    isLive: false,
    nextScheduled: "2026-02-20T18:00:00Z" // Example upcoming
  };

  if (mockStatus.isLive) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-red-600/20 border border-red-500 rounded-xl p-6 mb-8 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
            <div>
              <h3 className="text-xl font-bold text-white">LIVE NOW</h3>
              <p className="text-red-200">Streaming: Tech Review Q&A</p>
            </div>
          </div>
          <a href="https://youtube.com/@tobyonfitnesstech/live" target="_blank" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors">
            Watch Stream
          </a>
        </div>
      </div>
    );
  }

  if (mockStatus.nextScheduled) {
    const date = new Date(mockStatus.nextScheduled);
    return (
      <div className="w-full max-w-4xl mx-auto bg-neutral-800 border border-neutral-700 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="text-blue-400 w-8 h-8" />
            <div>
              <h3 className="text-lg font-semibold text-white">Next Livestream</h3>
              <p className="text-neutral-400">{date.toLocaleDateString()} at {date.toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-neutral-300 bg-neutral-900 px-4 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-mono">46:22:10 until live</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
