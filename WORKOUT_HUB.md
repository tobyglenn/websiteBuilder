# Speediance Workout Hub — unpublished prototype

A working separate application for:

- connecting an individual Speediance account with its email/password;
- importing and publishing Speediance Manager-compatible workout JSON;
- exporting community workouts as JSON;
- writing a shared workout into the connected user's Speediance custom-workout library;
- reading completed Speediance sessions for the last 90 days;
- matching completed sessions to installed shared workouts;
- producing device-verified per-workout leaderboards ranked by total weight/volume.

The page is intentionally `noindex` and has **not** been deployed. Local route: `http://localhost:4321/speediance/workouts/`.

## Run locally

Terminal 1:

```bash
cd backend
python3 workout_hub_server.py
```

In development, the server creates `backend/.workout-hub-key` with mode `0600` and `backend/workout_hub.db`. Both are gitignored. Production refuses to start without `WORKOUT_HUB_MASTER_KEY`.

Terminal 2:

```bash
cd frontend
npm install
PUBLIC_WORKOUT_HUB_API_URL=http://127.0.0.1:8787/api/workout-hub npm run dev
```

Open `http://localhost:4321/speediance/workouts/`.

## Test and build

```bash
cd backend
python3 -m unittest discover -s tests -v

cd ../frontend
npm run test:workout-hub
npm run build
```

## Credential and leaderboard security

- Passwords are accepted only by `POST /connect`, passed to Speediance login, and immediately discarded.
- Passwords and email addresses are never written to SQLite or logs.
- The returned Speediance token and account identifier are encrypted with Fernet using a server-only key.
- Hub session tokens are returned once and stored only as SHA-256 hashes server-side.
- The browser keeps the hub token in `sessionStorage`, not persistent `localStorage`.
- Validation responses omit submitted input, preventing credential reflection.
- Connection attempts are rate limited.
- Leaderboards only include completed (`isFinish == 1`) sessions fetched from Speediance for a workout the user installed through the hub. There is no manual leaderboard-write endpoint.
- Provider summary storage is deliberately minimized to identifiers and completion metadata.
- Disconnect deletes the encrypted provider connection and all active hub sessions.

## Production configuration

See `backend/.env.workout-hub.example`. Required production settings:

- `WORKOUT_HUB_ENV=production`
- `WORKOUT_HUB_MASTER_KEY` from the deployment secret manager
- `WORKOUT_HUB_DB_PATH` on an encrypted persistent volume with backups
- `WORKOUT_HUB_ALLOWED_ORIGINS` set to the exact frontend origin
- `PUBLIC_WORKOUT_HUB_API_URL` set during the Astro build

Place the API behind HTTPS and a reverse proxy. Run one application instance per SQLite database; SQLite WAL is appropriate for this initial community beta. Move the service repository layer to PostgreSQL before horizontal scaling.

## Provider caveat

Speediance does not currently publish a supported public API for this workflow. The gateway is isolated in `backend/workout_hub/speediance_gateway.py`, uses the request shapes already validated by the existing local Speediance Manager, and returns sanitized errors. A Speediance app update can require gateway maintenance.

## API routes

- `POST /api/workout-hub/connect`
- `GET /api/workout-hub/me`
- `DELETE /api/workout-hub/connection`
- `GET /api/workout-hub/workouts`
- `POST /api/workout-hub/workouts`
- `GET /api/workout-hub/workouts/{id}`
- `GET /api/workout-hub/workouts/{id}/export`
- `POST /api/workout-hub/workouts/{id}/install`
- `POST /api/workout-hub/sync`
- `GET /api/workout-hub/workouts/{id}/leaderboard`
