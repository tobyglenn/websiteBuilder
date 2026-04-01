#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

loadDotEnv();

const API_BASE = 'https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project';
const DEFAULT_SITE_BASE_URL = (process.env.SITE_URL_BASE || 'https://tobyonfitnesstech.com').replace(/\/$/, '');

const PLATFORM_STYLE = {
  general: 1,
  tiktok: 2,
  instagram: 3,
  youtube: 4,
  facebook: 5,
  linkedin: 6,
  twitter: 7,
  x: 7,
};

const TONE_MAP = {
  neutral: 0,
  interesting: 1,
  catchy: 2,
  serious: 3,
  question: 4,
};

const VOICE_MAP = {
  first: 0,
  third: 1,
};

const POST_LIMITS = {
  tiktok: 2200,
  instagram: 2200,
  youtube: 5000,
  facebook: 2200,
  linkedin: 3000,
  twitter: 280,
  x: 280,
  general: 2200,
};

const HELP_TEXT = `
Usage:
  node scripts/vizard-links.mjs accounts
  node scripts/vizard-links.mjs clips --project-id=17861706
  node scripts/vizard-links.mjs compose --project-id=17861706 --main-video=h3hq4Owzi74 --social-account-id=12345
  node scripts/vizard-links.mjs preview --project-id=17861706 --main-video=h3hq4Owzi74 --social-account-id=12345
  node scripts/vizard-links.mjs publish --project-id=17861706 --main-video=https://www.youtube.com/watch?v=h3hq4Owzi74 --social-account-id=12345,67890

Commands:
  accounts   List connected Vizard social accounts.
  clips      List clips returned by a Vizard project.
  compose    Build Vizard-style captions, append your website URL, and stop there.
  preview    Same as compose.
  publish    Publish clips through Vizard with your website URL injected into the post body.

Required environment:
  VIZARDAI_API_KEY   Your Vizard API key.

Common options:
  --project-id=...           Vizard project ID returned by project creation.
  --main-video=...           Full video YouTube ID, YouTube URL, site URL, or /video/... path.
  --social-account-id=...    One or more Vizard social account IDs. Repeat the flag or pass comma-separated values.
  --final-video-id=...       Restrict to one or more specific clip IDs from the project response.
  --site-base-url=...        Website base URL. Defaults to SITE_URL_BASE or ${DEFAULT_SITE_BASE_URL}
  --tone=neutral             neutral | interesting | catchy | serious | question
  --voice=first              first | third
  --publish-time=...         Unix ms timestamp or ISO datetime for scheduled posting.
  --link-text=...            Prefix placed before the website URL. Defaults to "Watch the full video:"
  --no-ai                    Skip AI caption generation and use a short fallback caption.

Examples:
  node scripts/vizard-links.mjs accounts
  node scripts/vizard-links.mjs clips --project-id=17861706
  node scripts/vizard-links.mjs compose --project-id=17861706 --main-video=h3hq4Owzi74 --social-account-id=12345
  node scripts/vizard-links.mjs preview --project-id=17861706 --main-video=h3hq4Owzi74 --social-account-id=12345
  node scripts/vizard-links.mjs publish --project-id=17861706 --main-video=h3hq4Owzi74 --social-account-id=12345 --publish-time=2026-04-02T09:00:00-04:00
`.trim();

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (!command || command === 'help' || command === '--help' || command === '-h' || options.help) {
    console.log(HELP_TEXT);
    return;
  }

  if (!process.env.VIZARDAI_API_KEY) {
    throw new Error('Missing VIZARDAI_API_KEY. Put it in your shell env or .env file.');
  }

  if (command === 'accounts') {
    const accounts = await fetchAccounts();
    printAccounts(accounts);
    return;
  }

  if (command === 'clips') {
    const projectId = requiredOption(options, 'project-id');
    const project = await fetchProject(projectId);
    printProjectClips(project);
    return;
  }

  if (command !== 'compose' && command !== 'preview' && command !== 'publish') {
    throw new Error(`Unknown command "${command}". Run with --help to see usage.`);
  }

  const projectId = requiredOption(options, 'project-id');
  const mainVideoInput = requiredOption(options, 'main-video');
  const siteBaseUrl = (firstOption(options, 'site-base-url') || DEFAULT_SITE_BASE_URL).replace(/\/$/, '');
  const mainVideoUrl = resolveMainVideoUrl(mainVideoInput, siteBaseUrl);
  const mainVideoId = extractYouTubeVideoId(mainVideoInput);
  const mainVideoTitle = loadLocalVideoTitle(mainVideoId);
  const tone = resolveMappedValue(firstOption(options, 'tone') || 'neutral', TONE_MAP, 'tone');
  const voice = resolveMappedValue(firstOption(options, 'voice') || 'first', VOICE_MAP, 'voice');
  const linkText = firstOption(options, 'link-text') || 'Watch the full video:';
  const shouldUseAi = options.ai !== false;
  const publishTime = parsePublishTime(firstOption(options, 'publish-time'));

  const project = await fetchProject(projectId);
  const clips = selectClips(project, optionList(options, 'final-video-id'));
  if (clips.length === 0) {
    throw new Error(`No clips were found for project ${projectId}.`);
  }

  const allAccounts = await fetchAccounts();
  const selectedAccounts = selectAccounts(command, allAccounts, optionList(options, 'social-account-id'));

  if (selectedAccounts.length === 0) {
    throw new Error('No active Vizard social accounts were selected.');
  }

  console.log(`Project: ${project.projectName || project.projectId}`);
  console.log(`Main video URL: ${mainVideoUrl}`);
  if (mainVideoTitle) {
    console.log(`Main video title: ${mainVideoTitle}`);
  }
  console.log(`Clips selected: ${clips.length}`);
  console.log(`Accounts selected: ${selectedAccounts.length}`);
  console.log('');

  for (const clip of clips) {
    console.log(`Clip ${clip.videoId}: ${clip.title || 'Untitled clip'}`);

    for (const account of selectedAccounts) {
      const platformKey = normalizePlatformName(account.platform);
      const limit = POST_LIMITS[platformKey] || POST_LIMITS.general;
      const aiResult = shouldUseAi
        ? await generateCaption({ finalVideoId: clip.videoId, platformKey, tone, voice })
        : null;
      const fallbackCaption = buildFallbackCaption({ clipTitle: clip.title, mainVideoTitle });
      const caption = sanitizeText(aiResult?.aiSocialContent || fallbackCaption);
      const post = buildPost({
        caption,
        fullVideoUrl: mainVideoUrl,
        limit,
        linkText,
      });
      const youtubeTitle = platformKey === 'youtube'
        ? buildYoutubeTitle(aiResult?.aiSocialTitle || clip.title || mainVideoTitle || 'Short clip')
        : undefined;

      console.log(`  -> ${formatAccountLabel(account)}`);
      if (youtubeTitle) {
        console.log(`     Title: ${youtubeTitle}`);
      }
      console.log(indentBlock(post, 5));

      if (command === 'publish') {
        await publishClip({
          finalVideoId: clip.videoId,
          socialAccountId: account.id,
          post,
          title: youtubeTitle,
          publishTime,
        });
        console.log('     Published successfully.');
      } else {
        console.log('     Caption composed only. Nothing was published or rescheduled.');
      }
    }

    console.log('');
  }
}

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function parseArgs(args) {
  const command = args[0];
  const options = {};

  for (let index = 1; index < args.length; index += 1) {
    const part = args[index];
    if (!part.startsWith('--')) {
      throw new Error(`Unexpected argument "${part}".`);
    }

    if (part === '--help') {
      options.help = true;
      continue;
    }

    if (part.startsWith('--no-')) {
      options[part.slice(5)] = false;
      continue;
    }

    const trimmed = part.slice(2);
    const separator = trimmed.indexOf('=');

    if (separator !== -1) {
      appendOption(options, trimmed.slice(0, separator), trimmed.slice(separator + 1));
      continue;
    }

    const next = args[index + 1];
    if (next && !next.startsWith('--')) {
      appendOption(options, trimmed, next);
      index += 1;
      continue;
    }

    appendOption(options, trimmed, true);
  }

  return { command, options };
}

