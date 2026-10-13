import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

test('consolidated articles retain routes but leave English and translated listings', async () => {
  const server = await createServer({root:fileURLToPath(new URL('../../',import.meta.url)),appType:'custom',logLevel:'silent',server:{middlewareMode:true}});
  try {
    const {MANUAL_REDIRECTS}=await server.ssrLoadModule('/src/lib/blogSlugRedirects.ts');
    const {BLOG_POSTS,BLOG_REDIRECTS,CANONICAL_BLOG_POSTS}=await server.ssrLoadModule('/src/lib/blogPosts.ts');
    const {getLocalizedBlogPosts}=await server.ssrLoadModule('/src/lib/localizedBlogPosts.ts');
    for(const [oldSlug,target] of Object.entries(MANUAL_REDIRECTS)) {
      assert.ok(BLOG_POSTS.some(p=>p.slug===oldSlug),`retained old route: ${oldSlug}`);
      assert.equal(BLOG_REDIRECTS[oldSlug],target);
      assert.ok(CANONICAL_BLOG_POSTS.some(p=>p.slug===target),`English destination exists: ${target}`);
      assert.ok(!CANONICAL_BLOG_POSTS.some(p=>p.slug===oldSlug));
      for(const locale of ['de','es','pt','hi']) {
        const posts=getLocalizedBlogPosts(locale);
        assert.ok(posts.some(p=>p.slug===target),`${locale} destination exists: ${target}`);
        assert.ok(!posts.some(p=>p.slug===oldSlug),`${locale} listing excludes ${oldSlug}`);
      }
    }
  } finally { await server.close(); }
});
