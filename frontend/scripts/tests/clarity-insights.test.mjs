import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildClarityReport,
  durationSeconds,
  normalizeClarityPath,
  summarizeClarityMetrics,
} from '../lib/clarity-insights.mjs';

const metric = (metricName, information) => ({ metricName, information });

const snapshot = ({ date, readers, bots, dead = 0, rage = 0, scroll, active, total }) => ({
  schemaVersion: 1,
  provider: 'microsoft-clarity',
  snapshotDate: date,
  collectedAt: `${date}T09:45:00.000Z`,
  queries: {
    summary: {
      metrics: [
        metric('Traffic', [{
          totalSessionCount: String(readers),
          totalBotSessionCount: String(bots),
          distinctUserCount: String(readers - 2),
          pagesPerSessionPercentage: 1.5,
        }]),
        metric('ScrollDepth', [{ averageScrollDepth: scroll }]),
        metric('EngagementTime', [{ totalTime: total, activeTime: active }]),
        metric('DeadClickCount', [{
          sessionsCount: String(readers),
          sessionsWithMetricPercentage: 100 * dead / readers,
          subTotal: String(dead + 1),
          pagesViews: String(dead),
        }]),
        metric('RageClickCount', [{
          sessionsCount: String(readers),
          sessionsWithMetricPercentage: 100 * rage / readers,
          subTotal: String(rage),
          pagesViews: String(rage),
        }]),
      ],
    },
    pageDevice: {
      metrics: [
        metric('Traffic', [{
          Url: 'https://tobyonfitnesstech.com/blog/example',
          Device: 'PC',
          totalSessionCount: String(readers),
          totalBotSessionCount: String(bots),
          distinctUserCount: String(readers - 2),
          pagesPerSessionPercentage: 1.5,
        }]),
        metric('ScrollDepth', [{
          Url: 'https://tobyonfitnesstech.com/blog/example',
          Device: 'PC',
          averageScrollDepth: scroll,
        }]),
        metric('DeadClickCount', [{
          Url: 'https://tobyonfitnesstech.com/blog/example',
          Device: 'PC',
          sessionsCount: String(readers),
          sessionsWithMetricPercentage: 100 * dead / readers,
          subTotal: String(dead + 1),
          pagesViews: String(dead),
        }]),
        metric('RageClickCount', [{
          Url: 'https://tobyonfitnesstech.com/blog/example',
          Device: 'PC',
          sessionsCount: String(readers),
          sessionsWithMetricPercentage: 100 * rage / readers,
          subTotal: String(rage),
          pagesViews: String(rage),
        }]),
      ],
    },
    acquisition: {
      metrics: [
        metric('Traffic', [{
          Source: 'Google',
          Medium: 'organic',
          Channel: 'Organic Search',
          totalSessionCount: String(readers),
          totalBotSessionCount: String(bots),
          distinctUserCount: String(readers - 2),
        }]),
      ],
    },
  },
});

test('normalizes Clarity duration and URL values', () => {
  assert.equal(durationSeconds('01:02:03.5'), 3723.5);
  assert.equal(durationSeconds('42.5'), 42.5);
  assert.equal(normalizeClarityPath('https://tobyonfitnesstech.com/blog/example?x=1'), '/blog/example/');
});

test('keeps reader and bot traffic separate in summary metrics', () => {
  const summary = summarizeClarityMetrics(snapshot({
    date: '2026-08-18', readers: 20, bots: 2, dead: 2, rage: 1,
    scroll: 70, active: '00:02:20', total: '00:03:20',
  }).queries.summary.metrics);

  assert.equal(summary.readerSessions, 20);
  assert.equal(summary.botSessions, 2);
  assert.equal(summary.behaviors.deadClicks.sessions, 2);
  assert.equal(summary.activeEngagementSeconds, 140);
});

test('uses Clarity behavior percentage instead of treating every session as affected', () => {
  const summary = summarizeClarityMetrics([
    metric('Traffic', [{ totalSessionCount: '12', totalBotSessionCount: '5' }]),
    metric('DeadClickCount', [{
      sessionsCount: '12',
      sessionsWithMetricPercentage: 8.33,
      subTotal: '7',
      pagesViews: '3',
    }]),
  ]);

  assert.equal(summary.behaviors.deadClicks.sessions, 1);
  assert.equal(summary.behaviors.deadClicks.events, 7);
});

test('builds complete one-period comparisons and ranks page friction', () => {
  const prior = snapshot({
    date: '2026-08-17', readers: 10, bots: 5, dead: 1, rage: 0,
    scroll: 50, active: '00:00:50', total: '00:01:40',
  });
  const current = snapshot({
    date: '2026-08-18', readers: 20, bots: 2, dead: 2, rage: 1,
    scroll: 70, active: '00:02:20', total: '00:03:20',
  });
  const report = buildClarityReport([prior, current], {
    generatedAt: '2026-08-18T10:00:00.000Z',
    periodDays: 1,
  });

  assert.equal(report.comparisonReady, true);
  assert.equal(report.comparisons.readerSessions.delta, 10);
  assert.equal(report.periods.current.readerShare, 90.91);
  assert.equal(report.currentPageDeviceFriction[0].path, '/blog/example/');
  assert.equal(report.currentPageDeviceFriction[0].frictionScore, 35);
  assert.equal(report.currentPageDeviceFriction[0].decisionSampleQualified, true);
  assert.equal(report.currentAcquisition[0].source, 'Google');
});

test('labels a weekly report partial until fourteen daily snapshots exist', () => {
  const current = snapshot({
    date: '2026-08-18', readers: 4, bots: 1, dead: 0, rage: 0,
    scroll: 40, active: 20, total: 50,
  });
  const report = buildClarityReport([current]);

  assert.equal(report.comparisonReady, false);
  assert.equal(report.periods.current.snapshots, 1);
  assert.equal(report.periods.prior.snapshots, 0);
  assert.equal(report.currentPageDeviceFriction[0].decisionSampleQualified, false);
});
