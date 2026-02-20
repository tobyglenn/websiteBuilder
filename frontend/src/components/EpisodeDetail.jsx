import { useState, useEffect } from 'react';

export default function EpisodeDetail({ episode }) {
  const [activeTab, setActiveTab] = useState('shownotes');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'transcript') setActiveTab('transcript');
  }, []);

  return (
    <div className="min-h-screen">
      {/* Back nav */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <a href="/podcasts" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
          All Episodes
        </a>
      </div>

      {/* Hero */}
      <header className="max-w-4xl mx-auto px-4 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-4 text-xs text-neutral-500 font-mono">
          <span className="text-blue-400 font-bold tracking-widest uppercase">Episode {episode.number}</span>
          <span>·</span>
          <span>{episode.date}</span>
          <span>·</span>
          <span>{episode.duration}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight mb-4">
          {episode.title}
        </h1>

        <p className="text-neutral-300 text-lg leading-relaxed max-w-2xl mb-8">
          {episode.description}
        </p>

        <a
          href={episode.audioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>🎧</span> Listen to Episode
        </a>
      </header>

      {/* Sticky tab bar */}
      <div className="sticky top-16 z-20 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            {[
              { id: 'shownotes', label: '📄 Show Notes' },
              { id: 'transcript', label: '📝 Full Transcript' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {activeTab === 'shownotes' ? (
          <ShowNotes episode={episode} />
        ) : (
          <FullTranscript episode={episode} />
        )}
      </div>
    </div>
  );
}

function SectionHeading({ icon, label }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-lg">{icon}</span>
      <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400">{label}</h2>
      <div className="flex-1 h-px bg-neutral-800" />
    </div>
  );
}

function ShowNotes({ episode }) {
  return (
    <div className="space-y-12">
      {episode.showNotesHtml ? (
        <div
          className="show-notes-content prose prose-invert prose-sm max-w-none text-neutral-300"
          dangerouslySetInnerHTML={{ __html: episode.showNotesHtml }}
        />
      ) : (
        <>
          {/* Topics */}
          {episode.topics.length > 0 && (
            <section>
              <SectionHeading icon="🏷️" label="Topics Covered" />
              <div className="flex flex-wrap gap-2">
                {episode.topics.map((topic, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-950 to-purple-950 border border-blue-800/50 text-blue-300">
                    {topic}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Links */}
          {episode.links.length > 0 && (
            <section>
              <SectionHeading icon="🔗" label="Links & Resources" />
              <div className="flex flex-col gap-3">
                {episode.links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                     className="group flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-blue-800 transition-all duration-200">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-neutral-100 group-hover:text-blue-400 transition-colors truncate">{link.title}</div>
                      <div className="text-xs text-neutral-500 font-mono truncate mt-0.5">{link.url}</div>
                    </div>
                    <span className="shrink-0 text-neutral-600 group-hover:text-blue-400 transition-all group-hover:translate-x-0.5">↗</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Fallback if nothing extracted */}
          {episode.topics.length === 0 && episode.links.length === 0 && (
            <p className="text-neutral-500 text-sm">Show notes coming soon.</p>
          )}
        </>
      )}
    </div>
  );
}

function FullTranscript({ episode }) {
  return (
    <div>
      <div
        className="max-w-[65ch] text-neutral-300 text-[1.0625rem] leading-[1.85] transcript-content"
        dangerouslySetInnerHTML={{ __html: episode.transcriptHtml }}
      />

      <div className="mt-16 pt-8 border-t border-neutral-800 flex items-center justify-between">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          ↑ Back to top
        </button>
        <a href={episode.mdUrl} download
           className="px-4 py-2 rounded-lg text-sm bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-100 hover:border-neutral-600 transition-all">
          ⬇ Download Transcript
        </a>
      </div>
    </div>
  );
}
