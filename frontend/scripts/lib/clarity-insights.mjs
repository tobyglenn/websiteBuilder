const BEHAVIOR_METRICS = {
  DeadClickCount: 'deadClicks',
  ExcessiveScroll: 'excessiveScrolls',
  RageClickCount: 'rageClicks',
  QuickbackClick: 'quickbacks',
  ScriptErrorCount: 'scriptErrors',
  ErrorClickCount: 'errorClicks',
};

const numberValue = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const round = (value, places = 2) => {
  if (!Number.isFinite(value)) return 0;
  const multiplier = 10 ** places;
  return Math.round(value * multiplier) / multiplier;
};

const propertyValue = (row, name) => {
  const target = name.toLowerCase();
  const key = Object.keys(row || {}).find((candidate) => candidate.toLowerCase() === target);
  return key ? row[key] : '';
};

export const durationSeconds = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value || '').trim();
  if (!normalized) return 0;
  if (/^\d+(?:\.\d+)?$/.test(normalized)) return numberValue(normalized);

  const match = normalized.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:\.(\d+))?$/);
  if (!match) return 0;
  const [, hours = '0', minutes = '0', seconds = '0', fraction = '0'] = match;
  return (
    numberValue(hours) * 3600
    + numberValue(minutes) * 60
    + numberValue(seconds)
    + numberValue(`0.${fraction}`)
  );
};

