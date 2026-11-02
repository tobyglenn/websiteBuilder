const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.SITE_TEST_URL;

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  for (const width of [390, 1440]) {
    test(`${name} ${width}: video origin is stable through hydration and seeking`, { skip: !base }, async () => {
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin
          ? route.continue() : route.abort());
        for (const [locale, videoId] of [['', '7SbAqizIdzM'], ['/de', '9JA9pjANcPo']]) {
          const response = await page.goto(`${base}${locale}/video/${videoId}/`);
          assert.equal(response.status(), 200);
          const html = await response.text();
          const serverSrc = await page.evaluate(html => new DOMParser().parseFromString(html, 'text/html')
            .querySelector('[data-video-location="video_detail"] iframe')?.getAttribute('src'), html);
          assert.ok(serverSrc);
          assert.equal(new URL(serverSrc).searchParams.get('origin'), 'https://tobyonfitnesstech.com');
          if (!locale) {
            const translationHold = await page.evaluate(html => new DOMParser().parseFromString(html, 'text/html')
              .querySelector('astro-island[component-url*="NewsletterSignup"] [translate]')?.getAttribute('translate'), html);
            assert.equal(translationHold, 'no');
          }
          await page.locator('astro-island[component-url*="VideoPlayer"]:not([ssr])').waitFor();
          assert.equal(await page.locator('[data-video-location="video_detail"] iframe').getAttribute('src'), serverSrc);
          await page.evaluate(() => { location.hash = 't=30s'; });
          await page.waitForFunction(() => document.querySelector('[data-video-location="video_detail"] iframe')
            ?.getAttribute('data-analytics-start-time') === '30');
          const seekSrc = new URL(await page.locator('[data-video-location="video_detail"] iframe').getAttribute('src'));
          assert.equal(seekSrc.searchParams.get('origin'), 'https://tobyonfitnesstech.com');
          assert.equal(seekSrc.searchParams.get('start'), '30');
          if (!locale) {
            const newsletterInput = page.locator('astro-island[component-url*="NewsletterSignup"] input[type=email]');
            await newsletterInput.scrollIntoViewIfNeeded();
            await page.locator('astro-island[component-url*="NewsletterSignup"]:not([ssr])').waitFor({ state: 'attached' });
            assert.equal(await newsletterInput.isEditable(), true);
            await page.waitForFunction(() => document.querySelector('astro-island[component-url*="NewsletterSignup"] [translate]')
              ?.getAttribute('translate') === 'yes');
          }
          assert.deepEqual(errors, []);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        }
      } finally { await browser.close(); }
    });
  }
}
