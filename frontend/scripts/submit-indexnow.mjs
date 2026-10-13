import {readFileSync,readdirSync} from 'node:fs';
const host='tobyonfitnesstech.com';
const key='21df5f0e15ba46c9ba198d5c8c3d53c6';
const urls=new Set();
for(const file of readdirSync('dist').filter(file=>/^sitemap-\d+\.xml$/.test(file))){
 for(const match of readFileSync(`dist/${file}`,'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)){
  const url=match[1].replaceAll('&amp;','&');if(new URL(url).hostname===host)urls.add(url);
 }
}
if(!urls.size)throw Error('No sitemap URLs found');
const response=await fetch('https://www.bing.com/indexnow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host,key,keyLocation:`https://${host}/${key}.txt`,urlList:[...urls].slice(0,10000)})});
if(!response.ok)throw Error(`IndexNow returned HTTP ${response.status}: ${(await response.text()).slice(0,300)}`);
console.log(`IndexNow accepted ${Math.min(urls.size,10000)} sitemap URLs (HTTP ${response.status}).`);
