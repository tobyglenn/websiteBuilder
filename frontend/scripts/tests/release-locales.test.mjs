import test from 'node:test';
import assert from 'node:assert/strict';
import {messageKey,translateText} from '../../src/lib/releaseLocale.js';
import {transformReleaseHtml,localeLink} from '../../src/lib/releaseLocaleServer.mjs';
import {videoPools,rotationPick} from '../../src/lib/homeVideoRotation.js';
import {data,total,buyin} from '../../src/lib/comparisonModel.js';
test('translations preserve changing prices and escape HTML without touching code or telemetry',()=>{
 const key=messageKey('From $4,397.97 installation').key;
 const messages={[key]:'Desde ${{n0}} de instalación','Change device':'Cambiar dispositivo'};
 assert.equal(translateText('From $999 installation',messages),'Desde $999 de instalación');
 const html=transformReleaseHtml('<button data-change="nano" aria-label="Change device">Change device</button><script>"Change device"</script>',{locale:'es',messages});
 assert.match(html,/data-change="nano" aria-label="Cambiar dispositivo">Cambiar dispositivo/);
 assert.match(html,/<script>"Change device"<\/script>/);
 assert.equal(localeLink('/games/journal/story/#x','es'),'/es/games/journal/story/#x');
 assert.equal(localeLink('/images/comparison/nano.jpg','es'),'/images/comparison/nano.jpg');
 assert.equal(localeLink('https://www.roblox.com/games/123/','es'),'https://www.roblox.com/games/123/');
});
test('rotation alternates latest and all top-three popular picks without duplicates',()=>{
 const videos=Array.from({length:7},(_,i)=>({id:String(i),publishedAt:`2026-10-0${i+1}`,viewCount:100-i,is_live:i===6}));
 const pools=videoPools(videos,()=>false,Date.parse('2026-10-13'));
 assert.deepEqual(pools.popular.map(v=>v.id),['0','1','2']);
 assert.deepEqual(Array.from({length:6},(_,i)=>rotationPick(pools,i).featured.id),['5','0','4','1','3','2']);
 for(let i=0;i<6;i++){const {featured,related}=rotationPick(pools,i);assert.equal(new Set([featured.id,...related.map(v=>v.id)]).size,4);}
});
test('rack-inclusive costs and the approved ratings survive all locale rendering',()=>{
 assert.equal(buyin(data.gym.find(p=>p.id==='nano')),4397.97);
 assert.equal(buyin(data.gym.find(p=>p.id==='voltra')),4984.97);
 assert.equal(data.gym.find(p=>p.id==='aeke-s1-pro').verdict.color,'green');
 assert.equal(data.wearables.find(p=>p.id==='fitbit').evidence,'Wife’s device');
 for(const category of Object.values(data))for(const p of category)for(const years of [1,3,5])assert.equal(Math.round(total(p,years)*100),Math.round(p.hardware*100)+Math.round(p.setup*100)+Math.round(p.annual*100)*years);
});
