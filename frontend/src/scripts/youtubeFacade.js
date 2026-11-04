// YouTube players (VideoPlayer.astro): watch pages render their iframe on the
// server; previews create it when the visitor presses play or a chapter link.
// public/js/posthog-analytics.js picks the new iframe up for video events.

const players = () => [...document.querySelectorAll('[data-youtube-player]')];

function startFromHash() {
  const match = (window.location.hash || '').match(/#t=(\d+)s?/i);
  return match ? Number(match[1]) : 0;
}

function embedUrl(player, start, autoplay) {
  const params = new URLSearchParams({ rel: '0', autoplay: autoplay ? '1' : '0', enablejsapi: '1' });
  params.set('origin', player.dataset.origin || window.location.origin);
  if (start > 0) params.set('start', String(start));
  return `https://www.youtube.com/embed/${encodeURIComponent(player.dataset.videoId)}?${params}`;
}

function activate(player, start = Number(player.dataset.startTime || 0), autoplay = true) {
  const facade = player.querySelector('[data-youtube-facade]');
  const iframe = document.createElement('iframe');
  iframe.className = 'absolute top-0 left-0 w-full h-full';
  iframe.src = embedUrl(player, start, autoplay);
  iframe.title = player.dataset.videoTitle || 'YouTube video player';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.setAttribute('frameborder', '0');
  iframe.dataset.analyticsVideoId = player.dataset.videoId;
  iframe.dataset.analyticsStartTime = String(start);
  iframe.dataset.analyticsEmbedMode = player.dataset.embedMode || 'click_to_play';
  // The placeholder already reported its impression; don't count it twice.
  if (facade?.dataset.analyticsEmbedViewed) iframe.dataset.analyticsEmbedViewed = 'true';
  player.querySelector('iframe')?.remove();
  facade?.remove();
  player.append(iframe);
  player.dataset.active = 'true';
  player.dataset.startTime = String(start);
}

function seek(seconds) {
  const player = players()[0];
  if (!player) return;
  // Same behaviour as before: restart the embed at the chosen second.
  if (player.dataset.active === 'true') activate(player, seconds, false);
  else player.dataset.startTime = String(seconds);
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const facade = target?.closest('[data-youtube-facade]');
  if (facade) {
    activate(facade.closest('[data-youtube-player]'));
    return;
  }
  // Astro handles same-page anchors with history.pushState, which does not emit
  // hashchange, so own seek links before the router handles the click.
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = target?.closest('[data-video-seek]');
  if (!link || !players().length) return;
  const seconds = Number(link.getAttribute('data-seconds'));
  if (!Number.isFinite(seconds) || seconds < 0) return;
  event.preventDefault();
  window.location.hash = `t=${seconds}s`;
  const player = players()[0];
  activate(player, seconds);
  player.scrollIntoView({ behavior: 'smooth', block: 'center' });
}, true);

window.addEventListener('hashchange', () => {
  const start = startFromHash();
  const player = players()[0];
  if (player && Number(player.dataset.startTime || 0) !== start) seek(start);
});

function setup() {
  const start = startFromHash();
  players().forEach((player) => {
    if (player.dataset.youtubeReady) return;
    player.dataset.youtubeReady = 'true';
    if (!player.dataset.startTime) player.dataset.startTime = String(start);
    // Hash fragments aren't available during static rendering. Apply a deep
    // link once, without autoplay or replacing an unchanged initial iframe.
    if (player.querySelector('iframe') && start > 0) activate(player, start, false);
  });
}

setup();
document.addEventListener('astro:page-load', setup);
