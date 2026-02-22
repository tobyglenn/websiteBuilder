export default function PodcastEpisodeCard({ ep }) {
  return (
    <article className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:shadow-xl hover:shadow-blue-400/5 hover:border-neutral-700 transition-all">
      {/* Cover art + meta row */}
      <div className="flex gap-4 mb-4">
        <img
          src={ep.coverImage}
          alt={`Episode ${ep.episodeNum} cover art`}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-neutral-700"
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="flex flex-col justify-center min-w-0">
          <span className="bg-blue-400/10 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full self-start mb-2">
            EP {ep.episodeNum}
          </span>
          <h2 className="text-xl font-bold text-white leading-snug">
            {ep.title.replace(/^Episode \d+:\s*/i, '')}
          </h2>
        </div>
      </div>
      {/* Description */}
      <p className="text-neutral-400 text-sm leading-relaxed mb-3">
        {ep.description}
      </p>
      {/* Meta */}
      <p className="text-neutral-500 text-xs mb-4 flex items-center gap-2 flex-wrap">
        <span>{ep.pubDate}</span>
        {ep.duration && (
          <>
            <span>·</span>
            <span>⏱ {ep.duration}</span>
          </>
        )}
      </p>
      {/* Actions */}
      <div className="mt-2">
        <a
          href={ep.audioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:scale-[1.01] mb-2"
        >
          🎧 Listen
        </a>
      </div>
    </article>
  );
}