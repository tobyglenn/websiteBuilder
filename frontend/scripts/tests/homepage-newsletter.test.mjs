import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('../../src/scripts/homepageNewsletter.js', import.meta.url), 'utf8').replace(/^import[^\n]+\n/, '');
function fixture(fetch) {
  const listeners = {}, events = [], error = { hidden: true }, success = { hidden: true };
  const button = { disabled: false, textContent: 'Suscribirse' };
  class Form {
    elements = { namedItem: () => ({ value: ' private@example.com ' }) };
    hidden = false;
    matches() { return true; }
    reportValidity() { return true; }
    querySelector(selector) { return selector === '[role="alert"]' ? error : button; }
    closest() { return { querySelector: () => success }; }
    setAttribute() {}
  }
  const form = new Form();
  vm.runInNewContext(source, {
    document: { addEventListener: (name, fn) => { listeners[name] = fn; } },
    captureEvent: (name, props) => events.push([name, props]),
    HTMLFormElement: Form, AbortController, setTimeout, clearTimeout, fetch,
  });
  return { form, events, button, error, success, listeners, submit: () => listeners.submit({ target: form, preventDefault() {} }) };
}
test('native homepage signup preserves privacy, translations, and success analytics', async () => {
  const f = fixture(async (_, options) => {
    assert.deepEqual(JSON.parse(options.body), { email_address: 'private@example.com' });
    return { ok: true };
  });
  const event = { target: { closest: () => f.form } };
  f.listeners.focusin(event); f.listeners.focusin(event);
  await f.submit();
  assert.equal(f.form.hidden, true);
  assert.equal(f.success.hidden, false);
  assert.equal(f.button.textContent, 'Suscribirse');
  assert.deepEqual(f.events.map(e => e[0]), ['newsletter_form_started', 'newsletter_submit_attempt', 'newsletter_signup', 'cta_conversion']);
  assert.equal(JSON.stringify(f.events).includes('private@'), false);
});
test('HTTP failure is retryable and does not emit signup', async () => {
  let count = 0;
  const f = fixture(async () => ({ ok: ++count > 1 }));
  await f.submit();
  assert.equal(f.error.hidden, false);
  assert.equal(f.button.disabled, false);
  assert.equal(f.form.hidden, false);
  assert.equal(f.events.at(-1)[1].error_type, 'response');
  await f.submit();
  assert.equal(f.success.hidden, false);
});
test('network failures and timeouts preserve retry and never claim success', async () => {
  for (const name of ['TypeError', 'AbortError']) {
    const f = fixture(async () => { const e = new Error(); e.name = name; throw e; });
    await f.submit();
    assert.equal(f.events.at(-1)[1].error_type, name === 'AbortError' ? 'timeout' : 'network');
    assert.equal(f.button.disabled, false);
    assert.equal(f.success.hidden, true);
  }
});
test('duplicate submission sends one request', async () => {
  let resolve, count = 0;
  const f = fixture(() => { count++; return new Promise(r => { resolve = r; }); });
  const first = f.submit(); await f.submit();
  assert.equal(count, 1);
  resolve({ ok: true }); await first;
});
