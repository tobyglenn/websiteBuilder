import React from 'react';
import { Play } from 'lucide-react';

export default function RelatedVideos({ currentId, videos }) {
  const related = videos
    .filter(v => v.id !== currentId)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {related.map((video) => (
        <a key={video.id} href={`/video/${video.id}`} className="group block bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-all">
          <div className="aspect-video relative overflow-hidden">
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Play className="text-white fill-white w-12 h-12" />
            </div>
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
              12:45
            </span>
          </div>
          <div className="p-4">
            <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors mb-2">
              {video.title}
            </h4>
            <div className="flex items-center text-xs text-neutral-500 gap-2">
                <span>{video.views} views</span>
                <span>•</span>
                <span>{new Date(video.published_at).toLocaleDateString()}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
