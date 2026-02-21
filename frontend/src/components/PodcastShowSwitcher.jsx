import { useState } from 'react';
import PodcastSubscribeButtons from './PodcastSubscribeButtons.jsx';

const OPENCLAW_SPOTIFY = 'https://open.spotify.com/show/5HTiRFhiGmS0PNTga7LsKr';
const OPENCLAW_APPLE = 'https://podcasts.apple.com/podcast/id1878697245';
const OPENCLAW_IHEART = 'https://iheart.com/podcast/324046562/';
const OPENCLAW_AMAZON = 'https://music.amazon.com/podcasts/b85209d2-776b-4ab3-9705-a2b6c6e9d6f1/openclaw-daily';

const FITNESS_SPOTIFY = 'https://open.spotify.com/show/03gk0rvNxpDWJKnNFB4mu2';
const FITNESS_APPLE = 'https://podcasts.apple.com/podcast/id1836037910';
const FITNESS_IHEART = 'https://www.iheart.com/podcast/269-toby-on-fitness-tech-291065725/';
const FITNESS_AMAZON = 'https://music.amazon.com/podcasts/0b8655b3-ecde-4762-9cf8-a78ef72030fd/toby-on-fitness-tech';

function EpisodeCard({ ep }) {
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
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`/podcasts/episode-${ep.episodeNum}/`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-all"
          >
            📄 Show Notes
          </a>
          <a
            href={`/podcasts/episode-${ep.episodeNum}/?tab=transcript`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-all"
          >
            📝 Transcript
          </a>
        </div>
      </div>
    </article>
  );
}

function FitnessEpisodeCard({ ep }) {
  return (
    <article className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:shadow-xl hover:shadow-green-400/5 hover:border-neutral-700 transition-all">
      <div className="flex gap-4 mb-4">
        <img
          src={ep.coverImage}
          alt="Toby on Fitness Tech"
          className="w-20 h-20 rounded-xl object-cover shrink-0 border border-neutral-700"
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="flex flex-col justify-center min-w-0">
          <span className="bg-green-400/10 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full self-start mb-2">💪 Fitness Tech</span>
          <h2 className="text-xl font-bold text-white leading-snug">{ep.title}</h2>
        </div>
      </div>
      <p className="text-neutral-400 text-sm leading-relaxed mb-3">{ep.description}</p>
      <p className="text-neutral-500 text-xs mb-4 flex items-center gap-2 flex-wrap">
        <span>{ep.pubDate}</span>
        {ep.duration && <><span>·</span><span>⏱ {ep.duration}</span></>}
      </p>
      <div className="mt-2">
        <a
          href={ep.audioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:scale-[1.01] mb-2"
        >
          🎧 Listen
        </a>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={ep.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-all"
          >
            🎵 Spotify
          </a>
          <a
            href="https://podcasts.apple.com/podcast/id1836037910"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-all"
          >
            🍎 Apple
          </a>
        </div>
      </div>
    </article>
  );
}

export default function PodcastShowSwitcher({
  episodes = [],
  fetchError = false,
  fitnessEpisodes = [],
  fitnessFetchError = false,
  pocketcastsUrl = null,
}) {
  const [activeShow, setActiveShow] = useState('openclaw');

  const tabs = [
    { id: 'openclaw', label: '🎙 OpenClaw Daily', rssUrl: 'https://tobyonfitnesstech.com/podcasts/feed.xml' },
    { id: 'fitness', label: '💪 Toby on Fitness Tech', rssUrl: 'https://anchor.fm/s/108bc95a4/podcast/rss' },
  ];

  const activeTab = tabs.find(t => t.id === activeShow);

  return (
    <div>
      {/* Show Switcher tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveShow(tab.id)}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all ${
              activeShow === tab.id
                ? 'bg-blue-400 text-neutral-950 border-blue-400'
                : 'bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RSS Feed URL display */}
      <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1">
          <p className="text-blue-400 text-sm font-semibold mb-1">📡 RSS Feed</p>
          <code className="text-neutral-300 text-xs break-all select-all">{activeTab?.rssUrl}</code>
        </div>
        <a
          href={activeTab?.rssUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Open Feed
        </a>
      </div>

      {/* Content area */}
      {activeShow === 'openclaw' ? (
        <div>
          <div className="mb-8">
            <PodcastSubscribeButtons
              spotifyUrl={OPENCLAW_SPOTIFY}
              appleUrl={OPENCLAW_APPLE}
              pocketcastsUrl={pocketcastsUrl}
              iheartUrl={OPENCLAW_IHEART}
              amazonUrl={OPENCLAW_AMAZON}
            />
          </div>

          {/* Hosts badge - OpenClaw Daily only */}
          <div className="mb-4 text-center">
            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm px-3 py-1 rounded-full inline-block">
              🎤 Hosts: Nova &amp; Alloy
            </span>
          </div>

          {fetchError ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
              <p className="text-neutral-400 text-sm">⚠️ Episodes temporarily unavailable. Please check back soon.</p>
            </div>
          ) : episodes.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
              <p className="text-neutral-400 text-sm">No episodes found in the feed yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {episodes.map(ep => (
                <EpisodeCard key={ep.episodeNum} ep={ep} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-8">
            <PodcastSubscribeButtons
              spotifyUrl={FITNESS_SPOTIFY}
              appleUrl={FITNESS_APPLE}
              iheartUrl={FITNESS_IHEART}
              amazonUrl={FITNESS_AMAZON}
            />
          </div>
          {fitnessFetchError ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
              <p className="text-neutral-400 text-sm">⚠️ Episodes temporarily unavailable. Please check back soon.</p>
            </div>
          ) : fitnessEpisodes.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
              <p className="text-neutral-400 text-sm">No episodes found yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fitnessEpisodes.map(ep => (
                <FitnessEpisodeCard key={ep.index} ep={ep} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
