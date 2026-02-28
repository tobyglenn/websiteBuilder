export function extractTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i",
  );
  const m = xml.match(re);
  return (m ? (m[1] ?? m[2] ?? "") : "").trim();
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
  fallbackFeedUrl = "https://grayking-creator.github.io/openclaw-podcast/feed.xml",
): Promise<string[]> {
  if (hasEpisode(items, episodeNum)) return items;

  try {
    const res = await fetch(fallbackFeedUrl);
    if (!res.ok) return items;

    const xml = await res.text();
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
      const res = await fetch(url);
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

  if (episodeNum === 1) {
    paths.push("episode_001_full_v2.md", "episode_001_script.md", "episode_001.md");
  }
  if (episodeNum === 4) {
    paths.push("episode_004_transcript.md", "episode_004.md");
  }

  paths.push(`episode_${ep}.md`);
  return [...new Set(paths)].map(normalizeRepoTextPath);
}

export function englishShowNotesCandidates(episodeNum: number): string[] {
  const ep = String(episodeNum).padStart(3, "0");
  const paths: string[] = [`show_notes_episode_${ep}.md`];
  return [...new Set(paths)].map(normalizeRepoTextPath);
}

export function localizedTranscriptCandidates(
  langCode: string,
  episodeNum: number,
): string[] {
  const ep = String(episodeNum).padStart(3, "0");
  const paths: string[] = [
    `translations/${langCode}/episode_${ep}_${langCode}.md`,
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
