# Website Growth Review - August 24, 2026

## Decision Summary

Do not make a homepage or primary-navigation winner decision this week. The Gym Monster hero has only 14 correctly tagged viewers plus one untagged viewer, and the experiment has not completed a full measured week. Comparisons has 84 exposed viewers and zero clicks, but Articles, Videos, and AgentStack also recorded zero primary-navigation clicks under the new schema. That makes click validation more urgent than declaring the replacement a failure.

The immediate risk is Search Console. Its final API data changed from 99 clicks and 13,219 impressions to zero clicks and 278 impressions. This could be a real indexing or serving problem, an account/property issue, or an API discontinuity. The cause is not verified. Comparative GSC recommendations are now suppressed and the condition posts to `build-log-errors` and Telegram until it is checked in the authenticated Page Indexing and Performance interfaces.

Three high-confidence fixes shipped in `e1b4a29fe8`: corrected Clarity behavior-session rates, a Search Console data-quality gate with visible alerts, and build-time podcast-cover fallbacks that remove missing image requests from all five AgentStack indexes.

## Measurement Window And Quality

- PostHog complete periods: August 17-23 versus August 10-16, 2026, UTC.
- Homepage experiment evidence: August 18-23, but events first appear August 19. This is a partial baseline.
- Navigation experiment evidence: August 18-23. This is a partial six-day baseline.
- Search Console: August 16-22 versus August 9-15. The current period is marked `degraded` and is not safe for editorial comparison.
- Clarity: seven current snapshots, zero prior snapshots, so `comparisonReady=false`.
- Chrome was unavailable to this runtime. PostHog connector, GSC API, Clarity export, live site, sitemap, repository, and DGX logs were used. Page Indexing validation still needs authenticated Chrome.
- Decision threshold: 20 unique readers per compared item or section unless an independently verified technical failure is clear.
- The pinned PostHog dashboard still contains tiles filtered to `home-2026-08-04-a` and `nav-2026-08-04-a`. Exact experiment queries used direct HogQL.

## Top Wins

1. Daily blog publishing is healthy again. One blog post was committed every day from August 17 through August 23, and all three Hermes stages are active with successful August 23 runs.
2. Podcast outbound listening intent rose from one click to seven, despite total reader traffic declining.
3. Dead-click volume fell from 54 to 18 events. Clarity's corrected baseline reports three affected reader sessions out of 116 (2.59%), not 100%.
4. Search Console downloaded both submitted sitemaps on August 24 with zero sitemap errors or warnings.
5. The production build generated 2,144 pages. The indexability audit checked 2,123 sitemap URLs and found zero broken internal links.
6. The missing podcast-cover problem is fixed at build time. AgentStack indexes now use an existing episode image or localized show art instead of requesting nonexistent files.

## Top Risks

1. GSC final data shows zero clicks and 278 impressions, versus 99 clicks and 13,219 impressions. Current impressions are 2.1% of the prior period. Treat this as an urgent unverified discontinuity, not a proven ranking loss or harmless latency.
2. PostHog reader pageviews fell from 535 to 280 (-47.7%) and reader sessions from 441 to 225 (-49.0%). Qualified sessions fell from 100 to 14, reducing the qualified-session rate from 22.7% to 6.2%.
3. The new Gym Monster hero has zero clicks from 14 tagged viewers. This is directional only because the full-week and 20-viewer requirements are not met.
4. The Comparisons navigation item has zero clicks from 84 exposed viewers. Every measured primary item also has zero clicks, so tracking or interaction validation is required before interpreting relevance.
5. Video exposure-to-play weakened from 7 of 32 viewers (21.9%) to 2 of 14 (14.3%), with no completion events in the current period.
6. PostHog recorded 70 exceptions versus 51, but 57 current exceptions came from two identities. Clarity independently found script errors in 5 of 24 qualified homepage desktop sessions, so masked replay and source attribution remain warranted.
7. LCP p75 increased from 842 ms to 2,424 ms. It remains inside the 2,500 ms good threshold but has little margin.

## Homepage Decision Table

Current layout: `home-2026-08-18-gym-monster-a`. Dwell averages are capped at 300 seconds; medians are included because repeat/background sessions can still inflate averages. Deepest reach is visit-based among 48 completed homepage summaries. Viewer counts are unique readers.

| Pos | Section | Purpose | Test / variant | Viewers | Avg / median visible | 5s rate | Viewer CTR | Deepest reach | Device split | Decision |
|---:|---|---|---|---:|---:|---:|---:|---:|---|---|
| 1 | Hero and featured story | Orientation | `hero-demand-topic` / `gym-monster-comparison` | 15 (14 tagged) | 5.1s / about 1-3s | 46.7% | 0% | 100% | 14 desktop / 1 mobile | **KEEP** test running; insufficient winner evidence |
| 2 | Latest articles | Content discovery | Missing | 6 | 15.5s / 5.0s | 50.0% | 16.7% | 54.2% | Desktop only | **INSUFFICIENT DATA** |
| 3 | Current training proof | Proof | Missing | 3 | 53.3s / 5.3s | 100% | 0% | 25.0% | Desktop only | **INSUFFICIENT DATA** |
| 4 | Featured and latest videos | Video discovery | Missing | 2 | 3.4s / 2.0s | 50.0% | 0% | 10.4% | Desktop only | **INSUFFICIENT DATA** |
| 5 | Newsletter signup | Conversion | Missing | 2 | 4.9s / 5.3s | 50.0% | 0% | 6.3% | Desktop only | **INSUFFICIENT DATA** |

