import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MANIFEST = 'deploy-asset-retention.json';
const DAY = 86400000;
// Only immutable public bundles, never HTML, source maps, or arbitrary old files.
const allowed = (path) => /^_astro\/[A-Za-z0-9_./-]+\.[A-Za-z0-9_-]{6,}\.(?:js|mjs|css|woff2?)$/.test(path)
  && !path.split('/').includes('..');

export function retainDeployAssets({ repo = process.cwd(), dist = 'dist', ref = 'origin/gh-pages', days = 30, now = new Date() } = {}) {
  const git = (...args) => execFileSync('git', args, { cwd: repo, maxBuffer: 32 * 1024 * 1024 });
  const output = resolve(repo, dist);
  const active = [];
  const visit = (folder, prefix) => {
    if (!existsSync(folder)) return;
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) visit(join(folder, entry.name), path);
      else if (entry.isFile() && allowed(path)) active.push(path);
    }
  };
  visit(join(output, '_astro'), '_astro');
  if (!active.length) throw new Error('No current hashed assets found; refusing an empty deployment.');
  const current = new Set(active);
  const cutoff = now.getTime() - days * DAY;
  const files = (commit) => git('ls-tree', '-r', '--name-only', commit, '--', '_astro').toString().trim().split('\n').filter(allowed);
  const previousFiles = new Set(files(ref));
  const rootFiles = git('ls-tree', '--name-only', ref).toString().split('\n');
  const candidates = new Map();
  const add = (path, lastUsedAt, commit) => {
    if (allowed(path) && !current.has(path) && !candidates.has(path) && Date.parse(lastUsedAt) >= cutoff) {
      candidates.set(path, { lastUsedAt, commit });
    }
  };

  if (rootFiles.includes(MANIFEST)) {
    const previous = JSON.parse(git('show', `${ref}:${MANIFEST}`).toString());
    if (previous.version !== 1 || !Array.isArray(previous.active) || !Array.isArray(previous.retained)) {
      throw new Error('Invalid asset retention manifest.');
    }
    for (const path of previous.active) if (previousFiles.has(path)) add(path, previous.builtAt, ref);
    for (const asset of previous.retained) if (previousFiles.has(asset.path)) add(asset.path, asset.lastUsedAt, ref);
  } else {
    // First rollout also repairs assets already deleted by earlier deployments.
    const history = git('log', '--first-parent', `--since=${new Date(cutoff).toISOString()}`, '--format=%H %cI', ref).toString().trim();
    for (const line of history.split('\n').filter(Boolean)) {
      const [commit, date] = line.split(' ');
      for (const path of files(commit)) add(path, date, commit);
    }
  }
  const retained = [];
  for (const [path, { lastUsedAt, commit }] of candidates) {
    const target = join(output, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, git('show', `${commit}:${path}`));
    retained.push({ path, lastUsedAt });
  }
  const manifest = { version: 1, builtAt: now.toISOString(), retentionDays: days, active: active.sort(), retained: retained.sort((a, b) => a.path.localeCompare(b.path)) };
  writeFileSync(join(output, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  return { active: active.length, retained: retained.length, retentionDays: days };
}

// Direct Pages deployments retain browser bundles from the currently live site,
// so generated output no longer needs a second Git branch.
export async function retainLiveDeployAssets({ dist = 'dist', site = 'https://tobyonfitnesstech.com', days = 30, now = new Date(), fetchAsset = fetch, retryDelayMs = 1000 } = {}) {
  const output = resolve(dist);
  const active = [];
  const visit = (folder, prefix) => {
    if (!existsSync(folder)) return;
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) visit(join(folder, entry.name), path);
      else if (entry.isFile() && allowed(path)) active.push(path);
    }
  };
  visit(join(output, '_astro'), '_astro');
  if (!active.length) throw Error('No current hashed assets found; refusing an empty deployment.');
  const get = async (path) => {
    let failure;
    for (let attempt = 0; attempt < 4; attempt++) {
      let response;
      try {
        response = await fetchAsset(new URL(path, `${site.replace(/\/$/, '')}/`), { signal: AbortSignal.timeout(30000) });
      } catch (error) {
        failure = new Error(`Cannot retain live asset ${path}: ${error.message}`);
      }
      if (response?.ok) return response;
      if (response) {
        failure = new Error(`Cannot retain live asset ${path}: HTTP ${response.status}`);
        await response.body?.cancel();
        if (![429, 500, 502, 503, 504].includes(response.status)) throw failure;
      }
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, retryDelayMs * 2 ** attempt));
    }
    throw failure;
  };
  const previous = await (await get(MANIFEST)).json();
  if (previous.version !== 1 || !Array.isArray(previous.active) || !Array.isArray(previous.retained) || !Number.isFinite(Date.parse(previous.builtAt))) throw Error('Invalid asset retention manifest.');
  const cutoff = now.getTime() - days * DAY;
  const current = new Set(active);
  const candidates = new Map();
  const add = (path, date) => {
    if (typeof path === 'string' && allowed(path) && !current.has(path) && Date.parse(date) >= cutoff && Date.parse(date) <= now.getTime()) {
      if (!candidates.has(path) || Date.parse(date) > Date.parse(candidates.get(path))) candidates.set(path, date);
    }
  };
  for (const path of previous.active) add(path, previous.builtAt);
  for (const asset of previous.retained) add(asset.path, asset.lastUsedAt);
  const queue = [...candidates];
  const retained = [];
  await Promise.all(Array.from({ length: Math.min(4, queue.length) }, async () => {
    while (queue.length) {
      const [path, lastUsedAt] = queue.shift();
      const response = await get(path);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 10 * 1024 * 1024 || /^\s*(?:<!doctype html|<html)/i.test(bytes.subarray(0, 100).toString())) throw Error(`Invalid live asset: ${path}`);
      const target = join(output, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes);
      retained.push({ path, lastUsedAt });
    }
  }));
  const manifest = { version: 1, builtAt: now.toISOString(), retentionDays: days, active: active.sort(), retained: retained.sort((a, b) => a.path.localeCompare(b.path)) };
  writeFileSync(join(output, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  return { active: active.length, retained: retained.length, retentionDays: days };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(process.argv.includes('--live')
    ? await retainLiveDeployAssets({ dist: process.argv[2] || 'dist' })
    : retainDeployAssets({ dist: process.argv[2] || 'dist' })));
}
