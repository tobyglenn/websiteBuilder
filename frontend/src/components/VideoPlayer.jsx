import React, { useEffect, useMemo, useState } from 'react';

export default function VideoPlayer({ videoId }) {
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    const updateStartTime = () => {
      const hash = window.location.hash || '';
      const match = hash.match(/#t=(\d+)s?/i);
      setStartTime(match ? Number(match[1]) : 0);
    };

    updateStartTime();
    window.addEventListener('hashchange', updateStartTime);

    return () => window.removeEventListener('hashchange', updateStartTime);
  }, []);

  const src = useMemo(() => {
    if (!videoId) return '';
    const startParam = startTime > 0 ? `&start=${startTime}` : '';
    const origin = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
    return `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=0&enablejsapi=1${origin}${startParam}`;
  }, [videoId, startTime]);

  if (!videoId) return null;

  return (
    <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl shadow-2xl bg-black" data-video-location="video_detail">
      <iframe
        key={startTime}
        className="absolute top-0 left-0 w-full h-full"
        src={src}
        title="YouTube video player"
        data-analytics-video-id={videoId}
        data-analytics-start-time={startTime}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </div>
  );
}
