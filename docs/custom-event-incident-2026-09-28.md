# CustomEvent Incident - September 28, 2026

## Status: PARTIAL, Highest Priority

The diagnostic blind spot is repaired and live in source commit `f31921ad41c2c199a9d867be44e7aa6e7d3b5ac9`. The underlying production trigger and visitor impact are **not established or fixed**. Do not close or suppress the PostHog issue on the strength of passing synthetic tests.

[PostHog issue](https://us.posthog.com/project/498166/error_tracking/019fe7cf-330d-7c60-bb61-3b536617c778)

## Verified Evidence

- The email fingerprint matches `CustomEvent captured as exception with keys: isTrusted` exactly.
- September 21-27: 185 exceptions, one tracked identity, three sessions. Including September 28 at investigation time: 194 exceptions, one identity, four sessions.
- Wider August 9-September 28 query: 291 occurrences, one identity, 13 sessions. First seen August 9 at 18:35:40 UTC; latest seen September 28 at 13:22:39 UTC.
- Latest events are desktop Safari on `/blog/openclaw-fitness-reports-garmin-whoop-speediance/`, release `8d0ba655ba359b0c722c306a9b7160910ed6c8da` from September 20.
- That identity's September 19-28 event timeline has one pageview, on September 20 at 18:49:20 UTC, and 220 exceptions from the same release afterward. It also has one header exposure and one next-step exposure. This supports a long-lived/stale page, not hundreds of distinct page failures. It does not establish harmlessness.
- Toby confirmed the affected Safari tab is not his. Do not attribute the identity to Toby or attempt to manipulate a presumed local tab.
- Original and latest session recording lookups both return `recording_not_found`, although exception properties report recording status `active`. No replay was viewed. Current project settings have `maskAllInputs=true`, `maskTextSelector="*"`, and image blocking. Missing replay delivery is not proof that masking is absent or that the browser blocked it.
- No useful originating stack or event payload was retained in the historical exceptions. SDK version on the affected tab is 1.434.2. Its actual exception handler reproduces the same description when given a CustomEvent without a usable error reason; a genuinely rejected CustomEvent can also produce it. Neither reproduction establishes the production cause.

## Shipped Scope

- `frontend/public/js/posthog-analytics.js`: capture-phase browser error/rejection listeners retain structural context until the next task, so the existing PostHog exception is enriched rather than duplicated or suppressed. Native browser dispatch can run microtasks between listeners; a microtask-only cleanup was caught by tests and corrected before commit.
- Added context version, event class/type/trust, reason and detail-reason types, sanitized source frames, page age, visibility and existing release attribution. Unknown custom event names are bucketed as `other`.
- Never collect CustomEvent detail values, arbitrary object keys, input text, raw stacks, URL query strings, fragments, or extension identifiers. Known first-party JS asset paths and line/column numbers can identify a dispatching script. Other sources are categorized. These are diagnostic dispatch frames, not a guaranteed original throw stack.
- Diagnostic state clears on the next task. Ordinary exceptions retain their type/value and normal SDK behavior. Failure inside diagnostics cannot interrupt the browser's existing error handler.
- `frontend/src/components/PostHogAnalytics.astro`: version the loader as `20260928-exception-context` so new page loads do not reuse the previous loader URL.
- `frontend/scripts/tests/exception-context.test.cjs`: Chromium/WebKit regression coverage for SDK-shaped fixtures, the actual 1.434.2 and current exception handlers, synthetic CustomEvents, native rejected CustomEvents, regular errors, throwing getters, stale-context cleanup, source attribution and privacy redaction. Optional live-article tests block all external traffic and keep synthetic errors in memory.

## Verification

- Both browser engines passed exception tests against 1.434.2 and the current downloaded handler (1.434.17 SDK distribution).
- Four existing exposure tests passed at desktop/mobile widths.
- Full isolated build passed: 2,391 sitemap URLs, 2,424 HTML files, 18,781 JSON-LD blocks, 30 Product schemas, no broken internal links.
- Canonical DGX preview rebuilt and `/gear/` returned 200.
- [Deployment 36434933708](https://github.com/tobyglenn/websiteBuilder/actions/runs/36434933708) succeeded. Production article HTML and the live browser capture hook identify release `f31921ad41c2c199a9d867be44e7aa6e7d3b5ac9`, loader `20260928-exception-context`, and context `20260928-browser-event-v1`.
- All 12 focused/regression checks passed on staged output and production, including in-memory reproduction on the actual article in Chromium and WebKit, locale/search flows, and chart/menu regressions. Four separate exposure checks also passed. All third-party requests were blocked during live-site tests; simulated exceptions were retained in memory, not sent to PostHog. These tests establish diagnostic behavior, not a repair of the unknown visitor's trigger or third-party integrations.
- Separate existing rendering issue: long inline code produces a 617px scroll width in the article at a 390px WebKit viewport, identically on production before this release and staged output. The first viewport is readable. No layout code was changed for this incident. This is an independent follow-up, not an explanation of CustomEvent exceptions; the focused capture tests do not certify this article as overflow-free.
- QA logs: `/tmp/website-custom-event-20260928/staged-tests.log` and `production-tests.log` on Toby's Mac. Temporary QA server/tunnel were stopped afterward.

## Next Evidence Required

Inspect a fresh occurrence carrying `exception_context_version=20260928-browser-event-v1`. Use its browser event type, reason type and sanitized source frames to identify the actual failing code or browser-injected context, then reproduce and fix that specific behavior. An old September 20 tab cannot receive this code without reload; old-release events must not be represented as regressions of the new diagnostics. Source maps alone cannot recover a stack that was never captured.

The weekly review automation now explicitly prioritizes repeated unresolved exceptions before SEO, metadata and dashboard cleanup. Single-identity concentration is not a reason to declare an error harmless. The root-cause incident remains open.
