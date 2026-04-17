const RSS_HEADERS = {
  "Content-Type": "application/rss+xml; charset=utf-8",
  "Cache-Control": "public, max-age=300",
};

async function resolvePinnedGitHubRawUrl(sourceUrl: string): Promise<string> {
  const match = sourceUrl.match(
    /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/main\/(.+)$/,
  );
  if (!match) {
    return sourceUrl;
  }

  const [, owner, repo, path] = match;
  const commitRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/main`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "websiteBuilder-podcast-feed",
      },
    },
  );
  if (!commitRes.ok) {
    return sourceUrl;
  }

  const commitData = await commitRes.json();
  const sha = typeof commitData?.sha === "string" ? commitData.sha : "";
  if (!sha) {
    return sourceUrl;
  }

  return `https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${path}`;
}

export async function proxyPodcastFeed(sourceUrl: string): Promise<Response> {
  const pinnedUrl = await resolvePinnedGitHubRawUrl(sourceUrl);
  const res = await fetch(pinnedUrl);
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
