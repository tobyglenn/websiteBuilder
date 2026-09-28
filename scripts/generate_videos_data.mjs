import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = process.env.VIDEO_CATALOG_ROOT || path.resolve(__dirname, '..');

const ytPath = path.join(rootDir, 'yt_videos_full.json');
const transcriptIndexPath = path.join(rootDir, 'transcript_index.json');
const channelVideosBasePath = path.join(rootDir, 'scripts', 'channel_videos_base.json');
const transcriptsDir = path.join(rootDir, 'frontend', 'src', 'data', 'transcripts');
const videosJsonPath = path.join(rootDir, 'frontend', 'src', 'data', 'videos.json');

const ytVideos = JSON.parse(fs.readFileSync(ytPath, 'utf8'));
const transcriptIndex = JSON.parse(fs.readFileSync(transcriptIndexPath, 'utf8'));

const baseData = JSON.parse(fs.readFileSync(channelVideosBasePath, 'utf8'));
const currentData = fs.existsSync(videosJsonPath)
  ? JSON.parse(fs.readFileSync(videosJsonPath, 'utf8')) : baseData;
// The scheduled channel refresh may be newer than the checked-in fallback.
const sourceData = Date.parse(currentData.fetchedAt || '') > Date.parse(baseData.fetchedAt || '')
  ? currentData : baseData;
const baselineVideos = [...new Map([...(baseData.videos || []), ...(sourceData.videos || [])].map(video => [video.id, video])).values()];
const baselineVideosMap = new Map(baselineVideos.map((v) => [v.id, v]));

const tiList = Array.isArray(transcriptIndex) ? transcriptIndex : Object.values(transcriptIndex);
const transcriptMap = new Map();
tiList.forEach((item) => {
  if (item.video_id) {
    transcriptMap.set(item.video_id, item);
  }
});

function parseChapters(text = '') {
  const lines = text.split('\n');
  const chapters = [];
  const regex = /(?:^|\s)(?:(?:(\d{1,2}):)?(\d{1,2}):(\d{2}))\s+[-–—]?\s*(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(regex);
    if (match) {
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const minutes = parseInt(match[2], 10);
      const seconds = parseInt(match[3], 10);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      const timeStr = match[1]
        ? `${hours}:${match[2].padStart(2, '0')}:${match[3].padStart(2, '0')}`
        : `${minutes}:${match[3].padStart(2, '0')}`;
      const title = match[4].trim().replace(/^[-–—]\s*/, '');
      if (seconds < 60 && (!match[1] || minutes < 60) && title.length > 0 && title.length < 80) {
        chapters.push({ time: timeStr, seconds: totalSeconds, title });
      }
    }
  }
  return chapters;
}

function determineCategoryAndTags(video) {
  const title = (video.title || '').toLowerCase();
  const desc = (video.description || '').toLowerCase();
  const fullText = `${title} ${desc}`;

  const scores = {
    speediance: 0,
    bjj: 0,
    wearables: 0,
    transformation: 0,
    training: 0,
    coding: 0,
  };

  // Speediance
  if (/\b(?:speediance|gym monster|freelift|2s|voltra|tonal)\b/i.test(fullText)) scores.speediance += 3;
  if (/speediance/i.test(title)) scores.speediance += 5;

  // BJJ
  if (/\b(?:bjj|jiu[- ]jitsu|grappling|black belt|purple belt|no-gi|sparring|submission)\b/i.test(fullText)) scores.bjj += 3;
  if (/bjj|jiu[- ]jitsu|belt|submission/i.test(title)) scores.bjj += 5;

  // Wearables
  if (/whoop|garmin|apple watch|oura|heart rate|recovery|hrv|sleep tracker|strain/i.test(fullText)) scores.wearables += 3;
  if (/whoop|garmin|wearable|recovery/i.test(title)) scores.wearables += 5;

  // Transformation
  if (/transformation|weight loss|fat loss|242|188|deficit|diet|nutrition|obese/i.test(fullText)) scores.transformation += 3;
  if (/transformation|242|fat loss|weight loss/i.test(title)) scores.transformation += 5;

  // Coding / Tech
  if (/\b(?:openclaw|agentstack|coding|ai|python|astro|api|llm|software development)\b/i.test(fullText)) scores.coding += 3;
  if (/\b(?:openclaw|agentstack|coding|ai)\b/i.test(title)) scores.coding += 5;

  // Training / Strength
  if (/workout|lift|hypertrophy|strength|muscle|bench press|squat|ppl|split|reps|sets|overload/i.test(fullText)) scores.training += 2;
  if (/workout|training|split|ppl|lift/i.test(title)) scores.training += 4;

  let maxCategory = 'training';
  let maxScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxCategory = cat;
    }
  }

  const tags = [];
  if (scores.speediance > 0) tags.push('speediance');
  if (scores.bjj > 0) tags.push('bjj');
  if (scores.wearables > 0) tags.push('wearables');
  if (scores.transformation > 0) tags.push('transformation');
  if (scores.training > 0) tags.push('training');
  if (scores.coding > 0) tags.push('coding');

  if (tags.length === 0) tags.push('training');
  return { category: maxCategory, tags };
}

