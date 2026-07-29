from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock
from typing import Annotated, Any

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, SecretStr

from .service import WorkoutHubService
from .speediance_gateway import SpeedianceProviderError

MAX_REQUEST_BODY_BYTES = 2_000_000


class BodySizeLimitMiddleware:
    def __init__(self, app, max_body_bytes: int = MAX_REQUEST_BODY_BYTES):
        self.app = app
        self.max_body_bytes = max_body_bytes

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope.get("method") not in {"POST", "PUT", "PATCH"}:
            await self.app(scope, receive, send)
            return

        headers = {
            key.lower(): value
            for key, value in scope.get("headers", [])
        }
        raw_content_length = headers.get(b"content-length")
        if raw_content_length is not None:
            try:
                content_length = int(raw_content_length)
            except ValueError:
                content_length = -1
            if content_length < 0 or content_length > self.max_body_bytes:
                await self._reject(scope, receive, send)
                return

        received = 0
        body_too_large = False
        response_started = False

        async def limited_receive():
            nonlocal received, body_too_large
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > self.max_body_bytes:
                    body_too_large = True
                    return {
                        "type": "http.request",
                        "body": b"",
                        "more_body": False,
                    }
            return message

        async def tracked_send(message):
            nonlocal response_started
            if body_too_large:
                return
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        await self.app(scope, limited_receive, tracked_send)
        if body_too_large:
            if response_started:
                return
            await self._reject(scope, receive, send)

    @staticmethod
    async def _reject(scope, receive, send):
        response = JSONResponse(
            status_code=413,
            content={"detail": "Request body must be smaller than 2 MB"},
        )
        await response(scope, receive, send)


class ConnectRequest(BaseModel):
    display_name: str = Field(min_length=2, max_length=40)
    email: str = Field(min_length=3, max_length=254)
    password: SecretStr
    region: str = Field(pattern="^(Global|EU)$")
    device_type: int = Field(default=1)
    unit: int = Field(default=1, ge=0, le=1)


class SetPayload(BaseModel):
    reps: int
    weight: float
    mode: int = 1
    rest: int = 60
    unit: str | None = None


class ExercisePayload(BaseModel):
    id: int | None = None
    groupId: int | None = None
    title: str = ""
    preset: int | None = None
    preset_id: int | None = None
    data_stat_type: int | None = None
    dataStatType: int | None = None
    isUnilateralExpanded: bool = False
    sets: list[SetPayload] = Field(min_length=1, max_length=100)


class WorkoutPayload(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=500)
    weight_unit: int | None = Field(default=None, ge=0, le=1)
    weightUnit: int | None = Field(default=None, ge=0, le=1)
    exercises: list[ExercisePayload] = Field(min_length=1, max_length=60)


class SyncRequest(BaseModel):
    start_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")


class LoginLimiter:
    def __init__(
        self,
        max_attempts: int = 10,
        window_seconds: int = 900,
        max_keys: int = 10_000,
    ):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.max_keys = max_keys
        self.attempts: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> None:
        with self._lock:
            now = time.monotonic()
            if key not in self.attempts and len(self.attempts) >= self.max_keys:
                stale_before = now - self.window_seconds
                stale_keys = [
                    stored_key
                    for stored_key, stored_attempts in self.attempts.items()
                    if not stored_attempts or stored_attempts[-1] < stale_before
                ]
                for stale_key in stale_keys:
                    self.attempts.pop(stale_key, None)
                if len(self.attempts) >= self.max_keys:
                    self.attempts.pop(next(iter(self.attempts)), None)
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
        client_host = request.client.host if request.client else "unknown"
        identity_key = service.vault.blind_index(payload.email.strip().lower())
        app.state.login_limiter.check(f"ip:{client_host}")
        app.state.login_limiter.check(f"identity:{identity_key}")
        try:
            return service.connect_speediance(
                display_name=payload.display_name,
                email=payload.email,
                password=payload.password.get_secret_value(),
                region=payload.region,
                device_type=payload.device_type,
                unit=payload.unit,
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

    # Add last so the limit wraps every other user middleware, including
    # BaseHTTPMiddleware, and sees the raw ASGI receive stream first.
    app.add_middleware(
        BodySizeLimitMiddleware,
        max_body_bytes=MAX_REQUEST_BODY_BYTES,
    )
    return app
