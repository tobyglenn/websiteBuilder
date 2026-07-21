import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:tobyonfitnesstech.com';
const API_BASE = 'https://searchconsole.googleapis.com/webmasters/v3';
const DAY_MS = 24 * 60 * 60 * 1000;
const isoDate = (date) => date.toISOString().slice(0, 10);

const credentialCandidates = [
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  join(homedir(), '.config/gcloud/application_default_credentials.json'),
].filter(Boolean);

const readCredentialMetadata = () => {
  for (const filename of credentialCandidates) {
    if (!existsSync(filename)) continue;
    try {
      return JSON.parse(readFileSync(filename, 'utf8'));
    } catch (error) {
      throw new Error(`Unable to read Google credentials metadata from ${filename}: ${error.message}`);
    }
  }
  return {};
};

const credentialMetadata = readCredentialMetadata();
const quotaProject = process.env.GSC_QUOTA_PROJECT || credentialMetadata.quota_project_id || '';

const getAccessToken = () => {
  if (process.env.GSC_ACCESS_TOKEN) return process.env.GSC_ACCESS_TOKEN.trim();

  const gcloudCandidates = [
    'gcloud',
    join(homedir(), 'google-cloud-sdk/bin/gcloud'),
  ];

  for (const command of gcloudCandidates) {
    try {
      return execFileSync(command, ['auth', 'application-default', 'print-access-token'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      // Try the next known gcloud location.
    }
  }

  throw new Error(
    'Set GSC_ACCESS_TOKEN or install application-default credentials and the Google Cloud CLI.',
  );
};

const token = getAccessToken();
const requestHeaders = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  ...(quotaProject ? { 'x-goog-user-project': quotaProject } : {}),
};

const today = new Date();
const currentEnd = new Date(today.getTime() - (2 * DAY_MS));
const currentStart = new Date(currentEnd.getTime() - (6 * DAY_MS));
const priorEnd = new Date(currentStart.getTime() - DAY_MS);
const priorStart = new Date(priorEnd.getTime() - (6 * DAY_MS));

const apiError = async (response) => {
  const body = await response.text();
  let detail = body;
  try {
    const parsed = JSON.parse(body);
    detail = parsed.error?.message || body;
  } catch {
    // Keep the original response body.
  }
  return new Error(`Search Console API ${response.status}: ${detail}`);
};

const query = async ({ startDate, endDate, dimensions = [], rowLimit = 10 }) => {
  const response = await fetch(`${API_BASE}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify({
      startDate: isoDate(startDate),
      endDate: isoDate(endDate),
      dimensions,
      rowLimit,
      dataState: 'final',
    }),
  });
  if (!response.ok) throw await apiError(response);
  return response.json();
};

const getSitemaps = async () => {
  const response = await fetch(`${API_BASE}/sites/${encodeURIComponent(SITE_URL)}/sitemaps`, {
    headers: requestHeaders,
  });
  if (!response.ok) throw await apiError(response);
  return response.json();
};

const metricValues = (row = {}) => ({
  clicks: row.clicks || 0,
  impressions: row.impressions || 0,
  ctr: row.ctr || 0,
  position: row.position || 0,
});

const summarize = (payload) => metricValues(payload.rows?.[0]);

const compareRows = (currentRows = [], priorRows = []) => {
  const priorByKey = new Map(priorRows.map((row) => [row.keys?.[0], row]));
  const currentKeys = new Set(currentRows.map((row) => row.keys?.[0]));
  const combined = currentRows.map((row) => {
    const key = row.keys?.[0] || '';
    const current = metricValues(row);
    const prior = metricValues(priorByKey.get(key));
    return {
      key,
      current,
      prior,
      delta: {
        clicks: current.clicks - prior.clicks,
        impressions: current.impressions - prior.impressions,
        ctr: current.ctr - prior.ctr,
        position: prior.position && current.position ? prior.position - current.position : 0,
      },
    };
  });

  for (const row of priorRows) {
    const key = row.keys?.[0] || '';
    if (currentKeys.has(key)) continue;
    const prior = metricValues(row);
    combined.push({
      key,
      current: metricValues(),
      prior,
      delta: {
        clicks: -prior.clicks,
        impressions: -prior.impressions,
        ctr: -prior.ctr,
        position: 0,
      },
    });
  }

  return combined;
};

const rankRisers = (rows) => [...rows]
  .filter((row) => row.delta.clicks > 0 || row.delta.impressions > 0)
  .sort((a, b) => b.delta.clicks - a.delta.clicks || b.delta.impressions - a.delta.impressions)
  .slice(0, 25);

const rankDecliners = (rows) => [...rows]
  .filter((row) => row.delta.clicks < 0 || row.delta.impressions < 0)
  .sort((a, b) => a.delta.clicks - b.delta.clicks || a.delta.impressions - b.delta.impressions)
  .slice(0, 25);

const ctrOpportunities = (rows) => [...rows]
  .filter((row) => (
    row.current.impressions >= 20
    && row.current.ctr < 0.02
    && row.current.position > 0
    && row.current.position <= 20
  ))
  .sort((a, b) => b.current.impressions - a.current.impressions)
  .slice(0, 25);

const normalizeSitemaps = (payload) => (payload.sitemap || []).map((sitemap) => ({
  path: sitemap.path,
  lastSubmitted: sitemap.lastSubmitted,
  lastDownloaded: sitemap.lastDownloaded,
  isPending: sitemap.isPending || false,
  isSitemapsIndex: sitemap.isSitemapsIndex || false,
  type: sitemap.type,
  errors: Number(sitemap.errors || 0),
  warnings: Number(sitemap.warnings || 0),
  contents: sitemap.contents || [],
}));

const [
  current,
  prior,
  currentPages,
  priorPages,
  currentQueries,
  priorQueries,
  daily,
  devices,
  sitemaps,
] = await Promise.all([
  query({ startDate: currentStart, endDate: currentEnd, rowLimit: 1 }),
  query({ startDate: priorStart, endDate: priorEnd, rowLimit: 1 }),
  query({ startDate: currentStart, endDate: currentEnd, dimensions: ['page'], rowLimit: 1000 }),
  query({ startDate: priorStart, endDate: priorEnd, dimensions: ['page'], rowLimit: 1000 }),
  query({ startDate: currentStart, endDate: currentEnd, dimensions: ['query'], rowLimit: 1000 }),
  query({ startDate: priorStart, endDate: priorEnd, dimensions: ['query'], rowLimit: 1000 }),
  query({ startDate: currentStart, endDate: currentEnd, dimensions: ['date'], rowLimit: 10 }),
  query({ startDate: currentStart, endDate: currentEnd, dimensions: ['device'], rowLimit: 10 }),
  getSitemaps(),
]);

const pageComparisons = compareRows(currentPages.rows, priorPages.rows);
const queryComparisons = compareRows(currentQueries.rows, priorQueries.rows);

const result = {
  site: SITE_URL,
  generatedAt: new Date().toISOString(),
  latencyNote: 'Uses final Search Console data for the latest seven-day window ending two days ago.',
  periods: {
    current: { start: isoDate(currentStart), end: isoDate(currentEnd), ...summarize(current) },
    prior: { start: isoDate(priorStart), end: isoDate(priorEnd), ...summarize(prior) },
  },
  topPages: pageComparisons
    .filter((row) => row.current.impressions > 0)
    .sort((a, b) => b.current.clicks - a.current.clicks || b.current.impressions - a.current.impressions)
    .slice(0, 50),
  topQueries: queryComparisons
    .filter((row) => row.current.impressions > 0)
    .sort((a, b) => b.current.clicks - a.current.clicks || b.current.impressions - a.current.impressions)
    .slice(0, 100),
  risingPages: rankRisers(pageComparisons),
  decliningPages: rankDecliners(pageComparisons),
  risingQueries: rankRisers(queryComparisons),
  decliningQueries: rankDecliners(queryComparisons),
  lowCtrPages: ctrOpportunities(pageComparisons),
  lowCtrQueries: ctrOpportunities(queryComparisons),
  daily: daily.rows || [],
  devices: devices.rows || [],
  sitemaps: normalizeSitemaps(sitemaps),
};

console.log(JSON.stringify(result, null, 2));