// Only quote explicit source bullets. Never invent summaries from a category.
function extractSourceTakeaways(video) {
  return [...new Set((video.description || '').split('\n')
    .filter(line => /^\s*[-•*]\s+/.test(line))
    .map(line => line.replace(/^\s*[-•*]\s+/, '').trim())
    .filter(line => line.length >= 20 && line.length < 180 && !/https?:|subscribe|affiliate|discount|coupon/i.test(line)))].slice(0, 4);
}

const allVideoItemsMap = new Map();

// 1. Add all baseline videos first
for (const [id, baseVideo] of baselineVideosMap.entries()) {
  allVideoItemsMap.set(id, {
    id: baseVideo.id,
    title: baseVideo.title,
    description: baseVideo.description || '',
    thumbnail: baseVideo.thumbnail || `https://i.ytimg.com/vi/${baseVideo.id}/hqdefault.jpg`,
    publishedAt: baseVideo.publishedAt || '2026-01-01T00:00:00Z',
    viewCount: Number(baseVideo.viewCount ?? baseVideo.views ?? 0),
    duration_formatted: baseVideo.duration_formatted || baseVideo.duration || null,
    duration_iso: baseVideo.duration_iso || null,
    is_live: Boolean(baseVideo.is_live),
    is_short: Boolean(baseVideo.is_short),
    comments: baseVideo.comments || [],
  });
}

// 2. Overlay / enrich with yt_videos_full.json
for (const ytVideo of ytVideos) {
  const existing = allVideoItemsMap.get(ytVideo.id) || {};
  allVideoItemsMap.set(ytVideo.id, {
    ...existing,
    id: ytVideo.id,
    title: existing.title || ytVideo.title || ytVideo.id,
    publishedAt: existing.publishedAt || (ytVideo.date ? `${ytVideo.date}T00:00:00Z` : null),
    thumbnail: existing.thumbnail || `https://i.ytimg.com/vi/${ytVideo.id}/hqdefault.jpg`,
  });
}

// 3. Process all videos into the final catalog
const generatedVideos = Array.from(allVideoItemsMap.values()).map((v) => {
  const transcriptEntry = transcriptMap.get(v.id);
  let transcriptContent = '';
  if (transcriptEntry && transcriptEntry.file) {
    const fullPath = path.join(transcriptsDir, transcriptEntry.file);
    if (fs.existsSync(fullPath)) {
      transcriptContent = fs.readFileSync(fullPath, 'utf8');
    }
  }

  const { category, tags } = determineCategoryAndTags(
    {
      title: v.title,
      description: v.description || v.title,
    },
    transcriptContent
  );

  const keyTakeaways = extractSourceTakeaways(
    {
      title: v.title,
      description: v.description || v.title,
    },
    transcriptContent,
    category
  );

  const chapters = parseChapters(v.description || '');

  let isShort = v.is_short ?? false;
  if (!isShort && v.duration_iso) {
    const match = v.duration_iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (match) {
      const h = parseInt(match[1] || '0', 10);
      const m = parseInt(match[2] || '0', 10);
      const s = parseInt(match[3] || '0', 10);
      const totalSec = h * 3600 + m * 60 + s;
      if (totalSec > 0 && totalSec <= 180) {
        isShort = true;
      }
    }
  }

  const publishedAt = v.publishedAt || '2026-01-01T00:00:00Z';
  const publishedDate = publishedAt.slice(0, 10);

  return {
    id: v.id,
    title: v.title,
    description: v.description || v.title,
    full_description: v.description || v.title,
    thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    publishedAt: publishedAt,
    published_at: publishedDate,
    category: category,
    tags: tags,
    key_takeaways: keyTakeaways,
    chapters: chapters,
    transcript_file: transcriptEntry ? transcriptEntry.file : null,
    has_transcript: Boolean(transcriptContent.trim()),
    word_count: transcriptEntry ? transcriptEntry.word_count : 0,
    duration_formatted: v.duration_formatted,
    duration_iso: v.duration_iso,
    viewCount: v.viewCount || 0,
    views: String(v.viewCount || 0),
    is_short: isShort,
    is_live: v.is_live || false,
    comments: v.comments || [],
  };
});

const output = {
  ...(sourceData.channelId ? { channelId: sourceData.channelId } : {}),
  channelStats: sourceData.channelStats,
  fetchedAt: sourceData.fetchedAt,
  totalVideos: generatedVideos.length,
  videosWithTranscripts: generatedVideos.filter((v) => v.has_transcript).length,
  videos: generatedVideos,
};

fs.writeFileSync(videosJsonPath, JSON.stringify(output, null, 2), 'utf8');

console.log(`Generated ${generatedVideos.length} videos into ${videosJsonPath}`);
console.log(`Videos with transcripts: ${output.videosWithTranscripts}`);
console.log(`Categories summary:`);
const catCounts = {};
generatedVideos.forEach((v) => {
  catCounts[v.category] = (catCounts[v.category] || 0) + 1;
});
console.log(catCounts);
