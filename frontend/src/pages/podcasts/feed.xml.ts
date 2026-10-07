import { proxyPodcastFeed } from '../../lib/podcastFeedProxy';

export async function GET() {
  return proxyPodcastFeed(
    'https://raw.githubusercontent.com/grayking-creator/openclaw-podcast/main/feed.xml',
    'https://tobyonfitnesstech.com/podcasts/feed.xml',
  );
}
