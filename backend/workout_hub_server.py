#!/usr/bin/env python3
"""Local/production entry point for the unpublished Speediance Workout Hub API."""

import os
from pathlib import Path

from cryptography.fernet import Fernet
import uvicorn

from workout_hub.api import create_app
from workout_hub.security import CredentialVault
from workout_hub.service import WorkoutHubService
from workout_hub.speediance_gateway import SpeedianceGateway


BASE_DIR = Path(__file__).resolve().parent


def master_key() -> str:
    configured = os.environ.get("WORKOUT_HUB_MASTER_KEY", "").strip()
    if configured:
        return configured
    if os.environ.get("WORKOUT_HUB_ENV", "development").lower() == "production":
        raise RuntimeError("WORKOUT_HUB_MASTER_KEY is required in production")
    key_file = BASE_DIR / ".workout-hub-key"
    if key_file.exists():
        return key_file.read_text(encoding="ascii").strip()
    generated = Fernet.generate_key().decode("ascii")
    key_file.write_text(generated, encoding="ascii")
    key_file.chmod(0o600)
    return generated


def build_app():
    database_path = os.environ.get("WORKOUT_HUB_DB_PATH", str(BASE_DIR / "workout_hub.db"))
    origins = [item.strip() for item in os.environ.get(
        "WORKOUT_HUB_ALLOWED_ORIGINS",
        "http://localhost:4321,http://127.0.0.1:4321",
    ).split(",") if item.strip()]
    service = WorkoutHubService(database_path, CredentialVault(master_key()), SpeedianceGateway)
    return create_app(service, origins)


app = build_app()


if __name__ == "__main__":
    uvicorn.run(
        app,
        host=os.environ.get("WORKOUT_HUB_HOST", "127.0.0.1"),
        port=int(os.environ.get("WORKOUT_HUB_PORT", "8787")),
        log_level=os.environ.get("WORKOUT_HUB_LOG_LEVEL", "info"),
        access_log=False,
    )
