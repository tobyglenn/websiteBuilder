import assert from 'node:assert/strict';
import test from 'node:test';
import { podcastItemIdentity } from '../../src/lib/openclawFeed.ts';
import { readFileSync } from 'node:fs';
const bonus = '<item><title>Agent Stack Shorts: Muse in Chrome</title><guid>agent-stack-shorts-2026-11-14-v2</guid><itunes:episodeType>bonus</itunes:episodeType></item>';
test('unnumbered bonus has stable separate slug and no episode number', () => {
 assert.deepEqual(podcastItemIdentity(bonus), { slug: 'agent-stack-shorts-2026-11-14-v2', number: null, isBonus: true });
});
test('numbered episodes including zero retain their routes', () => {
 for (const n of [0, 127, 128]) assert.equal(podcastItemIdentity(`<item><itunes:episode>${n}</itunes:episode></item>`).slug, `episode-${n}`);
});
test('bonus title digits cannot steal a numbered route', () => {
 assert.equal(podcastItemIdentity(bonus.replace('Muse in Chrome','Poppy 1.0')).number, null);
 assert.equal(podcastItemIdentity('<item><guid>openclaw-special-exo-cluster</guid><itunes:episodeType>bonus</itunes:episodeType></item>').slug, 'episode-0');
});
test('published bonus has rich notes, source links and original transcript', () => {
 const record=JSON.parse(readFileSync(new URL('../../src/data/podcast-bonus/agent-stack-shorts-2026-11-14-v2.json',import.meta.url)));
 assert.match(record.showNotes,/## Muse in Chrome/); assert.match(record.showNotes,/https:\/\/sierra.ai/); assert.ok(record.transcript.length>3000);
});
