const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { chromium, webkit } = require('playwright');

const root = process.env.FRONTEND_ROOT || resolve(__dirname, '../..');
const script = readFileSync(resolve(root, 'public/js/posthog-analytics.js'), 'utf8');
const sdkPath = process.env.POSTHOG_EXCEPTION_SDK;

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`${name}: opaque exception context is bounded, private and never suppresses errors`, async () => {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.route('**/*', route => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/js/posthog-analytics.js') return route.fulfill({ contentType: 'text/javascript', body: script });
        if (path === '/js/failing-widget.js') return route.fulfill({ contentType: 'text/javascript', body: "window.dispatchEvent(new CustomEvent('unhandledrejection', { detail: { secret: 'DO-NOT-CAPTURE', email: 'private@example.test' } }));" });
        return route.fulfill({ contentType: 'text/html', body: '<html><head><meta name="toft-release" content="test-release"></head><body></body></html>' });
      });
      await page.goto('https://exception-fixture.test/');
      if (sdkPath) await page.addScriptTag({ content: readFileSync(sdkPath, 'utf8') });
      await page.evaluate(() => {
        window.captured = [];
        window.__TOFT_POSTHOG_CONFIG__ = { key: 'fixture', analyticsVersion: 'test' };
        window.posthog = { __SV: true, capture() {}, init(key, options) {
          window.options = options;
          const record = properties => window.captured.push(options.before_send({ event: '$exception', properties }));
          const wrappers = window.__PosthogExtensions__?.errorWrappingFunctions;
          if (wrappers) {
            wrappers.wrapUnhandledRejection(record);
            wrappers.wrapOnError(record);
          } else {
            window.onunhandledrejection = () => record({ $exception_list: [{ type: 'CustomEvent', value: 'CustomEvent captured as exception with keys: isTrusted' }] });
            window.onerror = () => record({ $exception_list: [{ type: 'Error', value: 'fixture error' }] });
          }
        } };
      });
      await page.addScriptTag({ url: 'https://exception-fixture.test/js/posthog-analytics.js' });
      await page.addScriptTag({ url: 'https://exception-fixture.test/js/failing-widget.js?token=DO-NOT-CAPTURE' });
      const first = await page.evaluate(() => window.captured[0]);
      assert.equal(first.event, '$exception');
      assert.equal(first.properties.$exception_list[0].type, 'CustomEvent');
      assert.match(first.properties.$exception_list[0].value, /CustomEvent captured as exception with keys: isTrusted/);
      assert.equal(first.properties.exception_browser_event_class, 'CustomEvent');
      assert.equal(first.properties.exception_browser_event_type, 'unhandledrejection');
      assert.equal(first.properties.exception_event_trusted, false);
      assert.equal(first.properties.exception_context_scope, 'same-task-browser-event');
      assert.equal(first.properties.site_release, 'test-release');
      assert.ok(first.properties.exception_source_frames.some(frame => frame.startsWith('/js/failing-widget.js:')));
      assert.doesNotMatch(JSON.stringify(first), /DO-NOT-CAPTURE|private@example|token=/);
      await page.evaluate(() => {
        const manual = { event: '$exception', properties: { $exception_list: [{ type: 'Error', value: 'later error' }] } };
        window.captured.push(window.options.before_send(manual));
        const event = new CustomEvent('unhandledrejection');
        Object.defineProperty(event, 'detail', { get() { throw new Error('private getter'); } });
        window.dispatchEvent(event);
        window.dispatchEvent(new ErrorEvent('error', { error: new Error('real application error'), message: 'real application error' }));
      });
      const events = await page.evaluate(() => window.captured);
      assert.equal(events.length, 4);
      assert.equal(events[1].properties.exception_context_scope, 'no-browser-event-context');
      assert.equal(events[1].properties.exception_source_frames, undefined);
      assert.equal(events[3].properties.exception_browser_event_type, 'error');
      assert.equal(events[3].properties.exception_reason_type, 'Error');
      assert.equal(events[3].properties.$exception_list[0].type, 'Error');
      assert.equal(await page.evaluate(() => window.options.capture_exceptions), true);
      await page.evaluate(() => {
        Promise.reject(new CustomEvent('opaque-error', { detail: { secret: 'DO-NOT-CAPTURE' } }));
      });
      await page.waitForFunction(() => window.captured.length === 5);
      const rejection = await page.evaluate(() => window.captured[4]);
      assert.equal(rejection.properties.exception_reason_type, 'CustomEvent');
      assert.equal(rejection.properties.exception_browser_event_type, 'unhandledrejection');
      assert.equal(rejection.properties.exception_reason_event_type, 'other');
      assert.doesNotMatch(JSON.stringify(rejection), /DO-NOT-CAPTURE|opaque-error/);
      console.log(`${name}: ${sdkPath ? 'real PostHog exception SDK' : 'capture fixture'}; all five exceptions retained`);
    } finally { await browser.close(); }
  });

  test(`${name}: deployed article enriches the original exception without sending test traffic`, {
    skip: !process.env.SITE_TEST_URL || !sdkPath,
  }, async () => {
    const browser = await engine.launch({ headless: true });
    try {
      const base = process.env.SITE_TEST_URL;
      const page = await browser.newPage({ viewport: { width: name === 'webkit' ? 390 : 1440, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin
        ? route.continue() : route.abort());
      await page.goto(`${base}/blog/openclaw-fitness-reports-garmin-whoop-speediance/`);
      await page.waitForFunction(() => !!window.toftAnalytics && !!window.posthog?._i?.[0]?.[1]);
      assert.equal(await page.locator('h1').isVisible(), true);
      // Layout is checked separately: this article has pre-existing mobile
      // overflow from long inline code, unrelated to exception instrumentation.
      assert.deepEqual(errors, []);
      await page.addScriptTag({ content: readFileSync(sdkPath, 'utf8') });
      const result = await page.evaluate(() => {
        const options = window.posthog._i[0][1];
        let captured;
        window.__PosthogExtensions__.errorWrappingFunctions.wrapUnhandledRejection(properties => {
          captured = options.before_send({ event: '$exception', properties });
        });
        window.dispatchEvent(new CustomEvent('unhandledrejection'));
        return captured;
      });
      assert.equal(result.properties.$exception_list[0].type, 'CustomEvent');
      assert.equal(result.properties.exception_context_version, '20260928-browser-event-v1');
      assert.equal(result.properties.exception_browser_event_type, 'unhandledrejection');
      assert.equal(result.properties.exception_browser_event_class, 'CustomEvent');
      assert.equal(result.properties.analytics_version, '20260928-exception-context');
      console.log(`${name}: verified deployed release ${result.properties.site_release}`);
    } finally { await browser.close(); }
  });
}
