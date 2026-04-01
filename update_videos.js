const fs = require('fs');
const https = require('https');
const path = require('path');

const videosPath = path.join(__dirname, 'frontend', 'src', 'data', 'videos.json');
const channelId = 'UCmSwMp2gPo5PGl32d4oCu-Q';
const SHORT_FORM_MAX_SECONDS = 180;
// Set YOUTUBE_API_KEY env var (never hardcode keys in source)
const apiKey = process.env.YOUTUBE_API_KEY;

function hasShortsMarker(text = '') {
  return /(?:^|[\s#/])shorts?\b/i.test(text);
}

function requestJson(url, callback) {
  https.get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        callback(null, JSON.parse(rawData));
      } catch (error) {
        callback(error);
      }
    });
  }).on('error', (error) => {
    callback(error);
  });
}

try {
  const data = JSON.parse(fs.readFileSync(videosPath, 'utf8'));
  const videoIds = data.videos.map(v => v.id).join(',');

  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds}&key=${apiKey}`;
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`;

  requestJson(url, (requestError, apiResponse) => {
    try {
      if (requestError) {
        throw requestError;
      }

      if (apiResponse.error) {
        console.error('API Error:', JSON.stringify(apiResponse.error, null, 2));
        process.exit(1);
      }

      const apiVideos = {};
      if (apiResponse.items) {
        apiResponse.items.forEach(item => {
          apiVideos[item.id] = item;
        });
      }

      data.videos = data.videos.map(video => {
        const apiData = apiVideos[video.id];
        if (!apiData) {
          console.warn(`No data found for video ID: ${video.id}`);
          return video;
        }

        const durationIso = apiData.contentDetails.duration;
        
        // Parse ISO duration more robustly
        let hours = 0, minutes = 0, seconds = 0;
        
        const durationRegex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
        const match = durationIso.match(durationRegex);
        
        if (match) {
          hours = parseInt(match[1] || 0, 10);
          minutes = parseInt(match[2] || 0, 10);
          seconds = parseInt(match[3] || 0, 10);
        }

        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

        // Format duration: H:MM:SS or M:SS or 0:SS
        let formatted = '';
        if (hours > 0) {
          formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        const text = `${video.title || ''} ${video.description || ''}`;
        const isShort = (totalSeconds > 0 && totalSeconds <= SHORT_FORM_MAX_SECONDS) || hasShortsMarker(text);

        return {
          ...video,
          duration_iso: durationIso,
          duration_formatted: formatted,
          is_short: isShort,
          viewCount: apiData.statistics ? parseInt(apiData.statistics.viewCount, 10) : 0,
          publishedAt: apiData.snippet.publishedAt
        };
      });

      requestJson(channelUrl, (channelError, channelResponse) => {
        if (channelError) {
          console.error('Channel stats error:', channelError.message);
        } else if (channelResponse?.error) {
          console.error('Channel stats API Error:', JSON.stringify(channelResponse.error, null, 2));
        } else {
          const channel = channelResponse?.items?.[0];
          if (channel) {
            const stats = channel.statistics || {};
            const snippet = channel.snippet || {};
            data.channelStats = {
              title: snippet.title || '',
              customUrl: snippet.customUrl || '',
              subscriberCount: parseInt(stats.subscriberCount || '0', 10),
              viewCount: parseInt(stats.viewCount || '0', 10),
              videoCount: parseInt(stats.videoCount || '0', 10),
              hiddenSubscriberCount: Boolean(stats.hiddenSubscriberCount),
            };
          }
        }

        data.fetchedAt = new Date().toISOString();
        fs.writeFileSync(videosPath, JSON.stringify(data, null, 2));
        console.log('Successfully updated videos.json');
      });
    } catch (e) {
      console.error('Error parsing response:', e.message);
    }
  });
} catch (err) {
  console.error('Error reading file:', err);
}
