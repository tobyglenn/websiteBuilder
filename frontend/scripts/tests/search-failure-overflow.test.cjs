const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.SITE_TEST_URL;

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  for (const width of [390, 1440]) {
    test(`${name} ${width}: article containment and failed search recovery`, { skip: !base }, async () => {
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.route('**/*', route => {
          const url = new URL(route.request().url());
          if (url.origin !== new URL(base).origin || /\/_astro\/SearchModal\..*\.js$/.test(url.pathname)) return route.abort();
          return route.continue();
        });
        await page.goto(`${base}/blog/openclaw-fitness-reports-garmin-whoop-speediance/`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        // Preserve copyable code blocks and their local horizontal scrolling.
        await page.evaluate(() => {
          const pre = document.createElement('pre');
          const code = document.createElement('code');
          code.textContent = 'x'.repeat(300);
          pre.append(code);
          document.querySelector('.markdown-article').append(pre);
        });
        assert.equal(await page.evaluate(() => {
          const pre = document.querySelector('.markdown-article pre:last-child');
          return pre.scrollWidth > pre.clientWidth && document.documentElement.scrollWidth <= innerWidth + 1;
        }), true);
        await page.locator('astro-island[component-url*="Header"]:not([ssr])').waitFor();
        await page.waitForFunction(() => !!window.toftAnalytics);
        const sourceSignals = await page.evaluate(() => {
          const captured = [];
          const capture = window.toftAnalytics.capture;
          window.toftAnalytics.capture = (name, props) => {
            if (name === 'frontend_script_error') captured.push(props);
          };
          window.dispatchEvent(new ErrorEvent('error', { message: 'Script error.' }));
          window.dispatchEvent(new ErrorEvent('error', {
            filename: `${location.origin}/_astro/fixture.js?secret=do-not-collect`,
            lineno: 8, colno: 2, error: new TypeError('private message'),
          }));
          window.toftAnalytics.capture = capture;
          return captured;
        });
        assert.equal(sourceSignals[0].error_source, '');
        assert.equal(sourceSignals[0].error_source_known, false);
        assert.equal(sourceSignals[0].error_opaque, true);
        assert.equal(sourceSignals[1].error_source_known, true);
        assert.equal(sourceSignals[1].error_opaque, false);
        assert.equal(sourceSignals[1].error_source, `${new URL(base).origin}/_astro/fixture.js`);
        assert.doesNotMatch(JSON.stringify(sourceSignals), /do-not-collect|private message/);
        await page.evaluate(() => {
          window.originalSearchErrors = [];
          window.posthog.captureException = error => window.originalSearchErrors.push(error.message);
        });
        await page.keyboard.press('Control+k');
        const dialog = page.getByRole('dialog', { name: 'Search unavailable' });
        await dialog.waitFor();
        assert.equal(await dialog.getByRole('link', { name: 'Open search page' }).getAttribute('href'), '/search/');
        assert.equal(await page.evaluate(() => window.originalSearchErrors.length), 1);
        await dialog.getByRole('button', { name: 'Close search', exact: true }).click();
        assert.equal(await dialog.count(), 0);
        await page.keyboard.press('Control+k');
        await dialog.getByRole('link', { name: 'Open search page' }).click();
        await page.waitForURL(/\/search\/$/);
        assert.equal(await page.locator('#search-summary').count(), 1);
      } finally {
        await browser.close();
      }
    });
  }
}
