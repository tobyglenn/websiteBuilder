// Draft-scoped presentation, proposed for the exact October 28 English v2 artwork.
export function usesWildRacingAiReviewImage(post) {
  return post?.slug === 'wild-racing-boats-tracks-and-ai-tool-choices'
    && post?.image === '/images/blog/wild-racing-boats-tracks-and-ai-tool-choices-english-v2-aria-review.png';
}
export function wildRacingAiReviewImageStyle(post) {
  return usesWildRacingAiReviewImage(post) ? 'object-fit: contain; object-position: center; transform: none' : undefined;
}
