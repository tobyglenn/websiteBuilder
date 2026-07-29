"""Opt-in, read-only smoke tests against an authorized Speediance account."""

from __future__ import annotations

import json
import os
import unittest
from datetime import date, timedelta
from pathlib import Path

from workout_hub.speediance_gateway import SpeedianceGateway


LIVE_CONFIG = os.environ.get("SPEEDIANCE_LIVE_CONFIG")


@unittest.skipUnless(LIVE_CONFIG, "set SPEEDIANCE_LIVE_CONFIG to run live provider smoke tests")
class LiveSpeedianceGatewayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config_path = Path(LIVE_CONFIG).expanduser()
        config = json.loads(config_path.read_text(encoding="utf-8"))
        cls.gateway = SpeedianceGateway(
            {
                "region": config.get("region", "Global"),
                "device_type": config.get("device_type", 1),
                "unit": config.get("unit", 1),
                "token": config["token"],
                "app_user_id": config["user_id"],
            }
        )

    def test_authorized_account_can_list_workouts_and_training_records(self):
        workouts = self.gateway.get_user_workouts()
        self.assertIsInstance(workouts, list)

        end_date = date.today()
        start_date = end_date - timedelta(days=7)
        records = self.gateway.get_training_records(
            start_date.isoformat(),
            end_date.isoformat(),
        )
        self.assertIsInstance(records, list)


if __name__ == "__main__":
    unittest.main()
