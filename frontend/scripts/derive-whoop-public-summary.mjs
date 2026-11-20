import { execFileSync } from 'node:child_process';
import { constants } from 'node:fs';
import { lstat, open, realpath, rename, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { projectWhoopPublicSummary, validateWhoopPublicSummary } from '../src/lib/whoopPublicSummary.mjs';

const args = process.argv.slice(2);
const MAX_INPUT = 64 * 1024 * 1024;
const MAX_OUTPUT = 16 * 1024;

async function isInsideGit(target) {
  let here = dirname(target);
  while (true) {
    try {
      const marker = join(here, '.git');
      const meta = await lstat(marker);
      if (!meta.isDirectory()) return true; // A linked worktree uses a regular .git file.
      if ((await lstat(join(marker, 'HEAD'))).isFile()) return true;
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    const up = dirname(here);
    if (up === here) return false;
    here = up;
  }
}

// The deployed DGX source lives in an independent local data-lake repository.
// Allow only its exact, non-symlinked, untracked source and require no Git remote.
function isLocalDataLake(source, canonicalSource) {
  const expected = resolve(homedir(), 'clawd/data/whoop_v2_latest.json');
  if (source !== expected || canonicalSource !== expected) return false;
  const directory = dirname(expected);
  const git = (...args) => execFileSync('git', ['--no-optional-locks', '-C', directory, ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  return git('rev-parse', '--show-toplevel') === directory &&
    git('remote') === '' && git('ls-files', '--stage', '--', basename(expected)) === '';
}

async function atomicWrite(path, contents) {
  const sibling = join(dirname(path), `.whoop-projection-${randomUUID()}.tmp`);
  try {
    await writeFile(sibling, contents, { flag: 'wx', mode: 0o600 });
    await rename(sibling, path);
  } finally {
    await unlink(sibling).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}

async function readBounded(path, limit) {
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const meta = await file.stat();
    if (!meta.isFile() || meta.size > limit) throw new Error();
    const buf = Buffer.alloc(meta.size + 1);
    let length = 0;
    while (length < buf.length) {
      const { bytesRead } = await file.read(buf, length, buf.length - length);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length !== meta.size) throw new Error();
    return { json: JSON.parse(buf.toString('utf8', 0, length)), meta };
  } finally {
    await file.close();
  }
}

try {
  if (args.length === 2 && args[0] === '--check') {
    validateWhoopPublicSummary((await readBounded(resolve(args[1]), MAX_OUTPUT)).json);
  } else if (args.length === 4 && args[0] === '--input' && args[2] === '--output' && isAbsolute(args[1])) {
    const source = resolve(args[1]);
    const canonicalSource = await realpath(source);
    if ((await isInsideGit(source) || await isInsideGit(canonicalSource)) &&
        !isLocalDataLake(source, canonicalSource)) throw new Error();

    const out = resolve(args[3]);
    const canonicalOut = join(await realpath(dirname(out)), basename(out));
    if (canonicalOut === canonicalSource) throw new Error();
    const { json, meta } = await readBounded(canonicalSource, MAX_INPUT);
    try {
      const before = await lstat(canonicalOut);
      if (!before.isFile() || (before.ino === meta.ino && before.dev === meta.dev)) throw new Error();
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const summary = projectWhoopPublicSummary(json);
    if (!summary.metrics.available) throw new Error(); // Never overwrite a known-good snapshot with an empty export.
    const output = JSON.stringify(summary, null, 2) + '\n';
    if (Buffer.byteLength(output) > MAX_OUTPUT) throw new Error();
    await atomicWrite(canonicalOut, output);
  } else {
    throw new Error();
  }
} catch {
  // JSON syntax errors can quote source records. Never print exception details, inputs or output.
  console.error('WHOOP public summary validation/projection failed.');
  process.exitCode = 1;
}
