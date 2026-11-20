import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyWhoopPublicSummary, validateWhoopPublicSummary } from '../src/lib/whoopPublicSummary.mjs';

const summaryPath = 'frontend/src/data/whoop-public-summary.json';
const homepagePath = 'frontend/src/data/homepageFitnessData.json';
const metricsPath = 'frontend/src/data/siteMetrics.json';
const generatedPaths = [homepagePath, metricsPath];
const own = (value, key) => value != null && Object.hasOwn(value, key);
const forbiddenPath = /(?:^|\/)whoop(?:[-_]v\d+)?[-_](?:latest|raw|export|records|samples)(?:[-_][^/]*)?(?:\.[^/]+)?$/i;
const artifactText = /\.(?:json|js|mjs|cjs|html|xml|txt|csv|jsonl|map)$/i;
// No values are retained or reported. Matches require the raw export's envelope,
// not an individual mention of "records" or the name of a WHOOP metric.
const rawEnvelopeKeys = ['last_synced', 'records', 'recovery', 'sleep', 'workouts', 'cycle'];
const property = key => new RegExp(`(?:[\x22']|&quot;)?\\b${key}\\b(?:[\x22']|&quot;)?\\s*:`);
const envelopeProperties = rawEnvelopeKeys.map(property);
const privatePathOrSyncProperty = ['whoopDataPath', 'whoopLastSynced'].map(property);
const fault = message => { throw new Error(message); };

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 32 * 1024 * 1024 });
}

function assertSafeNames(paths) {
  if (paths.some(entry => forbiddenPath.test(entry))) fault('Raw WHOOP filename is present.');
}

function assertSummary(text) {
  try { validateWhoopPublicSummary(JSON.parse(text)); }
  catch { fault('WHOOP public summary failed the allowlist schema.'); }
}

function assertGeneratedPrivacy(file, text) {
  let data;
  try { data = JSON.parse(text); }
  catch { fault('Generated fitness JSON cannot be verified for the WHOOP boundary.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    fault('Generated fitness JSON cannot be verified for the WHOOP boundary.');
  }
  if (file === homepagePath && (own(data.source, 'whoopDataPath') || own(data.source, 'whoopLastSynced') || own(data, 'recovery'))) {
    fault('Legacy WHOOP private fields are present in the homepage summary.');
  }
  if (file === metricsPath) {
    if ([data.sourceDates?.whoop, data.whoop?.lastSynced]
      .some(date => date != null && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)))) {
      fault('Legacy WHOOP sync timestamp is present in the site metrics.');
    }
    if (own(data, 'whoop')) {
      try {
        validateWhoopPublicSummary({ ...emptyWhoopPublicSummary(), metrics: data.whoop });
        if (data.sourceDates?.whoop !== data.whoop.lastSynced) throw new Error();
      } catch { fault('Generated WHOOP metrics failed the allowlist schema.'); }
    }
  }
}

