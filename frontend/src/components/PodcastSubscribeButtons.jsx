export default function PodcastSubscribeButtons({ spotifyUrl, appleUrl, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {spotifyUrl && (
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm text-white transition-all duration-200 hover:scale-105 hover:shadow-lg bg-[#1DB954]"
          style={{ '--tw-shadow-color': 'rgba(29,185,84,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(29,185,84,0.30)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Spotify
        </a>
      )}
      {appleUrl && (
        <a
          href={appleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm text-white transition-all duration-200 hover:scale-105 hover:shadow-lg bg-[#872EC4]"
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(135,46,196,0.30)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.217c4.293 0 7.783 3.49 7.783 7.783S16.293 19.783 12 19.783 4.217 16.293 4.217 12 7.707 4.217 12 4.217zm0 2.61a5.173 5.173 0 100 10.346A5.173 5.173 0 0012 6.827zm0 2.61a2.564 2.564 0 110 5.128 2.564 2.564 0 010-5.128zm-4.391 8.52a.782.782 0 01.782.783v1.043a.782.782 0 11-1.565 0V18.74a.782.782 0 01.783-.783zm8.782 0a.782.782 0 01.783.783v1.043a.782.782 0 11-1.565 0V18.74a.782.782 0 01.782-.783z"/>
          </svg>
          Apple Podcasts
        </a>
      )}
    </div>
  );
}
