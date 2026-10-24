import test from 'node:test';
import assert from 'node:assert/strict';
import {homeBlogCover} from '../../src/lib/homeBlogCovers.mjs';
import {usesPokemonFeatureImage,pokemonFeatureImageStyle,POKEMON_FEATURE_SLUG,POKEMON_FEATURE_IMAGE} from '../../src/lib/pokemonBlogPresentation.mjs';
const post={slug:POKEMON_FEATURE_SLUG,image:POKEMON_FEATURE_IMAGE,category:'Build Logs',editorial_lane:'public-projects'};
test('reviewed game image wins over topic fallback, including translated metadata',()=>{
 for(const lang of ['en','de','es','pt','hi']){
  const p={...post,lang,title:'Title',category:'Localized category',categoryKey:'Build Logs'};
  assert.equal(homeBlogCover(p)[0].src,POKEMON_FEATURE_IMAGE);assert.equal(homeBlogCover(p)[0].fit,'contain');
  assert.match(pokemonFeatureImageStyle(p),/transform: none/);
 }
});
test('unrelated article or mismatched image does not receive the exception',()=>{
 for(const p of [{...post,slug:'other'},{...post,image:'/images/other.png'}]){assert.equal(usesPokemonFeatureImage(p),false);assert.equal(pokemonFeatureImageStyle(p),undefined)}
 assert.equal(homeBlogCover({slug:'wild-rebellion-guidance-without-open-panels'})[0].src,'/images/blog/wild-rebellion-guidance-without-open-panels-wild-racing-aria-review.png');
});
