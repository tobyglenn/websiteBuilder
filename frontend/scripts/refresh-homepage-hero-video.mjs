import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.resolve(__dirname, '../src/data/homepageHeroVideo.json');
const VIDEOS_JSON = path.resolve(__dirname, '../src/data/videos.json');
const CHANNEL_ID = process.env.HOMEPAGE_HERO_YOUTUBE_CHANNEL_ID ?? 'UCmSwMp2gPo5PGl32d4oCu-Q';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

function decodeXml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractRequired(text, regex, label) {
  const match = text.match(regex);
  if (!match) {
    throw new Error(`Could not find ${label}`);
  }
  return match[1];
}

function parseFeedEntries(feedXml) {
  return [...feedXml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => {
    const entryXml = match[1];
    const id = extractRequired(entryXml, /<yt:videoId>([^<]+)<\/yt:videoId>/, 'video id');
    const title = decodeXml(extractRequired(entryXml, /<title>([\s\S]*?)<\/title>/, 'video title').trim());
    const description = decodeXml(
      extractRequired(entryXml, /<media:description>([\s\S]*?)<\/media:description>/, 'video description').trim()
    );
    const publishedAt = extractRequired(entryXml, /<published>([^<]+)<\/published>/, 'published time');
    const url = extractRequired(entryXml, /<link rel="alternate" href="([^"]+)"/, 'video url');
    const thumbnail = extractRequired(entryXml, /<media:thumbnail url="([^"]+)"/, 'thumbnail url');
    const viewCountText = extractRequired(entryXml, /<media:statistics views="([^"]+)"/, 'view count');

    return {
      id,
      title,
      description,
      publishedAt,
      url,
      thumbnail,
      viewCount: Number(viewCountText || 0),
      is_short: /\/shorts\//.test(url),
      is_live: /\/live\//.test(url) || /\blive\b/i.test(title),
    };
  });
}

async function getFallbackFromVideosJson() {
  try {
    const raw = await readFile(VIDEOS_JSON, 'utf8');
    const data = JSON.parse(raw);
    const videos = data.videos || [];
    const longForm = videos.find((v) => !v.is_short && !v.is_live);
    if (!longForm) return null;
    return {
      id: longForm.id,
      title: longForm.title,
      description: longForm.description || longForm.title,
      publishedAt: longForm.publishedAt || longForm.published_at || '',
      url: `https://www.youtube.com/watch?v=${longForm.id}`,
      thumbnail: longForm.thumbnail || `https://i.ytimg.com/vi/${longForm.id}/hqdefault.jpg`,
      viewCount: longForm.viewCount || longForm.view_count || 0,
      is_short: false,
      is_live: false,
    };
  } catch {
    return null;
  }
}

async function main() {
  let featuredVideo = null;

  try {
    const response = await fetch(FEED_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${FEED_URL}: ${response.status}`);
    }

    const feedXml = await response.text();
    const entries = parseFeedEntries(feedXml);
    featuredVideo = entries.find((entry) => !entry.is_short && !entry.is_live);

    if (!featuredVideo) {
      console.warn('No long-form video found in RSS feed (all recent uploads may be Shorts) — falling back to videos.json');
    }
  } catch (error) {
    console.warn(`RSS fetch failed — falling back to videos.json: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!featuredVideo) {
    featuredVideo = await getFallbackFromVideosJson();
  }

  if (!featuredVideo) {
    throw new Error('Could not find a long-form homepage hero video in feed or videos.json');
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    feedUrl: FEED_URL,
    channelId: CHANNEL_ID,
    video: featuredVideo,
  };

  await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(
    `Updated homepage hero video to ${featuredVideo.id}: ${featuredVideo.title} (${featuredVideo.publishedAt})`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
