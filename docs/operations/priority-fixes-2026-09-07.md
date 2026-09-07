# Priority fixes - September 7, 2026

## Implemented on DGX

- Garmin sync now derives the profile from the authenticated account, rejects empty daily measurements, preserves cached files, and returns failures even when historical days succeeded.
- Explicit `--force` supports repairing existing days after delayed source uploads. Revalidated August 1 through September 7: 38/38 days saved; 26 previously zero-filled days recovered.
- `garmin_sync_health.json` records timestamps, missing/failed dates and status. Exit 4 bypasses the browser fallback, routes to build-log-errors and holds reports instead of reporting missing data as zero.
- Report extraction uses nightly sleep duration and the correct active-calorie field. Morning HTML regenerated and HTTP-verified on the DGX report server.
- `fitness-reports.service` restores port 8082, starts at boot with user lingering, and restarts after failures.
- Existing unrelated operations changes preserved. Backups are under `/home/toby/.openclaw/backups/garmin-sync-20260907/`.
- `garmin-sync-repair-2026-09-07.patch` records only the repair hunks. Apply to the workspace root with `git apply --unidiff-zero` only against the pre-repair files; the already-installed DGX files must not be patched twice. The unused profile constant deletion is omitted from this public patch.

## Website and analytics

- Homepage distinguishes snapshot build time from the latest workout record, uses Eastern time, and does not call an old streak or focus current. All five homepages disclose older workout coverage.
- Current streak calculation no longer falls back to an old historical streak.
- Events include the deployed Git release and loader version. Exceptions include JSON-LD shape counts; script diagnostics record source path and line without query strings, raw messages, or page content. Replay text/attribute masking remains enabled.
- Four PostHog insights no longer filter out the deployed August 18 versions. Menu results retain schema grouping; all four queries use complete seven-day comparison windows. Saved before/after definitions: `../analytics/dashboard-repair-2026-09-07.json`.

## Verification

- Eight Garmin sync/report regression tests passed on DGX.
- Eight website freshness/schema tests passed.
- Astro build and indexability audit passed: 2,261 HTML files, 2,228 sitemap URLs, no broken internal links, 17,506 JSON-LD scripts.
- Twelve Chromium/WebKit checks across desktop/mobile and home/German home/WHOOP gear passed. Verified release attribution, diagnostic payloads, masking and horizontal overflow; analytics requests were blocked during QA.
- Safari's reopened external metadata-parser issue is NOT declared resolved. New release/markup diagnostics support distinguishing stale markup from a remaining browser-specific failure.

## Still needs follow-up

- GSC's depressed visibility needs a separate live indexing/canonical investigation; today's repairs do not establish its cause.
- WHOOP/Speediance workout coverage remains older than the current Garmin wellness data. Fresh wellness data does not prove that all workouts have been recorded.
