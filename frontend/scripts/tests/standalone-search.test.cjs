const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');

const base = process.env.SITE_TEST_URL;
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  for (const width of [390, 1440]) {
    test(`${name} ${width}: standalone search outcomes without query disclosure`, { skip: !base }, async () => {
      const browser = await engine.launch();
      try {
        const createPage = async () => {
          const page = await browser.newPage({ viewport: { width, height: 900 } });
          await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
          await page.addInitScript(() => {
            window.searchSignals = [];
            window.toftAnalytics = { capture(event, properties) { window.searchSignals.push({ event, properties }); } };
            window.__TOFT_POSTHOG_READY__ = true;
          });
          return page;
        };
        let page = await createPage();
        await page.goto(`${base}/search/?q=Speediance`);
        await page.locator('#blog-results a').first().waitFor();
        const performed = await page.evaluate(() => window.searchSignals.filter(x => x.event === 'search_performed'));
        assert.equal(performed.length, 1);
        assert.equal(performed[0].properties.search_surface, 'standalone_page');
        assert.equal(performed[0].properties.search_query_length, 'Speediance'.length);
        assert.ok(performed[0].properties.result_count > 0);
        assert.doesNotMatch(JSON.stringify(performed), /Speediance|search_query"/);
        await page.evaluate(() => {
          window.dispatchEvent(new Event('popstate'));
          document.querySelector('#blog-results a').addEventListener('click', e => e.preventDefault());
        });
        await page.locator('#blog-results a').first().click();
        const clicks = await page.evaluate(() => window.searchSignals.filter(x => x.event === 'search_result_click'));
        assert.equal(clicks.length, 1);
        assert.equal(clicks[0].properties.content_type, 'blog');
        assert.equal(clicks[0].properties.position, 1);
        assert.equal(await page.evaluate(() => window.searchSignals.filter(x => x.event === 'search_performed').length), 1);
        // A result click may already have started an Astro navigation in WebKit.
        await page.close();
        page = await createPage();
        await page.goto(`${base}/search/?q=zzqa-not-a-real-topic-782193`);
        await page.locator('#no-results:not(.hidden)').waitFor();
        const empty = await page.evaluate(() => window.searchSignals.filter(x => x.event === 'search_no_results'));
        assert.equal(empty.length, 1);
        assert.equal(empty[0].properties.result_count, 0);
        assert.doesNotMatch(JSON.stringify(empty), /zzqa-not-a-real-topic/);
        for (const locale of ['de', 'es', 'hi', 'pt']) {
          const query = '<img src=x onerror="window.searchInjectionExecuted=true">';
          await page.goto(`${base}/${locale}/search/?q=${encodeURIComponent(query)}`);
          assert.match(await page.locator('#search-summary').innerText(), /<img src=x/);
          assert.equal(await page.locator('#search-summary img').count(), 0);
          assert.equal(await page.evaluate(() => window.searchInjectionExecuted === true), false);
        }
      } finally { await browser.close(); }
    });
  }
}
