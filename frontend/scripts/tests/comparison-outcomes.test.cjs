const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.SITE_TEST_URL;
for (const [name, engine] of Object.entries({ chromium, webkit })) {
 for (const width of [390,1440]) {
  test(`${name} ${width}: comparison changes and blocked attempts stay distinct`, {skip:!base}, async()=>{
   const browser=await engine.launch();
   try {
    const page=await browser.newPage({viewport:{width,height:900}});
    page.setDefaultTimeout(12000);
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
    await page.addInitScript(()=>{
     window.selectionEvents=[];window.__TOFT_POSTHOG_READY__=true;
     window.toftAnalytics={capture(event,properties){if(event==='comparison_selection_outcome')window.selectionEvents.push(properties);}};
    });
    await page.goto(`${base}/compare/`);
    await page.locator('#product-picker button').first().waitFor({state:'attached'});
    await page.locator('#toggle-picker').click();
    const pair=width<900;
    await page.locator(pair?'#product-picker button[aria-pressed=true]':'#product-picker button[aria-pressed=false]').first().click();
    await page.waitForFunction(()=>window.selectionEvents.length===1);
    let events=await page.evaluate(()=>window.selectionEvents);
    assert.equal(events.length,1);assert.equal(events[0].outcome,'blocked');
    assert.equal(events[0].reason,pair?'already_selected_mobile':'selection_limit');
    assert.equal(events[0].selected_count,pair?2:4);
    await page.locator(pair?'#product-picker button[aria-pressed=false]':'#product-picker button[aria-pressed=true]').first().click();
    await page.waitForFunction(()=>window.selectionEvents.length===2);
    events=await page.evaluate(()=>window.selectionEvents);
    assert.equal(events.length,2);assert.equal(events[1].outcome,'changed');
    assert.equal(events[1].selected_count,pair?2:3);
    if(pair){
     await page.locator('#mobile-a').selectOption(events[1].selected_devices[1]);
     await page.waitForFunction(()=>window.selectionEvents.length===3);
     events=await page.evaluate(()=>window.selectionEvents);
     assert.equal(events.at(-1).outcome,'changed');
     assert.equal(new Set(events.at(-1).selected_devices).size,2);
    }
    await page.locator('#reset-picks').click();
    await page.waitForFunction(()=>window.selectionEvents.at(-1)?.action==='reset');
    events=await page.evaluate(()=>window.selectionEvents);
    assert.equal(events.at(-1).action,'reset');
    assert.equal(events.at(-1).selected_count,pair?2:4);
    assert.doesNotMatch(JSON.stringify(events),/search_query|email|http:|https:/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    assert.deepEqual(errors,[]);
   }finally{await browser.close();}
  });
 }
}
