import React, { useState } from 'react';

export default function Chapters({ chapters, onChapterClick }) {
  const [activeChapter, setActiveChapter] = useState(null);

  if (!chapters || chapters.length === 0) {
    return null;
  }

  const handleChapterClick = (chapter) => {
    setActiveChapter(chapter.seconds);
    if (onChapterClick) {
      onChapterClick(chapter);
    }
    // Update the iframe src by dispatching a custom event
    window.dispatchEvent(new CustomEvent('seekToChapter', { detail: { seconds: chapter.seconds } }));
  };

  return (
    <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 mt-4">
      <h3 className="font-semibold mb-3 text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        Chapters
      </h3>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {chapters.map((chapter, index) => (
          <button
            key={index}
            onClick={() => handleChapterClick(chapter)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-neutral-800 transition-colors group"
          >
            <span className="text-blue-400 font-mono text-sm min-w-[60px] group-hover:text-blue-300">
              {chapter.time}
            </span>
            <span className="text-neutral-300 text-sm group-hover:text-white truncate">
              {chapter.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
