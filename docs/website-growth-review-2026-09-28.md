# Website Growth Review - September 28, 2026

## Decision

Ship the verified language-metadata and search fixes, keep the current WHOOP homepage feature unchanged, and continue investigating Google's visibility loss. There is still no defensible evidence that a homepage topic, DNS event, translation rollout, or JavaScript issue caused that loss. Do not publish more generic posts or change canonical policy merely to reduce an exclusion count.

Implementation status below is updated only after live verification. Source deployment: `0d9629f7f68afbd4db33e68cd77aac19c17d394c`. Dashboard change: `OmEMy2Vl`, renamed and successfully queried after saving. Evidence: `docs/analytics/website-growth-2026-09-28.json` and `website-growth-2026-09-28-sources.json`.

## Coverage and Limits

- PostHog project 498166/dashboard 1840395: September 21-27 versus September 14-20, complete UTC calendar days. Saved insights are the primary definitions. Technical SQL diagnostics are explicitly one-off, not governed metrics. The metric catalog scope is unavailable; this does not block saved insights.
- PostHog initially required reauthentication. Toby reconnected it during this review; saved insight reads, error inspection, SQL diagnostics and a dashboard update/readback then worked. The client's `learn` command remains unsupported. One supplemental first-party-resource query subsequently timed out; the principal results were retrieved successfully.
- GSC API snapshot generated September 28: requested September 20-26 versus September 13-19. Only six current final daily rows were returned (September 20-25); September 26 is absent, not proven zero. `comparisonSafe=false`; do not call the nominal week-on-week gain a recovery. Authenticated Chrome account: tobypeters@gmail.com.
- Clarity `comparisonReady=true`: seven daily snapshots dated September 22-28 versus September 15-21. These snapshot windows differ from PostHog and GSC. Daily distinct-user sums are not weekly unique people. No page/device segment reaches 20 reader sessions.
- No session replay was opened: full text masking of replay has not been independently verified. Autocapture `mask_all_text` alone is not proof of replay masking.

## Wins and Risks

| Measure | Current | Prior | Interpretation |
| --- | ---: | ---: | --- |
| PostHog pageviews | 187 | 208 | -10.1%; events, not readers |
| Qualified-engagement events | 18 | 20 | -10%; not a viewer conversion rate |
| Content-card clicks | 2 | 6 | Very small outcome count |
| Video embeds loaded | 11 | 20 | Saved exposure-to-play funnel: 9 people exposed, 2 played (22.2%) |
| Exceptions | 187 | 27 | 185 current events from one Safari identity, three sessions, one OpenClaw page |
| Known-bot-excluded dead clicks | 20 events / 2 people | 10 / 2 | Repeated clicks, not 20 affected readers |
| Resource errors, bot-excluded | 40 / 10 people | 69 / 20 | Top returned resources are third-party scripts, including analytics and YouTube |
| Long tasks, bot-excluded | 69 / 68 people | 62 / 56 | Diagnostic events; not an interaction-failure rate |
| Clarity readers / bots | 127 / 117 | 136 / 42 | Readers -6.6%, bots +178.6%; do not call bot growth audience growth |
| Clarity pages/session | 1.14 | 1.23 | Less exploration |
| Clarity scroll / active share | 29.11% / 27.54% | 30.66% / 45.34% | Corroborating concern, insufficient page-level samples |
| GSC clicks / impressions | 4 / 208 | 2 / 169 | Current window has an absent final daily row |
| GSC CTR / average position | 1.92% / 8.88 | 1.18% / 14.0 | Mix-sensitive, sparse; not a verified recovery |

GSC current impressions are only 1.57% of the fixed August 9-15 reference (13,219). Keep the visibility incident open. Manual Actions and Security Issues both show **No issues detected**, checked in Chrome today.

Newsletter starts, attempts, signups and signup errors; contact intent; affiliate actions; podcast audio/subscribe events; calculator starts/completions/errors; and search performed/result clicks are all zero in both PostHog comparison periods. Outbound clicks are 1 versus 1. These are recorded-event absences, not proof that the controls work or that nobody tried them. No affiliate program was restored.

Next-step funnel: AgentStack 0/4 exposed people, Gym Monster comparison 0/3, WHOOP comparison 0/1. Preserve the existing CTAs; those samples do not justify another copy rewrite. Search has now been exercised in isolated browser QA, without sending synthetic events to production.

