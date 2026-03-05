export default function ShareButtons({ url, title }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div class="flex gap-3 mt-4">
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
        aria-label="Share on Twitter"
      >
        𝕏
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
        aria-label="Share on Facebook"
      >
        f
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
        aria-label="Share on LinkedIn"
      >
        in
      </a>
      <button
        onclick={`navigator.clipboard.writeText('${url}')`}
        class="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
        aria-label="Copy link"
      >
        🔗
      </button>
    </div>
  );
}
