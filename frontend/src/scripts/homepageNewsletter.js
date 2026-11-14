import { captureEvent } from '../lib/analytics.js';

const started = new WeakSet();
const submitting = new WeakSet();
const properties = { form_location: 'homepage_newsletter' };

// Delegation survives Astro navigation without re-binding or hydrating form markup.
document.addEventListener('focusin', (event) => {
  const form = event.target.closest?.('form[data-homepage-newsletter]');
  if (!form || started.has(form)) return;
  started.add(form);
  captureEvent('newsletter_form_started', properties);
});

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches('[data-homepage-newsletter]')) return;
  event.preventDefault();
  if (submitting.has(form) || !form.reportValidity()) return;
  const email = form.elements.namedItem('email_address').value.trim();
  if (!email) return;
  const button = form.querySelector('button[type="submit"]');
  const error = form.querySelector('[role="alert"]');
  const originalLabel = button.textContent;
  submitting.add(form);
  button.disabled = true;
  form.setAttribute('aria-busy', 'true');
  error.hidden = true;
  captureEvent('newsletter_submit_attempt', properties);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('https://app.kit.com/forms/cbadc25c13/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_address: email }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('response');
    form.hidden = true;
    form.closest('[data-native-newsletter]').querySelector('[data-newsletter-success]').hidden = false;
    captureEvent('newsletter_signup', properties);
    captureEvent('cta_conversion', { cta_name: 'newsletter_signup', ...properties });
  } catch (failure) {
    error.textContent = 'We could not confirm your subscription. Please try again.';
    error.hidden = false;
    captureEvent('newsletter_signup_error', {
      ...properties,
      error_type: failure.name === 'AbortError' ? 'timeout' : failure.message === 'response' ? 'response' : 'network',
    });
  } finally {
    clearTimeout(timeout);
    submitting.delete(form);
    button.disabled = false;
    button.textContent = originalLabel;
    form.setAttribute('aria-busy', 'false');
  }
});
