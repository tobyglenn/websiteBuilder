import assert from 'node:assert/strict';
import test from 'node:test';
import {selectDiverseBlogPosts, articleTopic} from '../../src/lib/blogEditorial.mjs';
import {canonicalBlogHref} from '../canonicalize-blog-links.mjs';
const post = (slug,title,published_at,category='Reviews') => ({slug,title,published_at,category});
test('three adjacent gym posts do not crowd out different reader topics', () => {
 const posts=[post('tonal','Tonal review','2026-10-13'),post('clicker','Tonal clicker','2026-10-12'),post('comparison','Speediance vs Tonal','2026-10-11'),post('whoop','WHOOP review','2026-10-10'),post('bjj','BJJ coaching','2026-10-09')];
 const before=JSON.stringify(posts);const selected=selectDiverseBlogPosts(posts);
 assert.deepEqual(selected.map(p=>p.slug),['tonal','whoop','bjj']);assert.equal(JSON.stringify(posts),before);
 assert.equal(new Set(selected.map(articleTopic)).size,3);
});
test('revised guides sort by update while preserving original publication dates',()=>{
 const posts=[post('gym','Tonal review','2026-10-13'),{...post('guide','BJJ guide','2025-01-01'),updated_at:'2026-10-14'}];
 assert.equal(selectDiverseBlogPosts(posts)[0].slug,'guide');assert.equal(posts[1].published_at,'2025-01-01');
 assert.equal(selectDiverseBlogPosts([posts[0],{...posts[0],slug:'other'}]).length,1);
 assert.deepEqual(selectDiverseBlogPosts(posts,0),[]);
});
test('localized classification uses source title and category',()=>{
 const posts=[{...post('a','अनुवाद','2026-10-13'),sourceTitle:'Tonal review',categoryKey:'Reviews'}, {...post('b','Übersetzung','2026-10-12'),sourceTitle:'Speediance review',categoryKey:'Reviews'}, {...post('c','Tradução','2026-10-11'),categoryKey:'BJJ'}];
 assert.deepEqual(selectDiverseBlogPosts(posts).map(p=>p.slug),['a','c']);
});
test('old internal links keep language and query/hash but use final destination',()=>{
 const old='tonal-clicker-vs-speedy-ring-which-reigns-supreme';
 assert.equal(canonicalBlogHref(`/de/blog/${old}/?from=home#controls`),'/de/blog/speediance-vs-tonal-comparison/?from=home#controls');
 assert.equal(canonicalBlogHref(`http://www.tobyonfitnesstech.com/blog/${old}`),'https://tobyonfitnesstech.com/blog/speediance-vs-tonal-comparison/');
 assert.equal(canonicalBlogHref(`https://example.com/blog/${old}/`),`https://example.com/blog/${old}/`);
});

import { rotationContext } from '../blog-topic-rotation.mjs';
import { homeBlogCover } from '../../src/lib/homeBlogCovers.mjs';
import { existsSync, readFileSync } from 'node:fs';

test('rotation uses publication history, including retired articles, not guide revisions', () => {
  const history = [
    {...post('guide', 'BJJ guide', '2025-01-01', 'BJJ'), updated_at:'2026-10-14'},
    post('retired-tonal', 'Tonal hardware', '2026-10-13'),
    post('future', 'WHOOP news', '2026-10-20'),
  ];
  const result = rotationContext(history, [post('new-gym','Speediance software'), post('new-bjj','BJJ training')], '2026-10-14');
  assert.deepEqual(result.previous.map(p=>p.slug), ['retired-tonal']);
  assert.deepEqual(result.candidates.map(p=>p.allowed), [false,true]);
  assert.equal(rotationContext(history, [post('later','Tonal hardware')], '2026-10-19').candidates[0].allowed, false);
});
test('rotation blocks every subject from the latest publication day and fails on unreadable dates', () => {
  const history = [post('gym','Tonal','2026-10-13'),post('bjj','BJJ training','2026-10-13')];
  assert.deepEqual(rotationContext(history,[{title:'Speediance'},{title:'BJJ training'},{title:'WHOOP review'}],'2026-10-14').candidates.map(p=>p.allowed), [false,false,true]);
  assert.throws(()=>rotationContext([{title:'Tonal',slug:'invalid'}],[],'2026-10-14'), /No dated publication/);
  assert.equal(rotationContext([], [{title:'Tonal'}], '2026-10-14').candidates[0].allowed, true);
});
test('homepage covers use reviewed photos and English topic metadata across locales', () => {
  const english = post('comparison','Speediance vs Tonal','2026-10-13');
  const localized = {...english,title:'अनुवाद',category:'अनुवाद',sourceTitle:english.title,categoryKey:'Reviews'};
  assert.deepEqual(homeBlogCover(localized),homeBlogCover(english));
  for (const category of ['Reviews','BJJ','Wearables','Build Logs','Training Tips']) {
    for (const photo of homeBlogCover({category})) {
      assert.ok(existsSync(new URL(`../../public${photo.src}`, import.meta.url)));
      assert.ok(!photo.src.includes('/images/blog/'));
    }
  }
  for (const locale of ['', 'de/','es/','pt/','hi/']) {
    const html=readFileSync(new URL(`../../src/pages/${locale}index.astro`,import.meta.url),'utf8');
    assert.match(html, /<HomeBlogCover post=\{post\}/);
  }
});
