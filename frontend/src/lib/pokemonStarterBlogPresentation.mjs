// Scoped draft presentation; unrelated articles retain their existing artwork.
export const POKEMON_STARTER_SLUG = 'pokemon-go-daily-starter-routine';
export const POKEMON_STARTER_IMAGE = '/images/blog/pokemon-go-daily-starter-routine.png';

export function usesPokemonStarterImage(post) {
  return post?.slug === POKEMON_STARTER_SLUG && post?.image === POKEMON_STARTER_IMAGE;
}

export function pokemonStarterImageStyle(post) {
  return usesPokemonStarterImage(post)
    ? 'object-fit: contain; object-position: center; transform: none'
    : undefined;
}

export const pokemonStarterArtwork = {
  alt: 'Illustration of four phones representing progress, buddy care, gifts and battles',
  caption: 'AI-generated illustration, not a game screenshot.',
};
