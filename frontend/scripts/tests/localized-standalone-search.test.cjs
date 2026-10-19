const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.SITE_TEST_URL;

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  for (const width of [390, 1440]) {
    test(`${name} ${width}: localized fallback search and Astro revisit`, { skip: !base }, async () => {
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        page.setDefaultTimeout(10000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
        await page.addInitScript(() => {
          window.searchSignals = [];
          window.toftAnalytics = { capture(event, properties) { window.searchSignals.push({ event, properties }); } };
          window.__TOFT_POSTHOG_READY__ = true;
        });
        for (const locale of ['de', 'es', 'pt', 'hi']) {
          await page.goto(`${base}/${locale}/search/`);
          await page.locator('#standalone-query').fill('Speediance');
          await page.locator('#standalone-query').press('Enter');
          await page.locator('#blog-results a').first().waitFor();
          const performed = await page.evaluate(() => window.searchSignals.filter(x => x.event === 'search_performed'));
          assert.equal(performed.length, 1);
          assert.equal(performed[0].properties.$current_url, `${base}/${locale}/search/`);
          assert.doesNotMatch(JSON.stringify(performed), /Speediance/);
          // Use a real result link; prevent navigation only to inspect the selection event.
          await page.locator('#blog-results a').first().evaluate(link => link.addEventListener('click', event => event.preventDefault()));
          await page.locator('#blog-results a').first().click();
          assert.equal(await page.evaluate(() => window.searchSignals.filter(x => x.event === 'search_result_click').length), 1);
          await page.locator('#standalone-query').fill('zzqa-no-such-topic-583924');
          await page.locator('#standalone-search-form button').click();
          await page.locator('#no-results:not(.hidden)').waitFor();
          const empty = await page.evaluate(() => window.searchSignals.filter(x => x.event === 'search_no_results'));
          assert.equal(empty.length, 1);
          assert.doesNotMatch(JSON.stringify(empty), /zzqa-no-such-topic/);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        }
        // Exercise the actual Astro router, including a second visit to the same inline script.
        await page.goto(`${base}/de/search/?q=Speediance`);
        await page.locator('#blog-results a').first().waitFor();
        await page.locator('#blog-results a').first().click();
        await page.waitForURL(/\/blog\//);
        await page.goBack();
        await page.locator('#blog-results a').first().waitFor();
        await page.locator('#standalone-query').fill('zzqa-no-such-topic-583924');
        await page.locator('#standalone-query').press('Enter');
        await page.locator('#no-results:not(.hidden)').waitFor();
        assert.deepEqual(errors, []);
      } finally { await browser.close(); }
    });
    test(`${name} ${width}: homepage initial and visible-island hydration`, { skip: !base }, async () => {
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        page.setDefaultTimeout(10000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
        await page.goto(base);
        await page.locator('astro-island[component-url*="Header"]:not([ssr])').waitFor();
        await page.locator('input[type="email"]').scrollIntoViewIfNeeded();
        await page.locator('astro-island[component-url*="NewsletterSignup"]:not([ssr])').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        assert.deepEqual(errors, []);
      } finally { await browser.close(); }
    });
  }
}
