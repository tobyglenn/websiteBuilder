# Website Growth Review: October 5, 2026

## First Priority: Unresolved Browser Errors

The CustomEvent incident remains **PARTIAL**, not resolved or suppressed. Issue `019fe7cf-330d-7c60-bb61-3b536617c778` has nine occurrences, one person and one session in September 28–October 4; its last occurrence is September 28 at 13:22 UTC, before the diagnostic deployment. No fresh CustomEvent with diagnostic context was found. Silence after deployment does not establish the cause or prove a fix. The affected visitor is not Toby.

There is a separate new failure: 490 `frontend_script_error` signals and nine opaque `Script error.` exceptions in one mobile-Safari OpenClaw article session on October 4. A fully masked replay was available and inspected: 110 seconds, 89 active seconds, 35 clicks; errors begin around 32 seconds. Theme/navigation interaction precedes the burst, but this is not causal proof. The console supplies no source stack. Context version `20260928-browser-event-v1` identifies native `error`, null reason, empty frames and a fresh page about 34 seconds old, on release `283bbd31b19e`. Do not conflate this with the old CustomEvent issue or declare single-person failures harmless.

Seven other exceptions are React hydration mismatches (six Chrome homepage occurrences and one Safari German homepage occurrence); one is a failed dynamic search-module download. The article and homepage error causes remain open. React's [418 reference](https://react.dev/errors/418) identifies a server/client hydration mismatch, but does not identify this site's responsible component or prove browser-extension interference.

## Evidence Windows And Sources

- PostHog project 498166, pinned dashboard 1840395: complete UTC September 28–October 4 versus September 21–27. Connector and authenticated Chrome both worked. Dashboard trends exclude configured test accounts; event identities are not independently certified human readers.
- Verified deployed/source homepage `home-2026-09-22-whoop-5-a`, test `hero-demand-topic`, variant `whoop-5-comparison`; navigation `nav-2026-08-18-comparisons-a`, test `primary-slot-7-about-vs-comparisons`, variant `comparisons`. Prior week contains mixed WHOOP/Gym Monster cohorts, kept separate.
- GSC snapshot generated October 5 at 10:30 UTC: September 27–October 3 versus September 20–26, only six current final daily rows. `comparisonSafe=false`; do not interpret its weekly deltas as a complete comparison.
- Clarity generated October 5 at 09:45 UTC, `comparisonReady=true`: seven provider snapshots September 29–October 5 versus September 22–28. This rolling snapshot window is not PostHog's complete UTC window. No page/device cohort meets 20 reader sessions.
- Gmail scan `from:sc-noreply@google.com newer_than:8d` returned no messages. Therefore no new message IDs, dates, subjects or full-message dispositions exist this week. Existing alerts were corroborated in authenticated Search Console, not treated as fresh emails.

## Wins And Risks

| Signal | Current | Prior | Interpretation |
| --- | ---: | ---: | --- |
| Pageviews / distinct tracked people | 273 / 179 | 187 / 147 | More tracked traffic, not proof of Google recovery |
| Qualified engagement events / people | 32 / 22 | 18 / 16 | Directionally better, small audience |
| Content-card clicks / people | 17 / 3 | 2 / 2 | Most extra clicks are concentrated, not broad adoption |
| Video exposure-to-play people | 12 to 4 (33.3%) | 9 to 2 (22.2%) | Too small to claim a conversion winner |
| Exceptions / people | 26 / 5 | 187 / 2 | Event volume fell but affected identities increased |
| Dead clicks / people | 7 / 3 | 20 / 2 | Count decline does not establish a UX fix |
| Resource failures / people | 30 / 16 | 41 / 11 | Three first-party signals; 27 third-party/other |
| Long tasks / people | 77 / 62 | 69 / 68 | No demonstrated regression threshold |

Three reported first-party resources (episode 50 cover, `clock.CFFmOX_c.js`, `SearchModal.DMsPa6kP.js`) all currently return HTTP 200. A failed fetch is not necessarily a deleted asset. The new search fallback addresses reader recovery, not the download failure's unproven cause. RUM p75 LCP/INP: desktop 456ms/64ms (12/10 samples), mobile 1095ms/88ms (6/5); sparse samples are not a CrUX verdict.

