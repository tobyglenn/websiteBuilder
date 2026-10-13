import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { games, entries, gameMedia, validateGameContent, releasesFor } from '../../src/lib/gameJournal.mjs';
import { normalizeReceipt, mergeRelease } from '../import-game-release.mjs';
const game = games.find(g=>g.slug==='monstrum-world');
const article=structuredClone(entries.find(e=>e.game===game.slug && e.version===48));
const receipt = {rootPlaceId:Number(game.placeId),universeId:Number(game.universeId),publicVersion:48,stagedVersion:48,publiclyReleased:true,publicStateVerified:true,cloudDownloadMatchesBuild:true,buildSha256:article.release.buildSha256,releasedAt:article.release.verifiedAt,commit:article.release.sourceCommit};
test('all editorial entries, videos, and local media are valid',()=>{
  assert.equal(validateGameContent(games,entries,gameMedia),true);
  for(const item of [...games.map(g=>g.hero),...entries.map(e=>e.image),...gameMedia.filter(v=>v.provider==='local').flatMap(v=>[{src:v.src},{src:v.poster}])]) assert.ok(existsSync(fileURLToPath(new URL(`../../public${item.src}`,import.meta.url))),item.src);
});
test('release order follows versions, including multiple updates on one day',()=>assert.deepEqual(releasesFor(game.slug).map(e=>e.version),[48,47,46]));
test('saved, private, wrong-game, and unmatched receipts are rejected',()=>{
  for(const patch of [{publiclyReleased:false},{publicStateVerified:false},{stagedVersion:49},{rootPlaceId:123},{universeId:123},{cloudDownloadMatchesBuild:false},{downloadedSha256:'0'.repeat(64)}]) assert.throws(()=>normalizeReceipt({...receipt,...patch},game));
  assert.throws(()=>normalizeReceipt({privacyType:'Public',placeId:Number(game.placeId),universeId:Number(game.universeId),versionNumber:49,cloudDownloadMatchesBuild:true,buildSha256:receipt.buildSha256},game),/publication evidence/);
});
test('same release import is idempotent and retains its URL',()=>{
  const once=mergeRelease(entries,article,receipt,game,games,gameMedia);
  const twice=mergeRelease(once,article,receipt,game,games,gameMedia);
  assert.deepEqual(once,twice); assert.equal(once.length,entries.length);
  assert.throws(()=>mergeRelease(entries,{...article,slug:'changed-url'},receipt,game,games,gameMedia),/URL/);
});
test('mismatched article, media identity, duplicate release, and future date are rejected',()=>{
  assert.throws(()=>mergeRelease(entries,{...article,version:49},receipt,game,games,gameMedia));
  assert.throws(()=>mergeRelease(entries,{...article,date:'2099-01-01'},receipt,game,games,gameMedia));
  assert.throws(()=>validateGameContent(games,[...entries,{...article,slug:'duplicate'}],gameMedia));
  assert.throws(()=>validateGameContent(games,entries,gameMedia.map((v,i)=>i===0?{...v,public:false}:v)));
  assert.throws(()=>validateGameContent(games,entries,gameMedia.map((v,i)=>i===0?{...v,channelId:'wrong-channel'}:v)));
  assert.throws(()=>validateGameContent(games,entries.map(e=>e===entries[0]?{...e,mediaIds:['missing']}:e),gameMedia));
});
test('new verified update automatically becomes the latest release without a duplicate',()=>{
  const next={...article,slug:'monstrum-world-v49-test',version:49};
  const result=mergeRelease(entries,next,{...receipt,publicVersion:49,stagedVersion:49},game,games,gameMedia);
  assert.equal(result.filter(e=>e.game===game.slug && e.version===49).length,1);
  assert.equal(Math.max(...result.filter(e=>e.game===game.slug&&e.kind==='release').map(e=>e.version)),49);
});
