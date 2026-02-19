import React from 'react';

export default function VideoPlayer({ videoId }) {
  if (!videoId) return null;

  return (
    <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl shadow-2xl bg-black">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&mute=0`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </div>
  );
}
