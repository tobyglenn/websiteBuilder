import React, { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('loading');
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1500);
  };

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
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto relative">
            <input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-full px-6 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading' || status === 'success'}
                required
            />
            <button 
                type="submit" 
                className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-900/50 ${status === 'loading' ? 'animate-pulse' : ''}`}
                disabled={status === 'loading' || status === 'success'}
            >
                {status === 'idle' && 'Subscribe'}
                {status === 'loading' && 'Joining...'}
                {status === 'success' && 'Joined!'}
                {status === 'error' && 'Error'}
            </button>
            
            {status === 'success' && (
                <div className="absolute top-full left-0 w-full mt-2 text-green-400 text-sm font-medium animate-fade-in-up">
                    Welcome to the team! Check your inbox for confirmation.
                </div>
            )}
        </form>
        
        <p className="mt-6 text-xs text-neutral-600">
            By subscribing, you agree to our Privacy Policy. You can unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