The prior hero baseline had 21 viewers, 52.4% five-second engagement, and 4.8% viewer CTR. The current tagged variant has 14 viewers, 50.0% five-second engagement, and zero clicks. Both the current sample and elapsed time fail the decision rule. Low-position reach is reported as exposure, not as a judgment of relevance.

## Navigation Decision Table

Current schema: `nav-2026-08-18-comparisons-a`. Current primary-item impressions were desktop only. Mobile had one menu-opening reader and no selection, so no mobile conclusion is supported.

| Item | Test / variant | Exposed viewers | Clickers | Viewer CTR | Current-page clicks | Click-to-arrival | Decision |
|---|---|---:|---:|---:|---:|---:|---|
| Articles | Missing | 84 | 0 | 0% | 0 | N/A | **INSUFFICIENT DATA**; validate click capture |
| Videos | Missing | 84 | 0 | 0% | 0 | N/A | **INSUFFICIENT DATA**; validate click capture |
| AgentStack | Missing | 84 | 0 | 0% | 0 | N/A | **INSUFFICIENT DATA**; validate click capture |
| Comparisons | `primary-slot-7-about-vs-comparisons` / `comparisons` | 84 | 0 | 0% | 0 | N/A | **KEEP TEST RUNNING**; no full week |
| About baseline | `nav-2026-08-04-a` | 245 | 0 | 0% | 0 | N/A | Baseline; remains available in footer and homepage |

Desktop menu open-to-selection was 1 of 9 current sessions (11.1%) versus 5 of 30 baseline sessions (16.7%). Only three current desktop readers opened the menu, so this comparison is not decision-ready. The new schema recorded clicks to the brand and All Projects, which proves navigation capture is not entirely absent, but primary-link capture needs a controlled validation.

## Reader Journeys And Content

Current top entry paths were the homepage (51 pageviews), Episode 103 (17), WHOOP 5 size (7), OpenClaw fitness reports (7), WHOOP recovery (7), AgentStack (6), Anthropic refund (6), Speediance versus Tonal (5), WHOOP red-day protocol (5), Contact (5), Episode 104 (5), and Videos (5).

- **WHOOP:** WHOOP size, recovery, red-day, and comparison pages remain visible entry paths. Do not rewrite their SERP promises using this week's degraded GSC period.
- **Speediance:** Speediance versus Tonal remains a current entry page. The last trustworthy Search Console period supported Gym Monster and Tonal comparisons, so maintain the cluster while GSC is verified.
- **AgentStack:** Episode 103 and the AgentStack hub remain meaningful entry paths. Podcast outbound clicks increased to seven, but native player events remain at zero.
- **Anthropic:** Six current pageviews reached the refund article. Its evidence-specific next step is deployed, but the current next-step sample is too small to judge.
- **Oura versus WHOOP:** The prior recommendation to add an opening decision table is still incomplete. Hold title and query work until trustworthy GSC data returns.

Sitewide next-step modules recorded 19 item views and zero clicks, versus 122 views and one click. On-site search recorded no current searches, affiliate links no clicks, and calculators no starts. These are low-volume observations, not removal decisions.

## Technical UX

- PostHog: 70 exceptions, 18 dead clicks, 5 rage clicks, 176 Web Vitals samples, 198 resource errors, and 88 long tasks.
- Exception concentration: 34 `CustomEvent` occurrences came from one user; 23 Safari `@context.toLowerCase()` TypeErrors also came from one distinct identity across 15 sessions. No application frame was supplied.
- All five rage clicks and 61 `contact_intent` events came from one Contact-page session repeatedly activating email links. Weekly conversion reporting should use unique sessions or viewers, not raw contact event counts.
- Resource failures: 95 requests in one Portuguese AgentStack session targeted missing episode covers. The new asset resolver prevents those requests in rebuilt English, German, Spanish, Portuguese, and Hindi indexes.
- Clarity partial baseline: 116 reader sessions, 57 bot sessions, 67.05% reader share, 1.27 pages per session, 32.73% average scroll, and 26.61% active engagement. Corrected behavior rates are 2.59% dead-click sessions, 3.45% quick-back sessions, and 6.03% script-error sessions.
- Qualified Clarity page/device evidence exists only for homepage desktop: 24 reader sessions, 26.57% average scroll, one dead-click session, one quick-back session, and five script-error sessions.

## Prioritized Improvements