Native InitialPage session-entry queries, not the all-pageview tile: homepage 12 versus 11 people; Garmin/WHOOP explainer 6 versus 4; OpenClaw 5 versus 3; episode 117 5 versus zero; Gym Monster 3/Ultra personal article 4 versus 1; Anthropic refund 3 versus 4. The all-pageviews dashboard tile remains correctly labeled.

Clarity readers 153 versus 127; bots 127 versus 117; pages/session 1.23 versus 1.14; scroll 29.9% versus 29.11%; active engagement 409 versus 328 seconds. Dead-click sessions 9 versus 3, quick-backs 5 versus 1, script-error sessions 5 versus 1. Homepage PC has 15 readers and three bots, four script-error sessions and four quick-back sessions. These deserve technical inspection, not a sample-qualified redesign. Acquisition: direct 114 readers/124 bots, Bing 10/0, DuckDuckGo 7/0, ChatGPT 7/0, Google 6/3. Do not count crawler growth as reader growth.

## Homepage Decisions

Dashboard `KZu0kTpu` deduplicates checkpoint summaries per visit and normalizes engagement/clicks by unique exposed people. Dwell is per visit. Desktop results below; mobile does not have enough matching section-summary data for a comparison. All rows use WHOOP test/variant above. Depth dashboard has ten desktop summary viewers, median deepest position 2; one reached the newsletter, 10% of these viewers. Item exposure includes ten viewers of the WHOOP headline/image and zero clicks; the hero's sole click was a BJJ category link, not the WHOOP feature.

| Position / Section | Purpose | Unique viewers | Avg visible seconds/visit | Five-second engagement | Viewer CTR | Reach among 10 summary viewers | Decision |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 Hero | Orientation | 9 | 49.1 | 55.6% | 11.1% | 90% | Insufficient data; retain WHOOP cohort |
| 2 Latest articles | Discovery | 2 | 7.8 | 50% | 50% | 20% | Insufficient data; keep |
| 3 Training proof | Evidence | 1 | 130.3 | 100% | 100% | 10% | Insufficient data; keep consolidated band |
| 4 Featured/latest videos | Viewer discovery | 1 | 18.7 | 100% | 100% | 10% | Insufficient data; keep single block |
| 5 Newsletter | Conversion | 1 | 3.4 | 100% | 0% | 10% | Insufficient data; keep single homepage block |

Threshold: one complete measured week plus at least 20 unique exposed viewers per compared section/item/cohort, with meaningful outcome counts; verified technical failures are the exception. WHOOP had nine desktop hero viewers now versus eight in its partial prior week; prior Gym Monster had four. No winner, reorder or removal is justified. Low reach at positions 3–5 is not evidence of irrelevance. Training/activity/data, video and newsletter homepage consolidation remains in place; do not reintroduce duplicates.

## Navigation Decisions

All current rows use schema/test/variant stated above. About remains in the footer and hero. Native destination matching shows 100% recorded arrival for seven item/session pairs, including three English brand clicks, one German brand click, AgentStack and two project destinations; actual totals are nine click/arrival events. Average recorded arrival 35–261ms, small sample. Current-page clicks are zero in the reported English primary rows.

| Item/surface | Exposed people | Viewer CTR | Menu open-to-selection | Recorded completion | Decision |
| --- | ---: | ---: | --- | --- | --- |
| English brand/global | 130 | 0.8% | Not a menu | 3/3 sessions | Keep; repeated sessions are not three unique clickers |
| AgentStack/desktop | 118 | 0.8% | Not a menu | 1/1 | Keep |
| Articles/desktop | 96 | 0% | Not a menu | No clicks | Keep; no demonstrated replacement winner |
| Videos/desktop | 96 | 0% | Not a menu | No clicks | Keep |
| Comparisons/desktop slot 7 | 96 | 0% | Not a menu | No clicks | Insufficient outcome evidence; keep experiment |
| Reviews/desktop | 1 opener | Not meaningful | 0/5 opening sessions | No selections | Insufficient data |
| Training/desktop | 1 opener | Not meaningful | 0/5 | No selections | Insufficient data |
| Projects/desktop | 1 opener | Not meaningful | 1/3 (33.3%) | Two project clicks arrived; exposure missing for those items | Insufficient data; investigate missed exposure |
| Mobile primary | 1 opener/viewer | 0% | 0/1 | No selections | Insufficient data |

