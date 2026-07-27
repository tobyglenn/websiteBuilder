const DEFAULT_MAX_LENGTH = 160;
const MIN_USEFUL_LENGTH = 40;

const decodeEntities = (value: string): string => value
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#(?:39|x27);/gi, "'")
  .replace(/&apos;/gi, "'");

const extractSection = (notes: string, heading: string): string => {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = notes.match(
    new RegExp(`^##\\s+${escapedHeading}\\s*\\n([\\s\\S]*?)(?=^##\\s|\\s*$)`, 'im'),
  );
  return match?.[1]?.trim() || '';
};

const extractInlineField = (notes: string, label: string): string => {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = notes.match(
    new RegExp(`^\\*\\*${escapedLabel}:\\*\\*\\s*(.+?)\\s*$`, 'im'),
  );
  return match?.[1]?.trim() || '';
};

const isTimestampHeading = (line: string): boolean =>
  /^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*(?:[-:–—]\s*)?(?:intro|hook|story|section|chapter|outro|conclusion|sponsor)\b/i.test(line);

export const sanitizePodcastSummary = (value: string): string => {
  const withoutMarkup = decodeEntities(value || '')
    .replace(/<!\[CDATA\[|\]\]>/g, ' ')
    .replace(/```(?:\w+)?/g, '\n')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  return withoutMarkup
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !isTimestampHeading(line))
    .filter((line) => !/^(?:#{1,6}\s*)?(?:show notes?|full transcript|chapters?|links?|sources?)\s*:?\s*$/i.test(line))
    .filter((line) => !/^(?:agentstack|openclaw)\s+daily\b.*\bepisode\s+\d+/i.test(line))
    .filter((line) => !/^show notes?\s*:\s*https?:\/\//i.test(line))
    .map((line) => line
      .replace(/^#{1,6}\s*/, '')
      .replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/, '')
      .replace(/\*\*|__|`/g, '')
      .replace(/https?:\/\/\S+/gi, ' '))
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim();
};

export const compactPodcastSummary = (
  value: string,
  maxLength = DEFAULT_MAX_LENGTH,
): string => {
  const clean = sanitizePodcastSummary(value);
  if (clean.length <= maxLength) return clean;

  const window = clean.slice(0, maxLength + 1);
  const sentenceEnds = [...window.matchAll(/[.!?](?=\s|$)/g)]
    .map((match) => (match.index || 0) + 1)
    .filter((index) => index >= 110 && index <= maxLength);

  if (sentenceEnds.length) {
    return clean.slice(0, sentenceEnds.at(-1)).trim();
  }

  const wordSafe = clean
    .slice(0, Math.max(1, maxLength - 3))
    .replace(/\s+\S*$/, '')
    .replace(/[\s,:;/-]+$/, '');
  return `${wordSafe}...`;
};

interface PodcastMetaInput {
  title: string;
  description?: string;
  showNotes?: string;
  maxLength?: number;
}

export const buildPodcastMetaDescription = ({
  title,
  description = '',
  showNotes = '',
  maxLength = DEFAULT_MAX_LENGTH,
}: PodcastMetaInput): string => {
  const candidates = [
    extractSection(showNotes, 'Feed Description'),
    extractInlineField(showNotes, 'Feed description'),
    extractSection(showNotes, 'Tagline'),
    extractInlineField(showNotes, 'Tagline'),
    description,
  ];

  for (const candidate of candidates) {
    const compact = compactPodcastSummary(candidate, maxLength);
    if (compact.length >= MIN_USEFUL_LENGTH) return compact;
  }

  const normalizedTitle = sanitizePodcastSummary(title)
    .replace(/^(?:episode\s*)?\d+\s*[:\-–]\s*/i, '');
  return compactPodcastSummary(
    `${normalizedTitle}. AgentStack Daily explains the key updates and why they matter.`,
    maxLength,
  );
};