Native PostHog `InitialPage` session-derived query was also run separately, with the same complete-week comparison and test-account exclusion. Entrance-associated unique visitors: homepage 11 versus 11; Garmin/WHOOP 4 versus 3; Anthropic refund 4 versus 1; OpenClaw fitness reports 3 versus 3; WHOOP red-day protocol 3 versus 4. These differ from all-pageview rankings. Native bounce figures are small-sample diagnostics, not grounds to rewrite content. Full native results and query are in `website-growth-2026-09-28-entry-pages.json`; this query is not yet a saved dashboard tile.

## Homepage Decisions

The scheduled prompt was stale. Commit `0d2da786caa` changed the feature on September 22 to **WHOOP**, layout `home-2026-09-22-whoop-5-a`, variant `whoop-5-comparison`, test `hero-demand-topic`. Gym Monster remains a separate historical cohort (`home-2026-08-18-gym-monster-a`). The weekly automation now verifies live versions before analysis and preserves both cohorts.

All rows below are desktop. No current mobile section-summary or depth rows were returned; mobile relevance is unknown. Viewers are distinct people; mean seconds are per deduplicated visit. Engagement and CTR use section viewers, not all homepage arrivals.

| Position / purpose | Variant | Unique viewers / visits | Mean visible seconds | Five-second engagement | Viewer CTR | Deepest-reach count* | Decision |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 Hero / orientation | WHOOP | 8 / 11 | 5.8 | 62.5% | 0% | 8 | Insufficient data; keep |
| 2 Articles / discovery | WHOOP | 6 / 7 | 7.7 | 83.3% | 0% | 6 | Insufficient data; keep |
| 3 Training proof / evidence | WHOOP | 3 / 3 | 37.6 | 66.7% | 0% | 3 | Insufficient data; keep consolidated |
| 4 Featured/latest video / viewing | WHOOP | 3 / 3 | 9.5 | 66.7% | 0% | 3 | Insufficient data; keep consolidated |
| 5 Newsletter / signup | WHOOP | 2 / 2 | 4.3 | 50% | 0% | 2 | Insufficient data; keep single block |
| 1 Hero / orientation | Gym Monster | 4 / 6 | 16.5 | 50% | 25% | 4 | Insufficient data; historical cohort |
| 2 Articles / discovery | Gym Monster | 1 / 2 | 5.3 | 100% | 0% | 2 | Insufficient data |
| 3 Training proof / evidence | Gym Monster | No summary | N/A | N/A | N/A | 1 | Insufficient data |
| 4 Featured/latest video / viewing | Gym Monster | No summary | N/A | N/A | N/A | 1 | Insufficient data |
| 5 Newsletter / signup | Gym Monster | 1 / 1 | 5.3 | 100% | 0% | 1 | Insufficient data |

*Depth is from the separate overall-visit summary, not the section-summary denominator. WHOOP: eight people/twelve visits, median deepest position 2, mean maximum scroll 20.4%; Gym Monster: four people/six visits, median deepest position 1.5, mean maximum scroll 16.7%. Event delivery differs; do not combine denominators.

The single Gym Monster hero click reached its destination in 43ms, 1/1 completion. WHOOP has no click denominator. The WHOOP period is under a full week and every section is below 20 unique viewers. Earlier feed-driven baseline also had fewer than 20 per device and contaminated long-tab mean dwell. No keep/promote/remove winner is established, and low-position reach does not imply irrelevance.

## Navigation Decisions

Schema `nav-2026-08-18-comparisons-a`; slot 7 test `primary-slot-7-about-vs-comparisons`, variant `comparisons`. About stays available in the footer and hero.

