// Proposed English v1 presentation: apply only to this exact reviewed article/image pair.
export function usesWildRacingReviewImage(post) {
  return post?.slug === 'wild-racing-track-redesign-and-wild-skies-beta'
    && post?.image === '/images/blog/wild-racing-track-redesign-and-wild-skies-beta-english-v1.jpg';
}
export function wildRacingReviewImageStyle(post) {
  return usesWildRacingReviewImage(post) ? 'object-fit: contain; object-position: center; transform: none' : undefined;
}
