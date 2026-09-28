const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require('playwright');
const base = process.env.SITE_TEST_URL;

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  for (const width of [390, 1440]) {
    test(`${engineName} ${width}: theme, filters, newsletter retry, guides, workout export`, { skip: !base }, async () => {
      const browser = await engine.launch();
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        page.setDefaultTimeout(15000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        let kitStatus = 503;
        await page.route('**/*', route => {
          const url = new URL(route.request().url());
          if (url.hostname === 'app.kit.com') return route.fulfill({ status: kitStatus, contentType: 'application/json', body: kitStatus === 200 ? '{"success":true}' : '{"error":"unavailable"}' });
          return url.origin === new URL(base).origin ? route.continue() : route.abort();
        });
        await page.addInitScript(() => {
          window.reviewEvents = [];
          window.reviewPageLoads = 0;
          document.addEventListener('astro:page-load', () => window.reviewPageLoads++);
          window.posthog = { __SV: true, init() {}, register() {}, capture: (event, properties) => window.reviewEvents.push({ event, properties }) };
          window.toftAnalytics = { capture: window.posthog.capture };
        });
        const headerReady = () => page.locator('astro-island[component-url*="Header"]:not([ssr])').waitFor();
        await page.goto(`${base}/start-here/`);
        await headerReady();
        await page.getByRole('button', { name: 'Switch to light mode' }).filter({ visible: true }).click();
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
        await page.getByRole('link', { name: 'Explore Workout Hub' }).click();
        await page.waitForURL(/\/workout-hub\/?$/);
        await headerReady();
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
        assert.equal(await page.locator('html').evaluate(el => el.classList.contains('dark')), false);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        await page.reload();
        await headerReady();
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
        if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/hub-light-${engineName}-${width}.png` });
        await page.getByRole('button', { name: 'Switch to dark mode' }).filter({ visible: true }).click();
        await page.goto(`${base}/videos/?cat=bjj`);
        await page.locator('astro-island[component-url*="VideoGrid"]:not([ssr])').waitFor();
        const speediance = page.getByRole('button', { name: /^Speediance \(/ });
        let loads = await page.evaluate(() => window.reviewPageLoads);
        await speediance.click();
        await page.waitForFunction(before => window.reviewPageLoads > before, loads);
        assert.equal(new URL(page.url()).searchParams.get('cat'), 'speediance');
        loads = await page.evaluate(() => window.reviewPageLoads);
        await page.goBack();
        await page.waitForFunction(before => window.reviewPageLoads > before, loads);
        assert.equal(new URL(page.url()).searchParams.get('cat'), 'bjj');
        await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => /^BJJ/.test(b.textContent) && b.className.includes('bg-blue-600')));
        await page.goto(`${base}/videos/?cat=shorts`);
        await page.locator('astro-island[component-url*="VideoGrid"]:not([ssr])').waitFor();
        assert.ok(await page.locator('a[data-analytics-event="content_card_click"]').count() > 0);
        await page.goto(`${base}/projects/`);
        for (const slug of ['wild-rebellion', 'ironvane-chronicle', 'monstrum-world']) assert.ok(await page.locator(`a[href="/projects/${slug}/"]`).count());
        await page.goto(`${base}/`);
        await headerReady();
        await page.getByRole('button', { name: 'Switch to light mode' }).filter({ visible: true }).click();
        assert.equal(await page.locator('.theme-image-overlay h3').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
        const email = page.getByRole('textbox', { name: 'Email address' });
        await email.scrollIntoViewIfNeeded();
        await page.locator('astro-island[component-url*="NewsletterSignup"]:not([ssr])').waitFor();
        await email.fill('qa@example.invalid');
        await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'could not confirm' }).waitFor();
        assert.equal(await page.getByRole('status').filter({ hasText: 'subscription request was received' }).count(), 0);
        kitStatus = 200;
        await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
        await page.getByRole('status').filter({ hasText: 'subscription request was received' }).waitFor();
        const events = await page.evaluate(() => window.reviewEvents);
        assert.equal(events.filter(e => e.event === 'newsletter_signup').length, 1);
        assert.ok(!JSON.stringify(events).includes('qa@example.invalid'));
        await page.goto(`${base}/speediance/workouts/`);
        await page.locator('astro-island[component-url*="SpeedianceWorkoutHub"]:not([ssr])').waitFor();
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'JSON', exact: true }).first().click();
        const download = await downloadPromise;
        const payload = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
        assert.ok(payload.exercises.length > 0);
        assert.ok(payload.exercises.every(ex => ex.id && ex.sets.length));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        assert.deepEqual(errors, []);
      } finally { await browser.close(); }
    });
  }
}