| Surface/item | Current exposure | Matched viewer CTR / selection | Destination completion | Decision |
| --- | ---: | --- | --- | --- |
| English global brand | 120 people / 126 sessions | 0.8%; one matched click session | 2/2 click sessions arrived, 114ms average | Keep; unmatched/exposure definitions differ |
| Desktop AgentStack, slot 6 | 108 / 111 sessions | 0% | No clicks | Keep access; no winner |
| Desktop Articles, slot 3 | 99 / 102 sessions | 0% | No clicks | Keep archive access |
| Desktop Videos, slot 4 | 99 / 102 sessions | 0% | No clicks | Keep; test search journeys first |
| Desktop Comparisons, slot 7 | 99 / 102 sessions | 0% | No clicks | Insufficient outcome evidence |
| Reviews menu | 3 people / 3 open sessions | 1/3 selected (33.3%) | Compare Trackers 1/1, 256ms | Keep; too small to evaluate menu repair |
| Training menu | 3 / 3 open sessions | 0/3 | None | Insufficient data |
| Projects menu | 3 / 4 open sessions | 1/4 (25%) | 1 Peter Memory Trainer 1/1, 440ms | Insufficient data |
| Mobile primary drawer | 1 person / 1 open session | 0/1 | None | Insufficient data; search repaired separately |
| Hindi brand | 6 exposed people | 16.7% viewer CTR | 1/1, 694ms | Insufficient data |

All five current internal navigation click sessions arrived. English primary items have sufficient exposure but virtually no outcomes: Comparisons 0/99 versus prior 0/87 and historical About 1/139 is not a statistically persuasive content winner. Historical periods are sequential and straddle the September 21 menu fix. Current-page clicks are zero for the listed English primary/brand rows. Translation and mobile samples do not support device or locale winners.

## Google Alerts and Indexing

Read full messages for `from:sc-noreply@google.com newer_than:8d`. Six results, no unread-only filter. Dates below are sender-local PDT.

| Message ID / date | Full subject | Reported issue | Verification and disposition |
| --- | --- | --- | --- |
| `1a0c86f00adbfcaf` / Sep 22 02:25 | Product snippets structured data issues successfully fixed for site tobyonfitnesstech.com | Missing offers/review/aggregateRating, one page | **Passed**. GSC shows 3 valid/0 invalid Product snippets; live Original Gym Monster URL is 200/self-canonical. No invented ratings or offer markup added. |
| `1a0c3ca6f9242b77` / Sep 21 04:46 | We're validating your Product snippets structured data issue fixes for site tobyonfitnesstech.com | Same Product issue | Superseded by September 22 pass. |
| `1a0c3c81481a14f7` / Sep 21 04:44 | We're validating your Page indexing issue fixes for site tobyonfitnesstech.com | Server error (5xx) | GSC validation still Started; episode 103 is currently 200/self-canonical. Monitor existing validation, do not restart. |
| `1a0c0085f38e990f` / Sep 20 11:16 | New reasons prevent pages in a sitemap from being indexed on site tobyonfitnesstech.com | Server error (5xx) | Same incident, current failure not reproduced. |
| `1a0c0085cfe50789` / Sep 20 11:16 | New reasons prevent pages from being indexed on site tobyonfitnesstech.com | Server error (5xx) | Duplicate notification of the above. |
| `1a0c00811127cfcb` / Sep 20 11:15 | Some fixes failed for Page indexing issues on site tobyonfitnesstech.com | Alternate page with proper canonical tag | The previously identified `/videos/?category=all` still returns 200 and canonical `/videos/`. Expected variant; preserve canonical, no blanket validation request. |

GSC indexing last updated September 20: **1,793 indexed / 1,519 excluded**, versus last review's 1,826 / 1,471. Reasons: 315 proper alternates, 91 404s, 384 redirects, 8 noindex, 396 crawled-not-indexed, 320 discovered-not-indexed, 1 5xx, 4 different Google canonicals. This is delayed Google state, not a September 28 live crawl.

The four mismatched canonicals are localized training-log pages, last crawled in July. Inspected Spanish URL: successful fetch, indexing allowed, declared Spanish canonical; Google chose English `/training-log/`. Current Spanish HTML is translated, lang=es and self-canonical. No evidence of a currently wrong canonical tag, so do not canonicalize all translations to English. Revisit Google's next crawl before rewriting useful translations.

404 sample: `/test`, `/activity/sleep`, `/es/podcasts/episode-12/Dale.`, `/pt/podcasts/episode-12/Ok.` all remain 404. Do not redirect junk transcript suffixes to unrelated pages. Generated-site audit finds zero broken internal links; full 91-URL external backlink provenance was not audited.

Video indexing September 23: 347 indexed, 23 not on a watch page (prior 359/24). Product snippets 3 valid/0 invalid; Merchant listings 0/0. Core Web Vitals has insufficient GSC field data. Sitemap index was read September 28, zero errors/warnings, API snapshot 2,384 submitted URLs; today's new build contains 2,391. Legacy sitemap `indexed:0` is not the site's indexed-page count.

