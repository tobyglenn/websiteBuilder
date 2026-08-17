import { fetchPinnedGitHubRawText } from './openclawFeed';

const RSS_HEADERS = {
  "Content-Type": "application/rss+xml; charset=utf-8",
  "Cache-Control": "public, max-age=300",
};

export async function proxyPodcastFeed(sourceUrl: string): Promise<Response> {
  try {
    return new Response(await fetchPinnedGitHubRawText(sourceUrl), {
      status: 200,
      headers: RSS_HEADERS,
    });
  } catch (error) {
    return new Response(`Failed to fetch podcast feed: ${String(error)}`, {
      status: 502,
      headers: RSS_HEADERS,
    });
  }
}
