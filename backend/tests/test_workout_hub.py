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
    unit_confirmations = []
    saved = []
    templates = []
    records = []

    def __init__(self, auth):
        self.auth = dict(auth)

    def login(self, email, password):
        self.__class__.login_calls.append(
            (
                email,
                password,
                self.auth["region"],
                self.auth["device_type"],
                self.auth["unit"],
            )
        )
        return {
            "app_user_id": f"speediance-{email}",
            "token": "provider-secret-token",
            "region": self.auth["region"],
            "device_type": self.auth["device_type"],
        }

    def confirm_account_unit(self, unit):
        self.__class__.unit_confirmations.append(int(unit))
        return int(unit)

    def save_workout(self, name, exercises):
        self.__class__.saved.append((name, exercises))
        self.__class__.templates = [
            {"id": 9001, "code": "provider-workout-code", "name": name}
        ]
        return {"template_id": 9001, "template_code": "provider-workout-code"}

    def get_user_workouts(self):
        return list(self.__class__.templates)

    def get_training_records(self, start_date, end_date):
        return list(self.__class__.records)


class WorkoutHubServiceTests(unittest.TestCase):
    def setUp(self):
        FakeSpeedianceGateway.login_calls = []
        FakeSpeedianceGateway.unit_confirmations = []
        FakeSpeedianceGateway.saved = []
        FakeSpeedianceGateway.templates = []
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

    def connect(self, display_name="Toby", *, unit=1, device_type=1):
        return self.service.connect_speediance(
            display_name=display_name,
            email=f"{display_name.lower()}@example.com",
            password="never-store-this-password",
            region="Global",
            device_type=device_type,
            unit=unit,
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
            self.assertEqual(auth["unit"], 1)
        self.assertEqual(FakeSpeedianceGateway.unit_confirmations, [1])

    def test_connect_persists_only_provider_confirmed_unit(self):
        connected = self.connect("Metric", unit=0)
        auth = self.service._provider_auth(connected["user_id"])
        self.assertEqual(auth["unit"], 0)
        self.assertEqual(FakeSpeedianceGateway.unit_confirmations, [0])

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
        self.assertEqual(FakeSpeedianceGateway.saved[0][1][0]["sets"][0]["weight"], 22.5)

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

    def test_manager_time_based_vita_fields_round_trip_to_provider(self):
        connected = self.connect()
        workout = self.service.publish_workout(
            connected["user_id"],
            {
                "name": "Vita Timer",
                "exercises": [{
                    "groupId": 303,
                    "title": "Vita Move",
                    "preset_id": -1,
                    "dataStatType": 6,
                    "sets": [{
                        "reps": 45,
                        "weight": 7,
                        "mode": 1,
                        "rest": 15,
                        "unit": "sec",
                    }],
                }],
            },
        )

        exported = self.service.export_workout(workout["id"])
        self.assertEqual(exported["exercises"][0]["data_stat_type"], 6)
        self.assertEqual(exported["exercises"][0]["sets"][0]["unit"], "sec")

        self.service.install_workout(connected["user_id"], workout["id"])
        provider_exercise = FakeSpeedianceGateway.saved[-1][1][0]
        self.assertEqual(provider_exercise["data_stat_type"], 6)
        self.assertEqual(provider_exercise["sets"][0]["unit"], "sec")
        self.assertEqual(provider_exercise["sets"][0]["weight"], 7)

    def test_sync_does_not_title_match_when_provider_template_id_differs(self):
        connected = self.connect()
        workout = self.service.publish_workout(
            connected["user_id"],
            {
                "name": "Same Name",
                "exercises": [{
                    "id": 101,
                    "sets": [{"reps": 10, "weight": 20, "mode": 1, "rest": 60}],
                }],
            },
        )
        self.service.install_workout(connected["user_id"], workout["id"])
        FakeSpeedianceGateway.records = [{
            "trainingId": 444,
            "templateId": 555,
            "title": "Same Name",
            "isFinish": 1,
            "totalCapacity": 1000,
        }]

        result = self.service.sync_completions(
            connected["user_id"],
            "2026-07-01",
            "2026-07-31",
        )
        self.assertEqual(result["imported"], 0)

    def test_sync_validates_real_dates_and_limits_range(self):
        connected = self.connect()
        with self.assertRaisesRegex(ValueError, "real ISO"):
            self.service.sync_completions(
                connected["user_id"],
                "2026-02-30",
                "2026-03-01",
            )
        with self.assertRaisesRegex(ValueError, "90 days"):
            self.service.sync_completions(
                connected["user_id"],
                "2026-01-01",
                "2026-04-02",
            )

    def test_non_finite_weights_are_rejected(self):
        connected = self.connect()
        with self.assertRaisesRegex(ValueError, "outside supported limits"):
            self.service.publish_workout(
                connected["user_id"],
                {
                    "name": "Unsafe",
                    "exercises": [{
                        "id": 101,
                        "sets": [{
                            "reps": 10,
                            "weight": float("nan"),
                            "mode": 1,
                            "rest": 60,
                        }],
                    }],
                },
            )

    def test_device_and_unit_reach_gateway_auth(self):
        self.connect(unit=0, device_type=6)
        self.assertEqual(FakeSpeedianceGateway.login_calls[0][3:], (6, 0))

    def test_install_is_idempotent(self):
        connected = self.connect()
        workout = self.service.publish_workout(
            connected["user_id"],
            {
                "name": "Install Once",
                "exercises": [{
                    "id": 101,
                    "sets": [{"reps": 10, "weight": 20, "mode": 1, "rest": 60}],
                }],
            },
        )

        first = self.service.install_workout(connected["user_id"], workout["id"])
        second = self.service.install_workout(connected["user_id"], workout["id"])
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(len(FakeSpeedianceGateway.saved), 1)

    def test_install_recreates_provider_workout_when_template_was_deleted(self):
        connected = self.connect()
        workout = self.service.publish_workout(
            connected["user_id"],
            {
                "name": "Reinstall Me",
                "exercises": [{
                    "id": 101,
                    "sets": [{"reps": 10, "weight": 20, "mode": 1, "rest": 60}],
                }],
            },
        )
        self.service.install_workout(connected["user_id"], workout["id"])
        FakeSpeedianceGateway.templates = []

        reinstalled = self.service.install_workout(connected["user_id"], workout["id"])

        self.assertEqual(reinstalled["provider_template_id"], "9001")
        self.assertEqual(len(FakeSpeedianceGateway.saved), 2)

    def test_source_and_installer_units_are_carried_to_gateway(self):
        imperial = self.connect("Imperial", unit=1)
        workout = self.service.publish_workout(
            imperial["user_id"],
            {
                "name": "Cross Unit",
                "exercises": [{
                    "id": 101,
                    "sets": [{"reps": 10, "weight": 44.09, "mode": 1, "rest": 60}],
                }],
            },
        )
        self.assertEqual(workout["weight_unit"], 1)
        self.assertEqual(self.service.export_workout(workout["id"])["weight_unit"], 1)

        metric = self.connect("Metric", unit=0)
        self.service.install_workout(metric["user_id"], workout["id"])
        provider_exercise = FakeSpeedianceGateway.saved[-1][1][0]
        self.assertEqual(provider_exercise["source_unit"], 1)
        self.assertEqual(provider_exercise["target_unit"], 0)

    def test_mixed_units_are_normalized_for_leaderboard(self):
        imperial = self.connect("Imperial", unit=1)
        workout = self.service.publish_workout(
            imperial["user_id"],
            {
                "name": "Mixed Unit Challenge",
                "exercises": [{
                    "id": 101,
                    "sets": [{"reps": 10, "weight": 20, "mode": 1, "rest": 60}],
                }],
            },
        )
        self.service.install_workout(imperial["user_id"], workout["id"])
        FakeSpeedianceGateway.records = [{
            "trainingId": 1,
            "templateId": 9001,
            "title": "Mixed Unit Challenge",
            "isFinish": 1,
            "totalCapacity": 210,
            "duration": 1200,
            "finishTime": "2026-07-20 10:00:00",
        }]
        self.service.sync_completions(
            imperial["user_id"],
            "2026-07-01",
            "2026-07-31",
        )

        metric = self.connect("Metric", unit=0)
        self.service.install_workout(metric["user_id"], workout["id"])
        FakeSpeedianceGateway.records = [{
            "trainingId": 2,
            "templateId": 9001,
            "title": "Mixed Unit Challenge",
            "isFinish": 1,
            "totalCapacity": 100,
            "duration": 1200,
            "finishTime": "2026-07-21 10:00:00",
        }]
        self.service.sync_completions(
            metric["user_id"],
            "2026-07-01",
            "2026-07-31",
        )

        board = self.service.get_leaderboard(workout["id"])
        self.assertEqual([entry["display_name"] for entry in board], ["Metric", "Imperial"])
        self.assertAlmostEqual(board[0]["total_volume_lbs"], 220.46226218)
        self.assertEqual(board[1]["total_volume_lbs"], 210)
        self.assertNotIn("user_id", board[0])
        self.assertNotIn("owner_user_id", self.service.get_workout(workout["id"]))

    def test_ambiguous_title_only_completion_is_skipped(self):
        connected = self.connect()
        for _ in range(2):
            workout = self.service.publish_workout(
                connected["user_id"],
                {
                    "name": "Duplicate Name",
                    "exercises": [{
                        "id": 101,
                        "sets": [{"reps": 10, "weight": 20, "mode": 1, "rest": 60}],
                    }],
                },
            )
            self.service.install_workout(connected["user_id"], workout["id"])
        FakeSpeedianceGateway.records = [{
            "trainingId": 99,
            "title": "Duplicate Name",
            "isFinish": 1,
            "totalCapacity": 1000,
            "duration": 600,
            "finishTime": "2026-07-20 10:00:00",
        }]

        result = self.service.sync_completions(
            connected["user_id"],
            "2026-07-01",
            "2026-07-31",
        )
        self.assertEqual(result["imported"], 0)

    def test_malformed_provider_scores_are_skipped(self):
        connected = self.connect()
        workout = self.service.publish_workout(
            connected["user_id"],
            {
                "name": "Provider Validation",
                "exercises": [{
                    "id": 101,
                    "sets": [{"reps": 10, "weight": 20, "mode": 1, "rest": 60}],
                }],
            },
        )
        self.service.install_workout(connected["user_id"], workout["id"])
        FakeSpeedianceGateway.records = [
            {
                "trainingId": 1,
                "templateId": 9001,
                "isFinish": 1,
                "totalCapacity": float("inf"),
                "duration": 600,
                "finishTime": "2026-07-20 10:00:00",
            },
            {
                "trainingId": 2,
                "templateId": 9001,
                "isFinish": 1,
                "totalCapacity": 1000,
                "duration": -1,
                "finishTime": "2026-07-20 10:00:00",
            },
            {
                "trainingId": 3,
                "templateId": 9001,
                "isFinish": 1,
                "totalCapacity": 1000,
                "duration": 600,
                "finishTime": "not-a-date",
            },
        ]

        result = self.service.sync_completions(
            connected["user_id"],
            "2026-07-01",
            "2026-07-31",
        )
        self.assertEqual(result["imported"], 0)

    def test_publish_rejects_unsafe_device_parameters(self):
        connected = self.connect()
        base_set = {"reps": 10, "weight": 20, "mode": 1, "rest": 60}
        cases = [
            ("resistance mode", {"sets": [{**base_set, "mode": 4}]}),
            ("preset", {"preset": 2, "sets": [base_set]}),
            (
                "preset counter",
                {"preset": 1, "sets": [{**base_set, "weight": 501}]},
            ),
            ("weight limit", {"sets": [{**base_set, "weight": 221}]}),
            (
                "Vita level",
                {"data_stat_type": 6, "sets": [{**base_set, "weight": 11}]},
            ),
        ]
        for message, exercise_changes in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    self.service.publish_workout(
                        connected["user_id"],
                        {
                            "name": "Unsafe",
                            "weight_unit": 1,
                            "exercises": [{
                                "id": 101,
                                **exercise_changes,
                            }],
                        },
                    )

    def test_metric_custom_weight_limit_is_enforced(self):
        connected = self.connect(unit=0)
        with self.assertRaisesRegex(ValueError, "weight limit"):
            self.service.publish_workout(
                connected["user_id"],
                {
                    "name": "Too Heavy",
                    "weight_unit": 0,
                    "exercises": [{
                        "id": 101,
                        "preset": -1,
                        "sets": [
                            {"reps": 10, "weight": 100.1, "mode": 1, "rest": 60}
                        ],
                    }],
                },
            )

    def test_excessive_set_count_is_rejected(self):
        connected = self.connect()
        with self.assertRaisesRegex(ValueError, "more than 100 sets"):
            self.service.publish_workout(
                connected["user_id"],
                {
                    "name": "Too Many Sets",
                    "exercises": [{
                        "id": 101,
                        "sets": [
                            {"reps": 10, "weight": 20, "mode": 1, "rest": 60}
                            for _ in range(101)
                        ],
                    }],
                },
            )


if __name__ == "__main__":
    unittest.main()
