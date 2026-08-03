import assert from 'node:assert/strict';
import test from 'node:test';

import {
  adjustGroupedRows,
  buildAnomalyReport,
  classifyQueryPageAnomaly,
  subtractMetrics,
} from '../lib/gsc-anomalies.mjs';

const episode26 = 'https://tobyonfitnesstech.com/podcasts/episode-26/';
const agentStackHub = 'https://tobyonfitnesstech.com/agentstack/';
const localizedAgentStackHub =
  'https://tobyonfitnesstech.com/de/podcasts/agentstack/';

test('classifies known transcript-reference query anomalies', () => {
  assert.equal(
    classifyQueryPageAnomaly({ query: 'inferhub.dev', page: episode26 }),
    'external_domain_reference',
  );
  assert.equal(
    classifyQueryPageAnomaly({
      query: 'https://api.github.com/repos/openai/codex/releases?per_page=10',
      page: episode26,
    }),
    'url_or_api_reference',
  );
  assert.equal(
    classifyQueryPageAnomaly({
      query: '"inferhub.dev" OR "cosulagi.id"',
      page: episode26,
    }),
    'machine_generated_boolean_query',
  );
});

test('classifies API references on AgentStack hub and localized hub pages', () => {
  assert.equal(
    classifyQueryPageAnomaly({
      query: 'api.github.com/repos/openai/codex/releases?per_page=10',
      page: agentStackHub,
    }),
    'url_or_api_reference',
  );
  assert.equal(
    classifyQueryPageAnomaly({
      query: 'https://api.github.com/repos/openclaw/openclaw/releases/latest',
      page: localizedAgentStackHub,
    }),
    'url_or_api_reference',
  );
});

test('does not suppress legitimate AgentStack demand or unrelated site pages', () => {
  assert.equal(
    classifyQueryPageAnomaly({ query: 'openclaw fitness reports', page: episode26 }),
    null,
  );
  assert.equal(
    classifyQueryPageAnomaly({ query: 'agentstack daily', page: agentStackHub }),
    null,
  );
  assert.equal(
    classifyQueryPageAnomaly({
      query: 'inferhub.dev',
      page: 'https://tobyonfitnesstech.com/blog/inferhub-review/',
    }),
    null,
  );
});

test('subtracts anomaly traffic with weighted position and recalculated CTR', () => {
  const adjusted = subtractMetrics(
    { clicks: 10, impressions: 1000, ctr: 0.01, position: 10 },
    { clicks: 0, impressions: 600, ctr: 0, position: 8 },
  );

  assert.deepEqual(adjusted, {
    clicks: 10,
    impressions: 400,
    ctr: 0.025,
    position: 13,
  });
});

test('adjusts page rows without deleting legitimate traffic to the same page', () => {
  const pageRows = [{
    keys: [episode26],
    clicks: 2,
    impressions: 1054,
    ctr: 2 / 1054,
    position: 9,
  }];
  const anomalyRows = [{
    query: 'inferhub.dev',
    page: episode26,
    reason: 'external_domain_reference',
    clicks: 0,
    impressions: 605,
    ctr: 0,
    position: 8,
  }];

  const [adjusted] = adjustGroupedRows(pageRows, anomalyRows, 'page');
  assert.equal(adjusted.impressions, 449);
  assert.equal(adjusted.clicks, 2);
  assert.equal(adjusted.ctr, 2 / 449);
});

test('reports raw anomaly rows with current and prior summaries', () => {
  const currentRows = [{
    keys: ['inferhub.dev', episode26],
    clicks: 0,
    impressions: 605,
    ctr: 0,
    position: 8,
  }];
  const priorRows = [{
    keys: ['inferhub.dev', episode26],
    clicks: 0,
    impressions: 100,
    ctr: 0,
    position: 9,
  }];

  const report = buildAnomalyReport(currentRows, priorRows);
  assert.equal(report.summary.current.impressions, 605);
  assert.equal(report.summary.delta.impressions, 505);
  assert.equal(report.rows[0].reason, 'external_domain_reference');
});
