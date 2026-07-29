import unittest

from workout_hub.speediance_gateway import SpeedianceGateway, SpeedianceProviderError


class FakeResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload or {}
        self.text = "redacted provider response"
        self.content = b"{}"

    def json(self):
        return self._payload


class FakeSession:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def request(self, method, url, **kwargs):
        self.calls.append((method, url, kwargs))
        if not self.responses:
            raise AssertionError(f"Unexpected request: {method} {url}")
        return self.responses.pop(0)


class SpeedianceGatewayTests(unittest.TestCase):
    def test_login_returns_token_without_writing_credentials_to_disk(self):
        session = FakeSession([
            FakeResponse(payload={"data": {"isExist": True, "hasPwd": True}}),
            FakeResponse(payload={"data": {"token": "secret", "appUserId": 42}}),
        ])
        gateway = SpeedianceGateway({"region": "Global", "device_type": 1}, session=session)
        auth = gateway.login("person@example.com", "password")
        self.assertEqual(auth["token"], "secret")
        self.assertEqual(auth["app_user_id"], "42")
        self.assertEqual(len(session.calls), 2)
        self.assertNotIn("password", auth)
        self.assertNotIn("person@example.com", auth.values())

    def test_invalid_login_raises_sanitized_provider_error(self):
        session = FakeSession([
            FakeResponse(payload={"data": {"isExist": True, "hasPwd": True}}),
            FakeResponse(status_code=401, payload={"message": "provider secret diagnostic"}),
        ])
        gateway = SpeedianceGateway({"region": "Global", "device_type": 1}, session=session)
        with self.assertRaisesRegex(SpeedianceProviderError, "Invalid Speediance credentials"):
            gateway.login("person@example.com", "bad")

    def test_confirm_account_unit_updates_provider_setting(self):
        session = FakeSession([FakeResponse(payload={"code": 0, "data": True})])
        gateway = SpeedianceGateway(
            {
                "region": "Global",
                "device_type": 1,
                "token": "secret",
                "app_user_id": "42",
            },
            session=session,
        )

        self.assertEqual(gateway.confirm_account_unit(0), 0)
        self.assertEqual(session.calls[0][0], "PUT")
        self.assertTrue(session.calls[0][1].endswith("/api/app/userinfo"))
        self.assertEqual(session.calls[0][2]["json"], {"unit": 0})

    def test_save_workout_creates_provider_template_and_resolves_its_identifiers(self):
        session = FakeSession([
            FakeResponse(payload={"data": [{"id": 101, "actionLibraryList": [{"id": 501, "coachId": 31}], "isLeftRight": 0}]}),
            FakeResponse(payload={"data": {"isLeftRight": 0}}),
            FakeResponse(payload={"code": 0, "data": True}),
            FakeResponse(payload={"data": [{"id": 9001, "code": "abc123", "name": "Community Push Day"}]}),
        ])
        gateway = SpeedianceGateway({
            "region": "Global", "device_type": 1, "token": "secret", "app_user_id": "42"
        }, session=session)
        result = gateway.save_workout("Community Push Day", [{
            "groupId": 101,
            "preset_id": -1,
            "sets": [{"reps": 10, "weight": 10.0, "mode": 1, "rest": 60}],
        }])
        self.assertEqual(result, {"template_id": 9001, "template_code": "abc123"})
        payload = session.calls[2][2]["json"]
        self.assertEqual(payload["name"], "Community Push Day")
        self.assertEqual(payload["actionLibraryList"][0]["weights"], "10.0")
        self.assertEqual(payload["actionLibraryList"][0]["setsAndReps"], "10")

    def test_training_records_are_read_from_provider(self):
        session = FakeSession([FakeResponse(payload={"data": [{"trainingId": 1, "totalCapacity": 1234}]})])
        gateway = SpeedianceGateway({
            "region": "EU", "device_type": 1, "token": "secret", "app_user_id": "42"
        }, session=session)
        records = gateway.get_training_records("2026-07-01", "2026-07-31")
        self.assertEqual(records[0]["trainingId"], 1)
        self.assertIn("euapi.speediance.com", session.calls[0][1])

    def test_vita_workout_uses_level_from_provider_metadata(self):
        session = FakeSession([
            FakeResponse(payload={"data": [{
                "id": 303,
                "dataStatType": 6,
                "completionMethod": 5,
                "actionLibraryList": [{"id": 503, "coachId": 31}],
            }]}),
            FakeResponse(payload={"data": {"isLeftRight": 0}}),
            FakeResponse(payload={"code": 0, "data": {}}),
            FakeResponse(payload={"data": [{"id": 9002, "name": "Vita Timer", "code": "vita123"}]}),
        ])
        gateway = SpeedianceGateway({
            "region": "Global",
            "device_type": 1,
            "token": "secret",
            "app_user_id": "42",
        }, session=session)

        gateway.save_workout("Vita Timer", [{
            "groupId": 303,
            "preset_id": -1,
            "sets": [{
                "reps": 45,
                "weight": 7,
                "mode": 1,
                "rest": 15,
            }],
        }])

        action = session.calls[2][2]["json"]["actionLibraryList"][0]
        self.assertEqual(action["level"], "7")
        self.assertEqual(action["weights"], "0")
        self.assertEqual(action["completionMethod"], "1")
        self.assertEqual(action["countType"], "1")

    def test_legacy_timed_metadata_is_derived_from_provider_detail(self):
        session = FakeSession([
            FakeResponse(payload={"data": [{
                "id": 404,
                "dataStatType": 5,
                "completionMethod": 2,
                "actionLibraryList": [{"id": 504, "coachId": 31}],
            }]}),
            FakeResponse(payload={"data": {"isLeftRight": 0}}),
            FakeResponse(payload={"code": 0, "data": {}}),
            FakeResponse(payload={"data": [{"id": 9003, "name": "Legacy Timer", "code": "timer123"}]}),
        ])
        gateway = SpeedianceGateway({
            "region": "Global",
            "device_type": 1,
            "token": "secret",
            "app_user_id": "42",
        }, session=session)

        gateway.save_workout("Legacy Timer", [{
            "groupId": 404,
            "preset_id": -1,
            "sets": [{"reps": 45, "weight": 0, "mode": 1, "rest": 15}],
        }])

        action = session.calls[2][2]["json"]["actionLibraryList"][0]
        self.assertEqual(action["completionMethod"], "2")
        self.assertEqual(action["countType"], "2")

    def test_custom_weights_convert_between_account_units(self):
        def save_weight(source_unit, target_unit, weight):
            session = FakeSession([
                FakeResponse(payload={"data": [{
                    "id": 101,
                    "dataStatType": 0,
                    "completionMethod": 1,
                    "actionLibraryList": [{"id": 501, "coachId": 31}],
                }]}),
                FakeResponse(payload={"data": {"isLeftRight": 0}}),
                FakeResponse(payload={"code": 0, "data": {}}),
                FakeResponse(payload={"data": [{"id": 9001, "name": "Units", "code": "units"}]}),
            ])
            gateway = SpeedianceGateway({
                "region": "Global",
                "device_type": 1,
                "token": "secret",
                "app_user_id": "42",
            }, session=session)
            gateway.save_workout("Units", [{
                "groupId": 101,
                "preset_id": -1,
                "source_unit": source_unit,
                "target_unit": target_unit,
                "sets": [{"reps": 10, "weight": weight, "mode": 1, "rest": 60}],
            }])
            return session.calls[2][2]["json"]["actionLibraryList"][0]["weights"]

        self.assertEqual(save_weight(1, 0, 44.09), "20.0")
        self.assertEqual(save_weight(0, 1, 20), "44.1")
        self.assertEqual(save_weight(1, 1, 50), "50.0")

    def test_provider_metadata_mismatch_is_rejected(self):
        session = FakeSession([
            FakeResponse(payload={"data": [{
                "id": 101,
                "dataStatType": 0,
                "actionLibraryList": [{"id": 501, "coachId": 31}],
            }]}),
            FakeResponse(payload={"data": {"isLeftRight": 0}}),
        ])
        gateway = SpeedianceGateway(
            {
                "region": "Global",
                "device_type": 1,
                "token": "secret",
                "app_user_id": "42",
            },
            session=session,
        )

        with self.assertRaisesRegex(SpeedianceProviderError, "metadata"):
            gateway.save_workout("Unsafe", [{
                "groupId": 101,
                "preset_id": -1,
                "data_stat_type": 6,
                "sets": [{"reps": 10, "weight": 7, "mode": 1, "rest": 60}],
            }])

    def test_preset_must_be_available_for_provider_exercise(self):
        session = FakeSession([
            FakeResponse(payload={"data": [{
                "id": 101,
                "dataStatType": 0,
                "templatePresetList": [{
                    "id": 1,
                    "weightScopeStart": 9,
                    "weightScopeEnd": 13,
                }],
                "actionLibraryList": [{"id": 501, "coachId": 31}],
            }]}),
            FakeResponse(payload={"data": {"isLeftRight": 0}}),
        ])
        gateway = SpeedianceGateway(
            {
                "region": "Global",
                "device_type": 1,
                "token": "secret",
                "app_user_id": "42",
            },
            session=session,
        )

        with self.assertRaisesRegex(SpeedianceProviderError, "not available"):
            gateway.save_workout("Unsafe", [{
                "groupId": 101,
                "preset_id": 3,
                "sets": [{"reps": 10, "weight": 12, "mode": 1, "rest": 60}],
            }])

    def test_preset_counter_must_match_provider_range(self):
        session = FakeSession([
            FakeResponse(payload={"data": [{
                "id": 101,
                "dataStatType": 0,
                "templatePresetList": [{
                    "id": 1,
                    "weightScopeStart": 9,
                    "weightScopeEnd": 13,
                }],
                "actionLibraryList": [{"id": 501, "coachId": 31}],
            }]}),
            FakeResponse(payload={"data": {"isLeftRight": 0}}),
        ])
        gateway = SpeedianceGateway(
            {
                "region": "Global",
                "device_type": 1,
                "token": "secret",
                "app_user_id": "42",
            },
            session=session,
        )

        with self.assertRaisesRegex(SpeedianceProviderError, "outside Speediance limits"):
            gateway.save_workout("Unsafe", [{
                "groupId": 101,
                "preset_id": 1,
                "sets": [{"reps": 10, "weight": 99, "mode": 1, "rest": 60}],
            }])

    def test_provider_limits_are_enforced_before_install(self):
        def gateway_for(data_stat_type=0):
            return SpeedianceGateway(
                {
                    "region": "Global",
                    "device_type": 1,
                    "token": "secret",
                    "app_user_id": "42",
                },
                session=FakeSession([
                    FakeResponse(payload={"data": [{
                        "id": 101,
                        "dataStatType": data_stat_type,
                        "actionLibraryList": [{"id": 501, "coachId": 31}],
                    }]}),
                    FakeResponse(payload={"data": {"isLeftRight": 0}}),
                ]),
            )

        cases = [
            (
                "weight limit",
                0,
                {
                    "groupId": 101,
                    "preset_id": -1,
                    "source_unit": 1,
                    "target_unit": 1,
                    "sets": [{"reps": 10, "weight": 221, "mode": 1, "rest": 60}],
                },
            ),
            (
                "resistance mode",
                0,
                {
                    "groupId": 101,
                    "preset_id": -1,
                    "source_unit": 1,
                    "target_unit": 1,
                    "sets": [{"reps": 10, "weight": 20, "mode": 4, "rest": 60}],
                },
            ),
            (
                "Vita level",
                6,
                {
                    "groupId": 101,
                    "preset_id": -1,
                    "data_stat_type": 6,
                    "source_unit": 1,
                    "target_unit": 1,
                    "sets": [{"reps": 10, "weight": 11, "mode": 1, "rest": 60}],
                },
            ),
        ]
        for message, data_stat_type, exercise in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(SpeedianceProviderError, message):
                    gateway_for(data_stat_type).save_workout("Unsafe", [exercise])


if __name__ == "__main__":
    unittest.main()
