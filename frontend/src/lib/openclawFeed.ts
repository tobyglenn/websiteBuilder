function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export function extractTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i",
  );
  const m = xml.match(re);
  return decodeXmlEntities((m ? (m[1] ?? m[2] ?? "") : "").trim());
}

export function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

export function extractChannelItems(xml: string): string[] {
  const channelMatch = xml.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i);
  const channelXml = channelMatch ? channelMatch[1] : xml;
  return channelXml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];
}

const pinnedRepoShaCache = new Map<string, Promise<string>>();

const GITHUB_AUTH_HOSTS = new Set(['api.github.com', 'raw.githubusercontent.com']);

export function githubRequestHeaders(
  url: string,
  accept: string,
  userAgent: string,
  token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '',
): Record<string, string> {
  const hostname = new URL(url).hostname;
  return {
    Accept: accept,
    'User-Agent': userAgent,
    ...(token && GITHUB_AUTH_HOSTS.has(hostname)
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
}

export function githubRawFallbackUrls(sourceUrl: string): string[] {
  const match = sourceUrl.match(
    /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/,
  );
  if (!match) return [sourceUrl];
  const [, owner, repo, ref, path] = match;
  return [
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
    sourceUrl,
    `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${ref}/${path}`,
  ];
}

export async function resolvePinnedGitHubRawUrl(sourceUrl: string): Promise<string> {
  const match = sourceUrl.match(
    /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/main\/(.+)$/,
  );
  if (!match) return sourceUrl;

  const [, owner, repo, path] = match;
  try {
    const repoKey = `${owner}/${repo}`;
    let shaPromise = pinnedRepoShaCache.get(repoKey);
    if (!shaPromise) {
      shaPromise = (async () => {
        const commitUrl = `https://api.github.com/repos/${owner}/${repo}/commits/main`;
        const commitRes = await fetch(commitUrl, {
          headers: githubRequestHeaders(
            commitUrl,
            'application/vnd.github+json',
            'websiteBuilder-openclaw-feed',
          ),
        });
        if (!commitRes.ok) return "";
        const commitData = await commitRes.json();
        return typeof commitData?.sha === "string" ? commitData.sha : "";
      })();
      pinnedRepoShaCache.set(repoKey, shaPromise);
    }
    const sha = await shaPromise;
    if (!sha) return sourceUrl;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${path}`;
  } catch {
    return sourceUrl;
  }
}

export async function fetchPinnedGitHubRawText(sourceUrl: string): Promise<string> {
  const pinnedUrl = await resolvePinnedGitHubRawUrl(sourceUrl);
  const candidates = [...new Set([
    ...githubRawFallbackUrls(pinnedUrl),
    ...githubRawFallbackUrls(sourceUrl),
  ])];
  const failures: string[] = [];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: githubRequestHeaders(
          url,
          'application/vnd.github.raw+json,application/vnd.github.v3.raw,application/xml,text/xml,text/plain,*/*',
          'websiteBuilder-openclaw-feed',
        ),
      });
      if (res.ok) return await res.text();
      failures.push(`${new URL(url).hostname}: HTTP ${res.status}`);
    } catch (error) {
      failures.push(`${new URL(url).hostname}: ${String(error)}`);
    }
  }

  throw new Error(`Podcast feed fetch failed (${failures.join('; ')})`);
}

export function parseEpisodeNumber(itemXml: string): number {
  const fromTag = parseInt(extractTag(itemXml, "itunes:episode"), 10);
  if (!Number.isNaN(fromTag)) return fromTag;

  const title = extractTag(itemXml, "title");
  const titleMatch = title.match(/\b(\d+)\b/);
  return titleMatch ? parseInt(titleMatch[1], 10) : 0;
}

export function hasEpisode(items: string[], episodeNum: number): boolean {
  return items.some((item) => parseEpisodeNumber(item) === episodeNum);
}

export async function ensureEpisodeFromFallbackFeed(
  items: string[],
  episodeNum: number,
  fallbackFeedUrl = "https://raw.githubusercontent.com/grayking-creator/openclaw-podcast/main/feed.xml",
): Promise<string[]> {
  if (hasEpisode(items, episodeNum)) return items;

  try {
    const xml = await fetchPinnedGitHubRawText(fallbackFeedUrl);
    const fallbackItems = extractChannelItems(xml);
    const fallbackItem = fallbackItems.find(
      (item) => parseEpisodeNumber(item) === episodeNum,
    );

    if (!fallbackItem) return items;
    return [...items, fallbackItem];
  } catch {
    return items;
  }
}

export function normalizeEpisodeTitle(rawTitle: string): string {
  return rawTitle
    .replace(/^(?:Episode|Episodio|Episódio|Folge|एपिसोड)\s+\d+\s*[:\-–]\s*/i, "")
    .trim();
}

export function normalizeRepoTextPath(path: string): string {
  return `https://raw.githubusercontent.com/grayking-creator/openclaw-podcast/main/${path}`;
}

export async function fetchFirstAvailableText(
  urls: string[],
): Promise<{ url: string; text: string } | null> {
  for (const url of urls) {
    try {
      const fetchUrl = url.includes("raw.githubusercontent.com/")
        ? await resolvePinnedGitHubRawUrl(url)
        : url;
      const res = await fetch(fetchUrl);
      if (!res.ok) continue;
      return { url, text: await res.text() };
    } catch {
      // Try next candidate path.
    }
  }
  return null;
}

export function englishTranscriptCandidates(episodeNum: number): string[] {
  const ep = String(episodeNum).padStart(3, "0");
  const paths: string[] = [];

  // Legacy / special-case filenames
  if (episodeNum === 1) {
    paths.push("episode_001_full_v2.md", "episode_001_script.md", "episode_001.md");
  }
  if (episodeNum === 4) {
    paths.push("episode_004_transcript.md", "episode_004.md");
  }

  // Newer episodes store transcripts under /episodes/
  paths.push(`episodes/episode_${ep}_transcript.md`);

  // Fallback: some episodes have transcript embedded in episode_XXX.md
  paths.push(`episode_${ep}.md`);

  return [...new Set(paths)].map(normalizeRepoTextPath);
}

export function englishShowNotesCandidates(episodeNum: number): string[] {
  const ep = String(episodeNum).padStart(3, "0");
  const paths: string[] = [];

  // Preferred show notes filename (if present)
  paths.push(`show_notes_episode_${ep}.md`);

  // Fallback: many episodes use episode_XXX.md as show notes
  paths.push(`episode_${ep}.md`);

  return [...new Set(paths)].map(normalizeRepoTextPath);
}

export function localizedTranscriptCandidates(
  langCode: string,
  episodeNum: number,
): string[] {
  const ep = String(episodeNum).padStart(3, "0");
  const paths: string[] = [
    `translations/${langCode}/episode_${ep}_${langCode}.md`,
    `translations/${langCode}/episode_${ep}_${langCode}_nova.md`,
    `content_staging/translations/episode_${ep}_${langCode}.md`,
    `content_staging/translations/episode_${ep}_${langCode}_nova.md`,
    `episodes/episode_${ep}_${langCode}.md`,
    `episodes/episode_${ep}_${langCode}_nova.md`,
    `episode_${ep}_${langCode}.md`,
  ];
  return [...new Set(paths)].map(normalizeRepoTextPath);
}

export function localizedShowNotesCandidates(
  langCode: string,
  episodeNum: number,
): string[] {
  const ep = String(episodeNum).padStart(3, "0");
  const paths: string[] = [
    `translations/${langCode}/show_notes_episode_${ep}_${langCode}.md`,
  ];

  if (episodeNum === 0) {
    paths.push(`translations/${langCode}/show_notes_all_${langCode}.md`);
  }

  return [...new Set(paths)].map(normalizeRepoTextPath);
}
