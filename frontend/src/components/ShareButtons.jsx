import { captureEvent } from '../lib/analytics.js';

export default function ShareButtons({ url, title }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const trackShare = (platform) => captureEvent('share_click', {
    platform,
    shared_url: url,
  });

  return (
    <div class="flex gap-3 mt-4">
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
        aria-label="Share on Twitter"
        onClick={() => trackShare('twitter')}
      >
        𝕏
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
        aria-label="Share on Facebook"
        onClick={() => trackShare('facebook')}
      >
        f
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
        aria-label="Share on LinkedIn"
        onClick={() => trackShare('linkedin')}
      >
        in
      </a>
      <button
        onClick={() => {
          navigator.clipboard.writeText(url);
          trackShare('copy_link');
        }}
        class="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
        aria-label="Copy link"
      >
        🔗
      </button>
    </div>
  );
}
