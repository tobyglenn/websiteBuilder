import type { BlogPost } from './blogPosts';
import { normalizeBlogCategory } from './blogEditorial.mjs';
import { MANUAL_REDIRECTS } from './blogSlugRedirects';

export const BLOG_TRANSLATION_LOCALES = ['de', 'es', 'pt', 'hi'] as const;
export type BlogTranslationLocale = typeof BLOG_TRANSLATION_LOCALES[number];

export type LocalizedBlogPost = Omit<BlogPost, 'category'> & {
  lang: BlogTranslationLocale;
  category: string;
  categoryKey: string;
  sourceHash: string;
  sourceTitle: string;
  translatedAt: string;
  model: string;
};

const translationModules = import.meta.glob('../generated/blog-translations/*/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, LocalizedBlogPost>;

const CATEGORY_LABELS = {"de": {"Build Logs": "Entwicklungsberichte", "BJJ": "BJJ", "Reviews": "Tests", "Training Tips": "Trainingstipps", "Wearables": "Wearables"}, "es": {"Build Logs": "Desarrollo", "BJJ": "BJJ", "Reviews": "Reseñas", "Training Tips": "Consejos de entrenamiento", "Wearables": "Wearables"}, "pt": {"Build Logs": "Desenvolvimento", "BJJ": "BJJ", "Reviews": "Análises", "Training Tips": "Dicas de treino", "Wearables": "Wearables"}, "hi": {"Build Logs": "निर्माण विवरण", "BJJ": "BJJ", "Reviews": "समीक्षाएँ", "Training Tips": "प्रशिक्षण सुझाव", "Wearables": "वियरेबल्स"}};

const localizedPosts = Object.values(translationModules).map(post => {
  const categoryKey = normalizeBlogCategory(post.categoryKey, {title:post.sourceTitle, slug:post.slug});
  return {...post, categoryKey, category:CATEGORY_LABELS[post.lang]?.[categoryKey] || post.category};
}).filter((post) =>
  Boolean(post?.slug && post?.lang && post?.title && post?.excerpt && post?.content && !MANUAL_REDIRECTS[post.slug]),
);

const localesBySlug = new Map<string, Set<BlogTranslationLocale>>();
for (const post of localizedPosts) {
  const locales = localesBySlug.get(post.slug) || new Set<BlogTranslationLocale>();
  locales.add(post.lang);
  localesBySlug.set(post.slug, locales);
}

const completeSlugs = new Set(
  [...localesBySlug.entries()]
    .filter(([, locales]) => BLOG_TRANSLATION_LOCALES.every((locale) => locales.has(locale)))
    .map(([slug]) => slug),
);

const postsByLocale = new Map<BlogTranslationLocale, LocalizedBlogPost[]>(
  BLOG_TRANSLATION_LOCALES.map((locale) => [
    locale,
    localizedPosts
      .filter((post) => post.lang === locale && completeSlugs.has(post.slug))
      .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)),
  ]),
);

export const getLocalizedBlogPosts = (locale: BlogTranslationLocale) =>
  postsByLocale.get(locale) || [];

export const hasCompleteBlogTranslation = (slug: string) => {
  return completeSlugs.has(slug);
};
