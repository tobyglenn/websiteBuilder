const RSS_HEADERS = {
  "Content-Type": "application/rss+xml; charset=utf-8",
  "Cache-Control": "public, max-age=300",
};

export async function proxyPodcastFeed(sourceUrl: string): Promise<Response> {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    return new Response(`Failed to fetch podcast feed: ${res.status}`, {
      status: res.status,
      headers: RSS_HEADERS,
    });
  }

  return new Response(await res.text(), {
    status: 200,
    headers: RSS_HEADERS,
  });
}
