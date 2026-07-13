import { execFileSync } from 'node:child_process';

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:tobyonfitnesstech.com';
const API_BASE = 'https://searchconsole.googleapis.com/webmasters/v3';
const DAY_MS = 24 * 60 * 60 * 1000;
const isoDate = (date) => date.toISOString().slice(0, 10);

const getAccessToken = () => {
  if (process.env.GSC_ACCESS_TOKEN) return process.env.GSC_ACCESS_TOKEN.trim();
  try {
    return execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], { encoding: 'utf8' }).trim();
  } catch {
    throw new Error('Set GSC_ACCESS_TOKEN or authenticate gcloud application-default credentials before running this report.');
  }
};

const token = getAccessToken();
const today = new Date();
const currentEnd = new Date(today.getTime() - (2 * DAY_MS));
const currentStart = new Date(currentEnd.getTime() - (6 * DAY_MS));
const priorEnd = new Date(currentStart.getTime() - DAY_MS);
const priorStart = new Date(priorEnd.getTime() - (6 * DAY_MS));

const query = async ({ startDate, endDate, dimensions = [], rowLimit = 10 }) => {
  const response = await fetch(`${API_BASE}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: isoDate(startDate),
      endDate: isoDate(endDate),
      dimensions,
      rowLimit,
      dataState: 'all',
    }),
  });
  if (!response.ok) throw new Error(`Search Console API ${response.status}: ${await response.text()}`);
  return response.json();
};

const summarize = (payload) => {
  const row = payload.rows?.[0] || {};
  return {
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  };
};

const [current, prior, pages, queries] = await Promise.all([
  query({ startDate: currentStart, endDate: currentEnd, rowLimit: 1 }),
  query({ startDate: priorStart, endDate: priorEnd, rowLimit: 1 }),
  query({ startDate: currentStart, endDate: currentEnd, dimensions: ['page'], rowLimit: 25 }),
  query({ startDate: currentStart, endDate: currentEnd, dimensions: ['query'], rowLimit: 50 }),
]);

const result = {
  site: SITE_URL,
  generatedAt: new Date().toISOString(),
  latencyNote: 'Uses the latest complete seven-day window ending two days ago.',
  periods: {
    current: { start: isoDate(currentStart), end: isoDate(currentEnd), ...summarize(current) },
    prior: { start: isoDate(priorStart), end: isoDate(priorEnd), ...summarize(prior) },
  },
  topPages: pages.rows || [],
  topQueries: queries.rows || [],
};

console.log(JSON.stringify(result, null, 2));
