const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.SITE_TEST_URL;

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  for (const width of [390, 1440]) {
    test(`${name} ${width}: full podcast content survives hydration and tab navigation`, { skip: !base }, async () => {
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/*', (route) => new URL(route.request().url()).origin === new URL(base).origin
          ? route.continue() : route.abort());

        for (const locale of ['', '/hi']) {
          const response = await page.goto(`${base}${locale}/podcasts/episode-81/`);
          assert.equal(response.status(), 200);
          const html = await response.text();
          assert.ok(Buffer.byteLength(html) < 300 * 1024, 'full episode must meet the page budget');
          const server = await page.evaluate((html) => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const island = doc.querySelector('astro-island[component-url*="EpisodeDetail"]');
            const props = JSON.parse(island.getAttribute('props')).episode[1];
            return {
              notes: doc.querySelector('.show-notes-content')?.textContent.trim(),
              transcript: doc.querySelector('.transcript-content')?.textContent.trim(),
              duplicatesContent: 'showNotesHtml' in props || 'transcriptHtml' in props,
            };
          }, html);
          assert.equal(server.duplicatesContent, false);
          assert.ok(server.notes.length > 1000, 'notes must be present before JavaScript');
          assert.ok(server.transcript.length > 1000, 'transcript must be present before JavaScript');

          await page.locator('astro-island[component-url*="EpisodeDetail"]:not([ssr])').waitFor({ state: 'attached' });
          assert.equal(await page.locator('.show-notes-content').isVisible(), true);
          assert.equal(await page.locator('.transcript-content').isVisible(), false);
          assert.equal((await page.locator('.show-notes-content').textContent()).trim(), server.notes);
          await page.getByRole('button', { name: 'Full Transcript' }).click();
          assert.equal(await page.locator('.transcript-content').isVisible(), true);
          assert.equal((await page.locator('.transcript-content').textContent()).trim(), server.transcript);
          assert.equal(new URL(page.url()).hash, '#transcript');
          await page.reload();
          await page.locator('.transcript-content').waitFor({ state: 'visible' });
          await page.getByRole('button', { name: 'Show Notes' }).click();
          assert.equal(await page.locator('.show-notes-content').isVisible(), true);
          assert.equal(new URL(page.url()).hash, '');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        }
        const archive = await page.goto(`${base}/podcasts/agentstack/`);
        assert.ok(Buffer.byteLength(await archive.text()) < 300 * 1024);
        assert.ok(await page.locator('.pa-card').count() >= 100);
        await page.locator('header[data-header-ready]').waitFor({ state: 'attached' });
        await page.locator('[data-theme-toggle]:visible').first().click();
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
        const colors = await page.evaluate(() => ({
          background: getComputedStyle(document.querySelector('.pa-card')).backgroundColor,
          title: getComputedStyle(document.querySelector('.pa-title')).color,
        }));
        assert.equal(colors.background, 'rgb(255, 255, 255)');
        assert.equal(colors.title, 'rgb(15, 23, 42)');
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    });
  }
}
