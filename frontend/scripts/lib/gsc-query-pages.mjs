const metricValues = (row = {}) => ({
  clicks: Number(row.clicks || 0),
  impressions: Number(row.impressions || 0),
  ctr: Number(row.ctr || 0),
  position: Number(row.position || 0),
});

const rowIdentity = ({ query = '', page = '' } = {}) =>
  `${query}\u0000${page}`;

const normalizeRow = (row = {}) => {
  const [query = '', page = ''] = row.keys || [];
  return { query, page, ...metricValues(row) };
};

export const compareQueryPageRows = (
  currentRows = [],
  priorRows = [],
  currentExcludedRows = [],
  priorExcludedRows = [],
) => {
  const currentExcluded = new Set(currentExcludedRows.map(rowIdentity));
  const priorExcluded = new Set(priorExcludedRows.map(rowIdentity));
  const current = currentRows
    .map(normalizeRow)
    .filter((row) => !currentExcluded.has(rowIdentity(row)));
  const prior = priorRows
    .map(normalizeRow)
    .filter((row) => !priorExcluded.has(rowIdentity(row)));
  const priorByKey = new Map(prior.map((row) => [rowIdentity(row), row]));
  const currentKeys = new Set(current.map(rowIdentity));
  const comparisons = current.map((row) => {
    const currentMetrics = metricValues(row);
    const priorMetrics = metricValues(priorByKey.get(rowIdentity(row)));
    return {
      query: row.query,
      page: row.page,
      current: currentMetrics,
      prior: priorMetrics,
      delta: {
        clicks: currentMetrics.clicks - priorMetrics.clicks,
        impressions: currentMetrics.impressions - priorMetrics.impressions,
        ctr: currentMetrics.ctr - priorMetrics.ctr,
        position:
          priorMetrics.position && currentMetrics.position
            ? priorMetrics.position - currentMetrics.position
            : 0,
      },
    };
  });

  for (const row of prior) {
    if (currentKeys.has(rowIdentity(row))) continue;
    const priorMetrics = metricValues(row);
    comparisons.push({
      query: row.query,
      page: row.page,
      current: metricValues(),
      prior: priorMetrics,
      delta: {
        clicks: -priorMetrics.clicks,
        impressions: -priorMetrics.impressions,
        ctr: -priorMetrics.ctr,
        position: 0,
      },
    });
  }

  return comparisons;
};

export const queryPageCtrOpportunities = (
  rows = [],
  { minImpressions = 10, maxCtr = 0.02, maxPosition = 20, limit = 100 } = {},
) => [...rows]
  .filter(
    (row) =>
      row.current.impressions >= minImpressions
      && row.current.ctr <= maxCtr
      && row.current.position > 0
      && row.current.position <= maxPosition,
  )
  .sort(
    (a, b) =>
      b.current.impressions - a.current.impressions
      || a.current.ctr - b.current.ctr,
  )
  .slice(0, limit);

export const queriesForPages = (rows = [], pages = [], limitPerPage = 10) =>
  pages.map((page) => ({
    page: page.key,
    current: page.current,
    prior: page.prior,
    delta: page.delta,
    queries: rows
      .filter((row) => row.page === page.key && row.current.impressions > 0)
      .sort(
        (a, b) =>
          b.current.impressions - a.current.impressions
          || b.current.clicks - a.current.clicks,
      )
      .slice(0, limitPerPage),
  }));
