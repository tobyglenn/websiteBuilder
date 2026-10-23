import {writeFileSync,readFileSync} from 'node:fs';
import {transformReleaseHtml} from '../src/lib/releaseLocaleServer.mjs';
import {data,buildMatrix,detailsMarkup} from '../src/lib/comparisonModel.js';
import {entries} from '../src/lib/gameJournal.mjs';
const messages = new Set();
const check = process.argv.includes('--check');
const readPage = async route => check ? readFileSync(`dist${route}index.html`,'utf8') : await (await fetch('http://127.0.0.1:4325'+route)).text();
const collect = html => transformReleaseHtml(/<tr[ >]/.test(html) ? `<table>${html}</table>` : html,{collect:messages});
const outputs = [];
const elements = new Map();
class Element {
 constructor(key){this.key=key;this.dataset={};this.listeners={};this.hidden=false;this.value='150';}
 set innerHTML(v){outputs.push(String(v));this.html=v;} get innerHTML(){return this.html;}
 set textContent(v){outputs.push(`<span>${String(v)}</span>`);} get textContent(){return '';}
 setAttribute(){} focus(){} addEventListener(name,fn){this.listeners[name]=fn;}
 querySelector(s){if(!elements.has(s))elements.set(s,new Element(s));return elements.get(s);}
 querySelectorAll(s){return s==='[data-tab]'?['gym','wearables'].map(tab=>Object.assign(new Element(tab),{dataset:{tab}})):[];}
}
const root=new Element('root');
globalThis.document={querySelector:()=>root,getElementById:()=>null};
const mobile={matches:false,addEventListener(name,fn){this.listener=fn;}};
globalThis.window={matchMedia:()=>mobile};globalThis.location={hash:''};globalThis.CSS={escape:v=>v};
const {initComparison}=await import('../src/lib/comparisonClient.js');initComparison();
const click=(dataset={},id='')=>root.listeners.click({target:{closest:()=>({dataset,id})}});
for(const tab of ['gym','wearables']){
 click({tab});
 for(const years of ['1','3','5'])click({years});
 click({},'toggle-picker');for(const product of data[tab])click({change:product.id});click({change:data[tab][0].id});click({product:data[tab][1].id});click({product:data[tab][0].id});
 for(const p of data[tab])click({product:p.id});
 for(const p of data[tab])click({product:p.id});
 mobile.matches=true;mobile.listener();click({product:data[tab][0].id});mobile.matches=false;
 collect(detailsMarkup(tab));const matrix=buildMatrix(data[tab],tab);collect(`<table>${matrix.head}${matrix.body}</table>`);
 collect(buildMatrix([data[tab][0],data[tab][0]],tab,'All features',true).body);
}
for(const output of outputs)collect(output);
const routes=['/compare/','/games/','/games/journal/','/projects/','/projects/wild-rebellion/','/projects/monstrum-world/','/projects/ironvane-chronicle/','/projects/lilly/',...entries.map(e=>`/games/journal/${e.slug}/`)];
// Wild Racing is an English editorial update. Preserve the prior locale pages until
// reviewed translations are ready; their visible English notice links to the new guide.
// Keep the audit on the other translated surfaces; this page is explicitly held
// for editorial translation review rather than generating unreviewed translations.
for(const route of routes){
 if(route === '/projects/wild-rebellion/') continue;
 collect(await readPage(route));
}
// Only today's additions on otherwise already translated landing pages.
const home=await readPage('/');
collect(home.slice(home.indexOf('<section id="projects"'),home.indexOf('<div id="newsletter"')));
const blog=await readPage('/blog/');const start=blog.indexOf('<aside');collect(blog.slice(start,blog.indexOf('</aside>',start)+8));
const list=[...messages].filter(x=>x&&!/^https?:/.test(x)).sort();
if(check){
 for(const locale of ['es','de','pt','hi']){
  const catalog=JSON.parse(readFileSync(`src/data/locales/release-${locale}.json`,'utf8'));
  const missing=list.filter(key=>!Object.hasOwn(catalog,key));
  if(missing.length)throw Error(`${locale}: ${missing.length} missing release translations: ${JSON.stringify(missing.slice(0,8))}`);
  for(const key of list){if([...key.matchAll(/\{\{n\d+\}\}/g)].map(x=>x[0]).sort().join()!==[...catalog[key].matchAll(/\{\{n\d+\}\}/g)].map(x=>x[0]).sort().join())throw Error(`${locale}: numeric placeholder mismatch: ${key}`);}
 }
 console.log('Checked release surfaces have complete translations in es/de/pt/hi; Wild Racing’s English update is held for translation review with notices on retained locale pages.');
}else writeFileSync('src/data/locales/release-source.json',JSON.stringify(list,null,2)+'\n');
console.log(`Collected ${list.length} public messages`);
