import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const podcastPages = [
  'src/pages/podcasts/fitness-tech.astro',
  'src/pages/podcasts/[slug].astro',
  'src/pages/de/podcasts/fitness-tech.astro',
  'src/pages/es/podcasts/fitness-tech.astro',
  'src/pages/pt/podcasts/fitness-tech.astro',
  'src/pages/hi/podcasts/fitness-tech.astro',
];

test('production builds snapshot the fitness podcast feed before Astro', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

  assert.match(packageJson.scripts.build, /^npm run snapshot:fitness-podcast-feed /);
  assert.match(packageJson.scripts.build, /TOFT_FITNESS_PODCAST_FEED_SNAPSHOT=/);
});

test('every fitness podcast page reads the shared feed snapshot', async () => {
  for (const path of podcastPages) {
    const source = await readFile(path, 'utf8');
    assert.match(source, /getFitnessPodcastFeedXml/, `${path} must use the shared feed reader`);
    assert.doesNotMatch(source, /fetch\(FITNESS_FEED\)/, `${path} must not fetch its own feed`);
  }
});
