# websiteBuilder — Project Notes for AI Agents

## Start here

Before doing any work in this project, read `frontend/PROJECT_CONNECTION.md`.
It captures server location, project paths, build pipeline, data layout, and
slugs so you do not have to rediscover the same context every conversation.

## Where things live

| What                | Path                                                    |
|---------------------|---------------------------------------------------------|
| Project root        | `/home/toby/.openclaw/workspace/websiteBuilder/`        |
| Astro source        | `frontend/src/pages/`, `frontend/src/data/`             |
| Gear page           | `frontend/src/pages/gear/index.astro`                   |
| Gear data           | `frontend/src/data/gearItems.ts`                        |
| Slug detail page    | `frontend/src/pages/gear/[slug].astro`                  |
| WHOOP JSON          | `frontend/src/data/whoop_v2_latest.json`                |
| Build output        | `frontend/dist/`                                        |
| Live preview        | `http://192.168.1.6:4331/` (DGX Spark)                  |
| Production          | `https://tobyonfitnesstech.com/`                        |

## Build & deploy

```bash
ssh dgxspark
cd /home/toby/.openclaw/workspace/websiteBuilder/frontend
npm run build
```

The site is served by `python3 -m http.server 4331` from `frontend/dist/`. The
file server picks up new files on the next request — no restart needed.

## Recent fixes (2026-07-30)

- `gearItems.ts` had several empty `value:` fields that broke the Astro build
  (Speediance Original, Garmin, 8Sleep). All filled with real numbers.
- `fitnessStats.ts` was imported but missing — created with placeholder
  objects to satisfy the import surface.
- `gearItems.ts` WHOOP 5.0 entry now ships real 30-day metrics
  (62% recovery, 28.0 ms HRV, 72 bpm RHR, 6.6h asleep, etc.) sourced from
  `whoop_v2_latest.json` (1,646 records on file as of 2026-07-30).
- `pages/gear/[slug].astro` now imports `whoop_v2_latest.json` and renders
  a "Live Data" callout on the WHOOP 5.0 detail page with metrics that
  recompute on every build.
- M1 Mac Mini moved from Current Gear → What I Replaced; M3 Mac Studio
  (Codex, Antigravity, Claude) added to Current Gear as the recommended
  replacement. GX10 / DGX Spark (Hermes AI) added to Current Gear.

## Hard-won rules

- `gearItems.ts` must be valid TypeScript — every `value:` needs a string
  literal or the build dies. The empty-value bug is the most common cause
  of a 404 on `http://192.168.1.6:4331/gear/`.
- After editing data files, always run `npm run build` and curl
  `http://192.168.1.6:4331/gear/` to confirm 200 before declaring done.
- WHOOP data refreshes daily via the `nightly_pipeline.sh` cron at
  7:50 PM DGX local. The build does not auto-run after refresh — re-run
  `npm run build` if you want the page to show today’s numbers.
