import assert from 'node:assert/strict';
import test from 'node:test';
import { usesRetirementReviewImage, retirementReviewImageStyle } from '../../src/lib/retirementBlogPresentation.mjs';
import { homeBlogCover } from '../../src/lib/homeBlogCovers.mjs';

const post = { slug: 'retirement-sequence-of-returns-2008-2021', image: '/images/blog/retirement-sequence-of-returns-2008-2021-aria-review.jpg' };
test('the retirement draft keeps its exact source artwork on homepage cards', () => {
  assert.deepEqual(homeBlogCover(post), [{ src: post.image, fit: 'contain', position: '50% 50%' }]);
  assert.equal(retirementReviewImageStyle(post), 'object-fit: contain; object-position: center; transform: none');
});
test('retirement layout is scoped to both the exact slug and versioned asset', () => {
  for (const changed of [{ ...post, slug: 'other' }, { ...post, image: '/images/default-blog.jpg' }, {}]) {
    assert.equal(usesRetirementReviewImage(changed), false);
    assert.equal(retirementReviewImageStyle(changed), undefined);
  }
});
