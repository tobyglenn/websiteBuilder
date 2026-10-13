#!/usr/bin/env python3
"""Behavioral coverage for the zero-token gate and publication boundaries."""
import argparse
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('nightly', Path(__file__).parents[1] / 'nightly-game-journal.py')
nightly = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nightly)


class NightlyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.job = Path(self.temp.name)
        self.site = self.job / 'site'
        self.wild = self.job / 'wild'
        self.mon = self.job / 'monstrum'
        self.wild.mkdir()
        self.mon.mkdir()
        self.write(self.site / 'frontend/src/data/games/journal.json', [
            {'game': 'wild-rebellion', 'kind': 'release', 'version': 37},
            {'game': 'monstrum-world', 'kind': 'release', 'version': 48}])

    def write(self, path, record):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(record))

    def report(self):
        return nightly.scanner.inventory(self.site, self.wild, self.mon)

    def test_no_changes_never_starts_codex(self):
        args = argparse.Namespace(job_dir=self.job, wild_root=self.wild,
                                  monstrum_root=self.mon, retry=False, check_only=False)
        with patch.object(nightly, 'run', return_value=''), patch.object(nightly.subprocess, 'run') as model:
            self.assertEqual(nightly.process(args)['state'], 'unchanged')
            model.assert_not_called()

    def test_saved_version_is_not_an_update(self):
        self.write(self.wild / 'publish/public-v38.json', {
            'versionNumber': 38, 'cloudDownloadMatchesBuild': True, 'publicStateVerified': True})
        (self.wild / 'publish/PUBLISH_STATUS.md').write_text('## October 11 — SAVED version 38 (not published)\n')
        self.assertEqual(nightly.decision(self.report(), {}), 'unchanged')

    def test_new_evidence_invokes_once_then_suppresses_identical_attempt(self):
        self.write(self.mon / 'release.json', {'publicVersion': 49, 'publiclyReleased': True})
        args = argparse.Namespace(job_dir=self.job, wild_root=self.wild,
                                  monstrum_root=self.mon, retry=False, check_only=False,
                                  codex='stub-codex')
        with patch.object(nightly, 'run', return_value=''), patch.object(nightly.subprocess, 'run') as model:
            self.assertEqual(nightly.process(args)['state'], 'no_verified_content')
            model.assert_called_once()
            self.assertEqual(nightly.process(args)['state'], 'already_attempted')
            model.assert_called_once()

    def test_check_only_never_invokes_even_with_new_release(self):
        self.write(self.mon / 'release.json', {'publicVersion': 49, 'publiclyReleased': True})
        args = argparse.Namespace(job_dir=self.job, wild_root=self.wild,
                                  monstrum_root=self.mon, retry=False, check_only=True)
        with patch.object(nightly, 'run', return_value=''), patch.object(nightly.subprocess, 'run') as model:
            self.assertEqual(nightly.process(args)['state'], 'generate')
            model.assert_not_called()

    def test_published_log_detected_without_receipt(self):
        (self.wild / 'publish').mkdir()
        (self.wild / 'publish/PUBLISH_STATUS.md').write_text('## October 13 — PUBLISHED version 39\nSource and hash\n')
        report = self.report()
        self.assertEqual(nightly.decision(report, {}), 'generate')
        self.assertEqual(report['games'][0]['candidates'][0]['version'], 39)

    def test_mon_manifest_and_receipt_are_deduplicated(self):
        receipt = {'publicVersion': 49, 'publiclyReleased': True, 'cloudDownloadMatchesBuild': True}
        self.write(self.mon / 'release.json', receipt)
        self.write(self.mon / 'qa/day/public-release-v49.json', receipt)
        self.assertEqual(len(self.report()['games'][1]['candidates']), 1)

    def test_both_games_are_one_batch(self):
        self.write(self.wild / 'publish/public-v39.json', {'versionNumber': 39, 'publishedVersionNumber': 39})
        self.write(self.mon / 'release.json', {'publicVersion': 49, 'publiclyReleased': True})
        report = self.report()
        self.assertEqual(nightly.decision(report, {}), 'generate')
        self.assertTrue(all(game['candidates'] for game in report['games']))

    def test_unchanged_failed_attempt_does_not_burn_tokens_again(self):
        path = self.mon / 'release.json'
        self.write(path, {'publicVersion': 49, 'publiclyReleased': True})
        report = self.report()
        state = {'attempted_fingerprint': nightly.fingerprint(report)}
        self.assertEqual(nightly.decision(report, state), 'already_attempted')
        self.assertEqual(nightly.decision(report, state, retry=True), 'generate')
        self.write(path, {'publicVersion': 49, 'publiclyReleased': True, 'cloudDownloadMatchesBuild': True})
        self.assertEqual(nightly.decision(self.report(), state), 'generate')

    def test_missing_drive_and_malformed_receipts_are_errors(self):
        self.mon.rmdir()
        self.assertEqual(nightly.decision(self.report(), {}), 'unavailable')
        self.mon.mkdir()
        (self.mon / 'release.json').write_text('{broken')
        self.assertEqual(nightly.decision(self.report(), {}), 'unavailable')

    def test_deployed_coverage_skips_old_receipts(self):
        self.write(self.mon / 'release.json', {'publicVersion': 48, 'publiclyReleased': True})
        self.assertEqual(nightly.decision(self.report(), {}), 'unchanged')


if __name__ == '__main__':
    unittest.main()
