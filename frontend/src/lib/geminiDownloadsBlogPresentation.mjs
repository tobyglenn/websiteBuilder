// Only the exact approved article/image pair receives this presentation.
export const GEMINI_DOWNLOADS_SLUG = 'gemini-antigravity-organize-downloads';
export const GEMINI_DOWNLOADS_IMAGE = '/images/blog/gemini-antigravity-organize-downloads.png';

export function usesGeminiDownloadsImage(post) {
  return post?.slug === GEMINI_DOWNLOADS_SLUG && post?.image === GEMINI_DOWNLOADS_IMAGE;
}

export function geminiDownloadsImageStyle(post) {
  return usesGeminiDownloadsImage(post)
    ? 'object-fit: contain; object-position: center; transform: none'
    : undefined;
}

export const geminiDownloadsArtwork = {
  en: {
    alt: 'Illustration of organized folders and image files',
    caption: 'AI-generated illustration.',
  },
  de: {
    alt: 'Illustration von geordneten Ordnern und Bilddateien.',
    caption: 'KI-generierte Illustration.',
  },
  es: {
    alt: 'Ilustración de carpetas y archivos de imagen organizados.',
    caption: 'Ilustración generada por IA.',
  },
  pt: {
    alt: 'Ilustração de pastas e arquivos de imagem organizados.',
    caption: 'Ilustração gerada por IA.',
  },
  hi: {
    alt: 'व्यवस्थित फ़ोल्डरों और इमेज फ़ाइलों का चित्रण।',
    caption: 'एआई से बनाया गया चित्रण।',
  },
};
