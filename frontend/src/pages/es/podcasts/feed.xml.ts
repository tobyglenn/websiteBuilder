import { proxyPodcastFeed } from '../../../lib/podcastFeedProxy';

export async function GET() {
  return proxyPodcastFeed(
    'https://raw.githubusercontent.com/grayking-creator/openclaw-podcast/main/translations/feed_es.xml',
  );
}
