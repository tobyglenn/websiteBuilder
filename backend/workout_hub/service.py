"""Secure, persistence-backed domain service for the Speediance Workout Hub."""

from __future__ import annotations

import json
import math
import sqlite3
import uuid
from datetime import date, datetime, timedelta, timezone
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
    unit INTEGER NOT NULL DEFAULT 1,
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
    weight_unit INTEGER NOT NULL DEFAULT 1,
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
            connection_columns = {
                row["name"]
                for row in connection.execute("PRAGMA table_info(speediance_connections)")
            }
            if "unit" not in connection_columns:
                connection.execute(
                    "ALTER TABLE speediance_connections "
                    "ADD COLUMN unit INTEGER NOT NULL DEFAULT 1"
                )
            workout_columns = {
                row["name"]
                for row in connection.execute("PRAGMA table_info(workouts)")
            }
            if "weight_unit" not in workout_columns:
                connection.execute(
                    "ALTER TABLE workouts "
                    "ADD COLUMN weight_unit INTEGER NOT NULL DEFAULT 1"
                )
        Path(self.db_path).chmod(0o600)

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA busy_timeout = 5000")
        return connection

    def connect_speediance(
        self,
        display_name: str,
        email: str,
        password: str,
        region: str,
        device_type: int,
        unit: int = 1,
    ) -> dict:
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
        if int(unit) not in {0, 1}:
            raise ValueError("Speediance unit must be metric or imperial")

        gateway = self.gateway_factory(
            {"region": region, "device_type": int(device_type), "unit": int(unit)}
        )
        provider_auth = gateway.login(email, password)
        if not provider_auth.get("token") or not provider_auth.get("app_user_id"):
            raise RuntimeError("Speediance did not return a usable session")
        confirmed_unit = gateway.confirm_account_unit(int(unit))
        if confirmed_unit not in {0, 1}:
            raise RuntimeError("Speediance did not confirm the account unit")

        # Password is deliberately discarded here. Only the short-lived provider token is encrypted.
        provider_auth["unit"] = confirmed_unit
        provider_hash = self.vault.blind_index(str(provider_auth["app_user_id"]))
        email_hash = self.vault.blind_index(email)
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
                INSERT INTO speediance_connections(user_id, provider_user_hash, region, device_type, unit, encrypted_auth, connected_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    provider_user_hash=excluded.provider_user_hash,
                    region=excluded.region,
                    device_type=excluded.device_type,
                    unit=excluded.unit,
                    encrypted_auth=excluded.encrypted_auth,
                    updated_at=excluded.updated_at
                """,
                (
                    user_id,
                    provider_hash,
                    region,
                    int(device_type),
                    int(unit),
                    encrypted_auth,
                    now,
                    now,
                ),
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
                "SELECT encrypted_auth, unit FROM speediance_connections WHERE user_id = ?",
                (user_id,),
            ).fetchone()
        if not row:
            raise PermissionError("Speediance account is not connected")
        provider_auth = self.vault.decrypt_json(row["encrypted_auth"])
        provider_auth.setdefault("unit", int(row["unit"]))
        return provider_auth

    @staticmethod
    def _normalize_workout(payload: dict) -> dict:
        name = str(payload.get("name") or "").strip()
        description = str(payload.get("description") or "").strip()
        exercises = payload.get("exercises")
        raw_weight_unit = payload.get("weight_unit", payload.get("weightUnit"))
        try:
            weight_unit = None if raw_weight_unit is None else int(raw_weight_unit)
        except (TypeError, ValueError) as exc:
            raise ValueError("Workout weight unit must be metric or imperial") from exc
        if weight_unit not in {None, 0, 1}:
            raise ValueError("Workout weight unit must be metric or imperial")
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
            if len(sets) > 100:
                raise ValueError(f"Exercise {position} cannot contain more than 100 sets")

            try:
                raw_data_stat_type = exercise.get(
                    "data_stat_type",
                    exercise.get("dataStatType"),
                )
                data_stat_type = (
                    None if raw_data_stat_type is None else int(raw_data_stat_type)
                )
            except (TypeError, ValueError) as exc:
                raise ValueError(f"Exercise {position} has an invalid data stat type") from exc
            if data_stat_type is not None and (
                data_stat_type < 0 or data_stat_type > 99
            ):
                raise ValueError(f"Exercise {position} has an unsupported data stat type")

            normalized_sets = []
            for set_position, item in enumerate(sets, start=1):
                try:
                    reps = int(item.get("reps", 0))
                    weight = float(item.get("weight", 0))
                    mode = int(item.get("mode", 1))
                    rest = int(item.get("rest", 60))
                except (TypeError, ValueError) as exc:
                    raise ValueError(f"Exercise {position}, set {set_position} contains invalid numbers") from exc
                raw_unit = item.get("unit")
                unit = None if raw_unit in (None, "") else str(raw_unit).strip().lower()
                if unit is not None and unit not in {"reps", "sec", "kcal"}:
                    raise ValueError(f"Exercise {position}, set {set_position} has an unsupported unit")
                if (
                    not math.isfinite(weight)
                    or reps < 1
                    or reps > 500
                    or weight < 0
                    or rest < 0
                    or rest > 1800
                ):
                    raise ValueError(f"Exercise {position}, set {set_position} is outside supported limits")
                normalized_set = {
                    "reps": reps,
                    "weight": weight,
                    "mode": mode,
                    "rest": rest,
                }
                if unit is not None:
                    normalized_set["unit"] = unit
                normalized_sets.append(normalized_set)
            preset = exercise.get("preset", exercise.get("preset_id", -1))
            normalized_exercise = {
                "id": int(group_id),
                "title": str(exercise.get("title") or f"Exercise {group_id}").strip()[:120],
                "preset": int(preset if preset is not None else -1),
                "isUnilateralExpanded": bool(exercise.get("isUnilateralExpanded", False)),
                "sets": normalized_sets,
            }
            if data_stat_type is not None:
                normalized_exercise["data_stat_type"] = data_stat_type
            normalized.append(normalized_exercise)
        return {
            "name": name,
            "description": description[:500],
            "weight_unit": weight_unit,
            "exercises": normalized,
        }

    @staticmethod
    def _validate_device_limits(exercises: list[dict], source_unit: int) -> None:
        max_custom_weight = 100.0 if source_unit == 0 else 220.0
        for position, exercise in enumerate(exercises, start=1):
            preset = int(exercise.get("preset", -1))
            if preset not in {-1, 1, 3, 5}:
                raise ValueError(f"Exercise {position} uses an unsupported preset")
            data_stat_type = exercise.get("data_stat_type")
            for set_position, item in enumerate(exercise["sets"], start=1):
                if int(item["mode"]) not in {1, 2, 3}:
                    raise ValueError(
                        f"Exercise {position}, set {set_position} uses an unsupported resistance mode"
                    )
                weight = float(item["weight"])
                if data_stat_type == 6:
                    if not weight.is_integer() or weight < 1 or weight > 10:
                        raise ValueError(
                            f"Exercise {position}, set {set_position} Vita level must be between 1 and 10"
                        )
                elif preset == -1 and weight > max_custom_weight:
                    raise ValueError(
                        f"Exercise {position}, set {set_position} exceeds the device weight limit"
                    )
                elif preset != -1 and (
                    not weight.is_integer() or weight < 1 or weight > 500
                ):
                    raise ValueError(
                        f"Exercise {position}, set {set_position} has an invalid preset counter"
                    )

    def publish_workout(self, user_id: str, payload: dict) -> dict:
        workout = self._normalize_workout(payload)
        workout_id = str(uuid.uuid4())
        now = iso_now()
        with self._connect() as connection:
            connection_row = connection.execute(
                "SELECT unit FROM speediance_connections WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if not connection_row:
                raise PermissionError("Unknown user")
            source_unit = (
                int(workout["weight_unit"])
                if workout["weight_unit"] is not None
                else int(connection_row["unit"])
            )
            self._validate_device_limits(workout["exercises"], source_unit)
            connection.execute(
                """INSERT INTO workouts(
                       id, owner_user_id, name, description, exercises_json,
                       weight_unit, visibility, created_at, updated_at
                   ) VALUES (?, ?, ?, ?, ?, ?, 'public', ?, ?)""",
                (
                    workout_id,
                    user_id,
                    workout["name"],
                    workout["description"],
                    json.dumps(workout["exercises"], separators=(",", ":")),
                    source_unit,
                    now,
                    now,
                ),
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
        result.pop("owner_user_id", None)
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
            "weight_unit": workout["weight_unit"],
            "exercises": workout["exercises"],
        }

    @staticmethod
    def _provider_exercises(
        exercises: list[dict],
        source_unit: int,
        target_unit: int,
    ) -> list[dict]:
        provider = []
        for exercise in exercises:
            preset = int(exercise.get("preset", -1))
            sets = []
            for item in exercise["sets"]:
                converted = dict(item)
                sets.append(converted)
            provider_exercise = {
                "groupId": exercise["id"],
                "title": exercise["title"],
                "preset_id": preset,
                "source_unit": source_unit,
                "target_unit": target_unit,
                "sets": sets,
            }
            if exercise.get("data_stat_type") is not None:
                provider_exercise["data_stat_type"] = int(exercise["data_stat_type"])
            provider.append(provider_exercise)
        return provider

    def install_workout(self, user_id: str, workout_id: str) -> dict:
        workout = self.get_workout(workout_id)
        with self._connect() as connection:
            existing = connection.execute(
                """SELECT * FROM workout_installs
                   WHERE user_id=? AND workout_id=? AND status='installed'""",
                (user_id, workout_id),
            ).fetchone()

        provider_auth = self._provider_auth(user_id)
        gateway = self.gateway_factory(provider_auth)
        gateway.confirm_account_unit(int(provider_auth.get("unit", 1)))
        if existing:
            provider_workouts = gateway.get_user_workouts()
            if any(
                str(item.get("id")) == str(existing["provider_template_id"])
                for item in provider_workouts
            ):
                return dict(existing)
        saved = gateway.save_workout(
            workout["name"],
            self._provider_exercises(
                workout["exercises"],
                source_unit=int(workout["weight_unit"]),
                target_unit=int(provider_auth.get("unit", 1)),
            ),
        )
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
        value = record.get("finishTime") or record.get("endTime") or record.get("date") or record.get("startTime")
        if value in (None, ""):
            raise ValueError("Training record is missing a completion time")
        text = str(value)
        if "T" not in text and " " in text:
            text = text.replace(" ", "T", 1)
        completed_at = datetime.fromisoformat(text)
        if completed_at.tzinfo is None:
            completed_at = completed_at.replace(tzinfo=timezone.utc)
        return completed_at.isoformat()

    @staticmethod
    def _record_duration_seconds(record: dict) -> int:
        if record.get("durationMinute") is not None:
            return int(float(record.get("durationMinute") or 0) * 60)
        return int(float(record.get("trainingTime") or record.get("duration") or record.get("totalTime") or 0))

    def sync_completions(self, user_id: str, start_date: str, end_date: str) -> dict:
        try:
            start = date.fromisoformat(start_date)
            end = date.fromisoformat(end_date)
        except (TypeError, ValueError) as exc:
            raise ValueError("Sync dates must be real ISO calendar dates") from exc
        if start > end:
            raise ValueError("Start date must not be after end date")
        if (end - start).days > 90:
            raise ValueError("Sync range cannot exceed 90 days")

        provider_auth = self._provider_auth(user_id)
        account_unit = int(provider_auth.get("unit", 1))
        gateway = self.gateway_factory(provider_auth)
        gateway.confirm_account_unit(account_unit)
        records = gateway.get_training_records(start_date, end_date)
        with self._connect() as connection:
            installs = [dict(row) for row in connection.execute(
                """SELECT i.*, w.name AS workout_name FROM workout_installs i
                   JOIN workouts w ON w.id=i.workout_id WHERE i.user_id=? AND i.status='installed'""",
                (user_id,),
            )]
            imported = 0
            for record in records:
                if record.get("isFinish") is not None and int(record.get("isFinish")) != 1:
                    continue
                record_template_id = record.get("templateId")
                if record_template_id not in (None, ""):
                    candidates = [
                        item
                        for item in installs
                        if item.get("provider_template_id")
                        and str(record_template_id) == str(item["provider_template_id"])
                    ]
                else:
                    record_title = str(record.get("title") or "").strip()
                    candidates = [
                        item for item in installs if record_title == item["workout_name"]
                    ]
                if len(candidates) != 1:
                    continue
                match = candidates[0]
                provider_record_id = str(record.get("trainingId") or record.get("id") or "")
                if not provider_record_id:
                    continue
                try:
                    raw_capacity = float(record.get("totalCapacity") or 0)
                    duration_seconds = self._record_duration_seconds(record)
                    completed_at = self._record_finished_at(record)
                    completed_date = datetime.fromisoformat(completed_at).date()
                except (TypeError, ValueError, OverflowError):
                    continue
                if (
                    not math.isfinite(raw_capacity)
                    or raw_capacity < 0
                    or duration_seconds < 0
                    or duration_seconds > 86_400
                    or completed_date < start
                    or completed_date > end
                ):
                    continue
                total_volume_lbs = (
                    raw_capacity * 2.2046226218 if account_unit == 0 else raw_capacity
                )
                cursor = connection.execute(
                    """INSERT OR IGNORE INTO completions(
                           id,user_id,workout_id,provider_record_id,completed_at,total_volume_lbs,
                           duration_seconds,verified,provider_summary_json,created_at
                       ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)""",
                    (
                        str(uuid.uuid4()), user_id, match["workout_id"], provider_record_id,
                        completed_at,
                        total_volume_lbs,
                        duration_seconds,
                        json.dumps({
                            "trainingId": record.get("trainingId"), "templateId": record.get("templateId"),
                            "title": record.get("title"), "isFinish": record.get("isFinish"),
                            "sourceUnit": "kg" if account_unit == 0 else "lb",
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
            "display_name": item["display_name"],
            "total_volume_lbs": item["total_volume_lbs"],
            "duration_seconds": item["duration_seconds"],
            "completed_at": item["completed_at"],
            "verified": bool(item["verified"]),
            "attempts": attempts_by_user[item["user_id"]],
        } for rank, item in enumerate(board, start=1)]