Prior Comparisons was 0/99; historical About baseline is not a concurrent randomized control. Enough exposures alone do not manufacture outcome evidence. Localized primary items have only 6–8 exposed viewers. Two project click sessions lack matched item exposure, so do not compute their CTR as zero or infinity.

## Search Console, Content And Operations

- API current: two clicks, 284 impressions, 0.704% CTR, position 9.39; prior four clicks/263 impressions, but incomplete current rows prevent a safe weekly comparison. Visibility remains just 2.1% of verified August 9–15 impressions (13,219). Cause still unresolved; no recovery claim.
- Authenticated `tobypeters@gmail.com` indexing UI remains dated September 20: 1,793 indexed, 1,519 excluded; 315 proper alternates (Failed), 384 redirects, 91 404s, eight noindex, 396 crawled-not-indexed, 320 discovered, one 5xx validation Started and four different-canonical validation Started. Do not present stale counts as newly detected failures. Episode 103, the 5xx example, currently returns 200 and its own canonical.
- Manual actions and Security issues both currently show **No issues detected** in authenticated Search Console. This rules out those displayed notices, not all ranking causes.
- Sitemap index is live valid XML pointing to sitemap-0. API reports zero errors/warnings, 2,480 submitted URLs; index submission pending October 5, child read October 4. The API's legacy indexed=0 is not site-wide indexed pages.
- GSC demand is small: Tonal 1 vs 2 eight impressions; Gym Monster reviews six; WHOOP upgrade policy five; reverse Tonal comparison four; AEKE vs Speediance three. AgentStack hub has 30 impressions and zero clicks. One excluded anomaly impression; `site:docs.cohere.com "compatibility/v1/models"` still appears with four impressions and needs classification review, not assumed genuine product demand.
- Daily pipeline: six successful publication log entries September 29–October 4. September 28 failed because thumbnail Python could not import PIL; the reviewed draft published September 29. Do not claim 7/7 daily success. Verify the worker's actual interpreter and failure-routing environment permanently, rather than installing a package in an unrelated Python.
- All six logged publication URLs were fetched successfully with HTTP 200. The recovered `mflx3omqzw` alias points canonically to `speediance-gym-nano-vs-voltra-clone-controversy`. Thumbnail invocation currently uses bare `python3`; interactive DGX `/usr/bin/python3` imports Pillow 10.2.0 successfully. That does not prove a dependency preflight exists in the scheduled worker.
- Translation worker status October 5: 212 posts, 848/848 translations, zero remaining or failed. Counts do not certify translation editorial quality or Google indexing. Recent episode 117/118 entrances include translated locales.
- DGX canonical checkout was clean, fast-forwarded to the repair commit. Fitness reports service active; the previously documented preview service/4331 listener was absent. Production is GitHub Pages, not that preview. No production outage was inferred from the missing LAN preview.

## Prioritized Improvements

