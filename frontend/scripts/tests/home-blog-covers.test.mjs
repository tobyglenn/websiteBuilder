import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {homeBlogCover} from '../../src/lib/homeBlogCovers.mjs';
import {articleTopic} from '../../src/lib/blogEditorial.mjs';
const lanes=['game-development','creator-production','public-projects','model-workflows'];
for (const lane of lanes) test(`homepage cover supports ${lane}`,()=>{
 const post={category:'Build Logs',title:'An approved daily article',source_bundle:{lane}};
 const photos=homeBlogCover(post);
 assert.ok(Array.isArray(photos) && photos.length>0,articleTopic(post));
 const component=readFileSync(new URL('../../src/components/HomeBlogCover.astro',import.meta.url),'utf8');
 for(const photo of photos){
  assert.ok(component.includes(`'${photo.src}':`),`Astro asset mapping missing: ${photo.src}`);
  assert.ok(existsSync(fileURLToPath(new URL('../../public'+photo.src,import.meta.url))));
 }
});
test('legacy fitness topics retain covers',()=>{
 for(const category of ['Speediance','Training Tips','BJJ','Wearables','Build Logs']) assert.ok(homeBlogCover({category}).length);
});
