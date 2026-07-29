import base64
import os
import sqlite3
import tempfile
import unittest
from datetime import datetime, timezone

from workout_hub.security import CredentialVault
from workout_hub.service import WorkoutHubService


class FakeSpeedianceGateway:
    login_calls = []
    saved = []
    records = []

    def __init__(self, auth):
        self.auth = dict(auth)

    def login(self, email, password):
        self.__class__.login_calls.append((email, password, self.auth["region"], self.auth["device_type"]))
        return {
            "app_user_id": f"speediance-{email}",
            "token": "provider-secret-token",
            "region": self.auth["region"],
            "device_type": self.auth["device_type"],
        }

    def save_workout(self, name, exercises):
        self.__class__.saved.append((name, exercises))
        return {"template_id": 9001, "template_code": "provider-workout-code"}

    def get_training_records(self, start_date, end_date):
        return list(self.__class__.records)


class WorkoutHubServiceTests(unittest.TestCase):
    def setUp(self):
        FakeSpeedianceGateway.login_calls = []
        FakeSpeedianceGateway.saved = []
        FakeSpeedianceGateway.records = []
        self.tmp = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.tmp.name, "hub.db")
        key = base64.urlsafe_b64encode(b"test-master-key-material-32byte!")
        self.service = WorkoutHubService(
            self.db_path,
            CredentialVault(key.decode("ascii")),
            gateway_factory=FakeSpeedianceGateway,
        )

    def tearDown(self):
        self.tmp.cleanup()

    def connect(self, display_name="Toby"):
        return self.service.connect_speediance(
            display_name=display_name,
            email=f"{display_name.lower()}@example.com",
            password="never-store-this-password",
            region="Global",
            device_type=1,
        )

    def test_connect_encrypts_provider_token_and_never_persists_password(self):
        connected = self.connect()
        user = self.service.authenticate(connected["session_token"])
        self.assertEqual(user["display_name"], "Toby")
        self.assertEqual(FakeSpeedianceGateway.login_calls[0][0], "toby@example.com")

        with open(self.db_path, "rb") as database_file:
            db_bytes = database_file.read()
        self.assertNotIn(b"never-store-this-password", db_bytes)
        self.assertNotIn(b"provider-secret-token", db_bytes)
        self.assertNotIn(b"toby@example.com", db_bytes)

        with sqlite3.connect(self.db_path) as connection:
            encrypted = connection.execute(
                "SELECT encrypted_auth FROM speediance_connections WHERE user_id = ?",
                (connected["user_id"],),
            ).fetchone()[0]
        auth = self.service.vault.decrypt_json(encrypted)
        self.assertEqual(auth["token"], "provider-secret-token")

    def test_session_tokens_are_stored_only_as_hashes(self):
        connected = self.connect()
        with open(self.db_path, "rb") as database_file:
            db_bytes = database_file.read()
        self.assertNotIn(connected["session_token"].encode(), db_bytes)

    def test_shared_workout_can_be_exported_and_installed_to_connected_account(self):
        connected = self.connect()
        workout = self.service.publish_workout(
            connected["user_id"],
            {
                "name": "Community Push Day",
                "description": "Five-movement community challenge",
                "exercises": [
                    {"id": 101, "title": "Chest Press", "preset": -1, "sets": [{"reps": 10, "weight": 22.5, "mode": 1, "rest": 60}]},
                ],
            },
        )

        exported = self.service.export_workout(workout["id"])
        self.assertEqual(exported["name"], "Community Push Day")
        self.assertEqual(exported["exercises"][0]["id"], 101)

        install = self.service.install_workout(connected["user_id"], workout["id"])
        self.assertEqual(install["status"], "installed")
        self.assertEqual(install["provider_template_id"], "9001")
        self.assertEqual(FakeSpeedianceGateway.saved[0][0], "Community Push Day")
        self.assertEqual(FakeSpeedianceGateway.saved[0][1][0]["groupId"], 101)

    def test_sync_creates_verified_completion_and_is_idempotent(self):
        connected = self.connect("Toby")
        workout = self.service.publish_workout(
            connected["user_id"],
            {"name": "Community Push Day", "description": "", "exercises": [{"id": 101, "title": "Press", "sets": [{"reps": 10, "weight": 20, "mode": 1, "rest": 60}]}]},
        )
        self.service.install_workout(connected["user_id"], workout["id"])
        FakeSpeedianceGateway.records = [{
            "trainingId": 70001,
            "templateId": 9001,
            "title": "Community Push Day",
            "isFinish": 1,
            "totalCapacity": 12345.0,
            "duration": 1860,
            "finishTime": "2026-07-29 07:05:00",
        }]

        first = self.service.sync_completions(connected["user_id"], "2026-07-01", "2026-07-31")
        second = self.service.sync_completions(connected["user_id"], "2026-07-01", "2026-07-31")
        self.assertEqual(first["imported"], 1)
        self.assertEqual(second["imported"], 0)

        board = self.service.get_leaderboard(workout["id"])
        self.assertEqual(len(board), 1)
        self.assertEqual(board[0]["display_name"], "Toby")
        self.assertEqual(board[0]["total_volume_lbs"], 12345.0)
        self.assertEqual(board[0]["duration_seconds"], 1860)
        self.assertTrue(board[0]["verified"])

    def test_leaderboard_ranks_highest_verified_volume_and_breaks_ties_by_earliest_finish(self):
        first = self.connect("Alex")
        workout = self.service.publish_workout(
            first["user_id"],
            {"name": "Volume Test", "description": "", "exercises": [{"id": 101, "title": "Press", "sets": [{"reps": 10, "weight": 20, "mode": 1, "rest": 60}]}]},
        )
        self.service.install_workout(first["user_id"], workout["id"])
        FakeSpeedianceGateway.records = [{"trainingId": 1, "templateId": 9001, "title": "Volume Test", "isFinish": 1, "totalCapacity": 10000, "durationMinute": 20, "finishTime": "2026-07-20 10:00:00"}]
        self.service.sync_completions(first["user_id"], "2026-07-01", "2026-07-31")

        second = self.connect("Sam")
        self.service.install_workout(second["user_id"], workout["id"])
        FakeSpeedianceGateway.records = [{"trainingId": 2, "templateId": 9001, "title": "Volume Test", "isFinish": 1, "totalCapacity": 12000, "durationMinute": 21, "finishTime": "2026-07-22 10:00:00"}]
        self.service.sync_completions(second["user_id"], "2026-07-01", "2026-07-31")

        board = self.service.get_leaderboard(workout["id"])
        self.assertEqual([entry["display_name"] for entry in board], ["Sam", "Alex"])
        self.assertEqual([entry["rank"] for entry in board], [1, 2])

    def test_invalid_workout_payload_is_rejected(self):
        connected = self.connect()
        with self.assertRaisesRegex(ValueError, "at least one exercise"):
            self.service.publish_workout(connected["user_id"], {"name": "Empty", "exercises": []})


if __name__ == "__main__":
    unittest.main()
