import React from 'react';
import { Youtube, Twitter, Instagram, Mail, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 border-t border-neutral-900 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4">TobyOnFitnessTech</h3>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mb-6">
              Dedicated to cutting through the marketing hype and delivering data-driven reviews of fitness technology. 
              Helping you train smarter, not harder.
            </p>
            <div className="flex gap-4">
              <a href="https://youtube.com/@tobyonfitnesstech" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-[#FF0000] transition-colors">
                <Youtube size={20} />
              </a>
              <a href="https://twitter.com/tobyonfitnesstech" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-[#1DA1F2] transition-colors">
                <Twitter size={20} />
              </a>
              <a href="https://instagram.com/tobyonfitnesstech" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-[#E1306C] transition-colors">
                <Instagram size={20} />
              </a>
              <a href="mailto:contact@toby.tech" className="text-neutral-400 hover:text-white transition-colors">
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

        <div className="border-t border-neutral-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-600">
          <p>&copy; {new Date().getFullYear()} Toby on Fitness Tech. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <span className="text-red-900">♥</span> using Astro & React
          </p>
        </div>
      </div>
    </footer>
  );
}