| Rank | Status | Improvement | Impact | Evidence | Confidence | Effort | Implementation and measurement |
|---:|---|---|---|---|---|---|---|
| 1 | **IN PROGRESS** | Verify the GSC visibility and indexing discontinuity | Very high | 0 clicks / 278 impressions versus 99 / 13,219; sitemap still reports 0 indexed | High evidence, low cause confidence | Medium | Inspect Performance, Page Indexing, canonical validation, manual actions, crawl stats, and representative URLs in authenticated GSC before changing content |
| 2 | **DONE** | Add GSC data-quality gating and visible anomaly alerts | High | Unsafe comparison previously looked like an ordinary weekly decline | High | Low | `e1b4a29fe8`: `gsc-data-quality.mjs`, recommendation suppression, tests, `build-log-errors`, and Telegram warning; live report verified `degraded` |
| 3 | **DONE** | Correct Clarity behavior session rates | High | API `sessionsCount` is denominator; old report falsely showed every behavior at 100% | High | Low | `e1b4a29fe8`: derive affected sessions from `sessionsWithMetricPercentage`; 42-test suite passed and live report now shows 2.59% dead-click sessions |
| 4 | **DONE** | Stop missing AgentStack podcast-cover requests | Medium | 95 failures in one Portuguese index session | High | Low | `e1b4a29fe8`: build-time `resolvePublicAsset` fallback across five AgentStack indexes; all generated cards reference existing show art |
| 5 | **IN PROGRESS** | Complete the Gym Monster homepage test | Medium | 14 tagged viewers, 50% five-second engagement, zero clicks | Medium | Low | Keep `hero-demand-topic` unchanged until one complete week and 20 tagged viewers; add test metadata to sections 2-5 next |
| 6 | **IN PROGRESS** | Complete and validate the Comparisons navigation test | Medium | Comparisons 84 exposed / 0 clicks; all primary items also 0 | Medium | Low | Keep schema through a full measured week; run one controlled desktop and mobile click-to-arrival validation before declaring a winner |
| 7 | **NEXT** | Attribute homepage desktop script errors | Medium | Clarity finds errors in 5 of 24 qualified desktop sessions; PostHog issues are identity-concentrated | Medium | Medium | Inspect masked replays for the five Clarity sessions and add release/source-map attribution before changing site code |
| 8 | **NEXT** | Improve video and next-step conversion | Medium | Video play rate 14.3%; next steps 19 views / 0 clicks | Medium | Low | Test one clearer video promise and one page-specific next step after exposure reaches 20; measure exposure-to-play and exposure-to-arrival |
| 9 | **PARTIAL** | Add the Oura versus WHOOP opening decision table | Medium | Carried from August 17; metadata improved but opening answer remains incomplete | Medium | Low | Preserve existing title; add a concise sleep, recovery, battery, and subscription table after GSC verification |
| 10 | **DONE** | Maintain daily publishing and failure visibility | Very high | Seven daily blog commits August 17-23; all three August 23 stages succeeded | High | Low | Hermes draft, review, and publish jobs are active for 6:00, 6:15, and 7:00 PM; keep no-op and failure routing monitored |

## Tracking And Search Gaps

1. Homepage sections 2-5 do not carry `homepage_test_id` or `homepage_test_variant`; only the hero does.
2. Primary navigation item clicks need a controlled validation because all four measured primary items show zero clicks while other navigation groups do capture clicks.
3. The pinned PostHog dashboard needs layout/schema filters updated to include both experiment and baseline versions.
4. `contact_intent` must be reported by unique session or viewer; raw event counts were dominated by one failed email interaction.
5. Clarity needs seven more daily snapshots before week-over-week comparison is valid.
6. Search Console API does not expose the full Page Indexing validation drilldown. Authenticated Chrome remains required for canonical samples, validation state, manual actions, and crawl inspection.
7. Current GSC low-CTR, rising, and declining recommendation arrays are deliberately empty while `dataQuality.status=degraded`.

## Delivery Evidence

- Code commit: `e1b4a29fe8` (`fix weekly analytics data quality guards`).
- Tests: 42 of 42 Node tests passed.
- Build: 2,144 pages generated; Pagefind indexed 2,138 pages in six languages.
- Indexability: 2,123 sitemap URLs, 2,151 HTML files, zero broken internal links.
- Preview: homepage, Portuguese AgentStack, and German AgentStack returned HTTP 200.
- Production: GitHub Pages deployment succeeded; the live Portuguese AgentStack index contains no missing episode-cover URLs and resolves cards to existing localized show art.
- Live discovery: sitemap index and child sitemap return HTTP 200, the child contains 2,123 URLs, and `robots.txt` references `sitemap-index.xml`.
- GSC report rerun: warning posted to `build-log-errors`; comparative recommendations held.
- Clarity report rebuilt: `comparisonReady=false`, corrected behavior rates verified.

## First Actions

1. Use authenticated Search Console to determine whether the August 16 visibility break is real and inspect canonical validation samples.
2. Run a controlled desktop and mobile primary-navigation click so the new schema's click-to-arrival chain is proven.
3. Keep both homepage and navigation variants unchanged until next week's full-period evidence; do not reshuffle sections from the current small sample.
