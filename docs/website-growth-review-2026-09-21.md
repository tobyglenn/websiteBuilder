# Website Growth Review - September 21, 2026

## Decisions First

Three improvements selected: repair translated Speediance charts, repair desktop menu click behavior, and correct the remaining homepage item/depth dashboard denominators. The homepage feature and primary slot remain unchanged. Google search visibility is still an open incident; none of these fixes establishes its cause or proves recovery.

PostHog project 498166, dashboard [Website Growth Weekly Review](https://us.posthog.com/project/498166/dashboard/1840395). Evidence and before/after dashboard SQL: [analytics/website-growth-2026-09-21.json](analytics/website-growth-2026-09-21.json). [GSC/Clarity snapshots](analytics/website-growth-2026-09-21-sources.json). Previous review: [September 14](website-growth-review-2026-09-14.md).

## Measurement Boundaries

- PostHog: complete UTC calendar days September 14-20 versus September 7-13. Saved trend/funnel queries were explicitly date-filtered; SQL insights exclude today. These are observed analytics identities, not verified humans. Diagnostic queries and repaired SQL exclude PostHog-known bots, but blockers and unidentified automation remain limitations.
- GSC: final available complete days September 13-19 versus September 6-12; generated September 21. Do not combine its totals with differently dated analytics sessions.
- Clarity: `comparisonReady=true`, seven daily exports collected September 15-21 versus September 8-14. Collection-day rolling snapshots are not identical to PostHog calendar days. Daily distinct-user sums are not weekly unique people.
- Layout decisions require at least 20 distinct exposed people per compared section/item and a complete measured week. That is an eligibility floor, not proof of significance. Clarity requires 20 reader sessions per page/device; none qualifies this week. High-confidence reproducible technical failures can be repaired below those thresholds.
- Current experiments remain `hero-demand-topic` / `gym-monster-comparison` / `home-2026-08-18-gym-monster-a`, and `primary-slot-7-about-vs-comparisons` / `comparisons` / `nav-2026-08-18-comparisons-a`. Attribute the September 21 menu repair by release, not by inventing a content winner.

## Wins And Risks

| Signal | Current | Prior | Interpretation |
| --- | ---: | ---: | --- |
| PostHog pageviews | 208 | 192 | +8.3%; not a measure of Google recovery |
| Qualified-visit events | 20 | 24 | -16.7%; 9.6% versus 12.5% of pageviews, not a session conversion rate |
| Content clicks / CTA clicks | 6 / 0 | 3 / 5 | Discovery improved in raw counts, generic next-step activity did not |
| Video embeds loaded | 20 | 14 | Exposure is not playback |
| Video exposure-to-play funnel | 3 of 8 people, 37.5% | Prior saved review: 0 of 7 | Current funnel verified; too small for content ranking |
| Newsletter starts / attempts / signups | 0 / 0 / 0 | 0 / 0 / 0 | No measured conversion; not proof the form is broken |
| Podcast audio/native plays/completions/platform clicks | 0 / 0 / 0 / 0 | 1 / 0 / 0 / 1 | No current consumption signal |
| Search performed / result clicks | 0 / 0 | 2 / 0 | No current search-success denominator |
| Calculator starts / completions / errors | 0 / 0 / 0 | 0 / 0 / 0 | No observed demand this week |
| Contact / affiliate / outbound clicks | 0 / 0 / 1 | 1 / 0 / 2 | Affiliate zero is expected after program removal; do not restore affiliate links |
| GSC clicks / impressions | 2 / 169 | 3 / 281 | Impressions -39.9%; still only 1.28% of the August 9-15 reference of 13,219 |
| GSC CTR / position | 1.18% / 14.0 | 1.07% / 8.52 | Tiny/mixed populations; no evidence for new title winners |
| Clarity reader / bot sessions | 136 / 42 | 133 / 138 | Readers +2.3%, bots -69.6%; total traffic changes are misleading without separation |
| Clarity pages/session / scroll depth | 1.23 / 30.66% | 1.29 / 39.83% | Directional, not evidence to remove lower homepage sections |
| Clarity active engagement / total seconds | 448 / 988 | 424 / 1,146 | Active share 45.3% versus 37.0% |
| Clarity dead-click sessions | 10 (7.35%) | 6 (4.51%) | Page/device samples too small for layout decisions |
| Clarity script-error sessions | 0 | 2 | Does not contradict PostHog: different collection coverage/windows |

Other Clarity signals: one rage-click session in each period (2 versus 3 events), quick-backs 4 versus 6 sessions, zero excessive-scroll/error-click sessions. Acquisition: direct 99 reader sessions, ChatGPT 12 across two classifications, Bing organic 6, Google organic 4, DuckDuckGo 2, Ecosia 2. Homepage mobile friction involves only four reader sessions, three with dead clicks: a replay lead, not grounds for a redesign.

Publishing is healthy: seven daily blog commits September 14-20, all publish-stage builds passed. Most recent is `620cb84aca2`, September 20. Translation monitor: 199 posts, 796/796 translations, zero remaining and zero failures; priority pages 20/20 translations, five published pages. Daily output does not imply Google indexes or rewards each new page.

Other cadence checks: the [AgentStack source feed](https://raw.githubusercontent.com/grayking-creator/openclaw-podcast/main/feed.xml) lists episode 113 on September 17 and episode 114 on September 19. The website video inventory contains 485 videos and was fetched September 21, but its newest publication is September 12 and it contains zero September 14-20 videos. This is an inventory observation, not confirmation of a YouTube outage or proof no new upload exists; verify against the channel before modifying ingestion. The separate fitness-podcast feed was not individually audited this run.

## Homepage Decisions

Section summaries deduplicate within a visit; people are distinct analytics identities. Average visible time is per visit. Engagement is the share of section viewers with five seconds; CTR is matched clickers divided by section viewers. All current sections carry the hero test ID/variant above. D/M means desktop/mobile; a dash means no observed section-summary sample, not a measured zero response.

| Position / Section | Purpose | D/M unique viewers | D/M average visible seconds | D/M five-second engagement | D/M viewer CTR | Deepest-position reach D/M | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Hero and featured story | Orientation | 7 / 1 | 5.4 / 4.3 | 100% / 100% | 0% / 0% | 7 / 1 | **Insufficient data**; retain Gym Monster feature |
| 2 Latest articles | Content discovery | 2 / - | 62.8 / - | 100% / - | 0% / - | 3 / 0 | **Insufficient data**; keep position |
| 3 Current training proof | Training evidence | 1 / - | 254.8 / - | 100% / - | 100% / - | 2 / 0 | **Insufficient data**; one clicker is not a winner |
| 4 Featured/latest videos | Video discovery | 1 / - | 5.0 / - | 100% / - | 0% / - | 2 / 0 | **Insufficient data**; keep consolidated block |
| 5 Newsletter | Conversion | 1 / - | 1.2 / - | 0% / - | 0% / - | 1 / 0 | **Insufficient data**; keep single block |

Deepest-position counts use the separately collected page-exit summaries: nine desktop people/20 visits and two mobile people/14 visits. Desktop reach is 77.8%, 33.3%, 22.2%, 22.2%, 11.1%; mobile 50%, 0%, 0%, 0%, 0%. These are depth proxies, not direct section visibility. Summary delivery can differ from item/section event delivery; do not silently substitute denominators. Median deepest position is desktop 2, mobile 1. Mobile maximum-scroll telemetry is zero despite hero observations: verify this instrumentation before using it as an abandonment measure.

Corrected item exposure insight: desktop Gym Monster image and text link each had eight distinct viewers (13 viewing visits), zero matched clickers; mobile one viewer. A mobile hero click did arrive at the comparison page, but has no matching item exposure in that visit and is explicitly flagged rather than counted as conversion. The training link also reached its destination. Both observed homepage click journeys completed; this does not establish broad reliability.

Historical feed-driven hero, August 11-17: 11 desktop viewers, 36.4% five-second engagement, zero CTR; four mobile viewers, 25% engagement/CTR. Desktop mean dwell was an implausible 39,213.9 seconds versus median 2.3, predating visibility fixes. Do not compare that mean to today's corrected timing. Both historical and current samples fail the 20-person threshold. No promote/reorder/remove decision is justified this week. Overlapping training/video/newsletter blocks remain consolidated.

## Navigation Decisions

Current schema/test/variant are stated above. Exposure-matched CTR excludes current-page clicks. Destination completion uses click sessions and is a separate measure. English primary items are listed separately from translated items; do not add locale identities together.

| Surface / Item or menu | Exposure or openers | Matched selection / CTR | Arrival | Decision |
| --- | --- | --- | --- | --- |
| Global brand | 109 people / 113 sessions | 2 matched sessions; viewer CTR 1.8%; 5 current-page clicks separate | 2/2 | **Keep**; orientation, not content preference |
| Desktop AgentStack, slot 6 | 98 people / 100 sessions | 0 / 0% | No click denominator | **Keep**; no winner claim |
| Desktop Articles, slot 3 | 87 people / 89 sessions | 0 / 0% | No click denominator | **Keep**; preserve archive access |
| Desktop Videos, slot 4 | 87 people / 89 sessions | 0 / 0% | No click denominator | **Keep**; compare after menu repair |
| Desktop Comparisons, slot 7 | 87 people / 89 sessions | 0 / 0% | No click denominator | **Insufficient outcome evidence**; keep test running |
| Desktop Reviews menu | 6 people / 7 open sessions | 3 matched selection sessions, 42.9% | English Speediance 2/2; German Speediance 1/1 | **Keep; repair click interaction** |
| Desktop Training menu | 7 people / 7 open sessions | 1 matched selection session, 14.3% | PR Board 1/1; German Training 1/1 | **Keep; repair click interaction** |
| Desktop Projects menu | 6 people / 6 open sessions | 1 matched selection session, 16.7% | Pokemon project 1/1 | **Keep; repair click interaction** |
| Mobile primary | 1 exposed person and 1 open session | 0 selection | No click denominator | **Insufficient data** |

Submenu items are tiny: English Speediance 3 exposed people/2 matched click sessions (66.7%); Pokemon 3 exposed people and an unmatched click; PR Board 2 exposed people and an unmatched click. Do not classify unmatched clicks as broken navigation: faster-than-impression clicks can arrive successfully. Translated primary exposure is Portuguese 6, German 5, Hindi 4, Spanish 4, with zero clicks. All eight observed current navigation click sessions in the arrival table reached their destination; no active completion defect is established.

Recomputed historical About baseline, August 11-17: **139 English desktop viewers, one matched click, 0.7% CTR** (not the old visit-based 217-viewer comparison). Current Comparisons: 87, zero, 0%. Both pass exposure eligibility but one versus zero clicks is inconclusive; the periods are sequential, not randomized, and straddle the search collapse. About remains accessible elsewhere. First-pointer-click failure in hover-open menus was independently reproduced and repaired; segment the next review by the new release.

## Search Console Email Audit

Gmail query: `from:sc-noreply@google.com newer_than:8d`. All seven matching messages were read in full. Times below preserve Gmail's displayed UTC-07 offset. Alerts were verified against authenticated GSC and live output before disposition; none was treated as an instruction to change canonical policy.

| Message ID / Date | Full subject | Reported issue | Verification / disposition |
| --- | --- | --- | --- |
| `1a0c3ca6f9242b77` / Sep 21 04:46 -07 | We're validating your Product snippets structured data issue fixes for site tobyonfitnesstech.com | Missing offers/review/aggregateRating, one page | GSC names `/gear/speediance-gym-monster-original/`, last crawl Aug 7. Live 200 contains a Review and reviewRating; existing `gear/[slug].astro` supplies it. Validation already started Sep 21. **Await Google; no new repair claimed.** |
| `1a0c3c81481a14f7` / Sep 21 04:44 -07 | We're validating your Page indexing issue fixes for site tobyonfitnesstech.com | Server error 5xx, one page | `/podcasts/episode-103/`, last crawl Sep 17. Live 200, self-canonical, sitemap/build audit healthy. Validation started Sep 21 before this review. **Monitor; no evidence of a current reproducible 5xx.** |
| `1a0c0085f38e990f` / Sep 20 11:16 -07 | New reasons prevent pages in a sitemap from being indexed on site tobyonfitnesstech.com | Server error 5xx | Same episode 103 incident. **Consolidated with validation above.** |
| `1a0c0085cfe50789` / Sep 20 11:16 -07 | New reasons prevent pages from being indexed on site tobyonfitnesstech.com | Server error 5xx | Same property-wide alert. **Duplicate lead, not another failing URL.** |
| `1a0c00811127cfcb` / Sep 20 11:15 -07 | Some fixes failed for Page indexing issues on site tobyonfitnesstech.com | Alternate page with proper canonical tag | Validation started Aug 10, failed Sep 19. Exact failed URL `/videos/?category=all`, crawled Sep 17; 324 others remain pending. Live URL is 200 with canonical `/videos/`, an intentional equivalent default filter. **Expected alternate; do not restart blanket validation or remove the canonical.** |
| `1a0a4f05237251db` / Sep 15 05:00 -07 | Merchant listings structured data issues successfully fixed for site tobyonfitnesstech.com | Missing image, four pages | Google confirms validation passed after September 14 repair. **Resolved**, code `1ee3bdfbbeb`; this is a confirmed win, not a new fix this week. |
| `1a0a033485d77aa7` / Sep 14 06:55 -07 | We're validating your Merchant listings structured data issue fixes for site tobyonfitnesstech.com | Missing image, four pages | Superseded by September 15 successful validation. **Closed.** |

GSC snapshot, last indexing update September 17: 1,826 indexed; 1,471 not indexed: 325 alternates, 91 404, 385 redirects, 8 noindex, 362 crawled-not-indexed, 295 discovered-not-indexed, 1 5xx, 4 Google-chosen-canonical duplicates. Those categories are not all defects. The four canonical mismatches and remaining 404 samples are carried forward, not declared solved.

Sitemap API: index successfully read September 21, zero errors/warnings, 2,332 submitted at export time. Build later contains 2,337 sitemap URLs and 2,370 HTML files, with zero broken internal links. The legacy sitemap API `indexed: 0` field is not a sitewide indexed-page count. Video report September 16: 359 indexed, 24 excluded because video is not on a watch page. This can be correct for supporting embeds; inspect watch-page examples before changing templates. GSC has insufficient field data for both desktop/mobile Core Web Vitals.

Google explicitly distinguishes valid alternate/redirect exclusions from indexing defects. See [Page indexing guidance](https://support.google.com/webmasters/answer/7440203), [Product snippet requirements](https://developers.google.com/search/docs/appearance/structured-data/product-snippet), and [traffic-drop diagnosis](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops). The mid-August loss remains unexplained; do not infer a penalty, DNS cause, or algorithm attribution from timing alone.

## Technical Evidence

- PostHog exceptions: 27 versus 7 in dashboard events. **26 current exceptions belong to one Safari person/session**, `CustomEvent captured exception keys: isTrusted`, on the OpenClaw article, no stack. The remaining one is `Chart is not defined` on `/de/speediance/`, September 18; the localized template used a CDN global during Astro client navigation. English already used the bundled library.
- Known-bot-filtered diagnostics: dead clicks 10 events/2 people versus 28/6; no current rage clicks versus 2/1; resource failures 69/20 versus 43/15; long-task observations 62/56 versus 42/34. These counts differ from unfiltered dashboard counts and must be labeled.
- Live rechecks: `Layout.DRXCgHQa.css`, last week's three retained `_astro` files, episode 113 cover, and episode 103 all return 200. Failures also include third-party PostHog/Clarity scripts; blockers/network failure must not be relabeled missing application assets. Do not suppress them globally.
- Current p75 observations: desktop LCP 1,302ms (11 samples), INP 60ms (8), CLS 0.00026 (9); mobile LCP 646ms (9), INP 48ms (2), no CLS. Small and partially sampled; these are not a passing CrUX assessment. Homepage desktop long tasks: 12 observations/six people, p75 157ms.
- Source-map resolution still fails for the ClientRouter frame. Build/upload configuration and credentials have not been repaired. Existing release properties help identify a build but do not replace source maps.
- Connector access worked for all principal queries and both dashboard updates/readbacks, then returned a reauthentication requirement during a supplemental dead-click query. Chrome PostHog login was refreshed successfully using the existing Google account. The Safari issue was confirmed in UI; no replay was opened because full replay masking was not independently verified. Keep this gap explicit rather than claiming a replay diagnosis.
- The saved "Top entry pages" result is labeled Pageviews and its breakdown sums to all 208 pageviews. This review uses it only as a top-page ranking, not a verified session-entrance ranking. Validate its saved definition or replace it with first-page-per-session logic before making entrance-specific decisions.

## Prioritized Improvements

| # | Status | Improvement | Impact | Evidence / confidence | Effort | Implementation and measurement |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **IN PROGRESS** | Continue the search-loss investigation | High | 169 impressions, 98.7% below healthy reference; cause still unestablished / high observation, low cause confidence | Medium | Keep fixed August reference alert; compare query/page/device/country and crawl history around Aug 15-18. Monitor existing 5xx validation and inspect four mismatched canonicals. Recovery requires multiple complete weeks, not a small CTR rise. |
| 2 | **DONE** | Repair translated Speediance charts | High | Actual German ReferenceError; all four translations retained CDN-global pattern / high | Low | Bundled Chart.js, Astro page-load initialization, destroy prior instances. Commit `e01db8a6ffc`; production release and all four locales verified. Measure recurrence by page/release, not just exception volume. |
| 3 | **DONE** | Fix desktop menu click-after-hover | High | Browser regression reproduced menu closing on first click / high | Low | Preserve first pointer click after hover-open, allow second click and keyboard toggle. Same commit; production regression spans Chromium/WebKit and mobile/desktop. Compare open-to-selection after release. |
| 4 | **DONE** | Finish homepage dashboard normalization | Medium | Item 'viewers' were visit IDs; depth used rolling days / high | Low | Updated `sc2ADZSP` and `ziC1zv5c`, then executed saved insights successfully. Distinct people versus visits, same-visit matched clickers, unmatched-click diagnostic, complete weeks, known-bot exclusion. Before/after SQL and results archived with this memo. |
| 5 | **PARTIAL** | Close legitimate GSC alerts without damaging canonical policy | High | Merchant validation passed; Product/5xx validations active; failed default-filter alternate is intentional / high | Low | Seven-email audit above. Existing live Review and episode 103 verified. No fabricated ratings, blanket alternate validation, or unnecessary redirects. Await Google result for active validations. |
| 6 | **DEFERRED** | Change homepage prominence or remove sections | Medium | Hero 7 desktop summary viewers; later sections 1-2; old dwell contaminated / high confidence of insufficient evidence | Low | Keep Gym Monster, consolidated proof/video/newsletter. Revisit after 20 distinct viewers per compared section and clean comparable measurement. |
| 7 | **PARTIAL** | Complete About-versus-Comparisons evaluation | Medium | About 1/139 versus Comparisons 0/87; sequential periods and menu defect / medium | Low | Baseline recomputed with matching definitions. No winner. Continue slot 7 and separate pre/post menu-fix releases; preserve About elsewhere. |
| 8 | **NEXT** | Publish one useful comparison answer, not more undifferentiated volume | Medium | Gym Monster hub 16 pageviews/10 GSC impressions; `is tonal worth it` 5 impressions; WHOOP fit article published Sep 17 / medium | Medium | Editorial decision: update existing Speediance-versus-Tonal article with verified costs/testing scope, or add Toby's garment/fit evidence to existing WHOOP comparison. Link existing article rather than create a competing URL. Measure relevant query/page impressions and next-step use, excluding anomalous unrelated query blocks. |
| 9 | **PARTIAL** | Attribute residual Safari errors and verify replay privacy/source maps | Medium | 26 opaque events from one session; no stack or verified masked replay / low cause confidence | Medium | UI account login restored, aggregate issue inspected. Verify full masking before targeted replay and approved source-map upload access. Do not call this 26 affected readers or claim the chart repair fixes it. |
| 10 | **NEXT** | Audit localized metadata and sparse search/depth measurement | Medium | Four localized Speediance documents still emit `html lang="en"`; search result/no-result events absent; mobile depth zero / high for markup, medium for measurement | Low-Medium | Verify Layout locale propagation across static translations, then correct HTML language without changing canonical targets. No evidence this caused the English search collapse. Exercise Oura, a no-result term, result click and mobile exit in isolated QA. Existing next-step funnel is 0/3 Gym Monster, 0/1 AgentStack, 0/1 BJJ; too small to rewrite CTAs. Carry OpenClaw opening-answer evaluation forward. |

## Delivery Evidence

- Code: `e01db8a6ffc6c0373defa1e634b544f596a5ffe4` (`Header.jsx`, four localized `speediance.astro` templates, `scripts/tests/speediance-charts.test.cjs`). Clean canonical working tree preserved; isolated DGX worktree used and fast-forwarded after verification.
- Follow-up `67b225751e4db2074bde2d2cfb303e38e7850b3b` scopes each of the five language-specific initializers to its route. Regression revisits German after the other languages and verifies menu-open event counts are not doubled by hover plus first click. Four final QA cases and the same four production cases pass. [Final deployment 35606715959](https://github.com/tobyglenn/websiteBuilder/actions/runs/35606715959) succeeded; production release meta matches this commit. The GitHub API hit its anonymous IP rate limit, so final workflow success was independently verified in authenticated Chrome.
- Regression: four browser/viewport cases pass, each exercises all four locales through real Astro navigation, no `window.Chart` global, both canvas pixel buffers nonblank, repeated page-load events, no page exceptions/overflow. Desktop additionally checks first pointer click, second click and keyboard reopening. Initial failures reproduced the menu bug; final cases pass after repair. WebKit QA used an SSH localhost tunnel because direct LAN navigation was blocked in that runtime.
- Full build: 2,337 sitemap URLs, 2,370 HTML, zero broken internal links; indexability audit passed. Mobile and desktop chart screenshots inspected.
- Dashboard repairs: both persisted insights queried successfully after update; not merely edited definitions. Backup and replacement SQL in the evidence JSON permit rollback.
- Initial GitHub build/deploy [35605464983](https://github.com/tobyglenn/websiteBuilder/actions/runs/35605464983) and Pages [35605822562](https://github.com/tobyglenn/websiteBuilder/actions/runs/35605822562) both completed successfully. Initial production meta was verified as `e01db8a6ffc6c0373defa1e634b544f596a5ffe4`; final production is the follow-up commit above. The same four browser/viewport regression cases passed against production, covering all four locales; all external analytics requests were blocked so tests did not pollute review metrics. Canonical LAN preview rebuilt and returned 200 at its bound LAN address.
- Live fixes: [German Speediance](https://tobyonfitnesstech.com/de/speediance/), [Spanish](https://tobyonfitnesstech.com/es/speediance/), [Portuguese](https://tobyonfitnesstech.com/pt/speediance/), [Hindi](https://tobyonfitnesstech.com/hi/speediance/). Global header repair applies throughout the site. All seven new weekly blog URLs were also checked live: HTTP 200.

First actions next cycle: check search/5xx validation and the fixed-reference incident; check new-release chart/menu behavior; get Toby's editorial choice for one comparison answer. Do not spend another week changing titles or homepage order on single-digit samples.

Validation assessment: **Share with caveats.** Complete-week boundaries, major totals, event/person/visit distinctions, dashboard readbacks and deployed code behavior were checked. GSC, Clarity and PostHog do not have identical windows or populations. Root-cause attribution, source maps, replay masking, remaining 404/canonical samples and sparse conversion conclusions remain explicitly unresolved. The built-output audit is not a network crawl of every production URL.
