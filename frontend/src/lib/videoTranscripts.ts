import { isCurrentTranslation } from './videoTranscriptValidation.mjs';

export type TranscriptSegment = { text: string; start?: number; end?: number };
export const transcriptLanguages = { en: 'English', de: 'Deutsch', es: 'Español', pt: 'Português', hi: 'हिन्दी' };
const sources = import.meta.glob('../data/video-transcripts/*.json', { eager: true, import: 'default' });
const translations = import.meta.glob('../generated/video-transcripts/*/*.json', { eager: true, import: 'default' });
const legacy = import.meta.glob('../data/transcripts/*.txt', { eager: true, query: '?raw', import: 'default' });

export function getVideoTranscript(video, locale = 'en') {
  const source = sources[`../data/video-transcripts/${video.id}.json`] as any;
  if (locale !== 'en') {
    const translated = translations[`../generated/video-transcripts/${locale}/${video.id}.json`] as any;
    return translated?.locale === locale && isCurrentTranslation(source, translated, video.title) ? translated : null;
  }
  if (source) return { ...source, title: video.title };
  const raw = legacy[`../data/transcripts/${video.transcript_file}`] as string | undefined;
  const text = raw?.split('\n').filter(line => !/^(Title:|Date:|Video ID:|URL:|Source:|---)/.test(line)).join('\n').trim();
  return text ? { title: video.title, segments: [{ text }] } : null;
}

export function videoTranscriptLocales(video) {
  return ['en', ...Object.keys(transcriptLanguages).filter(locale => locale !== 'en' && getVideoTranscript(video, locale))];
}

export function videoTranscriptPath(id: string, locale = 'en') {
  return `${locale === 'en' ? '' : `/${locale}`}/video/${id}/`;
}