| Priority | Status | Improvement | Impact / Evidence / Confidence / Effort | Implementation And Measurement |
| --- | --- | --- | --- | --- |
| 1 | **PARTIAL** | Attribute and fix CustomEvent plus opaque Safari burst | High / actual unhandled errors and masked replay / high on incident, low on cause / medium | Keep both issues open; compare fresh context, browser, page age, release, people and sessions. No suppression. Root cause and impact are not established. |
| 2 | **DONE** | Correct source-less script-error attribution | High / 490 events previously mislabeled as article-source errors / high / low | `posthog-analytics.js` leaves missing filename empty, adds `error_source_known` and `error_opaque`; version `20261005-error-attribution`. Commit `b3099839230`, production browser tests and live loader verified. Original exceptions/events preserved. Fresh reader arrival is still to be measured. |
| 3 | **DONE** | Fix article mobile horizontal overflow | High / reproduced 617px document at 390px screen / high / low | Markdown layout wraps long prose/code tokens; preformatted code remains locally scrollable. Commit `b3099839230`; production 390/1440 Chromium/WebKit tests pass, mobile document width now 390px. |
| 4 | **DONE** | Recover failed search-module loads | High / live failure and isolated fault injection / high / low | Commit `b3099839230`: error boundary retains original exception, emits `search_load_failed`, offers standalone search, reload and close; keyboard/portal retained. Production fault-injection and normal search tests pass. Root download failure remains unproven. |
| 5 | **NEXT** | Attribute homepage hydration errors | High / seven #418 occurrences / medium / medium | Map retained release assets and inspect masked homepage replay/component context. Reproduce with locale/theme/navigation before changing rendering; clean browser QA alone does not close the incident. |
| 6 | **PARTIAL** | Complete visibility/canonical investigation | High / impressions still 2.1% of healthy reference / high on drop, low on cause / medium | Refresh final daily data and crawl/inspection evidence; separate expected alternates from wrong canonicals. Await validation, preserve self-canonicals where correct; no blanket redirects or new validation requests. |
| 7 | **DEFERRED** | Decide WHOOP vs Gym Monster homepage feature | Medium / nine WHOOP hero viewers, zero feature clicks / low / low | Keep versioned cohort; require 20 exposed people each and a full week. Do not use BJJ category click as WHOOP conversion. |
| 8 | **DEFERRED** | Decide Comparisons vs About primary slot | Medium / 0/96 current and 0/99 prior Comparisons viewers / low / low | Keep experiment; assess qualified destination journeys, not exposure alone. Fix project exposure matching in a separate instrumentation pass. |
| 9 | **NEXT** | Harden daily thumbnail environment and publishing proof | High / September 28 PIL import failure, subsequent recovery / high / low | Add interpreter dependency preflight to the actual scheduled worker and test nonzero failure routing. Corroborate six published URLs; do not silently count a recovered draft as same-day success. |
| 10 | **NEXT** | Improve search/entry reporting and demand-led answer content | Medium / one search open, no searches; Tonal/WHOOP demand, tiny volumes / medium / medium | Add native entrance tile and validate standalone search telemetry. Review anomaly classifier coverage. Editorial decision: extend existing Tonal warranty comparison or WHOOP upgrade-policy answer with Toby's verified ownership experience; defer title rewrites until complete data. |

First three changes this week: source attribution, article containment and search recovery. These are reversible technical repairs supported without editorial speculation. Next content ideas: an ownership-cost/warranty answer in the existing Tonal comparison cluster; a WHOOP upgrade-policy answer with dated manufacturer policy; connect the existing Gym Monster Ultra decision and Gym Nano/VOLTRA posts to their comparison hub. Do not publish unverified pricing, policy or personal claims.

## Analytics Gaps And Delivery

Search performed/result/no-results have no real-reader arrivals; one search-open event is not successful search. Newsletter, contact, calculator and native podcast play/completion events remain zero; podcast audio clicks are two. Next-step funnel: WHOOP comparison 2 viewers/1 click, AgentStack 4/0, Gym Monster 3/0; samples do not justify another CTA rewrite. Affiliate programs remain removed; dashboard's legacy affiliate series is not authority to restore links.

Build/source evidence: commit `b309983923051b8446affbde14f4991944b9997a`, canonical DGX synchronized. Astro build, Pagefind (2,499 indexed pages) and indexability audit passed (2,484 sitemap URLs, 2,519 HTML, 19,509 JSON-LD scripts, 30 Product schemas, zero broken internal links). Local build uses offline QA analytics key only; no generated QA output is deployed. CI builds source with its production configuration and Node 24. Twelve browser tests passed: eight exception/recovery/containment tests plus four locale/search success/no-results/telemetry tests, Chromium/WebKit at 390/1440. All external analytics blocked; synthetic errors retained in memory.

Deployment workflow [37316842908](https://github.com/tobyglenn/websiteBuilder/actions/runs/37316842908) and Pages workflow [37317481805](https://github.com/tobyglenn/websiteBuilder/actions/runs/37317481805) both succeeded. Live homepage identifies release `b309983923051b8446affbde14f4991944b9997a` and analytics `20261005-error-attribution`; live JS contains the attribution fields. All twelve production browser tests passed, with external telemetry blocked and original exceptions retained in memory. Code: `frontend/src/components/Search.jsx`, `frontend/src/layouts/MarkdownBlogPostLayout.astro`, `frontend/public/js/posthog-analytics.js`, loader and two browser test files.

Live verification: [OpenClaw article](https://tobyonfitnesstech.com/blog/openclaw-fitness-reports-garmin-whoop-speediance/), [standalone search](https://tobyonfitnesstech.com/search/), [homepage](https://tobyonfitnesstech.com/). Priorities 2–4 are DONE as bounded repairs; priority 1 remains PARTIAL and is first investigation next week. No new editorial copy, affiliate links, ranking claims, exception suppression or incident resolution was published.
