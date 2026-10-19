// Public article prose for novelty checks. No private checkout or device data.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const server=await createServer({root,appType:'custom',logLevel:'silent',server:{middlewareMode:true}});
try {
 const {BLOG_POSTS}=await server.ssrLoadModule('/src/lib/blogPosts.ts');
 process.stdout.write(JSON.stringify(BLOG_POSTS.map(p=>({slug:p.slug,title:p.title,content:p.content}))));
} finally {await server.close();}
