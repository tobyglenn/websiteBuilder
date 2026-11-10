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
      line.replace(/'\.\.\/\.\.\/lib\/([^']+)'/, (_, file) =>
        `'${new URL(`../../src/lib/${file}`, import.meta.url).href}'`
      )
    )
    .join('\n');
  const result = transform(`---\n${imports}\nconst { post, featuredPost } = Astro.props;\n---\n${markup}`, {
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

test('social metadata stays image-driven and localized article templates are untouched', () => {
  assert.match(heroSource, /image=\{post\.image\}/);
  assert.match(heroSource, /"image": post\.image\.startsWith\('http'\) \? post\.image : `\$\{siteUrl\}\$\{post\.image\}`/);
  assert.doesNotMatch(readSource('pages/[lang]/blog/[slug].astro'), /pokemonStarter/);
});

test('the changed English templates compile without errors', () => {
  for (const path of ['pages/blog/[slug].astro', 'pages/blog/index.astro']) {
    const result = transform(readSource(path), {
      filename: path,
      internalURL: 'astro/compiler-runtime',
      resolvePath: (specifier) => specifier,
    });
    assert.deepEqual(result.diagnostics.filter((item) => item.severity === 'error'), [], path);
  }
});
