# Gemini site review and release — September 28, 2026

## Release decision

Keep the new project showcase, localized entry pages, video categorization, transcript improvements, and optional light theme. Correct data and interaction defects before publishing. Preserve the current WHOOP homepage experiment, navigation ordering, search repairs, analytics exception diagnostics, and deploy asset retention.

The local checkout started at `f1a5cb2003f9084b125f7eae2cdbb41c14ed6218`, matching origin/main and the clean canonical DGX checkout. Gemini's 51 staged files were reviewed in this checkout. The original staged patch was preserved at `/tmp/website-gemini-review/gemini-original.patch` on the Mac. Original project PNG assets remain available alongside the optimized WebP delivery assets.

## Evidence and decisions

PostHog project 498166 was verified through the connected service. The saved traffic, newsletter, search, and technical UX insights were executed again with September 21–27 and September 14–20 complete UTC periods. Raw results are in [the evidence file](analytics/gemini-review-2026-09-28.json). See also [the full September 28 growth review](website-growth-review-2026-09-28.md) for homepage/navigation denominators and GSC/Clarity limits.

- Pageviews: 187 versus 208. These are events, not verified readers.
- Newsletter and search events remain zero in both periods. This does not establish a broken funnel or justify a conversion-lift claim.
- Exceptions: 187 versus 27. The existing investigation identifies a concentrated Safari CustomEvent incident; this release preserves its diagnostic instrumentation and does not claim to fix its unknown production cause.
- The existing homepage section and navigation outcome samples do not support a new ordering winner. No experiment winner is declared and the WHOOP hero stays in place.

## Review fixes

| Finding | Released behavior |
| --- | --- |
| Generator replaced the fresh 494-video inventory with an older 485-video snapshot and invented subscriber/view counts | Retain fresh metadata, all 494 videos, original dates/titles, and source fetch time; use the saved catalog as a fallback and test deterministic regeneration |
| Generic category-based text was presented as video takeaways | Quote only explicit description bullets; omit takeaways when no source supports them; remove fabricated fallback descriptions |
| Substring category matching treated words containing `ai` or `gi` as topics | Use word boundaries for ambiguous terms and avoid classifying by incidental transcript mentions |
| Form displayed success after both providers failed | Kit response must succeed; failures stay retryable with an accessible error, timeout, and no email values in analytics |
| Blueprint form promised an unverified email/download flow | Link directly to the published transformation guide; preserve the unused SQL proposal under `docs/drafts/email-leads.sql`, outside runnable migrations |
| New workout exports used placeholder exercise IDs and arbitrary weights | Localized `/workout-hub/` pages route to the existing 53-workout catalog, tested JSON export, training page, and transformation timeline |
| Header change reintroduced duplicate mobile search shortcut ownership | Restore one keyboard shortcut owner |
| Manual filter history could race Astro navigation in WebKit | Use Astro navigation, preserve shareable category URLs and Back behavior, and allow Shorts deep links while retaining the long-form default |
| Theme could reset during navigation or make image captions unreadable | Reapply the saved theme after Astro navigation, retain dark as default, keep image captions white, adapt project detail colors, and improve light-theme accents |
| Podcast translation cutoff was hard-coded to episode 116 | Determine translated episode availability from the same pinned feeds used by localized routes |
| New PNG assets totalled 8,583,357 bytes | Generate WebP assets totalling 799,368 bytes (90.7% smaller); use them on the project pages |
| New guide actions lacked measurement | Preserve the existing click schema and add guide item exposure markers; the workout directory also has section exposure tracking |
| Node guidance differed from production | Align `.nvmrc` files and documentation to the workflow's Node 24 |

The three Roblox project identities/root places were checked against Roblox's public game API. Monstrum now links to place 81218380157488. This was an identity/link check, not a gameplay/device test. Unverified locked-60-FPS and universal safety/performance claims were softened.

## Validation before deployment

- Astro sync and full production build completed. Final build used Node 24 and production public analytics/workout feature configuration.
- Indexability audit: 2,404 sitemap URLs, 2,437 HTML files, zero broken internal links, 18,876 valid JSON-LD blocks, 30 Product schemas.
- 12 browser regression cases passed across Chromium/WebKit and 390px/1440px viewports: category links and history, Shorts deep links, theme persistence, newsletter failure/retry/success with mocked Kit responses, source workout downloads, localized metadata, safe search text and events, desktop menus, and localized charts.
- The combined final browser suite also passed two exception-context fixture cases (14 passes total); two optional tests needing a downloaded PostHog SDK fixture were skipped.
- Four analytics exposure/deduplication tests passed. The focused unit suite passed 29 tests with the same two optional SDK cases skipped. Catalog regression passed, including fresh inventory, unchanged source metadata, missing transcript handling, and idempotence.
- Desktop/mobile light-theme screenshots were reviewed for the homepage, start page, workout entry page, projects listing, and Monstrum detail. No horizontal overflow was found in those checked routes.
- `git diff --check` passed.

Browser verification blocks third-party traffic and keeps synthetic capture calls in memory. Newsletter tests do not subscribe anyone and do not establish email delivery or live PostHog ingestion. No ranking recovery, conversion improvement, full-site WCAG certification, or repair of the pre-existing Safari incident is claimed.

Local QA logs and screenshots: `/tmp/website-gemini-review/`. Deployment uses the existing main → GitHub Actions → gh-pages pipeline; the final chat delivery records the successful run and live release verification.
