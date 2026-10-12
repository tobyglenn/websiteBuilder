# Website Growth Review: October 12, 2026

## First Priority: Browser Incidents Remain Open

PostHog has zero `$exception` events in complete UTC October 5-11, versus 26 events / five people / eight sessions in September 28-October 4. The original CustomEvent issue `019fe7cf-330d-7c60-bb61-3b536617c778` remains Active; its last previously verified occurrence was September 28 before diagnostic deployment. No new occurrence means no fresh exception context to attribute, not proof of root-cause repair. Keep it open. The visitor is not Toby.

The separate October 4 opaque mobile-Safari burst and homepage hydration mismatch also remain unresolved. Latest week has one explicit script-error signal: SyntaxError in the ClientRouter bundle, Opera 58.1 / Android 4.4.2, one person / one session, release `7eee5e61c91d`. This old-browser signal is distinct from the opaque Safari issue. No message or stack establishes the exact unsupported construct; do not claim a modern-browser regression or silently suppress it. Current resource failures are all classified other/third-party, not first-party assets.

Clarity reports zero script-error sessions in its current rolling window, versus five previously. Different coverage and windows mean this corroborates the quiet period but does not close the incidents. Original exceptions and privacy-safe diagnostics remain intact.

## Evidence And New Google Emails

Sources: PostHog connector, pinned dashboard [1840395](https://us.posthog.com/project/498166/dashboard/1840395), native InitialPage entrances; authenticated Chrome as `tobypeters@gmail.com`; DGX canonical Git source; GSC and Clarity snapshots; live HTTP responses and production-browser tests.

PostHog compares October 5-11 against September 28-October 4, complete UTC weeks. Clarity compares seven daily exports October 6-12 versus September 29-October 5, `comparisonReady=true`; these are rolling provider windows, not identical PostHog periods. GSC compares final October 4-10 versus September 27-October 3. The 10:30 UTC GSC snapshot had six rows / 251 impressions; the fresh API run now has all seven rows / 269 impressions. Do not merge those snapshots into one result.

Gmail scan: `from:sc-noreply@google.com newer_than:8d`. Both full plain-text messages read; no email was sent or altered.

| Message ID / Date | Subject / Reported Issue | Verification And Disposition |
| --- | --- | --- |
| `1a115363908f6a7e`, October 7 00:13:57 -0700 | Page indexing issues successfully fixed: Server error (5xx), one page | GSC October 8 report shows Passed / zero affected. Validation success confirmed; no new validation requested. |
| `1a11536713b08d2b`, October 7 00:14:11 -0700 | New indexing reasons: Not found (404); Duplicate without user-selected canonical | 84 historical 404s, newest visible example last crawled August 17. Examples include malformed episode suffixes, `/test`, `/activity/sleep`. Duplicate example is `/podcasts/feed.xml`, last crawled September 26. Feed already has live Atom self-link from commit `03b716c9f2f`; reprocessing pending, not a newly repaired page today. |

The `/activity/sleep` example still returns 404; `/sleep/` is the live destination. Do not blanket-redirect transcript punctuation or `/test` to the homepage: that would create irrelevant/soft-404 destinations. Verify actual referring links before adding a specific alias. Proper canonical alternates are not automatically defects.

## Wins And Risks

| Signal | Current | Prior | Interpretation |
| --- | ---: | ---: | --- |
| Pageviews / tracked people / sessions | 178 / 103 / 119 | 273 / 179 / 204 | Lower traffic; people are tracked identities, not independently verified readers |
| Qualified engagement events / people | 30 / 21 | 32 / 22 | Almost flat absolute engagement despite lower volume |
| Content-card clicks / people | 15 / 7 | 17 / 3 | Broader click participation, still small |
| Video exposed-to-play people | 11 to 1, 9.1% | 12 to 4, 33.3% | Consumption concentrated in one identity; not enough to declare a content loser |
| Contact intent | 4 people | 0 | New intent signal, not proof of messages delivered |
| Exceptions / people | 0 / 0 | 26 / 5 | Quiet period, not verified incident resolution |
| Dead clicks / people / sessions | 16 / 9 / 10 | 7 / 3 / 4 | Increased friction breadth merits targeted inspection |
| Resource errors / people | 16 / 7, all other/third-party | 30 / 16, three first-party | No fresh first-party resource failures in current query |
| Long-task signals / people | 56 / 36 | 77 / 62 | Lower counts are not a normalized performance win |

One real-reader search open; no performed/result/no-result arrivals in either week. Newsletter, calculator and podcast play/completion/subscription signals remain absent; affiliate series remains absent by design. Two outbound clicks versus zero; video completion one person. Next-step item funnel: Gym Monster six viewers/zero clicks, WHOOP comparison one/zero; one next-step click exists overall without a matched funnel conversion. Do not infer zero site-wide clicks from a matched-exposure funnel.

Native InitialPage entrances: homepage 24 versus 12 people; Gym Monster 3/Ultra article three versus four; Gym Nano/VOLTRA debate three versus two; OpenClaw two versus five; episode 120/121 translations appear among top entrances (three per listed locale/page). These are not all-pageview rankings. Newly published comparison pages and translated podcasts need coherent onward routes, not indiscriminate new landing pages.

Clarity: readers 94 versus 153; bots 114 versus 127; pages/session 1.48 versus 1.23; scroll 43.63% versus 29.9%; active engagement 659 versus 409 seconds. Dead-click sessions 16 versus nine, quick-backs three versus five, rage/excessive-scroll/error-click sessions zero. Homepage PC is the sole qualified page/device segment: 31 readers/eight bots, three dead-click sessions, two quick-backs, zero script errors. It mixes homepage variants, so cannot pick a winning hero. Direct acquisition contains 67 readers/112 bots; Google three readers, Bing four, DuckDuckGo five, Reddit four, ChatGPT two. Crawler volume is not reader growth.

Masked replay inspected only for the aggregate-identified blog-index question: session `01a11e56-35c9-79c1-b7b4-d5cc2cce4f86`, five dead clicks on October 9 between 02:16:46 and 02:19:03 UTC. Project masking verified: all text and inputs masked, images blocked. Recorded session lasts 2,345 seconds with 402 active seconds, 35 clicks and no console errors; rendered blog filters/cards visible under masking. Inspection did not establish which control failed; no speculative UI repair or private-text extraction. Continue targeted attribution rather than declaring harmlessness.

RUM p75 desktop LCP 1,131ms (28 samples), INP 80ms (17), CLS zero (22). Mobile LCP 940ms (eight), INP 80ms (four), CLS 0.140 (two). Mobile CLS sample is far too small for a layout verdict. GSC Core Web Vitals, updated October 10: insufficient CrUX usage data for both devices, not a pass/fail.

## Homepage Decisions

Actual source and captured events use `home-2026-10-07-weekly-pick`, test `hero-weekly-pick`, variant `recent-articles-with-latest-video`; navigation remains `nav-2026-08-18-comparisons-a`. The September WHOOP experiment is historical, not the current live hero. Weekly story selection is user-requested rotation, not an analytics-declared winner. October 5-11 is a mixed/partial transition week: keep cohorts separate.

New weekly-pick desktop cohort, dashboard `KZu0kTpu`: deduplicated dwell per visit; five-second engagement and clicks normalized by exposed people. Depth uses 14 unique summary viewers, median deepest position one. No mobile section-summary cohort supports a split.

| Position / Section / Purpose | Unique Viewers | Avg Visible Seconds/Visit | Five-Second Engagement | Viewer CTR | Deepest Reach Count / 14 | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 Hero / orientation | 14 | 64.6 | 78.6% | 0% | 14 / 14 | Insufficient data; keep rotation |
| 2 Articles / discovery | 5 | 344.0 | 40% | 0% | 5 / 14 | Insufficient data; keep |
| 3 Training proof / evidence | 5 | 3.0 | 20% | 0% | 5 / 14 | Insufficient data; keep consolidated |
| 4 Featured/latest video / viewing | 3 | 3.9 | 33.3% | 0% | 3 / 14 | Insufficient data; keep single block |
| 5 Newsletter / conversion | 2 | 13.7 | 100% | 0% | 2 / 14 | Insufficient data; keep single block |

Article mean dwell is skewed: median 2.3 seconds, not a claim of 344 seconds typical reading. Weekly-pick hero has one recorded INNODIGYM click and arrival, but no matched qualifying item exposure for that click; section-summary CTR remains zero. Report this unmatched case separately; do not invent an impression or count it as a proven zero-click hero. Other current cohort (WHOOP): hero nine viewers, 7.8s dwell, 66.7% engagement, 22.2% CTR; both clicks are About, not WHOOP. Its lower sections have five/two/one/three viewers respectively. Prior WHOOP hero nine viewers, 49.1s, 55.6% engagement, 11.1% CTR; feature itself zero clicks.

Threshold: full measured week and 20 unique exposed people per compared variant/item/section; clear technical failures may bypass it. No promote/reorder/move-off/remove decision is justified this week. Lower position suppresses reach and does not establish irrelevance. Combined training, video and newsletter bands remain consolidated. Measure each rotating story separately by destination, not only the shared layout version.

## Navigation Decisions

Schema `nav-2026-08-18-comparisons-a`; test `primary-slot-7-about-vs-comparisons`, variant `comparisons`. Current English desktop:

| Item / Surface | Exposed People | Viewer CTR | Open-To-Selection | Recorded Click-To-Arrival | Decision |
| --- | ---: | ---: | --- | --- | --- |
| Brand / global | 71 | 1.4% | Not a menu | 1/1 | Keep |
| AgentStack / primary slot 6 | 66 | 0% | Not a menu | No clicks | Keep; no replacement evidence |
| Articles / primary slot 3 | 50 | 2% | Not a menu | 1/1 | Keep |
| Videos / primary slot 4 | 50 | 4% | Not a menu | 2/2 | Keep; two outcomes not a winner |
| Comparisons / primary slot 7 | 50 | 0% | Not a menu | No clicks | Defer About comparison; no concurrent control |
| Reviews menu | 10 openers | Item samples three | 2/10 sessions, 20% | Speediance 2/2 | Insufficient data; keep |
| Training menu | 13 openers | Item samples three | 0/15 sessions | No clicks | Insufficient data; keep |
| Projects menu | 9 openers | Item samples four | 1/9 sessions, 11.1% | Wild Rebellion/Lilly 1/1 each | Insufficient data; keep |
| Mobile primary | 2 openers | 0% | 0/2 sessions | No clicks | Insufficient data |

Prior English Articles/Videos/Comparisons each 96 exposed/zero clicks; AgentStack 118/0.8%. Current-page clicks zero in reported primary rows. One Speediance click lacks matched item exposure; do not manufacture CTR. Eight click and arrival events across seven sessions; item/session completion 100%, timing 39-907ms, tiny samples. Localized primary exposure only four-seven people. About remains in hero/footer; old About is historical, not a randomized concurrent control.

## Search Visibility, Publishing And Content Decisions

Fresh final GSC: four clicks / 269 impressions / 1.49% CTR / position 9.43; prior three / 322 / 0.93% / 9.63. Visibility is 2.0% of August 9-15 reference 13,219 impressions. Cause remains unresolved; neither schema validation nor this small CTR change proves recovery. Current anomaly subtraction zero; prior one impression. `tencent74066` is six impressions needing query-page context, not presumed buying demand.

Indexing UI updated October 8: approximately 1.66K indexed / 1.74K excluded; proper alternates 300 (Failed), redirects 368, 404s 84, noindex eight, duplicate-without-canonical one, crawled-not-indexed 497, discovered-not-indexed 482, different-Google-canonical four (Started), 5xx zero (Passed). Backlog is growing while indexed count is down from the prior stale report; counts alone do not identify the August ranking cause. Video indexing October 7: 341 indexed, 18 not-on-watch-page. Preserve article embeds as supporting media; don't turn every article into a watch page.

Sitemap index and child are live; API has zero errors/warnings, 2,522 submitted in snapshot, child read October 10, index October 11; latest submission pending. Build inventory differs because it is newer; legacy API indexed=0 is not the website indexed total. Current indexability audit must pass before deployment.

Demand-led content ideas needing Toby's judgment: a dated ownership-cost/ongoing-membership answer alongside existing Tonal video (36 impressions for 'is tonal worth it'; 14 for membership cost), and a sourced INNODIGYM/Speediance comparison follow-through from the new article/video. Tonal video pages have 38 and 17 impressions respectively with no clicks in the earlier snapshot. Do not fabricate costs, warranty terms or ownership experience; no speculative new article published by this review.

Publishing logs show all seven October 5-11 publication stages built and published; October 11 MiniMax returned no content and Google fallback succeeded. Thus provider recovery worked, but silent first-provider success must not be claimed. Fitness reports service active. Previous September 28 thumbnail PIL environment incident still lacks a durable scheduled-worker preflight. Podcast feed latest episode 121 dated October 8; publication gaps may depend on separate approval workflow and are not authorization to release audio. Original Mac working-tree translation scripts and videos data remain untouched.

## Prioritized Improvements

| Priority | Status | Improvement | Impact / Evidence / Confidence / Effort | Implementation And Measurement |
| --- | --- | --- | --- | --- |
| 1 | **PARTIAL** | Attribute CustomEvent, opaque Safari and hydration failures | High / historical unhandled failures / high incident, low cause / medium | Carry open issues forward; no fresh exceptions this week. Retain original events, release/context diagnostics and masking. Opera legacy signal tracked separately. |
| 2 | **DONE** | Patch compatible vulnerable build dependencies | High / npm audit: one critical, eight high, one moderate / high / low | `b568303c833`, lockfile-only compatible updates, Astro 7.3.8 / Sharp 0.35.5; fresh npm ci/audit zero vulnerabilities. Production build and Pages deployment succeeded; not evidence of an exploit or exception root-cause repair. |
| 3 | **DONE** | Safe standalone search and outcome telemetry | High / missing standalone events and localized query HTML sinks / high / low | `d980747059d` plus `70b5974e346`; all four localized summaries use textContent. English search has an independent form and outcomes/selection record counts, query length, surface and destination; current URL excludes query parameters. Production success/no-results/selection and malicious-shaped literal text tests pass in Chromium/WebKit 390/1440. Localized outcome telemetry remains NEXT; synthetic QA is not real-reader event arrival. |
| 4 | **DONE** | Stop misdiagnosing omitted GSC dates | Medium / documented API semantics / high / low | `b1e4dcf45c7`; explicit unobserved dates and uncertain coverage, no zero fill, visibility hold preserved. 16 focused GSC tests pass; refreshed real API now has seven rows. Canonical scheduled source activated on DGX main; latest.json retains unresolved visibility hold. |
| 5 | **PARTIAL** | Refresh canonical/visibility investigation | High / 2.0% historical impressions, growing exclusions / high drop, low cause / medium | 5xx validation passed; feed self-link already deployed `03b716c9f2f`, Google last crawl predates it. Need URL Inspection evidence on intended canonical cluster before redirects or validation. |
| 6 | **NEXT** | Attribute blog-index and homepage dead clicks | Medium / nine affected PostHog people, qualified Clarity homepage cohort / medium / medium | Masked blog replay reviewed but exact failing control unresolved; inspect targeted timestamps/control behavior. Do not redesign from aggregate labels. |
| 7 | **DEFERRED** | Evaluate weekly homepage story and navigation slot | Medium / new hero 14 exposures, Comparisons zero/50 / low / low | Current user-requested rotating feature supersedes fixed WHOOP experiment. Wait full week/20 per item; preserve variants and unmatched-click caveats. Keep current navigation and single consolidated bands. |
| 8 | **NEXT** | Harden thumbnail interpreter and publication proof | High / prior PIL failure despite interactive Pillow availability / high / low | Add/test preflight in actual scheduled stage and verify nonzero routing; seven current published days don't prove this failure mode repaired. |
| 9 | **NEXT** | Add verified Tonal membership/ownership answer | Medium / 36 worth-it and 14 cost impressions, zero query clicks / medium / medium | Toby must approve facts/experience; consolidate into existing comparison/video cluster, no new generic near-duplicate daily page. Measure query-page CTR after complete data and indexing. |
| 10 | **PARTIAL** | Close instrumentation/reporting gaps | Medium / English standalone gap repaired, sparse journeys / high gap / medium | Carry localized standalone telemetry, native entrance dashboard tile, unmatched exposure attribution and anomaly review forward. Prior source attribution/mobile containment/search recovery remain verified bounded repairs, not root-cause closure. |

First changes: dependency patch, safe search/outcome tracking, corrected GSC coverage reporting. No analytics experiment winner, speculative editorial copy, affiliate revival, blanket canonical redirect, exception suppression or account changes.

## Delivery Evidence

- Source release: `70b5974e3468b50ed1c5034ef1315eccd7a45ecb`, fast-forwarded to canonical DGX main and pushed to GitHub. Unrelated local translation-worker and video-data changes preserved.
- [Source build/deploy 38255739482](https://github.com/tobyglenn/websiteBuilder/actions/runs/38255739482) and [Pages deployment 38256207328](https://github.com/tobyglenn/websiteBuilder/actions/runs/38256207328) both succeeded. Live `/search/` release meta matches `70b5974e346`; query-free `$current_url` override present in deployed HTML.
- Production browser QA: 16/16 tests passed sequentially in Chromium/WebKit at mobile/desktop widths. Covers standalone and modal search, keyboard/button entry, selection, no results, failed-loader recovery, localized literal text and preserved original exception diagnostics. Third-party analytics blocked throughout. An earlier concurrent QA run exited nonzero; standalone rerun 4/4 and final sequential complete suite 16/16 passed. Do not claim the concurrent run passed.
- Screenshots inspected at 390 and 1440 pixels; document widths match viewports. External thumbnail images were deliberately blocked in these QA screenshots, not diagnosed as live broken assets.
- Build/indexability audit: 2,538 sitemap URLs, 2,579 HTML files, 19,933 JSON-LD scripts, 30 Product schemas, zero broken internal links. Fresh dependency install/audit reported zero vulnerabilities.
- GSC operational snapshot refreshed at `2026-10-12T13:13:58.512Z`: seven final dates, 4 clicks / 269 impressions; unresolved visibility incident hold remains. No canonical validation, incident closure, editorial publication or account-setting change performed.

Sources: [GSC API omitted-date semantics](https://developers.google.com/webmaster-tools/v1/searchanalytics/query); [Astro image-processing advisory](https://github.com/advisories/GHSA-26w7-cxv4-gfx2); authenticated GSC/UI and private PostHog dashboard linked above; DGX `/home/toby/.openclaw/logs/analytics/{gsc,clarity}/latest.json` and pipeline stage logs. Dates, cohort boundaries and limitations are part of every decision.
