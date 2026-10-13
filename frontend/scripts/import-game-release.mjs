#!/usr/bin/env node
// Import a verified release and a reviewed, player-facing article. No Roblox mutation.
import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { validateGameContent } from '../src/lib/gameJournal.mjs';
const dataDir = fileURLToPath(new URL('../src/data/games/', import.meta.url));
const assert = (ok, message) => { if (!ok) throw new Error(message); };
export function normalizeReceipt(input, game) {
  const r = input.receipt || input;
  const placeId = String(r.rootPlaceId || r.placeId || '');
  const universeId = String(r.universeId || '');
  const version = r.publicVersion ?? r.versionNumber;
  assert(placeId === game.placeId && universeId === game.universeId, 'Receipt belongs to another Roblox game');
  assert(Number.isInteger(version) && version > 0, 'Missing published version');
  const monstrumPublished = r.publiclyReleased === true && r.publicStateVerified === true && r.publicVersion === r.stagedVersion;
  const wildPublished = r.privacyType === 'Public' && (r.publishedVersionNumber === version || (r.publicationEvidence && r.publicationEvidence.includes(`version ${version}`)));
  assert(monstrumPublished || wildPublished, 'Explicit publication evidence is required; saved/private builds are not releases');
  assert(r.cloudDownloadMatchesBuild === true && /^[a-f0-9]{64}$/.test(r.buildSha256), 'Missing byte-matched build proof');
  assert(!r.downloadedSha256 || r.downloadedSha256 === r.buildSha256, 'Downloaded hash does not match');
  const verifiedAt = r.verifiedAt || r.releasedAt;
  const sourceCommit = r.sourceCommit || r.commit;
  assert(!Number.isNaN(Date.parse(verifiedAt)) && /^[a-f0-9]{40}$/.test(sourceCommit), 'Incomplete date or source commit');
  return {placeId, universeId, version, verifiedAt, sourceCommit, buildSha256:r.buildSha256, public:true, byteMatched:true};
}
export function mergeRelease(existing, article, receipt, game, games, videos) {
  const release = normalizeReceipt(receipt, game);
  assert(article.game === game.slug && article.kind === 'release' && article.version === release.version, 'Article and receipt identify different releases');
  assert(article.date <= new Date().toISOString().slice(0, 10), 'Future releases cannot be imported');
  const entry = {...article, release};
  const previous = existing.find(e=>e.game===game.slug && e.kind==='release' && e.version===release.version);
  assert(!previous || previous.slug === entry.slug, 'An existing release URL cannot be changed');
  assert(!previous || previous.release.buildSha256 === release.buildSha256, 'An existing version cannot change build hash');
  const result = previous ? existing.map(e=>e===previous ? entry : e) : [...existing,entry];
  validateGameContent(games,result,videos);
  return result;
}
async function main() {
  const args = process.argv.slice(2); const flags = {};
  for(let i=0;i<args.length;i++) { if(args[i]==='--write') flags.write=true; else { assert(['--game','--receipt','--article','--output'].includes(args[i]),`Unknown argument ${args[i]}`); flags[args[i].slice(2)]=args[++i]; } }
  assert(flags.game && flags.receipt && flags.article, 'Usage: node scripts/import-game-release.mjs --game SLUG --receipt PATH --article PATH [--write] [--output PATH]');
  const read = async path => JSON.parse(await readFile(path,'utf8'));
  const games = await read(resolve(dataDir,'showcases.json'));
  const videos = await read(resolve(dataDir,'media.json'));
  const target = flags.output ? resolve(flags.output) : resolve(dataDir,'journal.json');
  const existing = await read(target);
  const game = games.find(g=>g.slug===flags.game); assert(game,'Unknown game');
  const result = mergeRelease(existing,await read(flags.article),await read(flags.receipt),game,games,videos);
  const serialized = JSON.stringify(result,null,2)+'\n';
  if(flags.write) {
    // Atomic replacement: validation never leaves a partial journal file.
    const tmp = resolve(dirname(target),`.game-journal-${process.pid}.tmp`);
    await writeFile(tmp,serialized); await rename(tmp,target);
  }
  console.log(`${flags.write?'Imported':'Validated (dry run)'} ${game.title}; ${result.length} journal entries. Build and deploy the website to publish.`);
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{console.error(error.message);process.exitCode=1;});
