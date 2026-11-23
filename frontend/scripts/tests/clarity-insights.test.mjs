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

test('fourteen stored snapshots do not prove two complete weeks when a date is missing', () => {
  const dates = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26'];
  const snapshots = dates.map(date => snapshot({ date, readers: 4, bots: 1, scroll: 40, active: 20, total: 50 }));
  const report = buildClarityReport(snapshots);
  assert.equal(report.comparisonReady, false);
  assert.equal(report.periods.current.snapshots, 7);
  assert.equal(report.periods.current.complete, false);
  assert.equal(report.periods.prior.complete, true);
  assert.deepEqual(report.dataQuality.missingDates, ['2026-10-21']);
  assert.deepEqual(report.dataQuality.outsideWindowDates, ['2026-10-12']);
  assert.equal(report.periods.current.readerSessions, 28);
});

test('contiguous dates remain comparable after a late backfill', () => {
  const snapshots = Array.from({ length: 14 }, (_, i) => snapshot({ date: `2026-10-${String(i + 12).padStart(2, '0')}`, readers: 4, bots: 1, scroll: 40, active: 20, total: 50 }));
  snapshots[0].collectedAt = '2026-10-26T11:00:00Z';
  const report = buildClarityReport(snapshots);
  assert.equal(report.comparisonReady, true);
  assert.equal(report.periods.prior.start, '2026-10-12');
  assert.equal(report.periods.current.end, '2026-10-25');
  assert.deepEqual(report.dataQuality.missingDates, []);
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

const acquisitionFixture = () => [
  snapshot({ date: '2026-11-21', readers: 100, bots: 5, scroll: 30, active: 10, total: 20 }),
  snapshot({ date: '2026-11-22', readers: 40, bots: 2, scroll: 30, active: 10, total: 20 }),
];

test('reconciles reader and bot acquisition contributions before attributing a decline', () => {
  const result = buildClarityReport(acquisitionFixture(), { periodDays: 1 }).acquisitionComparison;
  assert.equal(result.ready, true);
  assert.equal(result.readerSessionDelta, -60);
  assert.equal(result.rows[0].readers.delta, -60);
  assert.equal(result.rows[0].bots.delta, -3);
  assert.equal(result.rows[0].shareOfNetReaderChangePercent, 100);
});

test('new and disappeared sources are zero-filled only for reconciled periods', () => {
  const snapshots = acquisitionFixture();
  snapshots[1].queries.acquisition.metrics[0].information[0].Source = 'Bing';
  const result = buildClarityReport(snapshots, { periodDays: 1 }).acquisitionComparison;
  assert.equal(result.ready, true);
  assert.equal(result.rows.find(row => row.source === 'Google').readers.delta, -100);
  assert.equal(result.rows.find(row => row.source === 'Bing').readers.percentChange, null);
  assert.equal(result.rows.reduce((sum, row) => sum + row.readers.delta, 0), -60);
});

test('missing, truncated, invalid and bot-mismatched acquisition data hold attribution', () => {
  for (const mutate of [
    s => { delete s.queries.acquisition; },
    s => { s.queries.acquisition.metrics[0].information[0].totalSessionCount = '20'; },
    s => { s.queries.acquisition.metrics[0].information[0].totalBotSessionCount = '0'; },
    s => { s.queries.acquisition.metrics[0].information[0].totalSessionCount = 'bad'; },
  ]) {
    const snapshots = acquisitionFixture();
    mutate(snapshots[1]);
    const result = buildClarityReport(snapshots, { periodDays: 1 }).acquisitionComparison;
    assert.equal(result.ready, false);
    assert.deepEqual(result.rows, []);
  }
});

test('partial dates hold attribution even when acquisition counts reconcile', () => {
  const snapshots = acquisitionFixture();
  snapshots[0].snapshotDate = '2026-11-20';
  const result = buildClarityReport(snapshots, { periodDays: 1 }).acquisitionComparison;
  assert.equal(result.ready, false);
  assert.match(result.reason, /consecutive/);
});

test('unchanged net reader traffic has no percentage contribution denominator', () => {
  const snapshots = acquisitionFixture();
  snapshots[1].queries.summary.metrics[0].information[0].totalSessionCount = '100';
  snapshots[1].queries.acquisition.metrics[0].information[0].totalSessionCount = '100';
  const result = buildClarityReport(snapshots, { periodDays: 1 }).acquisitionComparison;
  assert.equal(result.ready, true);
  assert.equal(result.rows[0].shareOfNetReaderChangePercent, null);
});

test('offsetting daily source omissions do not pass a period-total reconciliation', () => {
  const snapshots = Array.from({ length: 4 }, (_, i) => snapshot({
    date: `2026-11-${19 + i}`, readers: 10, bots: 0, scroll: 30, active: 10, total: 20,
  }));
  snapshots[2].queries.acquisition.metrics[0].information[0].totalSessionCount = '5';
  snapshots[3].queries.acquisition.metrics[0].information[0].totalSessionCount = '15';
  const result = buildClarityReport(snapshots, { periodDays: 2 }).acquisitionComparison;
  assert.equal(result.ready, false);
  assert.deepEqual(result.rows, []);
});
