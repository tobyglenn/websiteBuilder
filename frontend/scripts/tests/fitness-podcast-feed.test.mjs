import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const frontendRoot = new URL('../../', import.meta.url);

const podcastPages = [
  'src/pages/podcasts/fitness-tech.astro',
  'src/pages/podcasts/[slug].astro',
  'src/pages/de/podcasts/fitness-tech.astro',
  'src/pages/es/podcasts/fitness-tech.astro',
  'src/pages/pt/podcasts/fitness-tech.astro',
  'src/pages/hi/podcasts/fitness-tech.astro',
];

test('production builds snapshot the fitness podcast feed before Astro', async () => {
  const packageJson = JSON.parse(await readFile(new URL('package.json', frontendRoot), 'utf8'));

  const steps = packageJson.scripts.build.split(' && ');
  const snapshot = steps.findIndex((step) => step === 'npm run snapshot:fitness-podcast-feed');
  const build = steps.findIndex((step) => /\bastro build$/.test(step));
  assert.ok(snapshot >= 0 && build > snapshot, 'snapshot must run before Astro, after any build preparation');
  assert.match(packageJson.scripts.build, /TOFT_FITNESS_PODCAST_FEED_SNAPSHOT=/);
});

test('every fitness podcast page reads the shared feed snapshot', async () => {
  for (const path of podcastPages) {
    const source = await readFile(new URL(path, frontendRoot), 'utf8');
    assert.match(source, /getFitnessPodcastFeedXml/, `${path} must use the shared feed reader`);
    assert.doesNotMatch(source, /fetch\(FITNESS_FEED\)/, `${path} must not fetch its own feed`);
  }
});
