# Website Growth Review - August 31, 2026

## Decision Summary

Do not reorder the homepage again this week. The Gym Monster hero completed a calendar week but has only 18 unique viewers, below the predeclared 20-viewer threshold. It produced one click and roughly 39% five-second engagement; the older feed-driven baseline had 22 viewers, two clicks, and roughly 64% five-second engagement, but the current sample is still too small for a winner.

The Comparisons navigation experiment reached its exposure threshold. Comparisons received 58 desktop viewers and zero clicks; About previously received 44 viewers and one click. That is no demonstrated lift, but one total baseline click is too little evidence to call Comparisons worse. Keep the current slot stable while the dashboard and mobile click samples mature.

Search Console remains the most important risk. Both the API and authenticated UI show zero clicks and 205 impressions for August 23-29, while the 90-day UI still shows 657 clicks and 143K impressions. There is no manual action. Page Indexing reports 1,179 excluded URLs, including 93 failed 404s, 247 crawled-not-indexed pages, 341 alternate canonical pages under active validation, and four Google-selected canonical mismatches. Editorial recommendations from this seven-day window remain suppressed.

Three reversible fixes were implemented this week: Product schema cleanup for the new Google alert, a shared podcast RSS snapshot that prevents new episode links from outrunning generated routes, and a four-week Search Console quality baseline that keeps multiweek API discontinuities visible.

## Measurement And Quality

- PostHog complete periods: August 24-30 versus August 17-23, 2026, UTC; reader filter applied.
- Homepage: layout `home-2026-08-18-gym-monster-a`, test `hero-demand-topic`, variant `gym-monster-comparison`.
- Navigation: schema `nav-2026-08-18-comparisons-a`, test `primary-slot-7-about-vs-comparisons`, variant `comparisons`.
- Search Console: August 23-29 versus August 16-22. Both API and authenticated UI match, but the window is analytically degraded against the healthy August 9-15 baseline.
- Clarity: August 25-31 versus August 18-24; `comparisonReady=true`.
- Decision threshold: 20 unique readers per page/device, item, or section unless a verified technical failure is present.
- Replay privacy remains fully masked. No replay-driven code change was made from identity-concentrated errors.

## Top Wins

1. Reader pageviews were nearly stable at 275 versus 280, while qualified sessions increased from 14 to 21 and qualified identities from 12 to 19.
2. Clarity reader sessions rose 38.8%, average scroll depth rose 16.2%, and active engagement rate rose from 26.61% to 43.45%.
3. Technical friction improved: PostHog exceptions fell from 70 to 6, resource errors from 198 to 66, long tasks from 88 to 57, and rage clicks from five to zero.
4. Clarity script-error sessions fell from seven to two and quick-backs fell from four to zero.
5. Next-step engagement began to move: 42 item exposures led to five clicks across three sessions, versus 19 exposures and no clicks.
6. Video consumption improved from two plays to five, with one completion; current identity-normalized exposure-to-play is roughly 33% versus 20% prior.
7. The live sitemap is healthy and freshly generated; Google downloaded the child sitemap August 31 with zero sitemap errors or warnings.

## Top Risks

1. GSC remains discontinuous: zero clicks and 205 impressions, average position 25.2, after a healthy August 9-15 week with 99 clicks and more than 13K impressions.
2. Page Indexing has 1,179 excluded URLs: 93 failed 404s, 392 redirects, 247 crawled-not-indexed, 94 discovered-not-indexed, 341 alternate canonicals, eight noindex pages, and four canonical mismatches.
3. Bots grew faster than readers in Clarity: 191 bot sessions versus 57 prior, while reader sessions reached 161. Aggregate traffic must stay bot-separated.
4. Daily blog publishing delivered four of seven scheduled posts. The August 25, 27, and 29 builds correctly failed and alerted because newly published podcast feed items appeared on list pages before their static detail routes.
5. The homepage rarely reaches lower sections: 7 of 31 visits reached section 2, one reached section 3, and none reached sections 4 or 5.
6. The top PostHog entry, Episode 44, had 35 reader sessions and no qualified engagement. Clarity corroborates shallow activity; treat it as low-quality or anomalous query traffic until query provenance is verified.
7. Desktop LCP p75 rose to 3,479 ms, though sampled pages with at least three observations remained good. Broad single-session outliers prevent a page-specific fix this week.

## Homepage Decision Table

Deepest reach is visit-based from 31 completed homepage summaries. Sparse section averages are not promoted into decisions.

