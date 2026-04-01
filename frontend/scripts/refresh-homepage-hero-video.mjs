import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.resolve(__dirname, '../src/data/homepageHeroVideo.json');
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

async function main() {
  const response = await fetch(FEED_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${FEED_URL}: ${response.status}`);
  }

  const feedXml = await response.text();
  const entries = parseFeedEntries(feedXml);
  const featuredVideo =
    entries.find((entry) => !entry.is_short && !entry.is_live) ??
    entries.find((entry) => !entry.is_short) ??
    entries[0];

  if (!featuredVideo) {
    throw new Error('Could not find a homepage hero video in the channel feed');
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
