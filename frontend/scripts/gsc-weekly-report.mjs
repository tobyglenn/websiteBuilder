import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import {
  adjustGroupedRows,
  buildAnomalyReport,
  subtractMetrics,
} from './lib/gsc-anomalies.mjs';
import {
  compareQueryPageRows,
  queriesForPages,
  queryPageCtrOpportunities,
} from './lib/gsc-query-pages.mjs';
import { assessGscDataQuality } from './lib/gsc-data-quality.mjs';

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
      throw new Error(`Unable to read Google credentials metadata ${filename}: ${error.message}`);
    }
  }
  return {};
};

const credentialMetadata = readCredentialMetadata();
const quotaProject =
  process.env.GSC_QUOTA_PROJECT || credentialMetadata.quota_project_id || '';

const getAccessToken = () => {
  if (process.env.GSC_ACCESS_TOKEN) return process.env.GSC_ACCESS_TOKEN.trim();

  const gcloudCandidates = [
    'gcloud',
    join(homedir(), 'google-cloud-sdk/bin/gcloud'),
  ];

  for (const command of gcloudCandidates) {
    try {
      return execFileSync(
        command,
        ['auth', 'application-default', 'print-access-token'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim();
    } catch {
      // Try the next known gcloud location.
    }
  }

  throw new Error(
    'Set GSC_ACCESS_TOKEN or install application-default credentials with Google Cloud CLI.',
  );
};

const token = getAccessToken();
const requestHeaders = {
  authorization: `Bearer ${token}`,
  'content-type': 'application/json',
  ...(quotaProject ? { 'x-goog-user-project': quotaProject } : {}),
};

const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const currentEnd = new Date(today.getTime() - (2 * DAY_MS));
const currentStart = new Date(currentEnd.getTime() - (6 * DAY_MS));
const priorEnd = new Date(currentStart.getTime() - DAY_MS);
const priorStart = new Date(priorEnd.getTime() - (6 * DAY_MS));
const historicalStart = new Date(currentStart.getTime() - (28 * DAY_MS));
const historicalEnd = priorEnd;

const apiError = async (response) => {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body);
    return new Error(parsed.error?.message || `GSC API ${response.status}: ${body}`);
  } catch {
    return new Error(`GSC API ${response.status}: ${body}`);
  }
};

