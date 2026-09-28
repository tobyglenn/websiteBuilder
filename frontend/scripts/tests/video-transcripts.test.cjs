const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.SITE_TEST_URL;
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  for (const width of [390, 1440]) {
    test(`${name} ${width}: transcript seeking, translated navigation, language metadata`, { skip: !base }, async () => {
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        page.setDefaultTimeout(15000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
        await page.goto(`${base}/video/qTgprkmjw4w/`);
        await page.locator('a[data-analytics-event="transcript_open"]').click();
        await page.locator('astro-island[component-url*="VideoPlayer"]:not([ssr])').waitFor();
        assert.equal(await page.locator('#transcript details').getAttribute('open'), '');
        assert.match(await page.locator('.video-transcript').textContent(), /Blender/);
        await page.locator('#transcript a[data-seconds="35"]').click();
        await page.waitForFunction(() => document.querySelector('#video-player-wrapper iframe')?.src.includes('start=35'));
        assert.equal(new URL(page.url()).hash, '#t=35s');
        await page.locator('#transcript a[hreflang="de"]').click();
        await page.waitForURL(/\/de\/video\/qTgprkmjw4w\/#transcript$/);
        assert.equal(await page.locator('html').getAttribute('lang'), 'de');
        assert.match(await page.locator('#transcript').textContent(), /Maschinell mit MiniMax/);
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://tobyonfitnesstech.com/de/video/qTgprkmjw4w/');
        for (const locale of ['en', 'de', 'es', 'pt', 'hi']) assert.equal(await page.locator(`link[rel="alternate"][hreflang="${locale}"]`).count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        await page.locator('#transcript a[data-seconds="35"]').click();
        await page.waitForFunction(() => document.querySelector('#video-player-wrapper iframe')?.src.includes('start=35'));
        if (process.env.SCREENSHOT_DIR) {
          await page.locator('#transcript').scrollIntoViewIfNeeded();
          await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/transcript-${name}-${width}.png` });
        }
        await page.locator('#transcript a[hreflang="en"]').click();
        await page.waitForURL(/(?<!de)\/video\/qTgprkmjw4w\/#transcript$/);
        assert.equal(await page.locator('html').getAttribute('lang'), 'en');
        assert.equal(await page.locator('#transcript details').getAttribute('open'), '');
        await page.locator('#transcript a[data-seconds="35"]').click();
        await page.waitForFunction(() => document.querySelector('#video-player-wrapper iframe')?.src.includes('start=35'));
        await page.locator('astro-island[component-url*="Header"]:not([ssr])').waitFor();
        await page.getByRole('button', { name: width < 1280 ? 'Open navigation' : 'Choose language', exact: true }).filter({ visible: true }).click();
        await page.getByRole('button', { name: 'Español', exact: true }).filter({ visible: true }).click();
        await page.waitForURL(/\/es\/video\/qTgprkmjw4w\/$/);
        assert.equal(await page.locator('html').getAttribute('lang'), 'es');
        assert.deepEqual(errors, []);
      } finally { await browser.close(); }
    });
  }
}
