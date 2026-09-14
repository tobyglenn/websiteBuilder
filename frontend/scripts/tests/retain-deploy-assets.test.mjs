import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { retainDeployAssets } from '../retain-deploy-assets.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'asset-retention-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = join(root, 'repo');
  const dist = join(root, 'dist');
  mkdirSync(repo); mkdirSync(join(dist, '_astro'), { recursive: true });
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  git('init'); git('config', 'user.email', 'test@example.com'); git('config', 'user.name', 'Test');
  const write = (path, value) => { mkdirSync(join(repo, path, '..'), { recursive: true }); writeFileSync(join(repo, path), value); };
  const commit = (date) => {
    git('add', '.');
    execFileSync('git', ['commit', '-m', 'deploy'], { cwd: repo, stdio: 'pipe', env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } });
  };
  writeFileSync(join(dist, '_astro/Current.abcdefgh.js'), 'current');
  return { repo, dist, git, write, commit };
}

test('bootstrap restores deleted hashed bundles without restoring pages, maps, or overwriting current assets', (t) => {
  const f = fixture(t);
  f.write('_astro/Header.12345678.js', 'old header');
  f.write('_astro/Layout.12345678.css', 'old styles');
  f.write('_astro/Header.12345678.js.map', 'private map');
  f.write('_astro/Current.abcdefgh.js', 'stale current');
  f.write('retired/index.html', 'retired page');
  f.commit('2026-09-01T12:00:00Z');
  f.git('rm', '-r', '_astro', 'retired'); f.write('index.html', 'new page'); f.commit('2026-09-10T12:00:00Z');
  const result = retainDeployAssets({ ...f, ref: 'HEAD', now: new Date('2026-09-14T12:00:00Z') });
  assert.equal(result.retained, 2);
  assert.equal(readFileSync(join(f.dist, '_astro/Header.12345678.js'), 'utf8'), 'old header');
  assert.equal(readFileSync(join(f.dist, '_astro/Current.abcdefgh.js'), 'utf8'), 'current');
  assert.equal(existsSync(join(f.dist, 'retired/index.html')), false);
  assert.equal(existsSync(join(f.dist, '_astro/Header.12345678.js.map')), false);
});

test('manifest carries original usage dates and expires old assets without reviving them from history', (t) => {
  const f = fixture(t);
  f.write('_astro/Header.12345678.js', 'old header'); f.commit('2026-09-01T12:00:00Z');
  retainDeployAssets({ ...f, ref: 'HEAD', now: new Date('2026-09-14T12:00:00Z') });
  cpSync(f.dist, f.repo, { recursive: true }); f.commit('2026-09-14T12:00:00Z');
  rmSync(join(f.dist, '_astro/Header.12345678.js'));
  retainDeployAssets({ ...f, ref: 'HEAD', now: new Date('2026-09-20T12:00:00Z') });
  const manifest = JSON.parse(readFileSync(join(f.dist, 'deploy-asset-retention.json')));
  assert.equal(Date.parse(manifest.retained[0].lastUsedAt), Date.parse('2026-09-01T12:00:00Z'));
  rmSync(join(f.dist, '_astro/Header.12345678.js'));
  const expired = retainDeployAssets({ ...f, ref: 'HEAD', now: new Date('2026-10-02T12:00:00Z') });
  assert.equal(expired.retained, 0);
  assert.equal(existsSync(join(f.dist, '_astro/Header.12345678.js')), false);
});

test('rejects an empty current build and a corrupt previous manifest', (t) => {
  const f = fixture(t);
  f.write('deploy-asset-retention.json', '{"version":99}'); f.commit('2026-09-01T12:00:00Z');
  assert.throws(() => retainDeployAssets({ ...f, ref: 'HEAD' }), /Invalid asset retention/);
  rmSync(join(f.dist, '_astro'), { recursive: true });
  assert.throws(() => retainDeployAssets({ ...f, ref: 'HEAD' }), /No current hashed assets/);
});
