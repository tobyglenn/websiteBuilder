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


if __name__ == "__main__":
    unittest.main()
