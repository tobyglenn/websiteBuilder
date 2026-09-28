import React, { useId, useRef, useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { captureEvent } from '../lib/analytics.js';

export default function NewsletterSignup({
  formLocation = 'newsletter_signup_section',
  title = 'Get Weekly Fitness Tech Insights',
  description = 'Join the newsletter for honest reviews, training data, and fitness tech updates.',
  buttonText = 'Subscribe',
  hideHeader = false,
  placeholder = 'Enter your email',
}) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const started = useRef(false);
  const submitting = useRef(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting.current || !email.trim()) return;
    submitting.current = true;
    setLoading(true);
    setError('');
    captureEvent('newsletter_submit_attempt', { form_location: formLocation });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('https://app.kit.com/forms/cbadc25c13/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_address: email.trim() }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('response');
      setSubmitted(true);
      captureEvent('newsletter_signup', { form_location: formLocation });
      captureEvent('cta_conversion', { cta_name: 'newsletter_signup', form_location: formLocation });
    } catch (failure) {
      setError('We could not confirm your subscription. Please try again.');
      captureEvent('newsletter_signup_error', {
        form_location: formLocation,
        error_type: failure.name === 'AbortError' ? 'timeout' : failure.message === 'response' ? 'response' : 'network',
      });
    } finally {
      clearTimeout(timeout);
      submitting.current = false;
      setLoading(false);
    }
  };

  const content = (
    <div className="w-full">
      {submitted ? (
        <div role="status" className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center text-green-400">
          <CheckCircle2 className="w-6 h-6 mx-auto mb-3" aria-hidden="true" />
          <p>Your subscription request was received. Check your inbox for confirmation.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto" aria-busy={loading}>
          <label htmlFor={id} className="sr-only">Email address</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input id={id} type="email" name="email" autoComplete="email" required
              placeholder={placeholder} value={email} onChange={e => setEmail(e.target.value)}
              aria-describedby={error ? `${id}-error` : undefined}
              className="min-w-0 flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
              onFocus={() => {
                if (started.current) return;
                started.current = true;
                captureEvent('newsletter_form_started', { form_location: formLocation });
              }} />
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg whitespace-nowrap">
              {loading ? 'Submitting...' : buttonText}
            </button>
          </div>
          {error && <p id={`${id}-error`} role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
        </form>
      )}
      <p className="mt-4 text-xs text-neutral-500 text-center">No spam. Unsubscribe anytime.</p>
    </div>
  );
  if (hideHeader) return content;
  return (
    <section className="py-16 bg-neutral-900 border-t border-neutral-800">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <Mail className="w-7 h-7 text-blue-400 mx-auto mb-6" aria-hidden="true" />
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{title}</h2>
        <p className="text-neutral-400 mb-8 max-w-lg mx-auto">{description}</p>
        {content}
      </div>
    </section>
  );
}
