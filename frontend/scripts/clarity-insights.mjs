import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildClarityReport,
  CLARITY_QUERY_DEFINITIONS,
} from './lib/clarity-insights.mjs';

const API_URL = process.env.CLARITY_API_URL
  || 'https://www.clarity.ms/export-data/api/v1/project-live-insights';
const REPORT_DIR = process.env.CLARITY_REPORT_DIR
  || join(homedir(), '.openclaw/logs/analytics/clarity');
const SNAPSHOT_DIR = join(REPORT_DIR, 'snapshots');
const token = process.env.CLARITY_API_TOKEN || '';
let httpRequestCount = 0;
const countRequest = () => {
  // Leave room within Clarity's ten-request daily allowance. Failed transports
  // count too; a recovery attempt must never create an unbounded request loop.
  if (httpRequestCount >= 9) throw new Error('Clarity collection request budget exhausted.');
  httpRequestCount += 1;
};

const writeJsonAtomic = async (filename, value) => {
  await mkdir(dirname(filename), { recursive: true });
  const temporary = `${filename}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, filename);
};

const apiError = ({ status, body }) => {
  if (status === 429) {
    return new Error('Clarity API daily request quota exceeded; maximum is 10 requests per project per day.');
  }
  return new Error(`Clarity API ${status}${body ? `: ${body}` : ''}`);
};

// Clarity can reject Node's HTTP client with an empty 400 while accepting the
// identical authenticated request from Python. Keep credentials on stdin, never
// in process arguments, and only try this transport for that specific response.
const PYTHON_REQUEST = `
import json, sys, urllib.request, urllib.error
request = json.load(sys.stdin)
req = urllib.request.Request(request['url'], headers=request['headers'])
try:
    response = urllib.request.urlopen(req, timeout=30)
except urllib.error.HTTPError as error:
    response = error
with response:
    print(json.dumps({'status': response.code, 'body': response.read().decode('utf-8')}))
`;

const pythonRequest = (url, headers) => new Promise((resolveRequest, reject) => {
  const child = execFile('python3', ['-c', PYTHON_REQUEST], {
    timeout: 35_000,
    maxBuffer: 16 * 1024 * 1024,
  }, (error, stdout) => {
    if (error) return reject(new Error('Clarity fallback transport failed.', { cause: error }));
    try {
      resolveRequest(JSON.parse(stdout));
    } catch (cause) {
      reject(new Error('Clarity fallback returned an invalid response.', { cause }));
    }
  });
  child.stdin.on('error', () => {}); // execFile reports startup/timeout failures.
  child.stdin.end(JSON.stringify({ url: String(url), headers }));
});

export const fetchClarityMetrics = async ({ dimensions = [], numOfDays = 1 }) => {
  if (!token) throw new Error('Missing CLARITY_API_TOKEN.');
  const url = new URL(API_URL);
  url.searchParams.set('numOfDays', String(numOfDays));
  dimensions.forEach((dimension, index) => {
    url.searchParams.set(`dimension${index + 1}`, dimension);
  });

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  let result;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      countRequest();
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
      result = { status: response.status, body: (await response.text()).trim() };
      if (result.status === 400 && !result.body) {
        countRequest();
        result = await pythonRequest(url, headers);
      }
    } catch (error) {
      if (attempt === 1) throw new Error('Clarity request failed after two attempts.', { cause: error });
      await new Promise((done) => setTimeout(done, 1_000));
      continue;
    }
    if ((result.status >= 500 || (result.status === 400 && !result.body)) && attempt === 0) {
      await new Promise((done) => setTimeout(done, 1_000));
      continue;
    }
    break;
  }
  if (result.status < 200 || result.status >= 300) throw apiError(result);
  const payload = JSON.parse(result.body);
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
    try {
      queries[definition.key] = {
        dimensions: definition.dimensions,
        metrics: await fetchClarityMetrics({ dimensions: definition.dimensions }),
      };
    } catch (cause) {
      throw new Error(`Clarity ${definition.key} collection failed: ${cause.message}`, { cause });
    }
  }

  const snapshot = {
    schemaVersion: 1,
    provider: 'microsoft-clarity',
    collectedAt,
    snapshotDate,
    window: { numOfDays: 1, hours: 24 },
    requestCount: httpRequestCount,
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