function appendOption(options, key, value) {
  if (options[key] === undefined) {
    options[key] = value;
    return;
  }

  if (Array.isArray(options[key])) {
    options[key].push(value);
    return;
  }

  options[key] = [options[key], value];
}

function firstOption(options, key) {
  const value = options[key];
  return Array.isArray(value) ? value[0] : value;
}

function optionList(options, key) {
  const value = options[key];
  if (value === undefined) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((entry) => String(entry).split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function requiredOption(options, key) {
  const value = firstOption(options, key);
  if (!value) {
    throw new Error(`Missing required option --${key}.`);
  }
  return String(value);
}

function resolveMappedValue(value, map, label) {
  const normalized = String(value).trim().toLowerCase();
  if (!(normalized in map)) {
    const allowed = Object.keys(map).join(', ');
    throw new Error(`Unsupported ${label} "${value}". Expected one of: ${allowed}.`);
  }
  return map[normalized];
}

async function requestVizard(endpoint, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'VIZARDAI_API_KEY': process.env.VIZARDAI_API_KEY,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error(`Vizard returned a non-JSON response (${response.status}).`);
    }
  }

  if (!response.ok) {
    throw new Error(data.errMsg || data.message || `Vizard request failed with HTTP ${response.status}.`);
  }

  return data;
}

