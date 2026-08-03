import type { BlogPost } from './blogPosts';

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

const localizedPosts = Object.values(translationModules).filter((post) =>
  Boolean(post?.slug && post?.lang && post?.title && post?.excerpt && post?.content),
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
