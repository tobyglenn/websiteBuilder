import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const collector = fileURLToPath(new URL('./gsc-weekly-report.mjs', import.meta.url));
const day = 86400000;
const date = value => new Date(value).toISOString().slice(0, 10);

export function validateReport(report, now = new Date()) {
  if (report?.site !== 'sc-domain:tobyonfitnesstech.com') throw new Error('Unexpected Search Console property');
  const generated = Date.parse(report.generatedAt);
  if (!Number.isFinite(generated) || now - generated > day || generated - now > 300000) {
    throw new Error('Search Console export is stale or has an invalid generation time');
  }
  const midnight = Date.parse(`${date(now)}T00:00:00Z`);
  for (const [name, offset] of [['current', 2], ['prior', 9]]) {
    const period = report.periods?.[name];
    if (period?.end !== date(midnight - offset * day) || period?.start !== date(midnight - (offset + 6) * day)) {
      throw new Error(`Unexpected ${name} final-data window`);
    }
    for (const key of ['clicks', 'impressions', 'ctr', 'position']) {
      if (typeof period[key] !== 'number' || !Number.isFinite(period[key]) || period[key] < 0) {
        throw new Error(`Invalid ${name} ${key}`);
      }
    }
  }
  if (!Array.isArray(report.sitemaps) || typeof report.dataQuality?.comparisonSafe !== 'boolean') {
    throw new Error('Search Console export lacks sitemap or comparison-quality metadata');
  }
  return report;
}

function atomicWrite(filename, content) {
  const temporary = join(dirname(filename), `.gsc-${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, content, { mode: 0o600, flag: 'wx' });
    renameSync(temporary, filename);
  } finally {
    rmSync(temporary, { force: true });
  }
}

export async function refreshReport({
  directory = process.env.GSC_REPORT_DIR || join(process.env.OPENCLAW_HOME || join(homedir(), '.openclaw'), 'logs/analytics/gsc'),
  now = () => new Date(),
  collect = async () => (await execute(process.execPath, [collector], { timeout: 180000, maxBuffer: 16 * 1024 * 1024 })).stdout,
} = {}) {
  // Validate a fresh response before touching last-known evidence; degraded is not missing.
  const report = validateReport(JSON.parse(await collect()), now());
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const content = `${JSON.stringify(report, null, 2)}\n`;
  const dated = join(directory, `gsc-weekly-${report.periods.current.end}.json`);
  const latest = join(directory, 'latest.json');
  atomicWrite(dated, content);
  atomicWrite(latest, content);
  return { latest, dated, generatedAt: report.generatedAt, period: report.periods.current, comparisonSafe: report.dataQuality.comparisonSafe };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  refreshReport().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error(`GSC_REFRESH_FAILED: ${error.message.split('\n')[0]}`);
    process.exitCode = 1;
  });
}