Language fix is an accessibility/metadata correction, not a proven ranking-recovery fix. Google determines language algorithmically from content, not the HTML lang attribute; alternate language annotations should be reciprocal. [Google localized-version guidance](https://developers.google.com/search/docs/specialty/international/localized-versions). Preserve supported self-canonicals and existing sitemap language alternates.

## Content and Operations

- Published seven daily blog posts September 21-27, one per day; draft/review/publish logs and commits corroborate delivery and all seven live URLs returned HTTP 200 today. The September 24 post directly addresses Gym Monster 3 Ultra versus keeping the 2S. Do not invent a purchase recommendation beyond Toby's existing source material.
- Blog translations: 206 posts, 824/824 translations, zero remaining or failed tasks at September 28 13:16 UTC. This is coverage, not native-speaker quality approval.
- Video inventory fetched September 28; latest published item September 28, and September 27 content is present. Last week's stale-September-12 inventory concern no longer holds. Podcast 115/116 pages receive traffic; full RSS cadence wasn't separately re-audited this run.
- Both DGX preview and fitness-report services active. Daily draft logs include a transcript-sync partial failure on September 25, but a valid post was generated/reviewed/published that day. It is not a missed publication; a separate source-sync audit remains appropriate if it repeats.
- Small-sample PostHog p75: desktop LCP 1,340ms (9 samples), INP 104ms (7), CLS .0234 (4); mobile LCP 1,391ms (7), INP 130ms (2), CLS 0 (1). Not a CrUX pass declaration.
- Safari concentration: 185 opaque CustomEvent events, one identity/three sessions, OpenClaw fitness reports, release `8d0ba655ba359b0c722c306a9b7160910ed6c8da`. Separate homepage hydration error and script error, one event each on release `6af480583d39893c0d6412e123102b48dd2f76d2`. Representative React stack cannot resolve `client.BwWzwx6w.js` source maps. No verified fix for those residual errors is claimed.
- Clarity corroborates one desktop homepage reader session with two script errors (10 reader sessions total). OpenClaw desktop has three reader sessions, one with two dead clicks. Neither page/device qualifies for a content/layout decision.

## Prioritized Improvements

| # | Status | Improvement | Impact | Evidence / confidence | Effort | Implementation and next measurement |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **IN PROGRESS** | Continue search-loss diagnosis with a fixed healthy reference | High | 208 impressions, only 1.57% of healthy August; cause unestablished / high observation, low causal confidence | Medium | Preserve incident guard; verify missing September 26 final row and recrawls. Don't reset baseline or declare recovery from four clicks. |
| 2 | **DONE** | Correct localized document language and prevent recurrence | High | Live German Speediance declared English; shared Layout default affected untranslated metadata / high | Low | Route-derived default language, preserve explicit locale/region, omit noindex hreflang. Build guard validates locale and existing alternate targets; 17 unit tests and full audit passed. Production release `0d9629f7f68` verified; German, Spanish, Hindi and Portuguese language/canonical/hreflang checks passed in Chromium/WebKit at 390/1440. |
| 3 | **DONE** | Fix mobile search visibility and untrusted URL rendering | High | Mobile shortcut reproduced hidden dialog; raw query was interpolated as HTML / high | Medium | Portal search into document.body; one shortcut owner; textContent for legacy search summary. Production Oura search/result click/no-results and literal injected query checks passed at 390/1440 in Chromium/WebKit without telemetry pollution. Legacy standalone search event coverage remains separate follow-up. |
| 4 | **DONE** | Restore usable analytics and correct misleading dashboard labels | Medium | Connector queries now succeed; saved 'entry pages' was all pageviews / high | Low | Renamed `OmEMy2Vl` to Top pages by pageviews, preserved query/filters, successfully re-executed. A native InitialPage comparison was retrieved separately; saving that entrance-only view as a dashboard tile remains NEXT. |
| 5 | **PARTIAL** | Close legitimate Google alerts and leave expected exclusions alone | High | Product validation passed; 5xx active, July localized canonical decisions / high | Low | Six-message audit, live checks and Chrome inspection complete. Monitor existing validations; investigate backlink value before redirecting old 404s. |
| 6 | **DEFERRED** | Choose homepage/navigation content winners | Medium | WHOOP hero 8 viewers, partial week; Comparisons 0/99 vs About 1/139 / high confidence of insufficient outcomes | Low | Keep WHOOP and all five consolidated sections; preserve About access. Updated automation to detect actual versions. Need a full week and 20 exposed viewers per hero variant, plus meaningful outcomes. |
| 7 | **NEXT** | Add one evidence-led comparison answer to an existing canonical page | Medium | Tonal 1-vs-2 queries 13 combined impressions; warranty post 13; Gym Monster hub 8 PostHog pageviews / medium | Medium | Editorial choice: update warranty/cost/testing boundaries on the existing Tonal comparison, or link Toby's September 24 3 Ultra/2S experience into the Gym Monster hub. No speculative specs, price promises, or new competing hub. |
| 8 | **PARTIAL** | Resolve Safari attribution and verify replay privacy/source maps | Medium | 185 events from one identity; separate one-reader homepage hydration issue / high concentration, low cause confidence | Medium | Preserve diagnostic signals. Confirm fully masked replay settings before targeted viewing; enable authenticated private source-map upload through approved deployment credentials. No guessed code fix or blanket suppression. |
| 9 | **PARTIAL** | Validate search and discovery measurements in real use | Medium | Both weeks have zero search events; controlled modal events verified / high QA, insufficient real use | Low | After deployment watch search_performed, search_result_click, search_no_results by surface/release; instrument standalone search separately, and establish native entrance-page definition. Keep newsletter/podcast/calculator zero-event results marked unvalidated rather than broken. |
| 10 | **NEXT** | Audit sparse query-page anomaly coverage before title changes | Medium | `site:docs.cohere.com "compatibility/v1/models"` has five impressions while anomaly summary is zero / medium | Low | Verify query-page mapping and candidate thresholds for small weeks; do not call this fraud or automatically discard impressions. Preserve raw and adjusted totals. Episodes 25/84 have 15 impressions each, not enough to justify another title rewrite. |

First actions completed: deployed and verified items 2-3; corrected the dashboard label in item 4. Next: preserve item 1's search incident and check new crawl evidence; get Toby's choice for item 7. Previous chart/menu fixes remain in place and passed four production browser/viewport regression cases today. OpenClaw CTA evaluation remains carried forward because current outcome samples are tiny.

## Delivery Evidence

- Code commit: `0d9629f7f68afbd4db33e68cd77aac19c17d394c`, seven files. Reused clean isolated DGX checkout; canonical main fast-forwarded, unrelated local report left untouched.
- Full build: 2,391 sitemap URLs, 2,424 HTML files, 18,781 JSON-LD blocks, 30 Product schemas, zero broken internal links. Seventeen unit tests pass. Four locale/search Chromium/WebKit cases and four chart/menu cases pass.
- [Deployment run 36428350058](https://github.com/tobyglenn/websiteBuilder/actions/runs/36428350058) and [Pages publication 36429869085](https://github.com/tobyglenn/websiteBuilder/actions/runs/36429869085) both succeeded. Production HTML exposes release `0d9629f7f68afbd4db33e68cd77aac19c17d394c` and German Speediance now declares `lang="de"`.
- All eight production browser tests passed: Chromium/WebKit at 390/1440, four localized routes, language/canonical/hreflang checks, literal untrusted search text, keyboard/button search, result/no-result events, charts and menus. No uncaught page exceptions or horizontal overflow in the tested flows. Third-party requests were blocked, so this validates first-party behavior and capture calls, not ingestion or third-party integrations. Production screenshots were visually checked at mobile/desktop sizes. Canonical DGX preview rebuilt; homepage and gear returned 200. QA log: `/tmp/website-review-20260928/production-qa.log` on Toby's Mac.
- [German Speediance](https://tobyonfitnesstech.com/de/speediance/), [search](https://tobyonfitnesstech.com/search/), [homepage](https://tobyonfitnesstech.com/), [weekly dashboard](https://us.posthog.com/project/498166/dashboard/1840395).

Validation assessment: Share with caveats. Current PostHog complete-week boundaries, saved definitions, event/person/session distinctions and code regression tests were checked. GSC coverage is degraded; Clarity has different windows; homepage cohorts are small/mixed; no ranking-recovery or causal claim is supported.
