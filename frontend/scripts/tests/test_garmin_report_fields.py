import unittest
import os
import sys
sys.path.insert(0, os.environ.get('GARMIN_REPORT_MODULE_DIR', '/home/toby/.openclaw/workspace/scriptsJinja'))
import data_extractors as data

class GarminReportTests(unittest.TestCase):
    def test_nightly_sleep_wins_over_calendar_day_sleep(self):
        self.assertEqual(data.garmin_sleep_seconds({'stats': {'sleepingSeconds': 16992}, 'sleep': {'sleepTimeSeconds': 25260}}), 25260)

    def test_nested_and_legacy_formats(self):
        self.assertEqual(data.garmin_sleep_seconds({'sleep': {'dailySleepDTO': {'sleepTimeSeconds': 24000}}}), 24000)
        self.assertEqual(data.garmin_sleep_seconds({'stats': {'sleepingSeconds': 12000}}), 12000)

    def test_zero_is_not_replaced_but_null_and_invalid_are(self):
        self.assertEqual(data.garmin_sleep_seconds({'sleep': {'sleepTimeSeconds': 0}, 'stats': {'sleepingSeconds': 12000}}), 0)
        self.assertEqual(data.garmin_sleep_seconds({'sleep': {'sleepTimeSeconds': None}, 'stats': {'sleepingSeconds': 12000}}), 12000)
        self.assertEqual(data.garmin_sleep_seconds({'sleep': {'sleepTimeSeconds': float('nan')}}), 0)

if __name__ == '__main__':
    unittest.main()
