// Scoped draft presentation; unrelated articles retain their existing artwork.
export const POKEMON_FEATURE_SLUG = 'pokemon-go-automation-trading-gbl-gifts-and-more';
export const POKEMON_FEATURE_IMAGE = '/images/blog/pokemon-go-automation-trading-gbl-gifts-and-more-aria-review.png';
export function usesPokemonFeatureImage(post) {
  return post?.slug === POKEMON_FEATURE_SLUG && post?.image === POKEMON_FEATURE_IMAGE;
}
export function pokemonFeatureImageStyle(post) {
  return usesPokemonFeatureImage(post) ? 'object-fit: contain; object-position: center; transform: none' : undefined;
}
