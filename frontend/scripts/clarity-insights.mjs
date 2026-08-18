import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildClarityReport,
  CLARITY_QUERY_DEFINITIONS,
} from './lib/clarity-insights.mjs';

const API_URL = process.env.CLARITY_API_URL
  || 'https://www.clarity.ms/export-data/api/v1/project-live-insights';
const REPORT_DIR = process.env.CLARITY_REPORT_DIR
  || '/home/toby/.openclaw/logs/analytics/clarity';
const SNAPSHOT_DIR = join(REPORT_DIR, 'snapshots');
const token = process.env.CLARITY_API_TOKEN || '';

const writeJsonAtomic = async (filename, value) => {
  await mkdir(dirname(filename), { recursive: true });
  const temporary = `${filename}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, filename);
};

const apiError = async (response) => {
  const body = (await response.text()).trim();
  if (response.status === 429) {
    return new Error('Clarity API daily request quota exceeded; maximum is 10 requests per project per day.');
  }
  return new Error(`Clarity API ${response.status}${body ? `: ${body}` : ''}`);
};

export const fetchClarityMetrics = async ({ dimensions = [], numOfDays = 1 }) => {
  if (!token) throw new Error('Missing CLARITY_API_TOKEN.');
  const url = new URL(API_URL);
  url.searchParams.set('numOfDays', String(numOfDays));
  dimensions.forEach((dimension, index) => {
    url.searchParams.set(`dimension${index + 1}`, dimension);
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw await apiError(response);
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error('Clarity API returned a non-array response.');
  for (const metric of payload) {
    if (typeof metric?.metricName !== 'string' || !Array.isArray(metric?.information)) {
      throw new Error('Clarity API returned an invalid metric payload.');
    }
  }
  return payload;
};

const readSnapshots = async () => {
  if (!existsSync(SNAPSHOT_DIR)) return [];
  const filenames = (await readdir(SNAPSHOT_DIR))
    .filter((filename) => /^clarity-\d{4}-\d{2}-\d{2}\.json$/.test(filename))
    .sort();
  const snapshots = [];
  for (const filename of filenames) {
    snapshots.push(JSON.parse(await readFile(join(SNAPSHOT_DIR, filename), 'utf8')));
  }
  return snapshots;
};

const saveReport = async (snapshots) => {
  const report = buildClarityReport(snapshots);
  const reportDate = report.periods.current.end || new Date().toISOString().slice(0, 10);
  const datedPath = join(REPORT_DIR, `clarity-weekly-${reportDate}.json`);
  const latestPath = join(REPORT_DIR, 'latest.json');
  await writeJsonAtomic(datedPath, report);
  await writeJsonAtomic(latestPath, report);
  return { report, datedPath, latestPath };
};

const collect = async () => {
  const collectedAt = new Date().toISOString();
  const snapshotDate = collectedAt.slice(0, 10);
  const queries = {};
  for (const definition of CLARITY_QUERY_DEFINITIONS) {
    queries[definition.key] = {
      dimensions: definition.dimensions,
      metrics: await fetchClarityMetrics({ dimensions: definition.dimensions }),
    };
  }

  const snapshot = {
    schemaVersion: 1,
    provider: 'microsoft-clarity',
    collectedAt,
    snapshotDate,
    window: { numOfDays: 1, hours: 24 },
    requestCount: CLARITY_QUERY_DEFINITIONS.length,
    queries,
  };
  const snapshotPath = join(SNAPSHOT_DIR, `clarity-${snapshotDate}.json`);
  await writeJsonAtomic(snapshotPath, snapshot);
  const snapshots = await readSnapshots();
  const saved = await saveReport(snapshots);
  console.log(JSON.stringify({
    outcome: 'collected',
    snapshotPath,
    latestPath: saved.latestPath,
    requestCount: snapshot.requestCount,
    comparisonReady: saved.report.comparisonReady,
    currentSnapshots: saved.report.periods.current.snapshots,
    priorSnapshots: saved.report.periods.prior.snapshots,
    readerSessions: saved.report.periods.current.readerSessions,
    botSessions: saved.report.periods.current.botSessions,
  }, null, 2));
};

const report = async () => {
  const snapshots = await readSnapshots();
  const saved = await saveReport(snapshots);
  console.log(JSON.stringify({
    outcome: 'reported',
    latestPath: saved.latestPath,
    comparisonReady: saved.report.comparisonReady,
    currentSnapshots: saved.report.periods.current.snapshots,
    priorSnapshots: saved.report.periods.prior.snapshots,
  }, null, 2));
};

const main = async () => {
  const command = process.argv[2] || 'collect';
  if (command === 'collect') return collect();
  if (command === 'report') return report();
  throw new Error(`Unknown Clarity command: ${command}`);
};

const scriptPath = fileURLToPath(import.meta.url);
if (resolve(process.argv[1] || '') === scriptPath) {
  main().catch((error) => {
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
}
