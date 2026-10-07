import { fetchPinnedGitHubRawText } from './openclawFeed';

const RSS_HEADERS = {
  "Content-Type": "application/rss+xml; charset=utf-8",
  "Cache-Control": "public, max-age=300",
};

// Declares this domain's feed URL as the canonical address by injecting an
// <atom:link rel="self"> tag into the channel element. The same feed bytes are
// also served from grayking-creator.github.io; without this tag Google picks
// the GitHub copy as canonical ("Duplicate without user-selected canonical").
function injectSelfLink(xml: string, selfUrl: string): string {
  const withoutOld = xml.replace(
    /<atom:link\b[^>]*\brel=["']self["'][^>]*\/?>/gi,
    ""
  );
  const tag = `<atom:link href="${selfUrl}" rel="self" type="application/rss+xml" />`;
  return withoutOld.replace(/<channel(\s[^>]*)?>/i, (m) => `${m}\n    ${tag}`);
}

export async function proxyPodcastFeed(
  sourceUrl: string,
  selfUrl?: string
): Promise<Response> {
  try {
    let xml = await fetchPinnedGitHubRawText(sourceUrl);
    if (selfUrl) {
      xml = injectSelfLink(xml, selfUrl);
    }
    return new Response(xml, {
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
