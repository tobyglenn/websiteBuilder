import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeSourceHash,
  extractJsonObject,
  restoreTranslationTokens,
  shieldTranslationSource,
  splitTranslationChunks,
  sortSourcePosts,
  validateTranslationDraft,
} from '../blog-translations.mjs';

const source = {
  slug: 'example',
  title: 'WHOOP Recovery Test',
  excerpt: 'A concise source description for the article.',
  category: 'Wearables',
  published_at: '2026-08-03',
  image: '/images/example.jpg',
  tags: ['WHOOP'],
  content: '## Result\n\nRead the [WHOOP page](/whoop/) before using https://example.com/data.\n\nThe complete result contains enough source text for validation. '.repeat(8),
};

test('extracts JSON after reasoning and a provider footer', () => {
  const parsed = extractJsonObject('<think>work</think>\n```json\n{"title":"Titel"}\n```\n[via minimax/MiniMax-M3]');
  assert.deepEqual(parsed, { title: 'Titel' });
});

test('validates complete translations while preserving source links', () => {
  const translated = {
    title: 'WHOOP-Erholungstest',
    excerpt: 'Eine klare Beschreibung des vollstandigen Artikels fur Leser.',
    category: 'Wearables',
    tags: ['WHOOP'],
    content: '## Ergebnis\n\nLesen Sie die [WHOOP-Seite](/whoop/) und https://example.com/data.\n\nDer vollstandige ubersetzte Inhalt bleibt erhalten. '.repeat(8),
  };
  assert.equal(validateTranslationDraft(translated, source).title, translated.title);
});

test('rejects translations that drop a source URL', () => {
  const translated = {
    title: 'Prueba de recuperacion WHOOP',
    excerpt: 'Una descripcion completa para lectores del articulo traducido.',
    category: 'Wearables',
    tags: ['WHOOP'],
    content: '## Resultado\n\nContenido traducido sin los enlaces requeridos. '.repeat(30),
  };
  assert.throws(() => validateTranslationDraft(translated, source), /missing preserved links/);
});

test('rejects untranslated titles and descriptions', () => {
  const translated = {
    title: source.title,
    excerpt: source.excerpt,
    category: 'Wearables',
    tags: ['WHOOP'],
    content: '## Ergebnis\n\nLesen Sie die [WHOOP-Seite](/whoop/) und https://example.com/data.\n\nDer vollständige übersetzte Inhalt bleibt erhalten. '.repeat(8),
  };
  assert.throws(() => validateTranslationDraft(translated, source), /title was not translated/);
});

test('rejects translations that drop source numbers', () => {
  const numberedSource = { ...source, content: `${source.content}\n\nWHOOP scored 83% after 7 days.` };
  const translated = {
    title: 'WHOOP-Erholungstest',
    excerpt: 'Eine klare Beschreibung des vollständigen Artikels für Leser.',
    category: 'Wearables',
    tags: ['WHOOP'],
    content: '## Ergebnis\n\nLesen Sie die [WHOOP-Seite](/whoop/) und https://example.com/data.\n\nDer vollständige übersetzte Inhalt bleibt erhalten. '.repeat(8),
  };
  assert.throws(() => validateTranslationDraft(translated, numberedSource), /missing preserved numbers/);
});

test('accepts equivalent locale-specific numeric separators', () => {
  const numberedSource = {
    ...source,
    content: `${source.content}\n\nThe price is $2,400 to $2,600 with a 21.5-inch display.`,
  };
  const translated = {
    title: 'WHOOP-Erholungstest',
    excerpt: 'Eine klare Beschreibung des vollständigen Artikels für Leser.',
    category: 'Wearables',
    tags: ['WHOOP'],
    content: `${'## Ergebnis\n\nLesen Sie die [WHOOP-Seite](/whoop/) und https://example.com/data.\n\nDer vollständige übersetzte Inhalt bleibt erhalten. '.repeat(8)}\n\nDer Preis liegt zwischen $2.400 und $2.600 mit einem 21,5-Zoll-Display.`,
  };
  assert.equal(validateTranslationDraft(translated, numberedSource).title, translated.title);
});

test('shields and restores links and product names without placeholder-heavy numeric substitution', () => {
  const protectedSource = {
    ...source,
    content: `${source.content}\n\nWHOOP scored 83% after 7 days.`,
  };
  const { shielded, replacements } = shieldTranslationSource(protectedSource);
  assert.match(shielded.content, /83%|7 days/);
  assert.doesNotMatch(shielded.content, /\/whoop\/|WHOOP/);

  const restored = restoreTranslationTokens({
    title: shielded.title.replace('Recovery Test', 'Erholungstest'),
    excerpt: shielded.excerpt.replace('A concise source description for the article.', 'Eine klare Beschreibung des Artikels.'),
    category: shielded.category,
    tags: shielded.tags,
    content: shielded.content.replace('Read the', 'Lesen Sie die'),
  }, replacements);
  assert.match(restored.content, /83%/);
  assert.match(restored.content, /\/whoop\//);
  assert.match(restored.content, /WHOOP/);
});

test('rejects model output that changes a protected placeholder', () => {
  const { shielded, replacements } = shieldTranslationSource(source);
  assert.throws(() => restoreTranslationTokens({
    title: shielded.title,
    excerpt: shielded.excerpt,
    category: shielded.category,
    tags: shielded.tags,
    content: shielded.content.replace('__TOFT_KEEP_', '__CHANGED_'),
  }, replacements), /changed protected placeholders/);
});

test('splits long articles at readable boundaries without losing text', () => {
  const content = Array.from({ length: 40 }, (_, index) => `Sentence ${index} contains enough words to form a useful translation boundary.`).join(' ');
  const chunks = splitTranslationChunks(content, 240);
  assert.ok(chunks.length > 2);
  assert.ok(chunks.every((chunk) => chunk.length <= 240));
  assert.equal(chunks.join(' '), content);
});

test('source hashes change with reader-facing content', () => {
  assert.notEqual(computeSourceHash(source), computeSourceHash({ ...source, title: `${source.title} updated` }));
});

test('prioritizes high-opportunity slugs before date order', () => {
  const sorted = sortSourcePosts([
    { ...source, slug: 'new-post', published_at: '2026-08-03' },
    { ...source, slug: 'garmin-and-whoop-what-each-is-actually-for', published_at: '2026-01-01' },
  ]);
  assert.equal(sorted[0].slug, 'garmin-and-whoop-what-each-is-actually-for');
});
