import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { transform } from '@astrojs/compiler-rs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import {
  POKEMON_STARTER_SLUG,
  POKEMON_STARTER_IMAGE,
  usesPokemonStarterImage,
  pokemonStarterImageStyle,
  pokemonStarterArtwork,
  localizedPokemonStarterArtwork,
} from '../../src/lib/pokemonStarterBlogPresentation.mjs';
import { homeBlogCover } from '../../src/lib/homeBlogCovers.mjs';

const post = {
  slug: POKEMON_STARTER_SLUG,
  image: POKEMON_STARTER_IMAGE,
  title: 'Daily starter routine',
  category: 'Build Logs',
  editorial_lane: 'public-projects',
};
const readSource = (path) => readFileSync(new URL(`../../src/${path}`, import.meta.url), 'utf8');
const heroSource = readSource('pages/blog/[slug].astro');
const indexSource = readSource('pages/blog/index.astro');

// Render actual template markup with fixtures, without adding a draft to the site data.
async function renderMarkup(markup, source, props) {
  const imports = source
    .split('\n')
    .filter((line) => /^import /.test(line) && /Presentation\.mjs|imageVariants\.mjs/.test(line))
    .map((line) =>
      line.replace(/'(?:\.\.\/)+lib\/([^']+)'/, (_, file) =>
        `'${new URL(`../../src/lib/${file}`, import.meta.url).href}'`
      )
    )
    .join('\n');
  const result = transform(`---\n${imports}\nconst { post, featuredPost, lang } = Astro.props;
const articleUrl = (slug) => '/' + lang + '/blog/' + slug + '/';
const usesMuseArtwork = (post) => post.slug === 'what-changed-my-mind-about-muse' && post.image === '/images/blog/what-changed-my-mind-about-muse-aria-review.jpg';\n---\n${markup}`, {
    internalURL: 'astro/compiler-runtime',
    inlineComponentAssets: true,
    resultScopedSlot: true,
    resolvePath: (specifier) => specifier,
  });
  assert.deepEqual(result.diagnostics.filter((item) => item.severity === 'error'), []);
  const directory = mkdtempSync(new URL('.pokemon-starter-test-', import.meta.url));
  try {
    const file = join(directory, 'fixture.mjs');
    writeFileSync(file, result.code);
    const { default: Fixture } = await import(pathToFileURL(file));
    const container = await AstroContainer.create();
    return await container.renderToString(Fixture, { props });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('the exact starter slug and image select an uncropped homepage cover', () => {
  assert.equal(POKEMON_STARTER_SLUG, 'pokemon-go-daily-starter-routine');
  assert.equal(POKEMON_STARTER_IMAGE, '/images/blog/pokemon-go-daily-starter-routine.png');
  assert.equal(usesPokemonStarterImage(post), true);
  assert.equal(
    pokemonStarterImageStyle(post),
    'object-fit: contain; object-position: center; transform: none'
  );
  assert.deepEqual(homeBlogCover(post), [
    { src: post.image, fit: 'contain', position: '50% 50%' },
  ]);
});

test('missing or mismatched inputs do not receive the starter presentation', () => {
  for (const other of [undefined, null, {}, { ...post, slug: 'other' }, { ...post, image: '/other.png' }]) {
    assert.equal(usesPokemonStarterImage(other), false);
    assert.equal(pokemonStarterImageStyle(other), undefined);
  }
  assert.notEqual(homeBlogCover({ ...post, image: '/other.png' })[0].src, post.image);
  assert.notEqual(homeBlogCover({ ...post, slug: 'other' })[0].src, post.image);
});

test('the English illustration disclosure and alt text are exact', () => {
  assert.deepEqual(pokemonStarterArtwork, {
    alt: 'Illustration of four phones representing progress, buddy care, gifts and battles',
    caption: 'AI-generated illustration, not a game screenshot.',
  });
});

test('the English hero renders responsive artwork with dimensions and disclosure', async () => {
  const markup = heroSource.match(/\{usesPokemonStarterImage\(post\) && \([\s\S]*?<\/figure>\s*\)\}/)?.[0];
  assert.ok(markup);
  const html = await renderMarkup(markup, heroSource, { post });
  assert.ok(html.includes(`src="${post.image}"`));
  assert.ok(html.includes(`alt="${pokemonStarterArtwork.alt}"`));
  assert.ok(html.includes(pokemonStarterArtwork.caption));
  assert.match(html, /width="1672" height="941"/);
  assert.match(html, /class="block h-auto w-full object-contain"/);
  assert.match(html, /loading="eager"/);
  assert.match(markup, /imageVariants\(post\.image, "\(min-width: 768px\) 736px, 100vw"\)/);
  for (const other of [{ ...post, slug: 'other' }, { ...post, image: '/other.png' }]) {
    assert.doesNotMatch(await renderMarkup(markup, heroSource, { post: other }), /<figure|<img|<figcaption/);
  }
});

test('all three English index card positions render the uncropped cover without hover zoom', async () => {
  const cards = [...indexSource.matchAll(/(<a href=\{`\/blog\/\$\{(?:featuredPost|post)\.slug\}\/`\} style=[^\n]+>)[\s\S]*?(<img\s[\s\S]*?\/>)/g)];
  assert.equal(cards.length, 3, 'Featured, sidebar and grid covers must all be checked');
  for (const [index, [, anchor, img]] of cards.entries()) {
    const markup = `${anchor}${img}</a>`;
    const html = await renderMarkup(markup, indexSource, { post, featuredPost: post });
    assert.ok(html.includes(`src="${post.image}"`));
    assert.match(html, /aspect-ratio: 16 \/ 9/);
    assert.match(html, /object-fit: contain; object-position: center; transform: none/);
    assert.match(img, /imageVariants\(/);
    if (index === 1) assert.match(html, /height: auto/);
    const other = { ...post, image: '/other.png' };
    const fallback = await renderMarkup(markup, indexSource, { post: other, featuredPost: other });
    assert.doesNotMatch(fallback, /object-fit: contain|transform: none|style="aspect-ratio/);
  }
});

test('social metadata stays image-driven', () => {
  assert.match(heroSource, /image=\{post\.image\}/);
  assert.match(heroSource, /"image": post\.image\.startsWith\('http'\) \? post\.image : `\$\{siteUrl\}\$\{post\.image\}`/);
  assert.match(readSource('pages/[lang]/blog/[slug].astro'), /image=\{post\.image\}/);
});

test('the English and localized templates compile without errors', () => {
  for (const path of ['pages/blog/[slug].astro', 'pages/blog/index.astro', 'pages/[lang]/blog/[slug].astro', 'components/LocalizedBlogIndex.astro']) {
    const result = transform(readSource(path), {
      filename: path,
      internalURL: 'astro/compiler-runtime',
      resolvePath: (specifier) => specifier,
    });
    assert.deepEqual(result.diagnostics.filter((item) => item.severity === 'error'), [], path);
  }
});

const localizedHeroSource = readSource('pages/[lang]/blog/[slug].astro');
const localizedIndexSource = readSource('components/LocalizedBlogIndex.astro');
const localizedLabels = {
  de: /KI-generierte Illustration, kein Screenshot aus dem Spiel/,
  es: /Ilustración generada por IA, no es una captura del juego/,
  pt: /Ilustração gerada por IA, não é uma captura de tela do jogo/,
  hi: /एआई से बनाया गया चित्रण, गेम का स्क्रीनशॉट नहीं है/,
};

for (const lang of ['de', 'es', 'pt', 'hi']) {
  test(`${lang} actual hero renders localized alt and disclosure without cropping`, async () => {
    const markup = localizedHeroSource.match(/\{usesPokemonStarterImage\(post\) && \([\s\S]*?<\/figure>\s*\)\}/)?.[0];
    assert.ok(markup);
    const artwork = localizedPokemonStarterArtwork[lang];
    assert.match(artwork.caption, localizedLabels[lang]);
    assert.notEqual(artwork.alt, pokemonStarterArtwork.alt);
    const html = await renderMarkup(markup, localizedHeroSource, { post, lang });
    assert.ok(html.includes(`src="${post.image}"`));
    assert.ok(html.includes(`alt="${artwork.alt}"`));
    assert.ok(html.includes(artwork.caption));
    assert.match(html, /width="1672" height="941"/);
    assert.match(html, /class="block h-auto w-full object-contain"/);
    assert.match(html, /loading="eager"/);
    assert.match(markup, /imageVariants\(/);
    for (const other of [{ ...post, slug: 'other' }, { ...post, image: '/other.png' }]) {
      assert.doesNotMatch(await renderMarkup(markup, localizedHeroSource, { post: other, lang }), /<figure|<img|<figcaption/);
    }
  });

  test(`${lang} actual featured, sidebar and grid index covers preserve the full image`, async () => {
    const anchor = localizedIndexSource.match(/<a href=\{articleUrl\(featuredPost.slug\)\}[^\n]+>/)?.[0];
    const img = localizedIndexSource.match(/<img \{\.\.\.\{ src: featuredPost.image[^\n]+\/>/)?.[0];
    assert.ok(anchor && img);
    const featured = await renderMarkup(`${anchor}${img}</a>`, localizedIndexSource, { featuredPost: post, lang });
    assert.match(featured, /object-fit: contain; object-position: center; transform: none/);
    assert.match(featured, /aspect-ratio: 16 \/ 9/);
    assert.ok(featured.includes(`href="/${lang}/blog/${post.slug}/"`));
    for (const other of [{ ...post, slug: 'other' }, { ...post, image: '/other.png' }]) {
      const fallback = await renderMarkup(`${anchor}${img}</a>`, localizedIndexSource, { featuredPost: other, lang });
      assert.doesNotMatch(fallback, /object-fit: contain|transform: none|aspect-ratio/);
    }
    const cards = [...localizedIndexSource.matchAll(/\{\(usesGeminiDownloadsImage\(post\)[^\n]+&& \([\s\S]*?<\/a>\s*\)\}/g)];
    assert.equal(cards.length, 2);
    for (const [markup] of cards) {
      const html = await renderMarkup(markup, localizedIndexSource, { post, lang });
      assert.ok(html.includes(`src="${post.image}"`));
      assert.match(html, /width="1672" height="941"/);
      assert.match(html, /class="block h-auto w-full object-contain"/);
      assert.doesNotMatch(html, /scale|object-cover/);
      assert.match(markup, /imageVariants\(/);
      for (const other of [{ ...post, slug: 'other' }, { ...post, image: '/other.png' }]) {
        assert.doesNotMatch(await renderMarkup(markup, localizedIndexSource, { post: other, lang }), /<img/);
      }
    }
    assert.ok(readSource(`pages/${lang}/blog/index.astro`).includes(`<LocalizedBlogIndex locale="${lang}"`));
    assert.deepEqual(homeBlogCover({ ...post, lang, category: 'Localized category' }), [
      { src: post.image, fit: 'contain', position: '50% 50%' },
    ]);
  });
}
