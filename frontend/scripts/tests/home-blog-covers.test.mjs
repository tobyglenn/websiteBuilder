import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {homeBlogCover} from '../../src/lib/homeBlogCovers.mjs';
import {articleTopic} from '../../src/lib/blogEditorial.mjs';
const lanes=['game-development','creator-production','public-projects','model-workflows'];
for (const lane of lanes) test(`homepage cover supports ${lane}`,()=>{
 const post={category:'Build Logs',title:'An approved daily article',source_bundle:{lane}};
 const photos=homeBlogCover(post);
 assert.ok(Array.isArray(photos) && photos.length>0,articleTopic(post));
 for(const photo of photos){
  // scripts/build-image-variants.mjs makes resized copies for these folders.
  assert.match(photo.src,/^\/(?:images\/(?:blog|projects|gear|about|comparison)|progress)\//,`Cover outside resized folders: ${photo.src}`);
  assert.ok(existsSync(fileURLToPath(new URL('../../public'+photo.src,import.meta.url))));
 }
});
test('legacy fitness topics retain covers',()=>{
 for(const category of ['Speediance','Training Tips','BJJ','Wearables','Build Logs']) assert.ok(homeBlogCover({category}).length);
});
