import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const sourceUrl = process.env.FITNESS_PODCAST_FEED_URL
  || 'https://anchor.fm/s/108bc95a4/podcast/rss';
const outputPath = resolve(
  process.env.TOFT_FITNESS_PODCAST_FEED_SNAPSHOT
    || '.cache/fitness-podcast-feed.xml',
);
const temporaryPath = `${outputPath}.${process.pid}.tmp`;

const response = await fetch(sourceUrl, {
  headers: { 'user-agent': 'TobyOnFitnessTech build/1.0' },
});
if (!response.ok) {
  throw new Error(`Fitness podcast RSS returned HTTP ${response.status}`);
}

const xml = await response.text();
const itemCount = (xml.match(/<item>/g) || []).length;
if (!/<rss\b/i.test(xml) || !/<channel>/i.test(xml) || itemCount === 0) {
  throw new Error(`Fitness podcast RSS is malformed or empty (${itemCount} items)`);
}

await mkdir(dirname(outputPath), { recursive: true });
try {
  await writeFile(temporaryPath, xml, 'utf8');
  await rename(temporaryPath, outputPath);
} finally {
  await rm(temporaryPath, { force: true });
}

console.log(`Snapshotted ${itemCount} fitness podcast episodes to ${outputPath}`);
