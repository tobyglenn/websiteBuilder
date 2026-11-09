import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { transform } from '@astrojs/compiler-rs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import {
  GEMINI_DOWNLOADS_SLUG,
  GEMINI_DOWNLOADS_IMAGE,
  usesGeminiDownloadsImage,
  geminiDownloadsImageStyle,
  geminiDownloadsArtwork,
} from '../../src/lib/geminiDownloadsBlogPresentation.mjs';
import { homeBlogCover } from '../../src/lib/homeBlogCovers.mjs';

const post = {
  slug: GEMINI_DOWNLOADS_SLUG,
  image: GEMINI_DOWNLOADS_IMAGE,
  category: 'Build Logs',
  title: 'Using Gemini 3.8 Flash (High) in Antigravity to Organize Downloads',
};
const locales = ['en', 'de', 'es', 'pt', 'hi'];
const readSource = (path) => readFileSync(new URL(`../../src/${path}`, import.meta.url), 'utf8');

// Exercise the actual hero blocks without importing or adding unpublished article content.
async function renderHero(source, props) {
  const markup = source.match(
    /\{usesGeminiDownloadsImage\(post\) && \([\s\S]*?<\/figure>\s*\)\}/
  )?.[0];
  assert.ok(markup, 'The exact approved image must have a hero in this route');
  const helper = new URL('../../src/lib/geminiDownloadsBlogPresentation.mjs', import.meta.url);
  const variants = new URL('../../src/lib/imageVariants.mjs', import.meta.url);
  const result = await transform(
    `---
import { usesGeminiDownloadsImage, geminiDownloadsArtwork } from '${helper.href}';
import { imageVariants } from '${variants.href}';
const { post, lang } = Astro.props;
---
${markup}`,
    {
      internalURL: 'astro/compiler-runtime',
      inlineComponentAssets: true,
      resultScopedSlot: true,
      resolvePath: (specifier) => specifier,
    }
  );
  assert.deepEqual(
    result.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'),
    []
  );
  const directory = mkdtempSync(new URL('.gemini-art-test-', import.meta.url));
  try {
    const file = join(directory, 'hero.mjs');
    writeFileSync(file, result.code);
    const { default: Hero } = await import(pathToFileURL(file));
    const container = await AstroContainer.create();
    return await container.renderToString(Hero, { props });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('the approved image wins over homepage topic photography in every locale', () => {
  for (const lang of locales) {
    const localized = {
      ...post,
      lang,
      title: 'Localized title',
      category: 'Localized category',
      categoryKey: 'Build Logs',
    };
    assert.equal(usesGeminiDownloadsImage(localized), true);
    assert.deepEqual(homeBlogCover(localized), [
      { src: post.image, fit: 'contain', position: '50% 50%' },
    ]);
    assert.equal(
      geminiDownloadsImageStyle(localized),
      'object-fit: contain; object-position: center; transform: none'
    );
  }
});

test('the presentation is restricted to the exact approved slug and asset', () => {
  for (const changed of [
    undefined,
    null,
    {},
    { ...post, slug: 'other' },
    { ...post, image: '/images/other.png' },
  ]) {
    assert.equal(usesGeminiDownloadsImage(changed), false);
    assert.equal(geminiDownloadsImageStyle(changed), undefined);
  }
  assert.notEqual(homeBlogCover({ ...post, image: '/images/other.png' })[0].src, post.image);
});

test('the English wording is exact and every translation identifies the art as AI-generated', () => {
  assert.deepEqual(geminiDownloadsArtwork.en, {
    alt: 'Illustration of organized folders and image files',
    caption: 'AI-generated illustration.',
  });
  assert.deepEqual(Object.keys(geminiDownloadsArtwork), locales);
  const labels = {
    de: /KI-generierte/,
    es: /generada por IA/,
    pt: /gerada por IA/,
    hi: /एआई से बनाया गया/,
  };
  for (const [lang, label] of Object.entries(labels)) {
    assert.match(geminiDownloadsArtwork[lang].caption, label);
    assert.ok(geminiDownloadsArtwork[lang].alt.length > 20);
    assert.notEqual(geminiDownloadsArtwork[lang].alt, geminiDownloadsArtwork.en.alt);
  }
});

for (const lang of locales) {
  test(`${lang} article hero renders approved image, localized text, dimensions and responsive styling`, async () => {
    const source = readSource(
      lang === 'en' ? 'pages/blog/[slug].astro' : 'pages/[lang]/blog/[slug].astro'
    );
    const html = await renderHero(source, { post, lang });
    assert.match(html, /data-reviewed-gemini-downloads-art/);
    assert.ok(html.includes(`src="${post.image}"`));
    assert.ok(html.includes(`alt="${geminiDownloadsArtwork[lang].alt}"`));
    assert.ok(html.includes(geminiDownloadsArtwork[lang].caption));
    assert.match(html, /width="1672" height="941"/);
    assert.match(html, /class="block h-auto w-full object-contain"/);
    assert.match(html, /loading="eager"/);
    assert.match(source, /imageVariants\(post\.image, "\(min-width: 768px\) 736px, 100vw"\)/);
    assert.match(
      source,
      /image=\{post\.image\}/,
      'The existing social metadata must use the same image'
    );
    const absent = await renderHero(source, {
      post: { ...post, image: '/images/other.png' },
      lang,
    });
    assert.doesNotMatch(absent, /<figure|<img|<figcaption/);
  });
}

test('all English and localized blog card positions opt in without changing other artwork', () => {
  const english = readSource('pages/blog/index.astro');
  assert.equal((english.match(/style=\{geminiDownloadsImageStyle\(/g) || []).length, 3);
  assert.equal((english.match(/style=\{usesGeminiDownloadsImage\(/g) || []).length, 3);
  const localized = readSource('components/LocalizedBlogIndex.astro');
  assert.match(localized, /style=\{geminiDownloadsImageStyle\(featuredPost\)/);
  assert.equal((localized.match(/\{\(usesGeminiDownloadsImage\(post\) \|\|/g) || []).length, 2);
  assert.equal(
    (localized.match(/width=\{usesGeminiDownloadsImage\(post\) \? 1672/g) || []).length,
    2
  );
  assert.equal(
    (localized.match(/height=\{usesGeminiDownloadsImage\(post\) \? 941/g) || []).length,
    2
  );
  for (const locale of ['de', 'es', 'pt', 'hi']) {
    assert.ok(
      readSource(`pages/${locale}/blog/index.astro`).includes(
        `<LocalizedBlogIndex locale="${locale}"`
      )
    );
  }
});

test('the four changed Astro templates compile without errors', () => {
  for (const path of [
    'pages/blog/[slug].astro',
    'pages/[lang]/blog/[slug].astro',
    'pages/blog/index.astro',
    'components/LocalizedBlogIndex.astro',
  ]) {
    const result = transform(readSource(path), {
      filename: path,
      internalURL: 'astro/compiler-runtime',
      resolvePath: (specifier) => specifier,
    });
    assert.deepEqual(
      result.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'),
      [],
      path
    );
  }
});
