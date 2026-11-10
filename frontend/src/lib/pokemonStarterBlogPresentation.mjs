// Only the exact approved article/image pair receives this presentation.
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

// Keep the approved English API and wording unchanged.
export const localizedPokemonStarterArtwork = {
  de: {
    alt: 'Illustration von vier Smartphones, die Fortschritt, Kumpelpflege, Geschenke und Kämpfe darstellen',
    caption: 'KI-generierte Illustration, kein Screenshot aus dem Spiel.',
  },
  es: {
    alt: 'Ilustración de cuatro teléfonos que representan el progreso, el cuidado del compañero, los regalos y los combates',
    caption: 'Ilustración generada por IA, no es una captura del juego.',
  },
  pt: {
    alt: 'Ilustração de quatro celulares que representam progresso, cuidados com o companheiro, presentes e batalhas',
    caption: 'Ilustração gerada por IA, não é uma captura de tela do jogo.',
  },
  hi: {
    alt: 'चार फ़ोनों का चित्रण, जो प्रगति, साथी की देखभाल, उपहार और लड़ाइयों को दर्शाते हैं',
    caption: 'एआई से बनाया गया चित्रण, गेम का स्क्रीनशॉट नहीं है।',
  },
};
