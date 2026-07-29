from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Annotated, Any

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, SecretStr

from .service import WorkoutHubService
from .speediance_gateway import SpeedianceProviderError


class ConnectRequest(BaseModel):
    display_name: str = Field(min_length=2, max_length=40)
    email: str = Field(min_length=3, max_length=254)
    password: SecretStr
    region: str = Field(pattern="^(Global|EU)$")
    device_type: int = Field(default=1)


class SetPayload(BaseModel):
    reps: int
    weight: float
    mode: int = 1
    rest: int = 60


class ExercisePayload(BaseModel):
    id: int | None = None
    groupId: int | None = None
    title: str = ""
    preset: int | None = None
    preset_id: int | None = None
    isUnilateralExpanded: bool = False
    sets: list[SetPayload]


class WorkoutPayload(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=500)
    exercises: list[ExercisePayload] = Field(min_length=1, max_length=60)


class SyncRequest(BaseModel):
    start_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")


class LoginLimiter:
    def __init__(self, max_attempts: int = 10, window_seconds: int = 900):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.attempts: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        attempts = self.attempts[key]
        while attempts and attempts[0] < now - self.window_seconds:
            attempts.popleft()
        if len(attempts) >= self.max_attempts:
            raise HTTPException(status_code=429, detail="Too many connection attempts; try again later")
        attempts.append(now)


def create_app(service: WorkoutHubService, allowed_origins: list[str]) -> FastAPI:
    app = FastAPI(
        title="TobyOnFitnessTech Speediance Workout Hub API",
        version="0.1.0",
        docs_url=None,
        redoc_url=None,
    )
    app.state.service = service
    app.state.login_limiter = LoginLimiter()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store" if request.url.path.endswith(("/connect", "/me")) else "no-cache"
        return response

    @app.exception_handler(RequestValidationError)
    async def sanitized_validation_error(_request: Request, exc: RequestValidationError):
        safe_errors = []
        for error in exc.errors():
            safe_errors.append({key: value for key, value in error.items() if key not in {"input", "ctx"}})
        return JSONResponse(status_code=422, content={"detail": safe_errors})

    bearer = HTTPBearer(auto_error=False)

    def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
        if credentials is None or credentials.scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Authentication required")
        try:
            return service.authenticate(credentials.credentials)
        except PermissionError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc

    def translate_error(exc: Exception) -> HTTPException:
        if isinstance(exc, SpeedianceProviderError):
            message = str(exc)
            code = 401 if "credentials" in message.lower() or "expired" in message.lower() else 502
            return HTTPException(status_code=code, detail=message)
        if isinstance(exc, PermissionError):
            return HTTPException(status_code=403, detail=str(exc))
        if isinstance(exc, KeyError):
            return HTTPException(status_code=404, detail=str(exc).strip("'"))
        if isinstance(exc, ValueError):
            return HTTPException(status_code=422, detail=str(exc))
        return HTTPException(status_code=502, detail="The Speediance operation could not be completed")

    @app.get("/api/workout-hub/health")
    def health():
        return {"status": "ok", "service": "speediance-workout-hub"}

    @app.post("/api/workout-hub/connect", status_code=status.HTTP_201_CREATED)
    def connect(payload: ConnectRequest, request: Request):
        key = request.client.host if request.client else "unknown"
        app.state.login_limiter.check(key)
        try:
            return service.connect_speediance(
                display_name=payload.display_name,
                email=payload.email,
                password=payload.password.get_secret_value(),
                region=payload.region,
                device_type=payload.device_type,
            )
        except Exception as exc:
            raise translate_error(exc) from exc

    @app.get("/api/workout-hub/me")
    def me(user: dict = Depends(current_user)):
        return {"id": user["id"], "display_name": user["display_name"], "expires_at": user["expires_at"]}

    @app.delete("/api/workout-hub/connection", status_code=204)
    def disconnect(user: dict = Depends(current_user)):
        service.disconnect(user["id"])
        return None

    @app.get("/api/workout-hub/workouts")
    def list_workouts():
        return service.list_workouts()

    @app.get("/api/workout-hub/workouts/{workout_id}")
    def get_workout(workout_id: str):
        try:
            return service.get_workout(workout_id)
        except Exception as exc:
            raise translate_error(exc) from exc

    @app.get("/api/workout-hub/workouts/{workout_id}/export")
    def export_workout(workout_id: str):
        try:
            return service.export_workout(workout_id)
        except Exception as exc:
            raise translate_error(exc) from exc

    @app.post("/api/workout-hub/workouts", status_code=status.HTTP_201_CREATED)
    def publish_workout(payload: WorkoutPayload, user: dict = Depends(current_user)):
        try:
            return service.publish_workout(user["id"], payload.model_dump(exclude_none=True))
        except Exception as exc:
            raise translate_error(exc) from exc

    @app.post("/api/workout-hub/workouts/{workout_id}/install", status_code=status.HTTP_201_CREATED)
    def install_workout(workout_id: str, user: dict = Depends(current_user)):
        try:
            return service.install_workout(user["id"], workout_id)
        except Exception as exc:
            raise translate_error(exc) from exc

    @app.post("/api/workout-hub/sync")
    def sync(payload: SyncRequest, user: dict = Depends(current_user)):
        if payload.start_date > payload.end_date:
            raise HTTPException(status_code=422, detail="Start date must not be after end date")
        try:
            return service.sync_completions(user["id"], payload.start_date, payload.end_date)
        except Exception as exc:
            raise translate_error(exc) from exc

    @app.get("/api/workout-hub/workouts/{workout_id}/leaderboard")
    def leaderboard(workout_id: str):
        try:
            return service.get_leaderboard(workout_id)
        except Exception as exc:
            raise translate_error(exc) from exc

    return app
