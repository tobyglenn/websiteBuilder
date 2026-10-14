import assert from 'node:assert/strict';
import test from 'node:test';
import {articleTopic, normalizeBlogCategory, BLOG_CATEGORIES} from '../../src/lib/blogEditorial.mjs';
test('article intent wins over products mentioned in an AI or BJJ article',()=>{
 assert.equal(articleTopic({category:'Build Logs',title:'OpenClaw fitness reports from Speediance and WHOOP'}),'ai');
 assert.equal(articleTopic({category:'BJJ',title:'Speediance strength training for grapplers'}),'bjj');
 assert.equal(articleTopic({category:'Reviews',title:'WHOOP vs Garmin'}),'wearables');
 assert.equal(articleTopic({category:'Reviews',title:'Speediance vs Tonal'}),'gym');
});
test('legacy categories become usable filters without flattening valid categories',()=>{
 assert.equal(normalizeBlogCategory('fitness tech',{title:'Oura vs WHOOP'}),'Wearables');
 assert.equal(normalizeBlogCategory('AI Tech'),'Build Logs');
 assert.equal(normalizeBlogCategory('Mat Science'),'BJJ');
 assert.equal(normalizeBlogCategory('Training'),'Training Tips');
 for(const c of BLOG_CATEGORIES) assert.equal(normalizeBlogCategory(c),c);
});

test('generic AI and additional device titles get a useful rotation topic', () => {
 for (const title of ['Why your AI comparison might be totally unfair', 'Minimax vs Kodak: AI design', 'Using an LLM at home', 'Gemini coding']) assert.equal(articleTopic({title}), 'ai');
 for (const title of ['Smartwatch showdown: Garmin vs OnePlus for AI control', 'Apple Watch battery life']) assert.equal(articleTopic({title}), 'wearables');
 for (const title of ['INNODIGYM vs Speediance', 'Vitruvian review']) assert.equal(articleTopic({title}), 'gym');
 assert.equal(articleTopic({title:'Training with a daily walk'}), 'training');
});
