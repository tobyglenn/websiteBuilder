import React, { useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { captureEvent } from '../lib/analytics.js';

export default function NewsletterSignup({ formLocation = 'newsletter_signup_section' }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    captureEvent('newsletter_submit_attempt', { form_location: formLocation });
    setLoading(true);
    try {
      const response = await fetch('https://app.kit.com/forms/cbadc25c13/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email
        })
      });

      if (response.ok) {
        setSubmitted(true);
        captureEvent('newsletter_signup', {
          form_location: formLocation,
        });
      } else {
        captureEvent('newsletter_signup_error', {
          form_location: formLocation,
          error_type: 'response',
        });
      }
    } catch (error) {
      console.error('Subscription error:', error);
      captureEvent('newsletter_signup_error', {
        form_location: formLocation,
        error_type: 'network',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-neutral-900 border-t border-neutral-800">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/10 rounded-lg mb-6">
            <Mail className="w-7 h-7 text-blue-400" aria-hidden="true" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Get Weekly Fitness Tech Insights
          </h2>
          
          <p className="text-neutral-400 mb-8 max-w-lg mx-auto">
            Join the newsletter for honest reviews, training data, and exclusive deals on fitness tech. No spam, just real results.
          </p>

          {submitted ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
              <p className="text-green-400 font-medium text-lg">
                ✓ You're subscribed! Check your inbox for confirmation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => {
                  if (started.current) return;
                  started.current = true;
                  captureEvent('newsletter_form_started', { form_location: formLocation });
                }}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          )}

          <p className="mt-4 text-xs text-neutral-600">
            Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
