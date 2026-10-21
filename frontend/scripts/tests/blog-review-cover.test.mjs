import assert from 'node:assert/strict';
import test from 'node:test';
import {resolveReviewCover} from '../../src/lib/blogReviewCover.mjs';
test('existing exact owner-review art wins over an old slug title card',()=>{
 const approved='/images/blog/monstrum-companion-aria-review.webp';
 assert.equal(resolveReviewCover(approved,x=>x===approved,()=>{throw Error('Legacy replacement must not run')}),approved);
});
test('a missing reviewed asset is not presented as a valid cover',()=>{
 assert.equal(resolveReviewCover('/images/blog/monstrum-aria-review.webp',()=>false,()=>'/images/blog/old.jpg'),'/images/blog/old.jpg');
});
test('unrelated old image repair is preserved',()=>{
 for(const raw of ['/images/default-blog.jpg','/images/blog/old.jpg','https://example.com/aria-review.webp','/images/blog/../aria-review.webp'])
  assert.equal(resolveReviewCover(raw,()=>true,()=>'/legacy-corrected.jpg'),'/legacy-corrected.jpg');
});
test('reviewed image types and revision identifiers are supported',()=>{
 for(const ext of ['webp','png','jpg','jpeg']){
  const raw='/images/blog/monstrum-v2-aria-review.'+ext;
  assert.equal(resolveReviewCover(raw,()=>true,()=>'/old.jpg'),raw);
 }
});