function assertCode(data, allowedCodes) {
  if (!('code' in data)) {
    return;
  }

  if (!allowedCodes.includes(data.code)) {
    throw new Error(`${data.errMsg || 'Vizard request failed'} (code ${data.code}).`);
  }
}

async function fetchAccounts() {
  const data = await requestVizard('/social-accounts');
  assertCode(data, [2000]);
  return (data.publishAccounts || data.accounts || []).filter(Boolean);
}

async function fetchProject(projectId) {
  const data = await requestVizard(`/query/${projectId}`);
  if (data.code === 1000) {
    throw new Error(`Project ${projectId} is still processing in Vizard. Try again in a bit.`);
  }
  assertCode(data, [2000]);
  return data;
}

async function generateCaption({ finalVideoId, platformKey, tone, voice }) {
  try {
    const data = await requestVizard('/ai-social', {
      method: 'POST',
      body: {
        finalVideoId: Number(finalVideoId),
        aiSocialPlatform: PLATFORM_STYLE[platformKey] || PLATFORM_STYLE.general,
        tone,
        voice,
      },
    });
    assertCode(data, [2000]);
    return data;
  } catch (error) {
    const message = String(error.message || error);
    if (message.includes('4002') || /no speech|dialogue detected/i.test(message)) {
      return null;
    }
    throw error;
  }
}

async function publishClip({ finalVideoId, socialAccountId, post, title, publishTime }) {
  const payload = {
    finalVideoId: Number(finalVideoId),
    socialAccountId: String(socialAccountId),
    post,
  };

  if (title) {
    payload.title = title;
  }

  if (publishTime) {
    payload.publishTime = publishTime;
  }

  const data = await requestVizard('/publish-video', {
    method: 'POST',
    body: payload,
  });
  assertCode(data, [2000]);
  return data;
}

function selectClips(project, selectedIds) {
  const projectClips = Array.isArray(project.videos) ? project.videos : [];
  if (selectedIds.length === 0) {
    return projectClips;
  }

  const selected = new Set(selectedIds.map((value) => String(value)));
  const filtered = projectClips.filter((clip) => selected.has(String(clip.videoId)));

  for (const selectedId of selected) {
    if (!filtered.some((clip) => String(clip.videoId) === selectedId)) {
      throw new Error(`Clip ${selectedId} was not found in project ${project.projectId}.`);
    }
  }

  return filtered;
}

function selectAccounts(command, allAccounts, selectedIds) {
  const activeAccounts = allAccounts.filter(isUsableAccount);

  if (selectedIds.length === 0) {
    if (command === 'publish') {
      throw new Error('Publishing requires at least one --social-account-id.');
    }
    return activeAccounts;
  }

  const selected = new Set(selectedIds.map((value) => String(value)));
  const filtered = activeAccounts.filter((account) => selected.has(String(account.id)));

  for (const selectedId of selected) {
    if (!filtered.some((account) => String(account.id) === selectedId)) {
      throw new Error(`Active social account ${selectedId} was not found. Run the accounts command to see valid IDs.`);
    }
  }

  return filtered;
}

function isUsableAccount(account) {
  const rawStatus = String(account.status || account.accountStatus || '').trim().toLowerCase();
  return !rawStatus || rawStatus === 'active' || rawStatus === 'connected' || rawStatus === 'enabled' || rawStatus === 'ok';
}