export const normalizeClarityPath = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '/';
  try {
    const parsed = new URL(raw, 'https://tobyonfitnesstech.com');
    const pathname = parsed.pathname || '/';
    return pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`;
  } catch {
    return raw;
  }
};

const metricRows = (metrics, metricName) => (
  (metrics || []).find((metric) => metric.metricName === metricName)?.information || []
);

const firstMetricRow = (metrics, metricName) => metricRows(metrics, metricName)[0] || {};

const behaviorTotals = () => Object.fromEntries(
  Object.values(BEHAVIOR_METRICS).map((name) => [name, {
    sessions: 0,
    events: 0,
    pageViews: 0,
  }]),
);

export const summarizeClarityMetrics = (metrics = []) => {
  const traffic = firstMetricRow(metrics, 'Traffic');
  const engagement = firstMetricRow(metrics, 'EngagementTime');
  const scroll = firstMetricRow(metrics, 'ScrollDepth');
  const behaviors = behaviorTotals();

  for (const [metricName, outputName] of Object.entries(BEHAVIOR_METRICS)) {
    const row = firstMetricRow(metrics, metricName);
    behaviors[outputName] = {
      sessions: numberValue(row.sessionsCount),
      events: numberValue(row.subTotal),
      pageViews: numberValue(row.pagesViews),
    };
  }

  return {
    readerSessions: numberValue(traffic.totalSessionCount),
    botSessions: numberValue(traffic.totalBotSessionCount),
    dailyDistinctUsers: numberValue(traffic.distinctUserCount),
    pagesPerSession: numberValue(traffic.pagesPerSessionPercentage),
    averageScrollDepth: numberValue(scroll.averageScrollDepth),
    totalEngagementSeconds: durationSeconds(engagement.totalTime),
    activeEngagementSeconds: durationSeconds(engagement.activeTime),
    behaviors,
  };
};

const emptyPeriodSummary = () => ({
  readerSessions: 0,
  botSessions: 0,
  readerShare: 0,
  dailyDistinctUserSum: 0,
  pagesPerSession: 0,
  averageScrollDepth: 0,
  totalEngagementSeconds: 0,
  activeEngagementSeconds: 0,
  activeEngagementRate: 0,
  behaviors: behaviorTotals(),
});

const aggregateSummaries = (summaries) => {
  const result = emptyPeriodSummary();
  let pagesPerSessionWeight = 0;
  let scrollWeight = 0;

  for (const summary of summaries) {
    result.readerSessions += summary.readerSessions;
    result.botSessions += summary.botSessions;
    result.dailyDistinctUserSum += summary.dailyDistinctUsers;
    result.totalEngagementSeconds += summary.totalEngagementSeconds;
    result.activeEngagementSeconds += summary.activeEngagementSeconds;

    const weight = Math.max(summary.readerSessions, 1);
    if (summary.pagesPerSession > 0) {
      result.pagesPerSession += summary.pagesPerSession * weight;
      pagesPerSessionWeight += weight;
    }
    if (summary.averageScrollDepth > 0) {
      result.averageScrollDepth += summary.averageScrollDepth * weight;
      scrollWeight += weight;
    }

    for (const name of Object.values(BEHAVIOR_METRICS)) {
      result.behaviors[name].sessions += summary.behaviors[name].sessions;
      result.behaviors[name].events += summary.behaviors[name].events;
      result.behaviors[name].pageViews += summary.behaviors[name].pageViews;
    }
  }

  const allSessions = result.readerSessions + result.botSessions;
  result.readerShare = round(100 * result.readerSessions / Math.max(allSessions, 1));
  result.pagesPerSession = round(result.pagesPerSession / Math.max(pagesPerSessionWeight, 1));
  result.averageScrollDepth = round(result.averageScrollDepth / Math.max(scrollWeight, 1));
  result.totalEngagementSeconds = round(result.totalEngagementSeconds);
  result.activeEngagementSeconds = round(result.activeEngagementSeconds);
  result.activeEngagementRate = round(
    100 * result.activeEngagementSeconds / Math.max(result.totalEngagementSeconds, 1),
  );

  for (const name of Object.values(BEHAVIOR_METRICS)) {
    result.behaviors[name].sessionRate = round(
      100 * result.behaviors[name].sessions / Math.max(result.readerSessions, 1),
    );
  }

  return result;
};

const snapshotMetrics = (snapshot, queryName) => (
  snapshot?.queries?.[queryName]?.metrics || []
);

const emptyPageDevice = (path, device) => ({
  path,
  device: device || 'Unknown',
  readerSessions: 0,
  botSessions: 0,
  dailyDistinctUserSum: 0,
  pagesPerSessionWeighted: 0,
  pagesPerSessionWeight: 0,
  scrollDepthSum: 0,
  scrollDepthSamples: 0,
  totalEngagementSeconds: 0,
  activeEngagementSeconds: 0,
  behaviors: behaviorTotals(),
});

const pageDeviceRows = (snapshots) => {
  const rowsByKey = new Map();

  for (const snapshot of snapshots) {
    const metrics = snapshotMetrics(snapshot, 'pageDevice');
    for (const metric of metrics) {
      for (const row of metric.information || []) {
        const path = normalizeClarityPath(propertyValue(row, 'Url'));
        const device = String(propertyValue(row, 'Device') || 'Unknown');
        const key = `${path}\u0000${device}`;
        const aggregate = rowsByKey.get(key) || emptyPageDevice(path, device);

        if (metric.metricName === 'Traffic') {
          const readerSessions = numberValue(row.totalSessionCount);
          aggregate.readerSessions += readerSessions;
          aggregate.botSessions += numberValue(row.totalBotSessionCount);
          aggregate.dailyDistinctUserSum += numberValue(row.distinctUserCount);
          aggregate.pagesPerSessionWeighted += (
            numberValue(row.pagesPerSessionPercentage) * Math.max(readerSessions, 1)
          );
          aggregate.pagesPerSessionWeight += Math.max(readerSessions, 1);
        } else if (metric.metricName === 'ScrollDepth') {
          const scrollDepth = numberValue(row.averageScrollDepth);
          if (scrollDepth > 0) {
            aggregate.scrollDepthSum += scrollDepth;
            aggregate.scrollDepthSamples += 1;
          }
        } else if (metric.metricName === 'EngagementTime') {
          aggregate.totalEngagementSeconds += durationSeconds(row.totalTime);
          aggregate.activeEngagementSeconds += durationSeconds(row.activeTime);
        } else if (BEHAVIOR_METRICS[metric.metricName]) {
          const behavior = aggregate.behaviors[BEHAVIOR_METRICS[metric.metricName]];
          behavior.sessions += numberValue(row.sessionsCount);
          behavior.events += numberValue(row.subTotal);
          behavior.pageViews += numberValue(row.pagesViews);
        }

        rowsByKey.set(key, aggregate);
      }
    }
  }

  return [...rowsByKey.values()].map((row) => {
    for (const name of Object.values(BEHAVIOR_METRICS)) {
      row.behaviors[name].sessionRate = round(
        100 * row.behaviors[name].sessions / Math.max(row.readerSessions, 1),
      );
    }

    const frictionWeight = (
      row.behaviors.rageClicks.sessions * 3
      + row.behaviors.deadClicks.sessions * 2
      + row.behaviors.quickbacks.sessions * 2
      + row.behaviors.scriptErrors.sessions * 3
      + row.behaviors.errorClicks.sessions * 3
      + row.behaviors.excessiveScrolls.sessions
    );

    return {
      path: row.path,
      device: row.device,
      readerSessions: row.readerSessions,
      botSessions: row.botSessions,
      dailyDistinctUserSum: row.dailyDistinctUserSum,
      pagesPerSession: round(
        row.pagesPerSessionWeighted / Math.max(row.pagesPerSessionWeight, 1),
      ),
      averageScrollDepth: round(
        row.scrollDepthSum / Math.max(row.scrollDepthSamples, 1),
      ),
      totalEngagementSeconds: round(row.totalEngagementSeconds),
      activeEngagementSeconds: round(row.activeEngagementSeconds),
      behaviors: row.behaviors,
      frictionScore: round(100 * frictionWeight / Math.max(row.readerSessions, 1)),
      decisionSampleQualified: row.readerSessions >= 20,
    };
  });
};

const acquisitionRows = (snapshots) => {
  const rowsByKey = new Map();

  for (const snapshot of snapshots) {
    for (const row of metricRows(snapshotMetrics(snapshot, 'acquisition'), 'Traffic')) {
      const source = String(propertyValue(row, 'Source') || '(direct)');
      const medium = String(propertyValue(row, 'Medium') || '(none)');
      const channel = String(propertyValue(row, 'Channel') || 'Other');
      const key = `${source}\u0000${medium}\u0000${channel}`;
      const current = rowsByKey.get(key) || {
        source,
        medium,
        channel,
        readerSessions: 0,
        botSessions: 0,
        dailyDistinctUserSum: 0,
      };
      current.readerSessions += numberValue(row.totalSessionCount);
      current.botSessions += numberValue(row.totalBotSessionCount);
      current.dailyDistinctUserSum += numberValue(row.distinctUserCount);
      rowsByKey.set(key, current);
    }
  }

  return [...rowsByKey.values()]
    .map((row) => ({
      ...row,
      botShare: round(
        100 * row.botSessions / Math.max(row.readerSessions + row.botSessions, 1),
      ),
    }))
    .sort((a, b) => b.readerSessions - a.readerSessions || a.botShare - b.botShare);
};

const periodMetadata = (snapshots, expectedDays) => ({
  start: snapshots[0]?.snapshotDate || null,
  end: snapshots.at(-1)?.snapshotDate || null,
  snapshots: snapshots.length,
  expectedSnapshots: expectedDays,
  complete: snapshots.length === expectedDays,
});

const metricComparison = (current, prior) => ({
  current: round(current),
  prior: round(prior),
  delta: round(current - prior),
  percentChange: prior ? round(100 * (current - prior) / prior) : null,
});

export const buildClarityReport = (
  inputSnapshots,
  { generatedAt = new Date().toISOString(), periodDays = 7 } = {},
) => {
  const snapshotsByDate = new Map();
  for (const snapshot of inputSnapshots || []) {
    if (!snapshot?.snapshotDate || !snapshot?.collectedAt) continue;
    const previous = snapshotsByDate.get(snapshot.snapshotDate);
    if (!previous || previous.collectedAt < snapshot.collectedAt) {
      snapshotsByDate.set(snapshot.snapshotDate, snapshot);
    }
  }

  const snapshots = [...snapshotsByDate.values()]
    .sort((a, b) => a.collectedAt.localeCompare(b.collectedAt))
    .slice(-(periodDays * 2));
  const currentSnapshots = snapshots.slice(-periodDays);
  const priorSnapshots = snapshots.slice(0, Math.max(0, snapshots.length - periodDays));
  const currentSummary = aggregateSummaries(
    currentSnapshots.map((snapshot) => summarizeClarityMetrics(snapshotMetrics(snapshot, 'summary'))),
  );
  const priorSummary = aggregateSummaries(
    priorSnapshots.map((snapshot) => summarizeClarityMetrics(snapshotMetrics(snapshot, 'summary'))),
  );
  const currentPages = pageDeviceRows(currentSnapshots)
    .sort((a, b) => b.frictionScore - a.frictionScore || b.readerSessions - a.readerSessions);

  return {
    schemaVersion: 1,
    provider: 'microsoft-clarity',
    generatedAt,
    methodology: {
      snapshotWindow: 'One 24-hour export collected at a consistent daily time.',
      comparison: `Latest ${periodDays} daily snapshots versus the preceding ${periodDays}.`,
      readersAndBots: 'Clarity totalSessionCount is treated as reader sessions; totalBotSessionCount is reported separately.',
      decisionThreshold: 'Page/device recommendations require at least 20 reader sessions unless an independently clear technical failure exists.',
      limitation: 'Clarity exposes at most 72 hours per request, so complete weekly comparison requires 14 stored daily snapshots.',
    },
    periods: {
      current: {
        ...periodMetadata(currentSnapshots, periodDays),
        ...currentSummary,
      },
      prior: {
        ...periodMetadata(priorSnapshots, periodDays),
        ...priorSummary,
      },
    },
    comparisonReady: currentSnapshots.length === periodDays && priorSnapshots.length === periodDays,
    comparisons: {
      readerSessions: metricComparison(currentSummary.readerSessions, priorSummary.readerSessions),
      botSessions: metricComparison(currentSummary.botSessions, priorSummary.botSessions),
      pagesPerSession: metricComparison(currentSummary.pagesPerSession, priorSummary.pagesPerSession),
      averageScrollDepth: metricComparison(currentSummary.averageScrollDepth, priorSummary.averageScrollDepth),
      activeEngagementRate: metricComparison(currentSummary.activeEngagementRate, priorSummary.activeEngagementRate),
    },
    currentPageDeviceFriction: currentPages.slice(0, 100),
    currentQualifiedPageDeviceFriction: currentPages
      .filter((row) => row.decisionSampleQualified)
      .slice(0, 50),
    currentAcquisition: acquisitionRows(currentSnapshots).slice(0, 100),
    priorAcquisition: acquisitionRows(priorSnapshots).slice(0, 100),
    availableSnapshotDates: snapshots.map((snapshot) => snapshot.snapshotDate),
  };
};

export const CLARITY_QUERY_DEFINITIONS = [
  { key: 'summary', dimensions: [] },
  { key: 'pageDevice', dimensions: ['URL', 'Device'] },
  { key: 'acquisition', dimensions: ['Source', 'Medium', 'Channel'] },
];

