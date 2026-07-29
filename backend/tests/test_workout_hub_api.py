import base64
import os
import tempfile
import unittest

from fastapi.testclient import TestClient

from workout_hub.api import create_app
from workout_hub.security import CredentialVault
from workout_hub.service import WorkoutHubService


class ApiGateway:
    records = []

    def __init__(self, auth):
        self.auth = auth

    def login(self, email, password):
        return {"app_user_id": email, "token": "token", "region": self.auth["region"], "device_type": self.auth["device_type"]}

    def save_workout(self, name, exercises):
        return {"template_id": 77, "template_code": "code-77"}

    def get_training_records(self, start_date, end_date):
        return list(self.records)


class WorkoutHubApiTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        key = base64.urlsafe_b64encode(b"api-test-key-material-exactly-32").decode("ascii")
        service = WorkoutHubService(
            os.path.join(self.tmp.name, "api.db"),
            CredentialVault(key),
            ApiGateway,
        )
        self.client = TestClient(create_app(service, ["http://localhost:4321"]))
        response = self.client.post("/api/workout-hub/connect", json={
            "display_name": "Toby", "email": "toby@example.com", "password": "pw",
            "region": "Global", "device_type": 1,
        })
        self.assertEqual(response.status_code, 201, response.text)
        self.session_token = response.json()["session_token"]
        self.headers = {"Authorization": f"Bearer {self.session_token}"}

    def tearDown(self):
        self.tmp.cleanup()

    def test_health_and_me(self):
        self.assertEqual(self.client.get("/api/workout-hub/health").json()["status"], "ok")
        me = self.client.get("/api/workout-hub/me", headers=self.headers)
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["display_name"], "Toby")

    def test_publish_list_export_install_sync_and_leaderboard_flow(self):
        published = self.client.post("/api/workout-hub/workouts", headers=self.headers, json={
            "name": "Community Push Day", "description": "Challenge",
            "exercises": [{"id": 101, "title": "Press", "preset": -1, "sets": [{"reps": 10, "weight": 20, "mode": 1, "rest": 60}]}],
        })
        self.assertEqual(published.status_code, 201, published.text)
        workout_id = published.json()["id"]
        self.assertEqual(len(self.client.get("/api/workout-hub/workouts").json()), 1)
        self.assertEqual(self.client.get(f"/api/workout-hub/workouts/{workout_id}/export").json()["format"], "tobyonfitnesstech.speediance-workout.v1")

        installed = self.client.post(f"/api/workout-hub/workouts/{workout_id}/install", headers=self.headers)
        self.assertEqual(installed.status_code, 201, installed.text)
        ApiGateway.records = [{
            "trainingId": 1, "templateId": 77, "title": "Community Push Day", "isFinish": 1,
            "totalCapacity": 8888, "durationMinute": 25, "finishTime": "2026-07-29 08:00:00",
        }]
        synced = self.client.post("/api/workout-hub/sync", headers=self.headers, json={"start_date": "2026-07-01", "end_date": "2026-07-31"})
        self.assertEqual(synced.json()["imported"], 1)
        board = self.client.get(f"/api/workout-hub/workouts/{workout_id}/leaderboard").json()
        self.assertEqual(board[0]["total_volume_lbs"], 8888)
        self.assertTrue(board[0]["verified"])

    def test_private_actions_require_bearer_session(self):
        response = self.client.post("/api/workout-hub/workouts", json={"name": "Nope", "exercises": []})
        self.assertEqual(response.status_code, 401)

    def test_credentials_never_appear_in_validation_errors(self):
        secret = "super-secret-password"
        response = self.client.post("/api/workout-hub/connect", json={
            "display_name": "X", "email": "person@example.com", "password": secret,
            "region": "Global", "device_type": 1,
        })
        self.assertEqual(response.status_code, 422)
        self.assertNotIn(secret, response.text)


if __name__ == "__main__":
    unittest.main()
