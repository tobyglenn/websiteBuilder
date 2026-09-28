const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.SITE_TEST_URL;

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  for (const width of [390, 1440]) {
    test(`${name} ${width}: locale metadata, literal search text, search telemetry`, { skip: !base }, async () => {
      const browser = await engine.launch({ headless: true });
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        page.setDefaultTimeout(12000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin
          ? route.continue() : route.abort());
        for (const locale of ['de', 'es', 'hi', 'pt']) {
          await page.goto(`${base}/${locale}/speediance/`);
          assert.equal(await page.locator('html').getAttribute('lang'), locale);
          assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://tobyonfitnesstech.com/${locale}/speediance/`);
          assert.equal(await page.locator('link[hreflang="en"]').getAttribute('href'), 'https://tobyonfitnesstech.com/speediance/');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        }
        const query = '<img src=x onerror="window.searchInjected=true">';
        await page.goto(`${base}/search/?q=${encodeURIComponent(query)}`);
        assert.match(await page.locator('#search-summary').textContent(), /<img src=x/);
        assert.equal(await page.locator('#search-summary img').count(), 0);
        assert.equal(await page.evaluate(() => window.searchInjected), undefined);
        await page.goto(`${base}/`);
        await page.locator('astro-island[component-url*="Header"]:not([ssr])').waitFor();
        await page.waitForFunction(() => !!window.toftAnalytics);
        await page.evaluate(() => {
          window.searchEvents = [];
          const capture = window.toftAnalytics.capture.bind(window.toftAnalytics);
          window.toftAnalytics.capture = (event, properties) => {
            if (event.startsWith('search_')) window.searchEvents.push({ event, properties });
            return capture(event, properties);
          };
        });
        // The global shortcut must work even while the mobile drawer is closed.
        await page.keyboard.press('Control+k');
        const input = page.locator('input[type="text"]').filter({ visible: true }).last();
        await input.fill('oura');
        console.log(`${name} ${width}: search opened`);
        await page.waitForFunction(() => window.searchEvents.some(x => x.event === 'search_performed' && x.properties.result_count > 0));
        const modal = page.locator('body > div.fixed').filter({ has: page.getByRole('button', { name: 'Close search', exact: true }) });
        const result = modal.locator('a[href^="/blog/"]').first();
        await result.click();
        console.log(`${name} ${width}: result clicked`);
        await page.waitForFunction(() => window.searchEvents.some(x => x.event === 'search_result_click'));
        await page.waitForURL(/\/blog\//);
        await page.locator('astro-island[component-url*="Header"]:not([ssr])').waitFor();
        if (width < 1280) await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
        await page.getByRole('button', { name: 'Open search', exact: true }).filter({ visible: true }).click();
        await page.locator('input[type="text"]').filter({ visible: true }).last().fill('zzqnovalidmatch20260928');
        await page.waitForFunction(() => window.searchEvents.some(x => x.event === 'search_no_results'));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        assert.deepEqual(errors, []);
        if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/search-${name}-${width}.png` });
      } finally { await browser.close(); }
    });
  }
}