| Pos | Section | Purpose | Test / variant | Unique reach | Visible time | 5s rate | Viewer CTR | Deepest reach | Device split | Decision |
|---:|---|---|---|---:|---:|---:|---:|---:|---|---|
| 1 | Gym Monster comparison hero | Orient and route demand | `hero-demand-topic` / `gym-monster-comparison` | 18 | Desktop 2.1s; mobile 2.6s | About 39% | 5.6% | 31/31 | 17 desktop / 1 mobile | **KEEP / INSUFFICIENT DATA**; two viewers short of threshold |
| 2 | Latest articles | Content discovery | Section metadata missing | 4 | Desktop 1.8s | 0% desktop | 0% | 7/31 | 3 desktop / 1 mobile | **INSUFFICIENT DATA** |
| 3 | Current training proof | Evidence | Section metadata missing | 1 | Too sparse | Too sparse | 0% | 1/31 | Mobile only | **INSUFFICIENT DATA** |
| 4 | Featured/latest videos | Video discovery | Section metadata missing | 0 summary viewers | N/A | N/A | N/A | 0/31 | None | **INSUFFICIENT DATA**; low position explains reach |
| 5 | Newsletter | Retention | Section metadata missing | 0 summary viewers | N/A | N/A | N/A | 0/31 | None | **INSUFFICIENT DATA**; low position explains reach |

The prior feed-driven hero baseline had 22 viewers, approximately 64% five-second engagement, and 9.1% viewer CTR. The current hero has 18 viewers, approximately 39% five-second engagement, and 5.6% CTR. Keep the test unchanged until the current variant reaches 20 unique viewers, then reassess without extending indefinitely.

## Navigation Decision Table

| Item / surface | Schema / test | Exposed viewers | Clicking viewers | Viewer CTR | Click-to-arrival | Decision |
|---|---|---:|---:|---:|---:|---|
| Articles, desktop | `nav-2026-08-18-comparisons-a` | 58 | 1 | 1.7% | 1/1 | **KEEP** |
| Videos, desktop | `nav-2026-08-18-comparisons-a` | 58 | 1 | 1.7% | 1/1 identity; two clicks | **KEEP** |
| AgentStack, desktop | `nav-2026-08-18-comparisons-a` | 75 | 1 | 1.3% | 1/1 | **KEEP** |
| Comparisons, desktop | `primary-slot-7-about-vs-comparisons` / `comparisons` | 58 | 0 | 0% | N/A | **NO DEMONSTRATED LIFT**; keep stable pending a larger click sample |
| About baseline, desktop | `nav-2026-08-04-a` | 44 | 1 | 2.3% | 1/1 | Baseline; remains in footer and homepage |
| Primary menu, mobile | Current schema | 1 | 0 | 0% | N/A | **INSUFFICIENT DATA** |

Desktop menu open-to-selection was 33.3% for Reviews (one of three sessions), 20% for Training (one of five), and 0% for Projects (zero of two). All measured primary-link clicks reached their destination. Speediance menu clicks without corresponding item exposure remain a tracking gap.

## Content And Journey Findings

- **Garmin/WHOOP:** 10 entry sessions, five qualified. This remains the clearest current reader-quality cluster.
- **Gym Monster:** the original comparison had seven sessions, three qualified, one next-step click, and one video play. The canonical hub also had seven Clarity readers with 89% scroll and 100 active seconds, but PostHog identity concentration makes its aggregate unstable.
- **OpenClaw fitness reports:** six sessions, no qualified engagement. Clarity shows very shallow mobile scroll and weak desktop engagement. Improve the opening answer before adding more traffic routes.
- **WHOOP 5:** two sessions and no qualified engagement this week; do not rewrite the SERP promise from the degraded GSC window.
- **Episode 44:** 35 PostHog reader sessions with no qualified engagement and low Clarity activity. Exclude it from content-winner decisions until query provenance is understood.
- **Podcast behavior:** outbound audio clicks fell from seven to two despite new episode traffic. The new RSS consistency fix removes a technical interruption from future episode launches.
- **Content ideas from corroborated demand:** Aeke versus Speediance, Gym Monster 2 versus Tonal 2, and WHOOP 4 versus 5 remain useful comparison topics, but current-week GSC volumes are not safe enough to reprioritize publishing by themselves.

## Technical UX

- PostHog current: 6 exceptions, 14 dead clicks, 0 rage clicks, 111 Web Vitals samples, 66 resource errors, and 57 long tasks.
- Current exceptions are sparse: two React #424 events on About and four Safari `@context.toLowerCase` events across Episode 107, Videos, and WHOOP 5. No homepage exception occurred.
- Dead clicks are concentrated on Contact (six events from one session), then Speediance and Episode 107 (two each). No page/device Clarity row reaches 20 reader sessions.
- Desktop Web Vitals p75: LCP 3,479 ms, INP 52 ms, CLS 0, FCP 2,796 ms. Multi-sample content pages had good LCP, so the aggregate regression is monitored rather than patched speculatively.
- Remaining resource errors are mostly third-party or blocker-related. Current local image misses are isolated episode and Speediance article assets and should be handled in the next asset-fallback pass.
- PostHog events still have no release attribution. Source-map upload remains blocked on an authorized project-scoped API key; do not create one implicitly.

## Prioritized Improvements

