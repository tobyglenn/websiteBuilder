# TobyOnFitnessTech — Project Connection Reference

> Last updated 2026-07-30.

This document exists so that any future AI conversation or agent session can
quickly locate the project, connect to the server, and understand the build
pipeline without re-discovering everything from scratch.

## Server

| Field          | Value                                      |
|----------------|--------------------------------------------|
| Hostname       | `dgxspark` / `dgx` / `gx10` (SSH aliases) |
| IP             | `192.168.1.6`                              |
| User           | `toby`                                     |
| SSH Key        | Via NVIDIA Sync (`~/.ssh/config` Include)   |
| SSH Command    | `ssh dgxspark`                             |
| OS             | Ubuntu (DGX Spark / GX10)                  |

## Project Paths

| What              | Path                                                                    |
|-------------------|-------------------------------------------------------------------------|
| Project root      | `/home/toby/.openclaw/workspace/websiteBuilder/`                        |
| Top-level AGENTS  | `/home/toby/.openclaw/workspace/websiteBuilder/AGENTS.md`               |
| Astro source      | `frontend/src/pages/`                                                   |
| Data files        | `frontend/src/data/`                                                    |
| Gear page         | `frontend/src/pages/gear/index.astro`                                   |
| Gear detail page  | `frontend/src/pages/gear/[slug].astro`                                  |
| Gear data         | `frontend/src/data/gearItems.ts`                                        |
| Aggregated stats  | `frontend/src/data/fitnessStats.ts`                                     |
| WHOOP data        | `frontend/src/data/whoop_v2_latest.json`                                |
| Garmin data       | `frontend/src/data/garmin_all_activities.json`                          |
| Speediance data   | `frontend/src/data/speediance_dashboard_data.json`                      |
| 8Sleep data       | `frontend/src/data/eight_sleep_historical.csv`                          |
| Build output      | `frontend/dist/`                                                        |

## WHOOP Data Structure

The WHOOP JSON uses this structure (important for correct data access):

```
whoopData.recovery.records[]   → recovery scores, HRV, RHR
whoopData.sleep.records[]      → sleep data
whoopData.workouts.records[]   → activity/strain data
whoopData.cycle.records[]      → physiological cycles
whoopData.last_synced          → ISO timestamp of last data sync
```

Records are stored **oldest-first** in the file. Sort descending by
`created_at` before slicing for "most recent N" queries.

## Build & Deploy

```bash
# From project root on dgxspark:
cd /home/toby/.openclaw/workspace/websiteBuilder/frontend
npm run build        # Astro SSG → dist/, then pagefind, then indexability audit
```

The site is served by a Python http.server on **port 4331** from the `dist/`
directory:

```bash
# Running process (managed separately, not part of npm scripts)
python3 -m http.server 4331 --bind 0.0.0.0
# Working directory: /home/toby/.openclaw/workspace/websiteBuilder/frontend/dist
```

No server restart is needed after a rebuild — the file server picks up new
files immediately.

### Build break — most common cause

If `npm run build` fails on a fresh checkout, check `src/data/gearItems.ts`
first. Every `value:` field on a `GearMetric` must be a non-empty string
literal — `value: ,` (empty) breaks the build. As of 2026-07-30 this file
has all real values populated.

## URLs

| Environment | URL                                  |
|-------------|--------------------------------------|
| Local LAN   | `http://192.168.1.6:4331/`           |
| Gear page   | `http://192.168.1.6:4331/gear/`      |
| Production  | `https://tobyonfitnesstech.com/`     |

## Key Gear Items

| Slug                                       | Name                                       | Status   |
|--------------------------------------------|--------------------------------------------|----------|
| `codex-antigravity-claude-m3-mac-studio`   | M3 Mac Studio (Codex, Antigravity, Claude)  | current  |
| `hermes-dgx-gx10`                          | GX10 / DGX Spark (Hermes AI)               | current  |
| `openclaw-m1-mac-mini`                     | M1 Mac Mini                                | replaced |
| `whoop-5`                                  | WHOOP 5.0                                  | current  |

The M1 Mac Mini was replaced by the M3 Mac Studio; the GX10 / DGX Spark is
the dedicated on-prem Hermes inference host (also serves this site).

## Tech Stack

- **Framework**: Astro 7.x (SSG mode)
- **UI**: React 19 + Tailwind CSS 4
- **Search**: Pagefind
- **Hosting**: Static files via Python http.server (dev), Cloudflare/Netlify (prod)

## Three-machine setup (Toby's stack)

| Machine          | Local IP       | Role                                                        |
|------------------|----------------|-------------------------------------------------------------|
| M3 Ultra 96GB    | 192.168.1.212  | FLUX, narration, Ken Burns, final video assembly (local)   |
| M4 Max 64GB      | 192.168.1.222  | FLUX generation in parallel (`toby@tobyM4Max.local`)        |
| GX10 / DGX Spark | 192.168.1.6    | Hermes local AI, this site, gear data, fitness pipelines    |

WHOOP, Garmin, 8Sleep, Speediance, and Cronometer data all flow into the
clawd data lake and are surfaced via the website and the daily morning
report (Telegram + email + voice).
