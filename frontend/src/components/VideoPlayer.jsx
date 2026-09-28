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
    // Astro handles same-page anchors with history.pushState, which does not
    // emit hashchange. Own seek links before the router handles the click.
    const seekFromLink = (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('[data-video-seek]') : null;
      if (!link) return;
      const seconds = Number(link.getAttribute('data-seconds'));
      if (!Number.isFinite(seconds) || seconds < 0) return;
      event.preventDefault();
      setStartTime(seconds);
      window.location.hash = `t=${seconds}s`;
    };
    document.addEventListener('click', seekFromLink, true);

    return () => {
      window.removeEventListener('hashchange', updateStartTime);
      document.removeEventListener('click', seekFromLink, true);
    };
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