export function checkSource(root, commit = null) {
  if (commit) {
    if (!/^(?:HEAD|[a-f0-9]{7,64})$/.test(commit)) fault('Invalid commit selector.');
    const paths = git(root, 'ls-tree', '-r', '--name-only', '-z', commit).split('\0');
    assertSafeNames(paths);
    if (!/^100(?:644|755) blob [a-f0-9]+\t/.test(git(root, 'ls-tree', commit, '--', summaryPath))) {
      fault('WHOOP public summary commit entry is not a regular file.');
    }
    assertSummary(git(root, 'show', commit + ':' + summaryPath));
    for (const file of generatedPaths.filter(file => paths.includes(file))) {
      if (!/^100(?:644|755) blob [a-f0-9]+\t/.test(git(root, 'ls-tree', commit, '--', file))) {
        fault('Generated fitness JSON is not a regular file.');
      }
      assertGeneratedPrivacy(file, git(root, 'show', commit + ':' + file));
    }
    return;
  }
  const indexed = git(root, 'ls-files', '--cached', '-z').split('\0');
  assertSafeNames(indexed);
  assertSafeNames(git(root, 'ls-files', '--others', '--exclude-standard', '-z').split('\0'));
  // Ignore rules cannot exempt a raw export written at its former source path.
  const rawLocation = path.join(root, 'frontend/src/data');
  assertSafeNames(readdirSync(rawLocation));
  const summary = path.join(root, summaryPath);
  if (!lstatSync(summary).isFile()) fault('WHOOP public summary is not a regular file.');
  assertSummary(readFileSync(summary, 'utf8'));
  if (indexed.includes(summaryPath)) {
    const entry = git(root, 'ls-files', '--stage', '--', summaryPath);
    if (!/^100(?:644|755) [a-f0-9]+ 0\t/.test(entry) || entry.trimEnd().includes('\n')) {
      fault('WHOOP public summary index entry is not a regular file.');
    }
    assertSummary(git(root, 'show', ':' + summaryPath));
  }
  for (const file of generatedPaths) {
    const dest = path.join(root, file);
    const stats = lstatSync(dest, { throwIfNoEntry: false });
    if (stats) {
      if (!stats.isFile()) fault('Generated fitness JSON is not a regular file.');
      assertGeneratedPrivacy(file, readFileSync(dest, 'utf8'));
    }
    if (indexed.includes(file)) {
      const entry = git(root, 'ls-files', '--stage', '--', file);
      if (!/^100(?:644|755) [a-f0-9]+ 0\t/.test(entry) || entry.trimEnd().includes('\n')) {
        fault('Generated fitness JSON is not a regular file.');
      }
      assertGeneratedPrivacy(file, git(root, 'show', ':' + file));
    }
  }
}

async function checkArtifactText(file) {
  const seen = new Set();
  let tail = '';
  for await (const chunk of createReadStream(file, { encoding: 'utf8' })) {
    const text = tail + chunk;
    if (privatePathOrSyncProperty.some(pattern => pattern.test(text))) {
      fault('Legacy WHOOP private fields are present in the Pages artifact.');
    }
    for (const pattern of envelopeProperties) {
      if (pattern.test(text)) seen.add(pattern);
    }
    if (seen.size === envelopeProperties.length) {
      fault('Raw WHOOP export schema detected in the Pages artifact.');
    }
    tail = text.slice(-256);
  }
}

export async function checkArtifact(directory) {
  if (!existsSync(directory) || !lstatSync(directory).isDirectory()) fault('Pages artifact directory is unavailable.');
  const stack = [directory];
  while (stack.length) {
    const dir = stack.pop();
    const entries = readdirSync(dir, { withFileTypes: true });
    assertSafeNames(entries.map(entry => entry.name));
    for (const entry of entries) {
      const item = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) fault('Unexpected symlink in the Pages artifact.');
      if (entry.isDirectory()) stack.push(item);
      else if (entry.isFile() && artifactText.test(entry.name)) await checkArtifactText(item);
    }
  }
}

async function main(args) {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  if (args.length === 0) checkSource(root);
  else if (args.length === 2 && args[0] === '--commit') checkSource(root, args[1]);
  else if (args.length === 2 && args[0] === '--artifact') await checkArtifact(path.resolve(args[1]));
  else fault('Invalid WHOOP boundary check arguments.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await main(process.argv.slice(2)); }
  catch (error) {
    // Report only fixed messages from this script, never parser/git/fs errors.
    const accepted = new Set([
      'Raw WHOOP filename is present.',
      'WHOOP public summary failed the allowlist schema.',
      'Invalid commit selector.',
      'WHOOP public summary is not a regular file.',
      'WHOOP public summary index entry is not a regular file.',
      'WHOOP public summary commit entry is not a regular file.',
      'Generated fitness JSON cannot be verified for the WHOOP boundary.',
      'Generated fitness JSON is not a regular file.',
      'Generated WHOOP metrics failed the allowlist schema.',
      'Legacy WHOOP private fields are present in the homepage summary.',
      'Legacy WHOOP sync timestamp is present in the site metrics.',
      'Pages artifact directory is unavailable.',
      'Unexpected symlink in the Pages artifact.',
      'Raw WHOOP export schema detected in the Pages artifact.',
      'Legacy WHOOP private fields are present in the Pages artifact.',
      'Invalid WHOOP boundary check arguments.',
    ]);
    console.error(accepted.has(error.message) ? error.message : 'WHOOP public boundary verification failed.');
    process.exitCode = 1;
  }
}
