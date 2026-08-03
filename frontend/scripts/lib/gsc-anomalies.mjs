const AGENTSTACK_PAGE_RE =
  /\/(?:agentstack|podcasts\/(?:agentstack|episode-\d+))\/?$/i;
const EXTERNAL_DOMAIN_ONLY_RE =
  /^["']?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|dev|id|io|ai|app|net|org|co|xyz)["']?$/i;
const URL_OR_API_RE =
  /(?:https?:\/\/|api\.github\.com|github\.com\/[^/\s]+\/[^/\s]+|\/repos\/|[/?&][a-z0-9_.-]+=[^\s]+)/i;
const BOOLEAN_QUERY_RE = /(?:^|\s)(?:OR|AND)\s|["'][^"']+["']\s+(?:OR|AND)\s+/i;

export const ANOMALY_RULES = {
  scope: 'AgentStack hub and episode query-page rows only',
  url_or_api_reference:
    'URL, API endpoint, repository path, or parameterized request copied from episode transcript text.',
  external_domain_reference:
    'External domain-only navigation query matched an AgentStack transcript mention.',
  machine_generated_boolean_query:
    'Quoted or boolean search expression resembles an automated or copied transcript query.',
};

const metricValues = (row = {}) => ({
  clicks: Number(row.clicks || 0),
  impressions: Number(row.impressions || 0),
  ctr: Number(row.ctr || 0),
  position: Number(row.position || 0),
});

const summarizeRows = (rows = []) => {
  const totals = rows.reduce(
    (summary, row) => {
      const metrics = metricValues(row);
      summary.clicks += metrics.clicks;
      summary.impressions += metrics.impressions;
      summary.positionWeight += metrics.position * metrics.impressions;
      return summary;
    },
    { clicks: 0, impressions: 0, positionWeight: 0 },
  );

  return {
    clicks: totals.clicks,
    impressions: totals.impressions,
    ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
    position: totals.impressions ? totals.positionWeight / totals.impressions : 0,
  };
};

export const classifyQueryPageAnomaly = ({ query = '', page = '' } = {}) => {
  const normalizedQuery = String(query).trim();
  const normalizedPage = String(page).trim();

  if (!normalizedQuery || !AGENTSTACK_PAGE_RE.test(normalizedPage)) {
    return null;
  }
  if (/tobyonfitnesstech\.com/i.test(normalizedQuery)) {
    return null;
  }
  if (URL_OR_API_RE.test(normalizedQuery)) {
    return 'url_or_api_reference';
  }
  if (EXTERNAL_DOMAIN_ONLY_RE.test(normalizedQuery)) {
    return 'external_domain_reference';
  }
  if (
    BOOLEAN_QUERY_RE.test(normalizedQuery)
    && /(?:\.[a-z]{2,}\b|https?:|\/repos\/)/i.test(normalizedQuery)
  ) {
    return 'machine_generated_boolean_query';
  }

  return null;
};

export const findQueryPageAnomalies = (rows = []) =>
  rows.flatMap((row) => {
    const [query = '', page = ''] = row.keys || [];
    const reason = classifyQueryPageAnomaly({ query, page });
    if (!reason) return [];

    return [{
      query,
      page,
      reason,
      ...metricValues(row),
    }];
  });

const anomalyMetricsByKey = (anomalyRows, key) => {
  const relevantRows = anomalyRows.filter((row) => row[key]);
  const grouped = new Map();

  for (const row of relevantRows) {
    const groupKey = row[key];
    const previous = grouped.get(groupKey) || [];
    previous.push(row);
    grouped.set(groupKey, previous);
  }

  return new Map(
    [...grouped.entries()].map(([groupKey, rows]) => [groupKey, summarizeRows(rows)]),
  );
};

export const subtractMetrics = (totalRow = {}, excludedRow = {}) => {
  const total = metricValues(totalRow);
  const excluded = metricValues(excludedRow);
  const impressions = Math.max(0, total.impressions - excluded.impressions);
  const clicks = Math.max(0, total.clicks - excluded.clicks);
  const positionWeight = Math.max(
    0,
    (total.position * total.impressions) - (excluded.position * excluded.impressions),
  );

  return {
    clicks,
    impressions,
    ctr: impressions ? clicks / impressions : 0,
    position: impressions ? positionWeight / impressions : 0,
  };
};

export const adjustGroupedRows = (rows = [], anomalyRows = [], key = 'query') => {
  const excludedByKey = anomalyMetricsByKey(anomalyRows, key);

  return rows.flatMap((row) => {
    const groupKey = row.keys?.[0] || '';
    const excluded = excludedByKey.get(groupKey);
    if (!excluded) return [row];

    const adjusted = subtractMetrics(row, excluded);
    if (!adjusted.impressions && !adjusted.clicks) return [];
    return [{ ...row, ...adjusted }];
  });
};

const anomalyRowKey = (row) => `${row.query}\u0000${row.page}\u0000${row.reason}`;

export const compareAnomalyRows = (currentRows = [], priorRows = []) => {
  const priorByKey = new Map(priorRows.map((row) => [anomalyRowKey(row), row]));
  const currentKeys = new Set(currentRows.map(anomalyRowKey));
  const comparisons = currentRows.map((row) => {
    const prior = priorByKey.get(anomalyRowKey(row));
    const current = metricValues(row);
    const priorMetrics = metricValues(prior);
    return {
      query: row.query,
      page: row.page,
      reason: row.reason,
      current,
      prior: priorMetrics,
      delta: {
        clicks: current.clicks - priorMetrics.clicks,
        impressions: current.impressions - priorMetrics.impressions,
        ctr: current.ctr - priorMetrics.ctr,
        position: priorMetrics.position && current.position
          ? priorMetrics.position - current.position
          : 0,
      },
    };
  });

  for (const row of priorRows) {
    if (currentKeys.has(anomalyRowKey(row))) continue;
    const prior = metricValues(row);
    comparisons.push({
      query: row.query,
      page: row.page,
      reason: row.reason,
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

  return comparisons.sort(
    (a, b) => b.current.impressions - a.current.impressions
      || b.prior.impressions - a.prior.impressions,
  );
};

export const buildAnomalyReport = (currentRows = [], priorRows = []) => {
  const current = findQueryPageAnomalies(currentRows);
  const prior = findQueryPageAnomalies(priorRows);
  const currentSummary = summarizeRows(current);
  const priorSummary = summarizeRows(prior);

  return {
    rules: ANOMALY_RULES,
    summary: {
      current: currentSummary,
      prior: priorSummary,
      delta: {
        clicks: currentSummary.clicks - priorSummary.clicks,
        impressions: currentSummary.impressions - priorSummary.impressions,
        ctr: currentSummary.ctr - priorSummary.ctr,
        position: priorSummary.position && currentSummary.position
          ? priorSummary.position - currentSummary.position
          : 0,
      },
      affectedQueries: new Set([...current, ...prior].map((row) => row.query)).size,
      affectedPages: new Set([...current, ...prior].map((row) => row.page)).size,
    },
    rows: compareAnomalyRows(current, prior),
    currentRows: current,
    priorRows: prior,
  };
};