function resolveMainVideoUrl(input, siteBaseUrl) {
  const value = String(input).trim();
  const youtubeId = extractYouTubeVideoId(value);
  if (youtubeId) {
    return `${siteBaseUrl}/video/${youtubeId}/`;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${siteBaseUrl}${value}`;
  }

  return `${siteBaseUrl}/${value.replace(/^\/+/, '')}`;
}

function extractYouTubeVideoId(value) {
  const raw = String(value || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) {
    return raw;
  }

  try {
    const url = new URL(raw);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
    }

    if (url.searchParams.get('v') && /^[A-Za-z0-9_-]{11}$/.test(url.searchParams.get('v'))) {
      return url.searchParams.get('v');
    }

    const pathSegments = url.pathname.split('/').filter(Boolean);
    const embedId = pathSegments[pathSegments.length - 1];
    if ((url.pathname.includes('/shorts/') || url.pathname.includes('/embed/')) && /^[A-Za-z0-9_-]{11}$/.test(embedId || '')) {
      return embedId;
    }
  } catch (error) {
    return null;
  }

  return null;
}

function loadLocalVideoTitle(videoId) {
  if (!videoId) {
    return null;
  }

  const filePath = path.resolve(process.cwd(), 'frontend/src/data/videos.json');
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const match = (data.videos || []).find((video) => String(video.id) === String(videoId));
    return match?.title || null;
  } catch (error) {
    return null;
  }
}

function parsePublishTime(value) {
  if (!value) {
    return undefined;
  }

  if (/^\d+$/.test(String(value))) {
    return Number(value);
  }

  const parsed = Date.parse(String(value));
  if (Number.isNaN(parsed)) {
    throw new Error(`Could not parse publish time "${value}". Use Unix ms or an ISO datetime.`);
  }
  return parsed;
}

function buildFallbackCaption({ clipTitle, mainVideoTitle }) {
  const safeClipTitle = sanitizeText(clipTitle || '');
  const safeMainTitle = sanitizeText(mainVideoTitle || '');

  if (safeClipTitle && safeMainTitle) {
    return `${safeClipTitle}\n\nFull breakdown from: ${safeMainTitle}`;
  }

  if (safeClipTitle) {
    return safeClipTitle;
  }

  if (safeMainTitle) {
    return `Full breakdown from: ${safeMainTitle}`;
  }

  return 'Short clip from the full video.';
}

function buildPost({ caption, fullVideoUrl, limit, linkText }) {
  const outro = `${sanitizeInlineText(linkText)} ${fullVideoUrl}`.trim();
  const body = sanitizeText(caption);
  const full = body ? `${body}\n\n${outro}` : outro;

  if (full.length <= limit) {
    return full;
  }

  const available = limit - outro.length - 2;
  if (available <= 0) {
    return outro.slice(0, limit);
  }

  let trimmed = body.slice(0, available).trim();
  if (trimmed.length < body.length) {
    trimmed = trimmed.replace(/\s+\S*$/, '').trimEnd();
  }

  return `${trimmed}\n\n${outro}`.trimEnd();
}

function buildYoutubeTitle(value) {
  const title = sanitizeInlineText(value || 'Short clip');
  if (title.length <= 100) {
    return title;
  }
  return `${title.slice(0, 97).trimEnd()}...`;
}

function sanitizeText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sanitizeInlineText(value) {
  return sanitizeText(value).replace(/\s+/g, ' ');
}

function normalizePlatformName(platform) {
  const normalized = String(platform || '').trim().toLowerCase();
  if (normalized.includes('youtube')) {
    return 'youtube';
  }
  if (normalized.includes('instagram')) {
    return 'instagram';
  }
  if (normalized.includes('facebook')) {
    return 'facebook';
  }
  if (normalized.includes('linkedin')) {
    return 'linkedin';
  }
  if (normalized.includes('tiktok')) {
    return 'tiktok';
  }
  if (normalized.includes('twitter') || normalized.includes('(x)') || normalized === 'x') {
    return 'twitter';
  }
  return 'general';
}

function formatAccountLabel(account) {
  const pieces = [account.platform || 'Unknown'];
  if (account.username) {
    pieces.push(`@${account.username}`);
  }
  if (account.page) {
    pieces.push(`page:${account.page}`);
  }
  pieces.push(`id:${account.id}`);
  return pieces.join(' | ');
}

function indentBlock(text, spaces) {
  const padding = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => `${padding}${line}`)
    .join('\n');
}

function printAccounts(accounts) {
  if (accounts.length === 0) {
    console.log('No Vizard social accounts were found.');
    return;
  }

  for (const account of accounts) {
    const expiry = account.expiresAt ? new Date(Number(account.expiresAt)).toISOString() : 'n/a';
    console.log(`${formatAccountLabel(account)} | status:${account.status || 'unknown'} | expires:${expiry}`);
  }
}

function printProjectClips(project) {
  const clips = Array.isArray(project.videos) ? project.videos : [];
  console.log(`Project ${project.projectId}: ${project.projectName || 'Untitled project'}`);
  console.log(`Share link: ${project.shareLink || 'n/a'}`);
  console.log(`Clips: ${clips.length}`);
  console.log('');

  for (const clip of clips) {
    const seconds = Number(clip.videoMsDuration || 0) / 1000;
    console.log(`${clip.videoId} | ${formatDuration(seconds)} | ${clip.title || 'Untitled clip'}`);
  }
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  }

  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
