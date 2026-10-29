// Proposed draft-scoped presentation for the October 29 English v2 video frame.
export function usesBjjHomeTrainingImage(post) {
  return post?.slug === 'bjj-black-belt-training-at-home'
    && post?.image === '/images/blog/bjj-black-belt-training-at-home-english-v2-aria-review.png';
}
export function bjjHomeTrainingImageStyle(post) {
  return usesBjjHomeTrainingImage(post) ? 'object-fit: contain; object-position: center; transform: none' : undefined;
}
