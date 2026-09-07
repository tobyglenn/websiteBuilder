import importlib.util
import json
import os
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('garmin_sync', os.environ.get('GARMIN_SYNC_SCRIPT', '/home/toby/.openclaw/workspace/scripts/sync/garmin_garth_sync.py'))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)

class GarminSyncTests(unittest.TestCase):
    def test_zero_sleep_container_is_not_daily_data(self):
        self.assertFalse(sync.has_daily_data({'stats': {'totalSteps': 0}, 'sleep': {'sleepTimeSeconds': 0, 'sleepScores': {'overall': {'value': 0}}}}))

    def test_a_rest_day_with_real_measurements_is_valid(self):
        self.assertTrue(sync.has_daily_data({'stats': {'totalSteps': 0, 'restingHeartRate': 55}}))
        self.assertTrue(sync.has_daily_data({'sleep': {'sleepTimeSeconds': 24000}}))

    def run_sync(self, fetch):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name) / 'garmin'
        root.mkdir()
        today_file = root / f'{date.today()}.json'
        today_file.write_text('{"previous": "preserve"}')
        with patch.object(sync, 'DATA_DIR', root), patch.object(sync, 'fetch_day', side_effect=fetch), patch.object(sync, '_implausible_today_payload', return_value=False):
            code = sync.sync_days(None, 3)
        return code, root, today_file

    def test_historical_success_does_not_hide_missing_current_data(self):
        historical = str(date.today() - timedelta(days=2))
        code, root, today_file = self.run_sync(lambda client, day: {'stats': {'totalSteps': 1234}} if day == historical else {})
        self.assertEqual(code, 4)
        self.assertEqual(json.loads(today_file.read_text()), {'previous': 'preserve'})
        self.assertEqual(json.loads((root / f'{historical}.json').read_text())['stats']['totalSteps'], 1234)
        self.assertEqual(json.loads((root.parent / 'garmin_sync_health.json').read_text())['status'], 'unavailable')

    def test_provider_failure_is_not_success_after_another_saved_day(self):
        def fetch(client, day):
            if day == str(date.today()):
                raise RuntimeError('upstream failed')
            return {'stats': {'restingHeartRate': 55}}
        code, _, _ = self.run_sync(fetch)
        self.assertEqual(code, 1)

    def test_valid_daily_measurements_succeed(self):
        code, _, _ = self.run_sync(lambda client, day: {'stats': {'restingHeartRate': 55}})
        self.assertEqual(code, 0)

if __name__ == '__main__':
    unittest.main()
