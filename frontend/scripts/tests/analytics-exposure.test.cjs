const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { chromium, webkit } = require('playwright');

const root = process.env.FRONTEND_ROOT || resolve(__dirname, '../..');
const script = readFileSync(resolve(root, 'public/js/posthog-analytics.js'), 'utf8');

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  for (const width of [390, 1440]) {
    test(`${name} ${width}: hidden impressions, return, deduplication, experiment metadata`, async () => {
      const browser = await engine.launch({ headless: true });
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.route('https://analytics-fixture.test/**', route => route.fulfill({ contentType: 'text/html', body: `
          <html lang="en"><head><meta name="toft-release" content="fixture"></head><body>
          <section data-homepage-section="hero" data-homepage-layout-version="home-test" data-homepage-test-id="hero-demand-topic" data-homepage-test-variant="gym-monster-comparison"><h1>Fixture</h1></section>
          <section data-homepage-section="latest" data-homepage-title="Latest articles"><a href="/article/" data-navigation-item data-navigation-surface="desktop" data-navigation-group="primary" data-navigation-version="nav-test">Article</a></section>
          </body></html>` }));
        await page.goto('https://analytics-fixture.test/');
        await page.evaluate(() => {
          window.events = [];
          window.observers = [];
          window.testVisibility = 'hidden';
          Object.defineProperty(document, 'visibilityState', { get: () => window.testVisibility });
          window.IntersectionObserver = class {
            constructor(callback) { this.callback = callback; this.elements = new Set(); window.observers.push(this); }
            observe(element) { this.elements.add(element); this.callback([{ target: element, isIntersecting: true, intersectionRatio: 1 }]); }
            unobserve(element) { this.elements.delete(element); }
            disconnect() { this.elements.clear(); }
          };
          window.__TOFT_POSTHOG_CONFIG__ = { key: 'fixture', analyticsVersion: 'test' };
          window.posthog = { __SV: true, init() {}, capture(event, properties) { window.events.push({ event, properties }); } };
        });
        await page.addScriptTag({ content: script });
        await page.waitForTimeout(950);
        assert.equal(await page.evaluate(() => window.events.filter(x => /^(homepage_item_viewed|navigation_item_viewed)$/.test(x.event)).length), 0);
        await page.evaluate(() => { window.testVisibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
        await page.waitForTimeout(950);
        const impressions = await page.evaluate(() => window.events.filter(x => /^(homepage_item_viewed|navigation_item_viewed)$/.test(x.event)));
        assert.equal(impressions.filter(x => x.event === 'homepage_item_viewed').length, 1);
        assert.equal(impressions.filter(x => x.event === 'navigation_item_viewed').length, 1);
        assert.equal(impressions.find(x => x.event === 'homepage_item_viewed').properties.homepage_test_id, 'hero-demand-topic');
        assert.equal(impressions.find(x => x.event === 'homepage_item_viewed').properties.homepage_test_variant, 'gym-monster-comparison');
        await page.evaluate(() => {
          window.testVisibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange'));
          window.testVisibility = 'visible'; document.dispatchEvent(new Event('visibilitychange'));
        });
        await page.waitForTimeout(950);
        assert.equal(await page.evaluate(() => window.events.filter(x => /^(homepage_item_viewed|navigation_item_viewed)$/.test(x.event)).length), 2);
      } finally { await browser.close(); }
    });
  }
}
