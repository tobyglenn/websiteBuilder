# Comparison and game-page localization release — 2026-10-13

## Scope

The gym and wearable comparison, Games index, four project guides (Wild Rebellion,
Monstrum World, Ironvane Chronicle and Lilly Plays), seven development-journal
articles, journal index and RSS, homepage games feature, and blog journal link share
the same English source structure across Spanish, German, Brazilian Portuguese and
Hindi. Prices, verdict colors, numbers, device IDs, media identities and analytics
attributes remain source-owned. Translation dictionaries contain only public rendered
copy, never the journal's private editorial `sources` or release receipts.

The homepage video feature alternates latest/popular on each same-tab visit or refresh,
and cycles through the three newest eligible long-form videos and top three by views.
All candidate titles and links are server-rendered; rotation does not depend on crawler
identity. Private browsing or blocked storage falls back to the newest video.

Video `gIJoE1Egkjk` is excluded from the website catalog, generator and feed refresh.
Its removed route returns 404; it is absent from the sitemap and search index. This
exclusion does not delete or modify the YouTube upload.

## Translation maintenance

Run `node scripts/collect-release-messages.mjs` from `frontend` while the established
preview is running on port 4325, then `python3 scripts/translate-release-messages.py`.
The latter uses the configured MiniMax provider through `freecall.runner.call_model`
with an explicit output budget, validates all keys, dollar signs and numeric placeholders,
and promotes only complete four-language catalogs. It resumes from temporary cached
chunks. Review substantive translations before committing.

The production build runs `audit:release-locales` against the actual generated HTML and
all comparison render states. Newly added English journal or comparison copy blocks
deployment until its four translations exist. Static HTML is localized with a parsed
HTML tree; scripts, code, CSS, IDs, telemetry and executable attributes are untouched.
The comparison localizes each interactive update with the same catalog. Header locale
is now correct in server HTML as well as after hydration.

## Analytics findings

Connected PostHog project: 498166 (Default project), verified through the connector.
Seven-day query on October 13 (UTC, current day partial; project test-account filter
applied) recorded 47 hero views, 15 latest-article section views, 8 training-proof views,
6 video-hub views, 4 newsletter views and 2 hero clicks. These are event counts, not
unique readers or a randomized experiment. This sample does not justify a definitive
claim that hero height causes lower engagement. A compact introduction is a design
recommendation to evaluate, not a proven winner. The hero is unchanged in this release.

No `$exception` events or active error-tracking issues appeared in that seven-day window.
There were 16 frontend resource-error events. Available records mostly involve Clarity,
Cloudflare and YouTube resources. The first-party Ironvane Ceryn image returned HTTP 200
on inspection; that does not establish why a prior visitor's request failed.

Existing production analytics intentionally uses masked autocapture and masked replay
(see `posthog-analytics-goals.md` and `posthog-astro-integration.md`); this release does
not change those settings. Comparison tab, device, feature group, differences, reset
and time-period actions use explicit `filter_changed` events. Video rotation emits
`homepage_video_selection`. Editable gym fees are not sent in custom events.

PostHog documentation consulted: https://posthog.com/docs/sql/optimizing-queries
Project: https://us.posthog.com/project/498166

## SEO and release checks

Reciprocal hreflang, self-canonicals, localized internal links, language-specific journal
RSS, sitemap inclusion, structured data, crawlable video links and removed-video
exclusion are checked. IndexNow now uses the required `urlList` payload after deployment,
instead of sending an unsupported `sitemap` field before publishing.

Verification receipts are appended after final builds and production checks.

Local pre-release checks: all 14 JavaScript regression checks, 9 transcript checks and
10 nightly-journal checks passed. The intermediate build found 2,602 sitemap URLs,
2,643 HTML files and zero broken internal links. Final localization checks still gate
release; those intermediate counts are not a production-deployment receipt.

Final canonical DGX build passed with Node 24.21.0 after a clean `npm ci`:
2,603 sitemap URLs, 2,643 HTML files, zero broken internal links, 20,446 JSON-LD
scripts and 30 Product schemas. All 1,479 public messages and interactive states
have complete es/de/pt/hi catalogs. Canonical regression checks also passed.
Browser checks covered Spanish desktop, Hindi mobile, German and Portuguese
game navigation, locale-preserving language switching, and six homepage refreshes.
