import videosData from './videos.json';

function extractTags(description = '') {
  if (!description) return [];
  return (description.match(/#(\w+)/g) || []).map(t => t.slice(1)).slice(0, 5);
}

function estimateReadTime(content = '') {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min read`;
}

export const VIDEOS = (videosData.videos || []).map(v => ({
  id: v.id,
  title: v.title,
  description: v.description?.slice(0, 300) || v.title,
  thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`,
  published_at: (v.publishedAt || '2025-01-01').slice(0, 10),
  views: String(v.viewCount || 0),
  tags: extractTags(v.description),
  transcript_file: v.transcript_file || null,
  has_transcript: v.has_transcript || false,
  duration_formatted: v.duration_formatted || null,
  is_short: v.is_short || false,
}));

export const CHANNEL_ID = videosData.channelId || "UCmSwMp2gPo5PGl32d4oCu-Q";
export const FETCHED_AT = videosData.fetchedAt || "2026-02-18T20:50Z";

export const BLOG_POSTS = [
  {
    slug: "speediance-v31-update",
    title: "Speediance V3.1: What Actually Changed",
    excerpt: "Progressive overload finally works like it should. Here's what's fixed, what's broken, and what I still want.",
    category: "Tech Review",
    published_at: "2026-02-18",
    image: "https://i.ytimg.com/vi/0C8mQoV-Xpg/maxresdefault.jpg",
    tags: ["Speediance", "FitnessTech", "HomeGym"],
    content: "## The Good: Progressive Overload Works\nSpeediance finally added proper progressive overload prompts. Before you add weight on bilateral and bar movements, the machine asks first. This is a small UI change with outsized impact on real training.\n\n## The Bad: Safety Start Still Limits ROM\nSafety Start continues to restrict your range of motion, which actually makes it dangerous for real lifting. When a machine's \"safety\" feature shortens your range of motion, you lose the eccentric loading benefit that makes these machines worth using. The concentric limiter should help with joint safety without restricting ROM.\n\n## Unilateral Mode Still Buggy\nSingle-arm and single-leg movements still have bugs in the weight reporting and the progressive overload detection. It's a known issue and the community is tracking it.\n\n## What I Want Next\nFix unilateral modes. Restore the original Free Lift partner mode that disappeared in V3. Give us raw motor data for third-party logging. These are all achievable in software — they just need to ship."
  },
  {
    slug: "openclaw-automation",
    title: "Building an AI Assistant That Manages Everything",
    excerpt: "How I built a custom AI on OpenClaw that tracks BJJ, analyzes recovery data, and generates training reports.",
    category: "Automation",
    published_at: "2026-02-18",
    image: "https://i.ytimg.com/vi/xFknwPPhVnI/sddefault.jpg",
    tags: ["OpenClaw", "AI", "BJJ", "Automation"],
    content: "## Why I Built This\nI was drowning in data from Speediance, WHOOP, Garmin, Cronometer, and my BJJ training log. Each app gives you its own dashboard but none of them talk to each other. I needed a single place to synthesize all of it.\n\n## The BJJ Buddy App\nA custom iOS/Android app I built tracking 150+ techniques with video references and sparring notes. When I tap in after rolling, it logs who I rolled with, how long, and which techniques I hit or got caught by.\n\n## Morning Reports\nEvery morning I get a report covering: recovery score from WHOOP, training load and strain, sleep quality breakdown, nutrition status from Cronometer, and yesterday's Speediance workout summary. It takes about 2 minutes to read and tells me exactly how hard I should train today.\n\n## What's Next\nAutomated YouTube upload notifications, blog post generation from video transcripts, and connecting my Garmin running data to the same morning report. The pipeline is mostly there — it's just wiring."
  },
  {
    slug: "garmin-whoop-comparison",
    title: "Garmin vs Whoop: The Real Difference",
    excerpt: "One tracks everything you do. One tracks how well you recover. Here's which one matters more.",
    category: "Data Analysis",
    published_at: "2026-02-15",
    image: "https://i.ytimg.com/vi/apsAL3x_V3k/maxresdefault.jpg",
    tags: ["Garmin", "WHOOP", "Wearables", "Recovery"],
    content: "## The Data Problem\nGarmin gives you 500 metrics. WHOOP gives you three that actually matter: recovery, strain, and sleep. The paradox: more data often means less insight.\n\n## What Garmin Does Well\nActivity tracking is excellent. Running pace, cadence, ground contact time, VO2 max trending — it's all reliable and the GPS accuracy is solid. I use Garmin specifically for run tracking and have disabled everything else (sleep tracking, body battery, the stress meter) because those metrics are noise.\n\n## What WHOOP Does Well\nHRV-based recovery scoring is the best consumer implementation I've used. When WHOOP says I'm at 35% recovery, my body confirms it. The sleep coaching is also legitimately useful — it tells you exactly how much sleep you need tonight to be recovered by your target wake time.\n\n## The Winner?\nBoth, but for different jobs. Garmin for what you DO, WHOOP for how you RECOVER. The mistake is expecting either one to do both jobs well. They don't."
  }
];