| Rank | Status | Improvement | Impact | Evidence | Confidence | Effort | Implementation and measurement |
|---:|---|---|---|---|---|---|---|
| 1 | **DONE** | Make podcast feed builds deterministic and restore daily blog reliability | Very high | Three publish failures occurred exactly when a new RSS episode appeared on list pages before its detail route | High | Low | Shared one cached RSS snapshot across list and route generation; full 2,141-URL audit now has zero broken links |
| 2 | **DONE** | Resolve the Product snippets notification without fabricated ratings | High | Aug 31 GSC email reported missing `review` and `aggregateRating`; rendered audit found 20 bare Product nodes | High | Low | Removed redundant nested Products from gear reviews and non-commerce Product/Offer schema from ROI pages in five languages; build now fails on a remaining unsupported Product |
| 3 | **DONE** | Keep GSC degraded when consecutive bad weeks mask the discontinuity | High | 205 versus 278 impressions looked `ready`, despite the healthy 13K-impression week immediately before | High | Low | Added four-week historical periods, rolling discontinuity checks, recommendation suppression, and a regression test |
| 4 | **IN PROGRESS** | Diagnose and reverse the Search Console visibility/indexing break | Very high | UI and API agree on 0 clicks / 205 impressions; 1,179 excluded URLs; no manual action | High evidence, medium cause confidence | Medium | Inspect 404 and canonical samples, crawl stats, and URL Inspection; fix verified internal causes in batches and monitor validation |
| 5 | **IN PROGRESS** | Complete the Gym Monster homepage test | Medium | 18 viewers, one click, about 39% five-second engagement | Medium | Low | Hold layout until 20 unique viewers, then compare against the feed baseline and close the test |
| 6 | **PARTIAL** | Close the About-versus-Comparisons navigation test | Medium | Comparisons 58/0; About 44/1 | Low | Low | No lift demonstrated; retain current slot until at least five clicks across compared items or 100 exposed viewers, then make a durable choice |
| 7 | **NEXT** | Update pinned PostHog dashboard filters and section metadata | High | Several tiles still filter old layout/schema; sections 2-5 omit test metadata | High | Low | Include active and baseline versions, add test ID/variant to every section, and retain direct-query QA |
| 8 | **NEXT** | Rewrite the OpenClaw fitness-report opening answer | Medium | Six entry sessions, zero qualified; shallow Clarity scroll | Medium | Low | Add a concise outcome-first summary and one report example; measure qualified engagement and next-step arrival |
| 9 | **PARTIAL** | Add the Oura-versus-WHOOP opening decision table | Medium | Carried from Aug 17; metadata improved, opening table not shipped | Medium | Low | Add sleep, recovery, battery, and subscription rows after GSC data is trustworthy |
| 10 | **BLOCKED** | Add release and source-map attribution | Medium | Current exceptions have no release or source frame | High | Medium | Prepared approach requires Toby-authorized creation/use of a project-scoped PostHog personal API key; no credential was created implicitly |

## Search Console Notifications

| Message ID | Date | Subject | Reported issue | Verification | Disposition |
|---|---|---|---|---|---|
| `1a056f0e39590291` | Aug 31, 2026 | New Product snippets structured data issues detected for tobyonfitnesstech.com | Non-critical missing `review` and missing `aggregateRating` | Rendered audit found 15 redundant nested bare Products on gear reviews and five non-commerce ROI Products | **DONE** in this review; no rating invented |
| `1a033e1ac2ba0fd1` | Aug 24, 2026 | New Merchant listings structured data issues detected for tobyonfitnesstech.com | Critical duplicate `brand` | Prior fix remains in source and rendered audit; no multi-brand Product remains | **DONE** in `2a6fefd4db`; awaiting Google recrawl |

The authenticated Search Console property is `sc-domain:tobyonfitnesstech.com` under `tobypeters@gmail.com`. Manual Actions reports “No issues detected.” No validation request was submitted during this read-only review.

## Tracking And Reporting Gaps

1. Update pinned dashboard tiles that still hard-filter `home-2026-08-04-a` or `nav-2026-08-04-a`.
2. Add test ID and variant properties to homepage sections 2-5.
3. Repair menu-item exposure tracking for Speediance clicks.
4. Continue reporting Contact intent by unique session or identity, not raw events.
5. Add a persistent GSC rolling baseline to every weekly artifact; implemented this week and awaiting the next scheduled run.
6. Add release/source maps after explicit authorization for a project-scoped key.
7. Add asset existence fallback to individual podcast detail covers and the two missing Speediance article images.

## Delivery Evidence

- Commit: `COMMIT_PENDING`.
- Tests: 4 of 4 GSC data-quality tests passed.
- Build: 2,163 pages generated; Pagefind indexed 2,156 pages across six languages.
- Indexability: 2,141 sitemap URLs, 2,175 HTML files, zero broken internal links, 4,327 JSON-LD scripts, and 35 eligible Product schemas.
- Podcast: one build generated 27 fitness-podcast routes from the same cached feed snapshot used by all list pages.
- Product data: no remaining Product lacks both `review` and `aggregateRating`; ROI remains a `WebPage`, not a merchant offer.
- Production: `LIVE_VERIFICATION_PENDING`.
- GSC report rerun: `GSC_RERUN_PENDING`.

## First Actions

1. Deploy and verify this review's three fixes, then rerun the GSC report to confirm it stays `degraded` against the rolling baseline.
2. Work through the 93 GSC 404 samples and four Google-selected canonical mismatches before requesting another validation.
3. Update the PostHog dashboard filters and close the two experiments once their declared evidence thresholds are actually met.

