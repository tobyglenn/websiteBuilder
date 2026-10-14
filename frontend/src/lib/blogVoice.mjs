import excerptOverrides from '../data/blogExcerptOverrides.json' with { type: 'json' };
export function firstPersonExcerpt(value = '', slug = '') {
  if (excerptOverrides[slug]) return excerptOverrides[slug];
  const text = String(value).replace(/\bGym Monza\b/g, 'Gym Monster');
  if (!/\bToby (?:explains|shares|compares|breaks down|weighs)/.test(text)) return text;
  return text
    .replace(/\bToby explains\b/g, 'I explain')
    .replace(/\bToby shares\b/g, 'I share')
    .replace(/\bToby compares\b/g, 'I compare')
    .replace(/\bToby breaks down\b/g, 'I break down')
    .replace(/\bToby weighs in\b/g, 'I weigh in')
    .replace(/\bToby weighs\b/g, 'I weigh')
    .replace(/\bhe built\b/g, 'I built').replace(/\bhe sticks\b/g, 'I stick')
    .replace(/\bwhy he covers\b/g, 'why I cover').replace(/\bhis software\b/g, 'my software')
    .replace(/\bhis own experience\b/g, 'my own experience').replace(/\bhis own\b/g, 'my own')
    .replace(/\band shares\b/g, 'and share').replace(/\btell him\b/g, 'tell me')
    .replace(/\bhe performed\b/g, 'I performed').replace(/\bmatter to him\b/g, 'matter to me');
}
