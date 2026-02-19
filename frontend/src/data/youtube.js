import videosData from './videos.json';

export const videos = videosData.videos || [];
export const channelId = videosData.channelId;
export const fetchedAt = videosData.fetchedAt;

export function getVideoById(id) {
  return videos.find(v => v.id === id);
}

export function getLatestVideos(count = 6) {
  return videos.slice(0, count);
}
