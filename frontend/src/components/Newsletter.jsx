import React, { useEffect } from 'react';

export default function Newsletter() {
  useEffect(() => {
    if (document.querySelector('script[data-uid="cbadc25c13"]')) return;
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-uid', 'cbadc25c13');
    script.src = 'https://tobyonfitnesstech.kit.com/cbadc25c13/index.js';
    document.head.appendChild(script);
  }, []);

  return (
    <section className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-t border-neutral-800 py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-900/10 rounded-l-full blur-3xl pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10 text-center max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Stay Ahead of the Curve
        </h2>
        <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
          Get weekly breakdowns of the latest fitness tech, leaked specs, and exclusive discounts delivered straight to your inbox. No spam, just data.
        </p>

        <div data-uid="cbadc25c13" />

        <p className="mt-6 text-xs text-neutral-600">
          By subscribing, you agree to our Privacy Policy. You can unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
