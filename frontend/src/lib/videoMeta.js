export const SHORT_FORM_MAX_SECONDS = 180;

function hasShortsMarker(text = '') {
  return /(?:^|[\s#/])shorts?\b/i.test(text);
}

export function parseVideoDurationSeconds(value) {
  const text = String(value || '').trim();

  if (!text || text === '0:00' || text === 'P0D' || text.toUpperCase() === 'LIVE') {
    return 0;
  }

  const isoMatch = text.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (isoMatch) {
    const hours = Number(isoMatch[1] || 0) * 3600;
    const minutes = Number(isoMatch[2] || 0) * 60;
    const seconds = Number(isoMatch[3] || 0);
    return hours + minutes + seconds;
  }

  const parts = text.split(':').map(Number);
  if (parts.some(Number.isNaN)) {
    return 0;
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

export function isLiveVideo(video = {}) {
  return Boolean(video.is_live) || String(video.duration_formatted || video.duration || '').trim().toUpperCase() === 'LIVE';
}

export function isLikelyShortVideo(video = {}) {
  if (isLiveVideo(video)) {
    return false;
  }

  const text = `${video.title || ''} ${video.description || ''}`;
  if (video.is_short === true || hasShortsMarker(text)) {
    return true;
  }

  const durationSeconds = parseVideoDurationSeconds(video.duration_iso || video.duration_formatted || video.duration);
  return durationSeconds > 0 && durationSeconds <= SHORT_FORM_MAX_SECONDS;
}

export function isLongFormVideo(video = {}) {
  if (isLiveVideo(video)) {
    return false;
  }

  return parseVideoDurationSeconds(video.duration_iso || video.duration_formatted || video.duration) > SHORT_FORM_MAX_SECONDS;
}

export function selectFeaturedVideo(videos = []) {
  return videos.find((video) => isLiveVideo(video))
    || videos.find((video) => isLongFormVideo(video))
    || videos.find((video) => !isLiveVideo(video))
    || videos[0]
    || null;
}
