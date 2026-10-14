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
