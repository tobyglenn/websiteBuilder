"""Public-caption intake regression tests. All media/network/recognition fixtures are local."""
import copy
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('capture', ROOT / 'scripts/dgx/blog_capture.py')
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
VIDEO = 'abcdefghijk'


class Capture(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.media = self.root / 'final.mp4'
        self.media.write_bytes(b'verified uploaded final master')
        self.receipt = self.root / 'youtube/main_receipt.json'
        self.receipt.parent.mkdir()
        self.data = {'video_id': VIDEO, 'expected_channel_id': c.CHANNEL,
                     'content_kind': 'long_form', 'duration_seconds': 200,
                     'asset': {'path': str(self.media), 'sha256': c.file_hash(self.media)}}
        self.save_receipt()
        self.rows = [{'start': i, 'end': i + 19, 'text': 'Actual recorded words about family and a useful reader question.'}
                     for i in range(0, 200, 20)]
        self.captions = self.root / 'captions.json'
        self.save_captions()
        self.metadata = {'video_id': VIDEO, 'channel_id': c.CHANNEL, 'title': 'Public recording',
                         'url': 'https://www.youtube.com/watch?v=' + VIDEO,
                         'duration_seconds': 200, 'description': 'Corrected public example: fourteen years.',
                         'visibility': 'public', 'published_at': '2026-10-29T00:00:00+00:00',
                         'verified_at': c.stamp()}

    def save_receipt(self):
        self.receipt.write_text(json.dumps(self.data))

    def save_captions(self):
        self.captions.write_text(json.dumps({'language': 'en', 'segments': self.rows,
                                            'source_asset_sha256': c.file_hash(self.media)}))

    def verify(self, video_id):
        self.assertEqual(video_id, VIDEO)
        return self.metadata

    def run_capture(self):
        return c.capture(self.receipt, self.captions, verify=self.verify)

    def test_real_receipt_layout_and_full_source_with_corrections(self):
        record = self.run_capture()
        self.assertTrue(record['complete'])
        self.assertEqual(record['text_sha256'], c.sha(record['text'].encode()))
        docs = c.documents(record)
        self.assertEqual(docs[0]['segments'], self.rows)
        self.assertIn('fourteen years', docs[1]['text'])
        self.assertNotIn(str(self.root), json.dumps(docs))

    def test_wrong_channel_and_shorts_rejected_before_source_read(self):
        for key, value in [('expected_channel_id', 'Lilly'), ('content_kind', 'short')]:
            d = copy.deepcopy(self.data)
            d[key] = value
            self.receipt.write_text(json.dumps(d))
            with patch.object(c, 'file_hash') as hashed:
                with self.assertRaises(ValueError):
                    self.run_capture()
                hashed.assert_not_called()

    def test_media_change_and_caption_binding_are_held(self):
        self.media.write_bytes(b'different replacement')
        with self.assertRaisesRegex(ValueError, 'media differs'):
            self.run_capture()
        self.data['asset']['sha256'] = c.file_hash(self.media)
        self.save_receipt()
        with self.assertRaisesRegex(ValueError, 'bound'):
            self.run_capture()

    def test_clip_truncation_gaps_nan_and_sparse_sources_held(self):
        cases = [self.rows[2:], self.rows[:-3], [self.rows[0], self.rows[-1]],
                 [{**self.rows[0], 'start': float('nan')}] + self.rows[1:],
                 [{**x, 'text': 'yes'} for x in self.rows]]
        for rows in cases:
            with self.subTest(rows=rows):
                with self.assertRaises(ValueError):
                    c.normalized_segments(rows, 200)

    def test_srt_and_vtt_preserve_actual_cues(self):
        cues = '\n\n'.join(f'{i+1}\n00:{int(x["start"]//60):02}:{int(x["start"]%60):02},000 --> '
                            f'00:{int(x["end"]//60):02}:{int(x["end"]%60):02},000\n{x["text"]}'
                            for i, x in enumerate(self.rows))
        for ext, prefix in [('.srt', ''), ('.vtt', 'WEBVTT\n\n')]:
            p = self.root / ('captions' + ext)
            p.write_text(prefix + cues)
            self.assertEqual(c.read_captions(p, 200), self.rows)

    def test_failed_source_does_not_discard_another_or_overwrite_capture(self):
        config = self.root / 'config.json'
        config.write_text(json.dumps({'schema': 'toft-caption-intake-v1',
                                     'source_roots': [str(self.root / 'missing')],
                                     'packages': [{'receipt': str(self.receipt), 'captions': str(self.captions)}]}))
        state = self.root / 'state'
        report = c.collect(ROOT, state, config, verify=self.verify)
        self.assertEqual(report['captured'], [VIDEO])
        self.assertEqual(len(report['errors']), 1)
        saved = (state / 'captures' / (VIDEO + '.json')).read_bytes()
        self.captions.write_text('broken')
        report = c.collect(ROOT, state, config, verify=self.verify)
        self.assertEqual(report['captured'], [])
        self.assertEqual((state / 'captures' / (VIDEO + '.json')).read_bytes(), saved)
        self.assertEqual(report['documents'], [])

    def test_no_configuration_never_calls_network(self):
        with patch.object(c, 'public_video') as net:
            self.assertFalse(c.collect(ROOT, self.root / 'empty-state')['configured'])
            net.assert_not_called()

    def test_public_visibility_and_identity_are_verified_without_catalog(self):
        good = {'playabilityStatus': {'status': 'OK'}, 'videoDetails': {
            'videoId': VIDEO, 'channelId': c.CHANNEL, 'isPrivate': False, 'isLiveContent': False,
            'lengthSeconds': '200', 'title': 'Public recording'},
            'microformat': {'playerMicroformatRenderer': {
                'isUnlisted': False, 'publishDate': '2026-10-29T00:00:00+00:00'}}}
        cases = [None, ('isUnlisted', True), ('isUnlisted', None)]
        for change in cases:
            player = copy.deepcopy(good)
            if change:
                player['microformat']['playerMicroformatRenderer'][change[0]] = change[1]
            raw = ('var ytInitialPlayerResponse = ' + json.dumps(player) + ';').encode()
            with patch.object(c, 'urlopen', return_value=io.BytesIO(raw)):
                if change:
                    with self.assertRaises(ValueError):
                        c.public_video(VIDEO)
                else:
                    self.assertEqual(c.public_video(VIDEO)['channel_id'], c.CHANNEL)

    def test_recognizer_reuses_only_hash_bound_exports(self):
        model = self.root / 'cached-model'
        model.mkdir()
        (model / 'weights.safetensors').write_bytes(b'fixture')
        settings = {'python': str(self.media), 'model': str(model)}
        self.assertEqual(c.transcribe_final(self.media, self.data['asset']['sha256'], self.captions, settings), self.captions)
        with self.assertRaisesRegex(ValueError, 'different media'):
            c.transcribe_final(self.media, '0' * 64, self.captions, settings)

    def test_offline_intake_preserves_full_source_corrections_and_verification_date(self):
        spec = importlib.util.spec_from_file_location('release', ROOT / 'scripts/dgx/blog_release.py')
        release = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(release)
        state = self.root / 'state'
        record = self.run_capture()
        c.write_json(state / 'captures' / (VIDEO + '.json'), record)
        (state / 'captures/broken.json').write_text('{broken')
        base = self.root / 'scripts/dgx'
        base.mkdir(parents=True)
        (base / 'blog-source-plan.json').write_text('{"documents":[],"topics":[]}')
        (base / 'source-library.json').write_text('{"documents":{}}')
        (self.root / 'frontend/src/data').mkdir(parents=True)
        (self.root / 'frontend/src/data/mock.js').write_text('export const BLOG_POSTS = [];')
        with patch.object(release, 'REPO', self.root), patch.object(release, 'STATE', state):
            intake = release.source_intake(capture=False)
        docs = intake['library']['documents']
        self.assertEqual(len(docs), 2)
        self.assertEqual(docs['youtube-' + VIDEO + '-production-full']['verified_at'], self.metadata['verified_at'])
        self.assertIn('fourteen years', docs['youtube-' + VIDEO + '-published-notes']['text'])
        self.assertEqual(intake['current_public_recordings'][0]['video_id'], VIDEO)
        self.assertEqual(intake['caption_intake']['usable_recordings'], 1)
        self.assertEqual(len(intake['caption_intake']['errors']), 1)

    def test_visibility_or_integrity_hold_survives_an_offline_run(self):
        state = self.root / 'state'
        c.write_json(state / 'captures' / (VIDEO + '.json'), self.run_capture())
        self.assertEqual(len(c.saved_documents(state)), 2)
        c.write_json(state / 'caption-intake-latest.json', {'held_video_ids': [VIDEO]})
        self.assertEqual(c.saved_documents(state), [])

    def test_speech_endpoint_cannot_drop_the_body_of_a_recording(self):
        with self.assertRaisesRegex(ValueError, 'outro'):
            c.capture(self.receipt, self.captions, verify=self.verify, speech_end=100)

    def test_empty_zero_length_terminal_marker_is_not_speech(self):
        self.rows.append({'start': 199, 'end': 199, 'text': ''})
        self.save_captions()
        self.assertEqual(len(self.run_capture()['segments']), 10)
        self.rows[-1]['text'] = 'Unverifiable spoken words'
        self.save_captions()
        with self.assertRaises(ValueError):
            self.run_capture()


if __name__ == '__main__':
    unittest.main()
