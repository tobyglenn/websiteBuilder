export function videoPools(videos, isShort, now = Date.now()) {
  const eligible = videos.filter(v => !v.is_live && !isShort(v) && v.publishedAt && Date.parse(v.publishedAt) <= now);
  const latest = [...eligible].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,3);
  const popular = [...eligible].sort((a,b)=>(Number(b.viewCount)||0)-(Number(a.viewCount)||0)).slice(0,3);
  return {latest,popular};
}
export function rotationPick(pools, visit) {
  const count = Number.isSafeInteger(visit) && visit >= 0 ? visit : 0;
  const mode = count % 2 === 0 ? 'latest' : 'popular';
  const pool = pools[mode];
  const featured = pool[Math.floor(count/2) % Math.max(1,pool.length)] || pools.latest[0] || pools.popular[0];
  const opposite = mode === 'latest' ? 'popular' : 'latest';
  const seen = new Set([featured?.id]);
  const related = [...pools[opposite],...pool].filter(v => {if(seen.has(v.id))return false;seen.add(v.id);return true;}).slice(0,3);
  return {mode,featured,related};
}