const query = async ({
  startDate,
  endDate,
  dimensions = [],
  rowLimit = 1000,
}) => {
  const response = await fetch(
    `${API_BASE}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({
        startDate: isoDate(startDate),
        endDate: isoDate(endDate),
        dimensions,
        rowLimit,
        dataState: 'final',
      }),
    },
  );
  if (!response.ok) throw await apiError(response);
  return response.json();
};

const getSitemaps = async () => {
  const response = await fetch(
    `${API_BASE}/sites/${encodeURIComponent(SITE_URL)}/sitemaps`,
    { headers: requestHeaders },
  );
  if (!response.ok) throw await apiError(response);
  return response.json();
};

const metricValues = (row = {}) => ({
  clicks: Number(row.clicks || 0),
  impressions: Number(row.impressions || 0),
  ctr: Number(row.ctr || 0),
  position: Number(row.position || 0),
});

const summarize = (payload) => metricValues(payload.rows?.[0]);

const summarizeHistoricalWeeks = (rows, startDate, weekCount = 4) => {
  const buckets = Array.from({ length: weekCount }, (_, index) => {
    const start = new Date(startDate.getTime() + (index * 7 * DAY_MS));
    const end = new Date(start.getTime() + (6 * DAY_MS));
    return {
      start: isoDate(start),
      end: isoDate(end),
      clicks: 0,
      impressions: 0,
      positionImpressions: 0,
    };
  });

  for (const row of rows) {
    const date = new Date(`${row.keys?.[0]}T00:00:00Z`);
    const index = Math.floor((date.getTime() - startDate.getTime()) / (7 * DAY_MS));
    if (index < 0 || index >= buckets.length) continue;
    const metrics = metricValues(row);
    buckets[index].clicks += metrics.clicks;
    buckets[index].impressions += metrics.impressions;
    buckets[index].positionImpressions += metrics.position * metrics.impressions;
  }

  return buckets.map(({ positionImpressions, ...bucket }) => ({
    ...bucket,
    ctr: bucket.impressions ? bucket.clicks / bucket.impressions : 0,
    position: bucket.impressions ? positionImpressions / bucket.impressions : 0,
  }));
};

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
        position:
          prior.position && current.position ? prior.position - current.position : 0,
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

const topRows = (rows, limit) => [...rows]
  .filter((row) => row.current.impressions > 0)
  .sort(
    (a, b) =>
      b.current.clicks - a.current.clicks
      || b.current.impressions - a.current.impressions,
  )
  .slice(0, limit);

const rankRisers = (rows) => [...rows]
  .filter((row) => row.delta.clicks > 0 || row.delta.impressions > 0)
  .sort(
    (a, b) =>
      b.delta.clicks - a.delta.clicks
      || b.delta.impressions - a.delta.impressions,
  )
  .slice(0, 25);

const rankDecliners = (rows) => [...rows]
  .filter((row) => row.delta.clicks < 0 || row.delta.impressions < 0)
  .sort(
    (a, b) =>
      a.delta.clicks - b.delta.clicks
      || a.delta.impressions - b.delta.impressions,
  )
  .slice(0, 25);

const ctrOpportunities = (rows) => [...rows]
  .filter(
    (row) =>
      row.current.impressions >= 20
      && row.current.ctr <= 0.02
      && row.current.position > 0
      && row.current.position <= 20,
  )
  .sort((a, b) => b.current.impressions - a.current.impressions)
  .slice(0, 25);

const normalizeSitemaps = (payload) => (payload.sitemap || []).map((sitemap) => ({
  path: sitemap.path,
  lastSubmitted: sitemap.lastSubmitted,
  lastDownloaded: sitemap.lastDownloaded,
  isPending: Boolean(sitemap.isPending),
  isSitemapsIndex: Boolean(sitemap.isSitemapsIndex),
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
  currentQueryPages,
  priorQueryPages,
  daily,
  historicalDaily,
  devices,
  sitemaps,
] = await Promise.all([
  query({ startDate: currentStart, endDate: currentEnd, rowLimit: 1 }),
  query({ startDate: priorStart, endDate: priorEnd, rowLimit: 1 }),
  query({
    startDate: currentStart,
    endDate: currentEnd,
    dimensions: ['page'],
    rowLimit: 1000,
  }),
  query({
    startDate: priorStart,
    endDate: priorEnd,
    dimensions: ['page'],
    rowLimit: 1000,
  }),
  query({
    startDate: currentStart,
    endDate: currentEnd,
    dimensions: ['query'],
    rowLimit: 1000,
  }),
  query({
    startDate: priorStart,
    endDate: priorEnd,
    dimensions: ['query'],
    rowLimit: 1000,
  }),
  query({
    startDate: currentStart,
    endDate: currentEnd,
    dimensions: ['query', 'page'],
    rowLimit: 25000,
  }),
  query({
    startDate: priorStart,
    endDate: priorEnd,
    dimensions: ['query', 'page'],
    rowLimit: 25000,
  }),
  query({
    startDate: currentStart,
    endDate: currentEnd,
    dimensions: ['date'],
    rowLimit: 10,
  }),
  query({
    startDate: historicalStart,
    endDate: historicalEnd,
    dimensions: ['date'],
    rowLimit: 40,
  }),
  query({
    startDate: currentStart,
    endDate: currentEnd,
    dimensions: ['device'],
    rowLimit: 10,
  }),
  getSitemaps(),
]);

const rawCurrentPeriod = summarize(current);
const rawPriorPeriod = summarize(prior);
const historicalPeriods = summarizeHistoricalWeeks(
  historicalDaily.rows || [],
  historicalStart,
);
const dataQuality = assessGscDataQuality({
  current: rawCurrentPeriod,
  prior: rawPriorPeriod,
  history: historicalPeriods,
  daily: daily.rows || [],
});
const anomalyReport = buildAnomalyReport(
  currentQueryPages.rows || [],
  priorQueryPages.rows || [],
);
const currentAnomalies = anomalyReport.currentRows;
const priorAnomalies = anomalyReport.priorRows;

const rawPageComparisons = compareRows(currentPages.rows, priorPages.rows);
const rawQueryComparisons = compareRows(currentQueries.rows, priorQueries.rows);
const pageComparisons = compareRows(
  adjustGroupedRows(currentPages.rows, currentAnomalies, 'page'),
  adjustGroupedRows(priorPages.rows, priorAnomalies, 'page'),
);
const queryComparisons = compareRows(
  adjustGroupedRows(currentQueries.rows, currentAnomalies, 'query'),
  adjustGroupedRows(priorQueries.rows, priorAnomalies, 'query'),
);
const queryPageComparisons = compareQueryPageRows(
  currentQueryPages.rows,
  priorQueryPages.rows,
  currentAnomalies,
  priorAnomalies,
);
const lowCtrPages = ctrOpportunities(pageComparisons);

const result = {
  site: SITE_URL,
  generatedAt: new Date().toISOString(),
  latencyNote:
    'Uses final Search Console data for the latest seven-day window ending two days ago.',
  methodology: {
    rawPeriods:
      'Unmodified Search Console aggregate totals, including anonymized queries.',
    decisionPeriods:
      'Raw totals minus explicitly classified AgentStack query-page anomalies. Position is impression-weighted after subtraction.',
    queryPageRows:
      'Classification uses up to 25,000 final query-page rows per period. Rules and every removed row are included under anomalies.',
    queryPageOpportunities:
      'Query-page opportunities exclude classified anomalies and require at least 10 current impressions, CTR at or below 2%, and average position 20 or better.',
    dataQuality:
      'Comparative recommendations are suppressed when final daily rows are incomplete or the current period has an abrupt traffic discontinuity against either the preceding week or the strongest complete week in the preceding four weeks.',
  },
  dataQuality,
  periods: {
    current: {
      start: isoDate(currentStart),
      end: isoDate(currentEnd),
      ...rawCurrentPeriod,
    },
    prior: {
      start: isoDate(priorStart),
      end: isoDate(priorEnd),
      ...rawPriorPeriod,
    },
  },
  decisionPeriods: {
    current: {
      start: isoDate(currentStart),
      end: isoDate(currentEnd),
      ...subtractMetrics(rawCurrentPeriod, anomalyReport.summary.current),
    },
    prior: {
      start: isoDate(priorStart),
      end: isoDate(priorEnd),
      ...subtractMetrics(rawPriorPeriod, anomalyReport.summary.prior),
    },
  },
  historicalPeriods,
  anomalies: {
    rules: anomalyReport.rules,
    summary: anomalyReport.summary,
    rows: anomalyReport.rows,
  },
  topPages: topRows(pageComparisons, 50),
  topQueries: topRows(queryComparisons, 100),
  rawTopPages: topRows(rawPageComparisons, 50),
  rawTopQueries: topRows(rawQueryComparisons, 100),
  risingPages: dataQuality.comparisonSafe ? rankRisers(pageComparisons) : [],
  decliningPages: dataQuality.comparisonSafe ? rankDecliners(pageComparisons) : [],
  risingQueries: dataQuality.comparisonSafe ? rankRisers(queryComparisons) : [],
  decliningQueries: dataQuality.comparisonSafe ? rankDecliners(queryComparisons) : [],
  lowCtrPages: dataQuality.comparisonSafe ? lowCtrPages : [],
  lowCtrQueries: dataQuality.comparisonSafe ? ctrOpportunities(queryComparisons) : [],
  lowCtrQueryPages: dataQuality.comparisonSafe
    ? queryPageCtrOpportunities(queryPageComparisons)
    : [],
  queriesByLowCtrPage: dataQuality.comparisonSafe
    ? queriesForPages(queryPageComparisons, lowCtrPages)
    : [],
  daily: daily.rows || [],
  devices: devices.rows || [],
  sitemaps: normalizeSitemaps(sitemaps),
};

console.log(JSON.stringify(result, null, 2));
