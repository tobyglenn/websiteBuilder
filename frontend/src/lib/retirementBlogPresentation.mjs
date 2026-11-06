// Exact artwork included in the separately versioned, unapproved retirement draft.
export function usesRetirementReviewImage(post = {}) {
  return post.slug === 'retirement-sequence-of-returns-2008-2021'
    && post.image === '/images/blog/retirement-sequence-of-returns-2008-2021-aria-review.jpg';
}

export function retirementReviewImageStyle(post) {
  return usesRetirementReviewImage(post)
    ? 'object-fit: contain; object-position: center; transform: none'
    : undefined;
}
