import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('catalog preserves fresh inventory and metadata, quotes sources, and verifies transcripts', t => {
  const root = mkdtempSync(join(tmpdir(), 'video-catalog-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (name, data) => {
    mkdirSync(join(root, name, '..'), { recursive: true });
    writeFileSync(join(root, name), typeof data === 'string' ? data : JSON.stringify(data));
  };
  const video = { id: 'old', title: 'Training with the family', description: '', publishedAt: '2026-09-21T12:00:00Z' };
  write('scripts/channel_videos_base.json', { fetchedAt: '2026-09-21', channelStats: { subscriberCount: 370 }, videos: [video] });
  const stats = { subscriberCount: 374, videoCount: 2 };
  write('frontend/src/data/videos.json', { fetchedAt: '2026-09-28', channelStats: stats, videos: [video, { ...video, id: 'new', title: 'Newest video', description: '- This is a quoted point from the actual description.' }] });
  write('yt_videos_full.json', [{ id: 'old', title: 'Stale title', date: '2025-01-01' }]);
  write('transcript_index.json', [{ video_id: 'old', file: 'missing.txt', word_count: 30 }, { video_id: 'new', file: 'new.txt', word_count: 6 }]);
  write('frontend/src/data/transcripts/new.txt', 'A real transcript about the latest video.');
  const run = () => execFileSync(process.execPath, [resolve('scripts/generate_videos_data.mjs')], { env: { ...process.env, VIDEO_CATALOG_ROOT: root } });
  run();
  const first = readFileSync(join(root, 'frontend/src/data/videos.json'), 'utf8');
  const output = JSON.parse(first);
  assert.equal(output.videos.length, 2);
  assert.deepEqual(output.channelStats, stats);
  assert.equal(output.fetchedAt, '2026-09-28');
  const old = output.videos.find(v => v.id === 'old');
  assert.equal(old.title, video.title);
  assert.equal(old.publishedAt, video.publishedAt);
  assert.equal(old.has_transcript, false);
  assert.deepEqual(old.key_takeaways, []);
  assert.ok(!old.tags.includes('coding'), 'training must not match the substring ai');
  assert.deepEqual(output.videos.find(v => v.id === 'new').key_takeaways, ['This is a quoted point from the actual description.']);
  assert.equal(output.videosWithTranscripts, 1);
  run();
  assert.equal(readFileSync(join(root, 'frontend/src/data/videos.json'), 'utf8'), first);
});
