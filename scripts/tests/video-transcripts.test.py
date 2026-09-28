import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest

ROOT = Path(__file__).resolve().parents[2]
def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / f'{name}.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod
sync = module('sync_video_transcripts')
translate = module('translate_video_transcripts')
ID = 'abcdefghijk'
SRT = '1\n00:00:00,000 --> 00:00:02,000\nHello, Speediance 2S.\n\n2\n00:00:40,000 --> 00:00:44,000\nSecond paragraph.\n'

class TranscriptTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        data = self.root / 'frontend/src/data'
        data.mkdir(parents=True)
        (data / 'videos.json').write_text(json.dumps({'videos': [{'id': ID, 'title': 'Title', 'publishedAt': '2026-01-01T00:00:00Z'}]}))
        (self.root / 'transcript_index.json').write_text('[]')
        self.source = self.root / 'captions'
        self.source.mkdir()
        (self.source / 'video.mp4').write_bytes(b'actual media fixture')
        (self.source / 'captions.srt').write_text(SRT)
        self.manifest = self.source / 'video.mp4.youtube-publish.json'
        self.manifest.write_text(json.dumps({'video_id': ID, 'expected_channel_id': sync.CHANNEL_ID, 'duration_seconds': 45, 'asset': {'sha256': sync.file_hash(self.source / 'video.mp4')}}))
        self.args = SimpleNamespace(repo=self.root, source_root=[self.source], backlog_index=[], apply=True)
    def run_sync(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return sync.run(self.args)
    def test_repository_sources_match_their_hashes_and_plain_text(self):
        for path in (ROOT / 'frontend/src/data/video-transcripts').glob('*.json'):
            record = json.loads(path.read_text())
            self.assertEqual(record['source_hash'], sync.source_hash(record['video_id'], record['segments']), path.name)
            text = '\n\n'.join(segment['text'] for segment in record['segments']) + '\n'
            self.assertEqual((ROOT / 'frontend/src/data/transcripts' / f"{record['video_id']}.txt").read_text(), text)

    def test_identity_timing_idempotence_and_index_consistency(self):
        report = self.run_sync()
        self.assertEqual(report['changed'], [ID])
        record = json.loads((self.root / f'frontend/src/data/video-transcripts/{ID}.json').read_text())
        self.assertEqual([s['start'] for s in record['segments']], [0, 40])
        self.assertEqual(record['source_hash'], sync.source_hash(ID, record['segments']))
        self.assertEqual((self.root / 'transcript_index.json').read_bytes(), (self.root / 'frontend/src/data/transcript_index.json').read_bytes())
        self.assertEqual(self.run_sync()['changed'], [])
        # Even after a successful import, changed media must be rejected.
        (self.source / 'video.mp4').write_bytes(b'wrong replacement')
        self.assertTrue(self.run_sync()['failures'])
    def test_wrong_channel_missing_captions_and_bad_hash(self):
        original = self.manifest.read_text()
        for mutate in [lambda d: d.update(expected_channel_id='wrong'), lambda d: d.update(asset={'sha256': 'wrong'})]:
            data = json.loads(original); mutate(data); self.manifest.write_text(json.dumps(data))
            self.assertTrue(self.run_sync()['failures'])
            self.assertEqual((self.root / 'transcript_index.json').read_text(), '[]')
        self.manifest.write_text(original)
        (self.source / 'captions.srt').unlink()
        self.assertTrue(self.run_sync()['failures'])
    def test_source_priority_and_future_exclusion(self):
        other = self.root / 'archive'; other.mkdir()
        (other / self.manifest.name).write_text(self.manifest.read_text())
        (other / 'video.mp4').write_bytes(b'old wrong bytes')
        (other / 'captions.srt').write_text(SRT)
        self.args.source_root.append(other)
        self.assertFalse(self.run_sync()['failures'])
        data_path = self.root / 'frontend/src/data/videos.json'
        data = json.loads(data_path.read_text()); data['videos'][0]['publishedAt'] = '2099-01-01T00:00:00Z'; data_path.write_text(json.dumps(data))
        self.assertEqual(self.run_sync()['selected'], 0)
    def test_invalid_timing_and_missing_source(self):
        for raw in ['not a caption', SRT.replace('00:00:02,000', '00:00:00,000'), SRT.replace('00:00:40,000', '00:80:40,000')]:
            with self.assertRaises(ValueError): sync.parse_srt(raw)
        self.args.source_root = [self.root / 'missing']
        with self.assertRaises(FileNotFoundError): self.run_sync()
    def test_translation_json_wrappers_and_partial_responses(self):
        for text in ['{"segments": []}', '```json\n{"segments": []}\n```']:
            self.assertEqual(translate.decode_response(text), {'segments': []})
        for text in ['{"segments": [', 'Here is a partial result: {"segments": []}', '```json\n{"segments": []}']:
            with self.assertRaises(ValueError): translate.decode_response(text)

    def test_translation_rejects_incomplete_reordered_and_changed_tokens(self):
        sources = [{'id': 0, 'text': 'Speediance costs 200 dollars.'}, {'id': 1, 'text': 'Second line.'}]
        protected = [translate.protect(s['text']) for s in sources]
        rows = [{'id': 0, 'text': '__TOFT_KEEP_0__ kostet __TOFT_KEEP_1__ Dollar.'}, {'id': 1, 'text': 'Zweite Zeile.'}]
        valid = translate.validate_chunk({'segments': rows}, sources, [p[1] for p in protected])
        self.assertEqual(valid[0]['text'], 'Speediance kostet 200 Dollar.')
        for bad in [rows[:1], rows[::-1], [dict(rows[0], text='Es kostet 300 Dollar.'), rows[1]]]:
            with self.assertRaises(ValueError): translate.validate_chunk({'segments': bad}, sources, [p[1] for p in protected])

if __name__ == '__main__': unittest.main()
