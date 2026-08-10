import assert from 'node:assert/strict';
import test from 'node:test';

import {
  compareQueryPageRows,
  queriesForPages,
  queryPageCtrOpportunities,
} from '../lib/gsc-query-pages.mjs';

const whoopPage = 'https://tobyonfitnesstech.com/blog/whoop-5-not-smaller-review/';
const agentStackPage = 'https://tobyonfitnesstech.com/podcasts/episode-55/';

test('compares query-page rows and excludes classified anomalies', () => {
  const currentRows = [
    {
      keys: ['whoop 4.0 vs 5.0', whoopPage],
      clicks: 1,
      impressions: 241,
      ctr: 1 / 241,
      position: 8.5,
    },
    {
      keys: ['api.github.com/repos/openai/codex/releases?per_page=10', agentStackPage],
      clicks: 0,
      impressions: 93,
      ctr: 0,
      position: 7.2,
    },
  ];
  const priorRows = [{
    keys: ['whoop 4.0 vs 5.0', whoopPage],
    clicks: 0,
    impressions: 169,
    ctr: 0,
    position: 9.7,
  }];
  const excludedRows = [{
    query: 'api.github.com/repos/openai/codex/releases?per_page=10',
    page: agentStackPage,
  }];

  const comparisons = compareQueryPageRows(
    currentRows,
    priorRows,
    excludedRows,
    [],
  );

  assert.equal(comparisons.length, 1);
  assert.equal(comparisons[0].query, 'whoop 4.0 vs 5.0');
  assert.equal(comparisons[0].delta.impressions, 72);
});

test('ranks low-CTR query-page opportunities by current impressions', () => {
  const rows = [
    {
      query: 'whoop 4.0 vs 5.0',
      page: whoopPage,
      current: { clicks: 1, impressions: 241, ctr: 1 / 241, position: 8.5 },
    },
    {
      query: 'small unrelated query',
      page: whoopPage,
      current: { clicks: 0, impressions: 9, ctr: 0, position: 4 },
    },
  ];

  assert.deepEqual(
    queryPageCtrOpportunities(rows).map((row) => row.query),
    ['whoop 4.0 vs 5.0'],
  );
});

test('groups the strongest query evidence under each low-CTR page', () => {
  const page = {
    key: whoopPage,
    current: { clicks: 7, impressions: 1729, ctr: 7 / 1729, position: 8.1 },
    prior: {},
    delta: {},
  };
  const rows = [
    { query: 'whoop 4 vs 5', page: whoopPage, current: { clicks: 2, impressions: 114 } },
    { query: 'whoop 4.0 vs 5.0', page: whoopPage, current: { clicks: 1, impressions: 241 } },
  ];

  const [group] = queriesForPages(rows, [page]);
  assert.equal(group.queries[0].query, 'whoop 4.0 vs 5.0');
  assert.equal(group.queries.length, 2);
});
