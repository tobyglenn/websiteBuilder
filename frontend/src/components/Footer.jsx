import React, { useState } from 'react';
import { Youtube, Twitter, Instagram, Mail, ArrowRight } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://app.kit.com/forms/cbadc25c13/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setEmail('');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-neutral-950 border-t border-neutral-900 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4">TobyOnFitnessTech</h3>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mb-6">
              Dedicated to cutting through the marketing hype and delivering data-driven 
              reviews of fitness technology. Helping you train smarter, not harder.
            </p>
            <div className="flex gap-2">
              <a 
                href="https://youtube.com/@TobyOnFitnessTech" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
              >
                <Youtube size={20} />
              </a>
              <a 
                href="https://twitter.com/tobyonft" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 text-neutral-400 hover:text-blue-400 transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="https://instagram.com/tobyonfitnesstech" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 text-neutral-400 hover:text-pink-500 transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="mailto:contact@toby.tech" 
                className="p-2 text-neutral-400 hover:text-white transition-colors"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Content</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><a href="/videos" className="hover:text-blue-400 transition-colors">Video Reviews</a></li>
              <li><a href="/blog" className="hover:text-blue-400 transition-colors">Written Analysis</a></li>
              <li><a href="/live" className="hover:text-blue-400 transition-colors">Live Streams</a></li>
              <li><a href="/podcasts" className="hover:text-blue-400 transition-colors">Podcasts</a></li>
              <li><a href="/gear" className="hover:text-blue-400 transition-colors">My Gear</a></li>
            </ul>
          </div>

          {/* Legal/Other */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="/affiliate" className="hover:text-blue-400 transition-colors">Affiliate Disclosure</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter - Kit Integration */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                <Mail size={16} className="text-blue-500" />
                Get the Weekly Brief
              </h4>
              <p className="text-neutral-400 text-sm">
                Fitness tech insights, Speediance tips, and OpenClaw updates. No spam.
              </p>
            </div>
            
            {submitted ? (
              <div className="flex items-center gap-2 text-green-400 font-medium bg-green-400/10 px-6 py-3 rounded-lg border border-green-400/20">
                ✅ You're subscribed! Check your inbox.
              </div>
            ) : (
              <form 
                onSubmit={handleSubmit}
                className="flex w-full md:w-auto gap-2"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                  className="flex-1 md:w-64 px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-neutral-600 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-70"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Subscribing...
                    </span>
                  ) : (
                    <>
                      Subscribe <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}
        </div>

        <div className="border-t border-neutral-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-600">
          <p>&copy; {new Date().getFullYear()} Toby on Fitness Tech. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <span className="text-red-500">♥</span> using Astro & React
          </p>
        </div>
      </div>
    </footer>
  );
}
