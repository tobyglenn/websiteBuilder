import showcases from '../data/games/showcases.json' with { type: 'json' };
import journal from '../data/games/journal.json' with { type: 'json' };
import media from '../data/games/media.json' with { type: 'json' };

const channels = new Set(['UC7ZfdS-b0zU-cE8Ie6NZVlQ', 'UCmSwMp2gPo5PGl32d4oCu-Q']);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const date = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0, 10) === value;
export function validateGameContent(games, entries, videos) {
  const gamesById = new Map(games.map(game => [game.slug, game]));
  const ids = new Set(); const versions = new Set(); const videoIds = new Set();
  for (const video of videos) {
    assert(!videoIds.has(video.id), `Duplicate media: ${video.id}`); videoIds.add(video.id);
    assert(gamesById.has(video.game), `Unknown media game: ${video.game}`);
    assert(video.public === true && date(video.verifiedAt), `Unverified media: ${video.id}`);
    assert(text(video.title) && date(video.publishedAt), `Incomplete media: ${video.id}`);
    if (video.provider === 'local') {
      assert(/^\/media\/games\/[a-z0-9-]+\.mp4$/.test(video.src), 'Invalid local video path');
      assert(/^\/images\/projects\/.+\.(jpg|webp|png)$/.test(video.poster), 'Missing video poster');
    } else {
      assert(/^[\w-]{11}$/.test(video.id) && channels.has(video.channelId), `Wrong video identity: ${video.id}`);
      assert(video.embeddable === true, `Video cannot be embedded: ${video.id}`);
    }
  }
  for (const entry of entries) {
    const game = gamesById.get(entry.game);
    assert(game, `Unknown game: ${entry.game}`);
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug) && !ids.has(entry.slug), `Invalid or duplicate slug: ${entry.slug}`); ids.add(entry.slug);
    assert(['release', 'making-of'].includes(entry.kind), 'Invalid journal kind');
    assert(date(entry.date) && text(entry.title) && text(entry.summary), `Incomplete entry: ${entry.slug}`);
    assert(entry.sections?.length > 0 && entry.sections.every(s => text(s.heading) && Array.isArray(s.paragraphs) && s.paragraphs.every(text) && (!s.bullets || s.bullets.every(text))), 'Invalid article sections');
    assert(entry.sources?.length > 0, 'Missing editorial evidence');
    for (const id of entry.mediaIds || []) assert(videos.some(v => v.id === id && v.game === entry.game), `Wrong or missing article media: ${id}`);
    if (entry.kind === 'release') {
      const r = entry.release; const key = `${entry.game}:${entry.version}`;
      assert(Number.isInteger(entry.version) && entry.version > 0 && !versions.has(key), `Duplicate or invalid release: ${key}`); versions.add(key);
      assert(r?.public === true && r.version === entry.version && r.placeId === game.placeId && r.universeId === game.universeId, `Unverified or wrong destination: ${key}`);
      assert(!Number.isNaN(Date.parse(r.verifiedAt)) && /^[a-f0-9]{40}$/.test(r.sourceCommit) && /^[a-f0-9]{64}$/.test(r.buildSha256), `Incomplete release receipt: ${key}`);
    }
  }
  for (const game of games) for (const id of game.mediaIds) assert(videos.some(v => v.id === id && v.game === game.slug), `Wrong showcase media: ${id}`);
  return true;
}
validateGameContent(showcases, journal, media);
export const games = showcases;
export const gameMedia = media;
export const entries = [...journal].sort((a, b) => b.date.localeCompare(a.date) || (b.version || 0) - (a.version || 0));
export const gameBySlug = (slug) => games.find(game => game.slug === slug);
export const storiesFor = (slug) => entries.filter(entry => entry.game === slug);
export const releasesFor = (slug) => storiesFor(slug).filter(entry => entry.kind === 'release').sort((a, b) => b.version - a.version);
export const mediaFor = (ids = []) => ids.map(id => media.find(video => video.id === id)).filter(Boolean);
export const journalHref = (entry) => `/games/journal/${entry.slug}/`;
export const gameHref = (game) => `/projects/${game.slug}/`;
export const playHref = (game) => `https://www.roblox.com/games/${game.placeId}/`;
export const formatDate = (value) => new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
