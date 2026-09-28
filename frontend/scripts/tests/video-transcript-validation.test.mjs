import test from 'node:test';
import assert from 'node:assert/strict';
import { isCurrentTranslation } from '../../src/lib/videoTranscriptValidation.mjs';
const source = { video_id: 'id', source_hash: 'hash', segments: [{ start: 0, end: 4, text: 'Source' }] };
const translation = { schema_version: 1, video_id: 'id', source_hash: 'hash', source_title: 'Title', title: 'Titel', translation_type: 'machine', segments: [{ start: 0, end: 4, text: 'Quelle' }] };
test('only complete translations of the current source with unchanged timestamps become routes', () => {
  assert.ok(isCurrentTranslation(source, translation, 'Title'));
  for (const change of [{ source_hash: 'stale' }, { source_title: 'Old title' }, { segments: [] }, { segments: [{ start: 1, end: 4, text: 'Quelle' }] }, { segments: [{ start: 0, end: 4, text: '__TOFT_KEEP_0__' }] }]) {
    assert.equal(isCurrentTranslation(source, { ...translation, ...change }, 'Title'), false);
  }
});
