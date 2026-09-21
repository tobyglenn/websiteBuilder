const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');

const base = process.env.SITE_TEST_URL;

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  for (const width of [390, 1440]) {
    test(`${engineName} ${width}: localized charts without CDN globals`, { skip: !base }, async () => {
      const browser = await engine.launch({ headless: true });
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => {
          const url = new URL(route.request().url());
          return url.origin === new URL(base).origin ? route.continue() : route.abort();
        });
        for (const locale of ['de', 'es', 'pt', 'hi', 'de']) {
          await page.goto(`${base}/${locale}/training/`);
          await page.locator('astro-island[component-url*="Header"]:not([ssr])').waitFor();
          await page.evaluate(() => {
            window.__chartNavigationSentinel = true;
            window.__menuEvents = [];
            const capture = window.toftAnalytics.capture.bind(window.toftAnalytics);
            window.toftAnalytics.capture = (event, properties) => {
              if (event === 'navigation_menu_opened') window.__menuEvents.push(properties);
              return capture(event, properties);
            };
          });
          if (width < 1280) {
            const reviewsLabel = await page.locator('nav[aria-label="Primary navigation"] button').first().textContent();
            await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
            await page.getByRole('button', { name: reviewsLabel, exact: true }).last().click();
          } else {
            const menu = page.getByRole('navigation', { name: 'Primary navigation', exact: true }).getByRole('button').first();
            await menu.click();
            assert.equal(await menu.getAttribute('aria-expanded'), 'true', 'first pointer click must preserve a hover-open menu');
            assert.equal(await page.evaluate(() => window.__menuEvents.filter(event => event.menu_name === 'reviews').length), 1, 'hover and first click must not double-count a menu open');
            await menu.click();
            assert.equal(await menu.getAttribute('aria-expanded'), 'false', 'second click closes the menu');
            await menu.press('Enter');
            assert.equal(await menu.getAttribute('aria-expanded'), 'true', 'keyboard opens the menu');
            assert.equal(await page.evaluate(() => window.__menuEvents.filter(event => event.menu_name === 'reviews').length), 2);
          }
          await page.locator(`a[href="/${locale}/speediance/"]`).first().click();
          await page.waitForURL(`${base}/${locale}/speediance/`);
          assert.equal(await page.evaluate(() => window.__chartNavigationSentinel), true, 'must exercise Astro client navigation');
          await page.waitForFunction(() => [...document.querySelectorAll('#volumeChart, #donutChart')].length === 2 && [...document.querySelectorAll('#volumeChart, #donutChart')].every(canvas => {
            const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
            return pixels.some((value, index) => index % 4 === 3 && value > 0);
          }));
          // Astro reruns page initialization on navigation; repeated events must not reuse a chart instance.
          await page.evaluate(() => {
            document.dispatchEvent(new Event('astro:page-load'));
            document.dispatchEvent(new Event('astro:page-load'));
          });
          await page.waitForTimeout(400);
          assert.equal(await page.evaluate(() => typeof window.Chart), 'undefined');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
          assert.deepEqual(errors, [], `${locale}: ${errors.join('; ')}`);
          if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/speediance-${locale}-${engineName}-${width}.png`, fullPage: true });
        }
      } finally {
        await browser.close();
      }
    });
  }
}
