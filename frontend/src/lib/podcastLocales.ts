import { extractChannelItems, fetchPinnedGitHubRawText, parseEpisodeNumber } from './openclawFeed';

const feeds = new Map<string, Promise<Set<number>>>();

// Use the same pinned feeds as the localized routes; a new episode must not
// advertise translations before they exist, and no episode cutoff should age out.
export async function podcastTranslationLocales(slug: string): Promise<string[]> {
  const number = Number(slug.replace(/^episode-/, ''));
  const translated = await Promise.all(['es', 'pt', 'hi', 'de'].map(async locale => {
    if (!feeds.has(locale)) {
      feeds.set(locale, fetchPinnedGitHubRawText(
        `https://raw.githubusercontent.com/grayking-creator/openclaw-podcast/main/translations/feed_${locale}.xml`
      ).then(xml => new Set([0, ...extractChannelItems(xml).map(parseEpisodeNumber)])));
    }
    return (await feeds.get(locale))?.has(number) ? locale : null;
  }));
  return ['en', ...translated.filter((locale): locale is string => Boolean(locale))];
}
