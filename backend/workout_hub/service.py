"""Secure, persistence-backed domain service for the Speediance Workout Hub."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Callable

from .security import CredentialVault, new_session_token, sha256_text


SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    email_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS speediance_connections (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    provider_user_hash TEXT NOT NULL UNIQUE,
    region TEXT NOT NULL,
    device_type INTEGER NOT NULL,
    encrypted_auth TEXT NOT NULL,
    connected_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    exercises_json TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'public',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS workout_installs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    provider_template_id TEXT,
    provider_template_code TEXT,
    status TEXT NOT NULL,
    installed_at TEXT NOT NULL,
    UNIQUE(user_id, workout_id)
);
CREATE TABLE IF NOT EXISTS completions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    provider_record_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    total_volume_lbs REAL NOT NULL,
    duration_seconds INTEGER NOT NULL,
    verified INTEGER NOT NULL DEFAULT 1,
    provider_summary_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, provider_record_id)
);
CREATE INDEX IF NOT EXISTS idx_completions_workout_volume
    ON completions(workout_id, verified, total_volume_lbs DESC);
"""


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utc_now().isoformat()


def _row(row: sqlite3.Row | None) -> dict | None:
    return dict(row) if row is not None else None


class WorkoutHubService:
    def __init__(
        self,
        db_path: str,
        vault: CredentialVault,
        gateway_factory: Callable[[dict], object],
        session_days: int = 30,
    ):
        self.db_path = str(db_path)
        self.vault = vault
        self.gateway_factory = gateway_factory
        self.session_days = session_days
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.executescript(SCHEMA)
        Path(self.db_path).chmod(0o600)

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA busy_timeout = 5000")
        return connection

    def connect_speediance(self, display_name: str, email: str, password: str, region: str, device_type: int) -> dict:
        display_name = (display_name or "").strip()
        email = (email or "").strip().lower()
        if len(display_name) < 2 or len(display_name) > 40:
            raise ValueError("Display name must be between 2 and 40 characters")
        if not email or not password:
            raise ValueError("Speediance email and password are required")
        if region not in {"Global", "EU"}:
            raise ValueError("Region must be Global or EU")
        if int(device_type) not in {1, 5, 6}:
            raise ValueError("Unsupported Speediance device type")

        gateway = self.gateway_factory({"region": region, "device_type": int(device_type)})
        provider_auth = gateway.login(email, password)
        if not provider_auth.get("token") or not provider_auth.get("app_user_id"):
            raise RuntimeError("Speediance did not return a usable session")

        # Password is deliberately discarded here. Only the short-lived provider token is encrypted.
        provider_hash = sha256_text(str(provider_auth["app_user_id"]))
        email_hash = sha256_text(email)
        encrypted_auth = self.vault.encrypt_json(provider_auth)
        now = iso_now()
        with self._connect() as connection:
            existing = connection.execute(
                "SELECT user_id FROM speediance_connections WHERE provider_user_hash = ?",
                (provider_hash,),
            ).fetchone()
            user_id = existing["user_id"] if existing else str(uuid.uuid4())
            if existing:
                connection.execute(
                    "UPDATE users SET display_name = ?, email_hash = ? WHERE id = ?",
                    (display_name, email_hash, user_id),
                )
            else:
                connection.execute(
                    "INSERT INTO users(id, display_name, email_hash, created_at) VALUES (?, ?, ?, ?)",
                    (user_id, display_name, email_hash, now),
                )
            connection.execute(
                """
                INSERT INTO speediance_connections(user_id, provider_user_hash, region, device_type, encrypted_auth, connected_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    provider_user_hash=excluded.provider_user_hash,
                    region=excluded.region,
                    device_type=excluded.device_type,
                    encrypted_auth=excluded.encrypted_auth,
                    updated_at=excluded.updated_at
                """,
                (user_id, provider_hash, region, int(device_type), encrypted_auth, now, now),
            )
            connection.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
            session_token = new_session_token()
            expires_at = (utc_now() + timedelta(days=self.session_days)).isoformat()
            connection.execute(
                "INSERT INTO sessions(token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
                (sha256_text(session_token), user_id, expires_at, now),
            )
        return {"user_id": user_id, "display_name": display_name, "session_token": session_token, "expires_at": expires_at}

    def authenticate(self, session_token: str) -> dict:
        if not session_token:
            raise PermissionError("Authentication required")
        with self._connect() as connection:
            row = connection.execute(
                """SELECT u.id, u.display_name, s.expires_at
                   FROM sessions s JOIN users u ON u.id = s.user_id
                   WHERE s.token_hash = ?""",
                (sha256_text(session_token),),
            ).fetchone()
        if not row or datetime.fromisoformat(row["expires_at"]) <= utc_now():
            raise PermissionError("Session is invalid or expired")
        return {"id": row["id"], "display_name": row["display_name"], "expires_at": row["expires_at"]}

    def disconnect(self, user_id: str) -> None:
        with self._connect() as connection:
            connection.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
            connection.execute("DELETE FROM speediance_connections WHERE user_id = ?", (user_id,))

    def _provider_auth(self, user_id: str) -> dict:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT encrypted_auth FROM speediance_connections WHERE user_id = ?", (user_id,)
            ).fetchone()
        if not row:
            raise PermissionError("Speediance account is not connected")
        return self.vault.decrypt_json(row["encrypted_auth"])

    @staticmethod
    def _normalize_workout(payload: dict) -> dict:
        name = str(payload.get("name") or "").strip()
        description = str(payload.get("description") or "").strip()
        exercises = payload.get("exercises")
        if not name or len(name) > 80:
            raise ValueError("Workout name is required and must be 80 characters or fewer")
        if not isinstance(exercises, list) or not exercises:
            raise ValueError("Workout must contain at least one exercise")
        if len(exercises) > 60:
            raise ValueError("Workout cannot contain more than 60 exercises")

        normalized = []
        for position, exercise in enumerate(exercises, start=1):
            group_id = exercise.get("id", exercise.get("groupId"))
            sets = exercise.get("sets")
            if not str(group_id or "").isdigit():
                raise ValueError(f"Exercise {position} is missing a valid Speediance exercise id")
            if not isinstance(sets, list) or not sets:
                raise ValueError(f"Exercise {position} must contain at least one set")
            normalized_sets = []
            for set_position, item in enumerate(sets, start=1):
                try:
                    reps = int(item.get("reps", 0))
                    weight = float(item.get("weight", 0))
                    mode = int(item.get("mode", 1))
                    rest = int(item.get("rest", 60))
                except (TypeError, ValueError) as exc:
                    raise ValueError(f"Exercise {position}, set {set_position} contains invalid numbers") from exc
                if reps < 1 or reps > 500 or weight < 0 or rest < 0 or rest > 1800:
                    raise ValueError(f"Exercise {position}, set {set_position} is outside supported limits")
                normalized_sets.append({"reps": reps, "weight": weight, "mode": mode, "rest": rest})
            preset = exercise.get("preset", exercise.get("preset_id", -1))
            normalized.append({
                "id": int(group_id),
                "title": str(exercise.get("title") or f"Exercise {group_id}").strip()[:120],
                "preset": int(preset if preset is not None else -1),
                "isUnilateralExpanded": bool(exercise.get("isUnilateralExpanded", False)),
                "sets": normalized_sets,
            })
        return {"name": name, "description": description[:500], "exercises": normalized}

    def publish_workout(self, user_id: str, payload: dict) -> dict:
        workout = self._normalize_workout(payload)
        workout_id = str(uuid.uuid4())
        now = iso_now()
        with self._connect() as connection:
            if not connection.execute("SELECT 1 FROM users WHERE id = ?", (user_id,)).fetchone():
                raise PermissionError("Unknown user")
            connection.execute(
                """INSERT INTO workouts(id, owner_user_id, name, description, exercises_json, visibility, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, 'public', ?, ?)""",
                (workout_id, user_id, workout["name"], workout["description"], json.dumps(workout["exercises"], separators=(",", ":")), now, now),
            )
        return self.get_workout(workout_id)

    def get_workout(self, workout_id: str) -> dict:
        with self._connect() as connection:
            row = connection.execute(
                """SELECT w.*, u.display_name AS creator_name,
                          COUNT(DISTINCT c.user_id) AS athlete_count,
                          COALESCE(MAX(c.total_volume_lbs), 0) AS top_volume_lbs
                   FROM workouts w JOIN users u ON u.id=w.owner_user_id
                   LEFT JOIN completions c ON c.workout_id=w.id AND c.verified=1
                   WHERE w.id=? GROUP BY w.id""",
                (workout_id,),
            ).fetchone()
        if not row:
            raise KeyError("Workout not found")
        result = dict(row)
        result["exercises"] = json.loads(result.pop("exercises_json"))
        return result

    def list_workouts(self) -> list[dict]:
        with self._connect() as connection:
            ids = [row["id"] for row in connection.execute("SELECT id FROM workouts WHERE visibility='public' ORDER BY created_at DESC")]
        return [self.get_workout(workout_id) for workout_id in ids]

    def export_workout(self, workout_id: str) -> dict:
        workout = self.get_workout(workout_id)
        return {
            "format": "tobyonfitnesstech.speediance-workout.v1",
            "name": workout["name"],
            "description": workout["description"],
            "exercises": workout["exercises"],
        }

    @staticmethod
    def _provider_exercises(exercises: list[dict]) -> list[dict]:
        provider = []
        for exercise in exercises:
            preset = int(exercise.get("preset", -1))
            sets = []
            for item in exercise["sets"]:
                converted = dict(item)
                # Manager JSON custom weights are exported in pounds; Speediance expects kilograms.
                if preset == -1:
                    converted["weight"] = round(float(item["weight"]) / 2.2046226218, 2)
                sets.append(converted)
            provider.append({
                "groupId": exercise["id"],
                "title": exercise["title"],
                "preset_id": preset,
                "sets": sets,
            })
        return provider

    def install_workout(self, user_id: str, workout_id: str) -> dict:
        workout = self.get_workout(workout_id)
        gateway = self.gateway_factory(self._provider_auth(user_id))
        saved = gateway.save_workout(workout["name"], self._provider_exercises(workout["exercises"]))
        template_id = str(saved.get("template_id") or "") or None
        template_code = str(saved.get("template_code") or "") or None
        if not template_id and not template_code:
            raise RuntimeError("Speediance accepted the request but the installed workout could not be identified")
        install_id = str(uuid.uuid4())
        now = iso_now()
        with self._connect() as connection:
            connection.execute(
                """INSERT INTO workout_installs(id, user_id, workout_id, provider_template_id, provider_template_code, status, installed_at)
                   VALUES (?, ?, ?, ?, ?, 'installed', ?)
                   ON CONFLICT(user_id, workout_id) DO UPDATE SET
                     provider_template_id=excluded.provider_template_id,
                     provider_template_code=excluded.provider_template_code,
                     status='installed', installed_at=excluded.installed_at""",
                (install_id, user_id, workout_id, template_id, template_code, now),
            )
            row = connection.execute(
                "SELECT * FROM workout_installs WHERE user_id=? AND workout_id=?", (user_id, workout_id)
            ).fetchone()
        return dict(row)

    @staticmethod
    def _record_finished_at(record: dict) -> str:
        value = record.get("finishTime") or record.get("date") or iso_now()
        text = str(value)
        if "T" not in text and " " in text:
            text = text.replace(" ", "T", 1)
        return text

    @staticmethod
    def _record_duration_seconds(record: dict) -> int:
        if record.get("durationMinute") is not None:
            return int(float(record.get("durationMinute") or 0) * 60)
        return int(float(record.get("duration") or record.get("totalTime") or 0))

    def sync_completions(self, user_id: str, start_date: str, end_date: str) -> dict:
        gateway = self.gateway_factory(self._provider_auth(user_id))
        records = gateway.get_training_records(start_date, end_date)
        with self._connect() as connection:
            installs = [dict(row) for row in connection.execute(
                """SELECT i.*, w.name AS workout_name FROM workout_installs i
                   JOIN workouts w ON w.id=i.workout_id WHERE i.user_id=? AND i.status='installed'""",
                (user_id,),
            )]
            imported = 0
            for record in records:
                if int(record.get("isFinish", 0)) != 1:
                    continue
                match = next((item for item in installs if (
                    item.get("provider_template_id") and str(record.get("templateId")) == str(item["provider_template_id"])
                ) or str(record.get("title") or "").strip() == item["workout_name"]), None)
                if not match:
                    continue
                provider_record_id = str(record.get("trainingId") or record.get("id") or "")
                if not provider_record_id:
                    continue
                cursor = connection.execute(
                    """INSERT OR IGNORE INTO completions(
                           id,user_id,workout_id,provider_record_id,completed_at,total_volume_lbs,
                           duration_seconds,verified,provider_summary_json,created_at
                       ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)""",
                    (
                        str(uuid.uuid4()), user_id, match["workout_id"], provider_record_id,
                        self._record_finished_at(record), float(record.get("totalCapacity") or 0),
                        self._record_duration_seconds(record),
                        json.dumps({
                            "trainingId": record.get("trainingId"), "templateId": record.get("templateId"),
                            "title": record.get("title"), "isFinish": record.get("isFinish"),
                        }, separators=(",", ":")),
                        iso_now(),
                    ),
                )
                imported += cursor.rowcount
        return {"scanned": len(records), "imported": imported}

    def get_leaderboard(self, workout_id: str) -> list[dict]:
        self.get_workout(workout_id)
        with self._connect() as connection:
            rows = [dict(row) for row in connection.execute(
                """SELECT c.*, u.display_name FROM completions c
                   JOIN users u ON u.id=c.user_id
                   WHERE c.workout_id=? AND c.verified=1
                   ORDER BY c.total_volume_lbs DESC, c.completed_at ASC""",
                (workout_id,),
            )]
        best_by_user = {}
        attempts_by_user = {}
        for item in rows:
            attempts_by_user[item["user_id"]] = attempts_by_user.get(item["user_id"], 0) + 1
            best_by_user.setdefault(item["user_id"], item)
        board = sorted(best_by_user.values(), key=lambda item: (-item["total_volume_lbs"], item["completed_at"]))
        return [{
            "rank": rank,
            "user_id": item["user_id"],
            "display_name": item["display_name"],
            "total_volume_lbs": item["total_volume_lbs"],
            "duration_seconds": item["duration_seconds"],
            "completed_at": item["completed_at"],
            "verified": bool(item["verified"]),
            "attempts": attempts_by_user[item["user_id"]],
        } for rank, item in enumerate(board, start=1)]
