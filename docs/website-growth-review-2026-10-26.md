# Website Growth Review: October 26, 2026

## Incidents First

PostHog recorded two exceptions, one person and one session during complete UTC October 19-25, versus five exceptions/two people/four sessions October 12-18. Both fresh exceptions are `ReferenceError: Can't find variable: _AutofillCallbackHandler` on `/` in Facebook Mobile / iOS 26.7.1, October 20 00:04:27 UTC, release `53ca055dc5b`. Diagnostics are present: `20260928-browser-event-v1`, `20261019-ui-phase-v1`, error/Event/Error, initial-load, visible, page age 1,717-1,718ms, source `first-party-inline:1:25`. That source label does not establish which party injected inline code.

Repository search found no `_AutofillCallbackHandler` in application source or analytics scripts. The [Sentry maintainers' event-filter source](https://raw.githubusercontent.com/getsentry/sentry-javascript/develop/packages/core/src/integrations/eventFilters.ts) recognizes this signature and links it to Meta's browser. This supports a browser-bridge hypothesis, not proof that this visitor was unaffected. No noop global, exception filter or suppression was added. Physical Facebook iOS behavior remains untested.

Original CustomEvent issue `019fe7cf-330d-7c60-bb61-3b536617c778` remains Active. Only the two ReferenceErrors appeared in this complete week's exception query; no fresh original CustomEvent or prior hydration/view-transition recurrence was observed. Their causes and impact are not established. The visitor in the original long-lived Safari session is not Toby. Keep original events and privacy-safe release/context diagnostics; quiet periods do not close incidents.

## Scope And Google Email

PostHog connector and pinned [Website Growth Weekly Review](https://us.posthog.com/project/498166/dashboard/1840395) inspected. Compare October 19-25 with October 12-18, complete UTC weeks. GSC final data covers October 18-24 versus October 11-17, generated October 26 10:30 UTC. Source of truth is DGX `/home/toby/.openclaw/workspace/websiteBuilder`; initial and public release `3cd49bf8b42`. Mac is 168 commits behind origin with existing translation-worker/video/prototype changes; none were reconciled or overwritten. DGX Garmin/activity metrics changes preserved.

| Gmail ID / Date | Subject / Reported Issue | Verification And Disposition |
| --- | --- | --- |
| `1a1628a949763404`, October 22 00:36:51 -0700 | Page indexing issues successfully fixed for site tobyonfitnesstech.com. Different Google-selected canonical; six pages validated. | Full message read. Authenticated GSC October 22 snapshot shows this reason Passed / zero affected. Validation milestone confirmed, no new validation or redirect required. This is not search-visibility recovery. |

Exact Gmail query: `from:sc-noreply@google.com newer_than:8d`, Toby's account; one matching message. Authenticated Chrome profile/account verified, including after browser profile IDs changed during reconnection. PostHog Google sign-in restored using the existing account without asking Toby for credentials.

## Wins And Risks

Authenticated GSC video indexing (last updated October 21) shows 337 videos indexed and 18 not indexed, all under "Video isn't on watch page." This is a separate eligibility signal, not proof that article pages are broken. Keep dedicated watch-page presentation distinct from supporting embeds; inspect representative affected URLs before changing markup. No fresh manual-action/security result was established this week.

| Signal | Current | Prior | Interpretation |
| --- | ---: | ---: | --- |
| Pageviews / tracked people / sessions | 240 / 114 / 134 | 347 / 180 / 219 | Lower tracked traffic; not all identities are independently verified readers |
| Qualified events / people / sessions | 24 / 19 / 21 | 44 / 25 / 35 | Lower absolute engagement and breadth |
| Content-card clicks / people | 19 / 10 | 32 / 8 | Fewer actions, slightly broader participation |
| Video exposure-to-play native person funnel | 3/7, 42.9% | 4/10, 40% | Too small to declare a meaningful rate improvement |
| Video completions / people | 1 / 1 | 1 / 1 | Completion remains concentrated |
| Next-step funnel | Gym Monster 0/5, BJJ 0/2, WHOOP 0/1 | Gym Monster 1/9 | Not enough viewers to select a CTA winner |
| Dead clicks / people / sessions | 43 / 11 / 11 | 20 / 13 / 14 | More repeated clicks, not wider affected population |
| Exceptions / people / sessions | 2 / 1 / 1 | 5 / 2 / 4 | New issue remains open; see incident section |
| Resource errors / people | 24 / 19 | 17 / 13 | 22 third-party events, two first-party image events; image currently 200 |
| Long-task events / people | 51 / 36 | 120 / 93 | Counts decreased with traffic; not a normalized performance verdict |

Comparison page accounts for 29 dead clicks in two sessions (`01a16f4a-adc0-7367-8017-e0922cc547f7`: 16; `01a17023-6fbe-7877-b159-1d946c0ec7da`: 13). Red-day protocol has four in one session; WHOOP Recovery three in one. Masking verified: all text and inputs masked, images blocked. Targeted first comparison replay initially failed to load; one retry restored masked playback of the mobile two-device interface and selector. No exact dead-click control or functional failure was established. Do not convert aggregate labels into a speculative redesign. New outcome tracking will separate successful selection, blocked attempts and unchanged resets.

Thirteen resource failures concern Cloudflare's beacon, five Clarity, four PostHog, two `/images/podcast/episode_122_cover.png`; the first-party image currently returns 200/image/png. These do not justify removing tracking or claiming a persistent missing asset. No rage clicks. No current search opens/performed/result/no-results, newsletter/calculator outcomes, contact intent, outbound or podcast audio clicks; one podcast subscribe click. No affiliate events expected after removal. Absence of real-reader events is distinct from verified test instrumentation.

Native session entrances: home 39 versus 24; current red-day protocol ten, Wild Rebellion nine, OpenClaw five, Garmin/WHOOP five, sore-fingers article five. These are native session-entry counts, not the dashboard's Top pages by pageviews. Content clusters to maintain: practical recovery answers, cross-device comparison, fitness automation, and the owner-approved project/creator articles.

RUM p75: desktop LCP 1,920ms (49 samples), INP 62ms (26), CLS .003 (42); mobile LCP 564ms (61), INP 82ms (12), CLS 0 (46). Samples are not CrUX certification. GSC October 20 report still has insufficient data for both device types.

## Clarity Data-Quality Repair

Clarity latest initially reported `comparisonReady=true` with seven snapshots per period, but October 21 is absent. Its current snapshots span October 19-26, eight calendar days; prior spans October 12-18. The reported comparison was therefore not a valid equal-week comparison. Repair preserves raw counts and exposes missing/outside-window dates; sorting now follows snapshot date rather than collection/backfill time. Overall readiness requires 14 consecutive dates, including continuity between the two periods. No zero-filled or invented October 21 snapshot and no quota-consuming historical API request.

After operational report regeneration, `comparisonReady=false`, missing date October 21. Treat both period totals as descriptive, not a week-over-week trend: current 137 reader sessions/138 bots, prior 216/82; pages/session 1.52/2.91, scroll 32.69%/36.55%, active engagement 389/917 seconds and 23.39%/45.94%. Current dead-click sessions 14, quick-backs six, script/rage/error-click/excessive-scroll sessions zero. Only qualified page/device segment is homepage PC: 23 readers, seven bots, one dead-click session, one quick-back, no script errors. This is not a homepage variant winner.

Current acquisition includes direct/unknown 78 readers/137 bots; ChatGPT 14 Other sessions from a daily-distinct-user sum of one plus six AiPlatform sessions; Bing ten readers, Google five, DuckDuckGo three, Reddit three. Do not add these ChatGPT rows and call them 20 distinct people. Clarity reader classification and PostHog identities are different grains. Localhost has zero readers/two bots this window; prior internal/QA audit remains useful. Clarity's missing snapshot cannot now be backfilled through its 72-hour export horizon; wait for a genuinely consecutive window rather than fabricating recovery.

## Homepage Decisions

Live/source/events agree on layout `compact-2026-10-13`, test `compact-introduction`, variant `compact-comparison-and-reviews`. Do not pool it with earlier weekly-pick, WHOOP or Gym Monster layouts. Editorial story content rotates, so unchanged layout does not imply an unchanged content experiment. Metrics use maximum per-visit/section summary values, not summed repeated summaries. CTR and engagement are unique-person rates among qualified section viewers. Desktop/mobile are shown descriptively because each is below the 20-person decision threshold.

| Position / Purpose / Section | Viewers D/M | Avg Visible Seconds D/M | Five-Second Engagement D/M | Viewer CTR D/M | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| 1 Orientation / Hero | 11 / 6 | 4.9 / 4.4 | 45.5% / 50% | 18.2% / 33.3% | **Insufficient data**; keep |
| 2 Discovery / Latest articles | 11 / 6 | 49.2 / 6.7 | 45.5% / 83.3% | 9.1% / 16.7% | **Insufficient data**; keep |
| 3 Credibility / Training proof | 4 / 3 | 212.1 / 4.7 | 75% / 33.3% | 0% / 0% | **Insufficient data**; don't demote because low reach |
| 4 Viewing / Video hub | 1 / 0 | 10.2 / n/a | 100% / n/a | 0% / n/a | **Insufficient data**; retain consolidated hub |
| 5 Projects | 1 / 0 | 3.9 / n/a | 0% / n/a | 0% / n/a | **Insufficient data**; no removal evidence |
| 6 Newsletter | 0 / 0 | n/a | n/a | n/a | **Insufficient data**; retain one signup band |

Depth summaries: 17 people, median deepest section three, maximum five; newsletter never reached a qualified summary. Training's large desktop average is too concentrated to treat as typical interest. All nine recorded homepage clicks have nine arrival events across six people/nine sessions. These raw totals are not a randomized conversion result.

Item-level evidence: smart-gym link 2/11 desktop and 2/6 mobile viewers clicked; wearables link zero/11 and zero/6. Individual weekly stories have one-seven exposed viewers and no matched click (INNODIGYM seven desktop, Garmin/WHOOP three desktop, automation QA two per device); do not declare a topic loser. For next week's homepage, keep practical comparisons visible and one reviewed weekly pick, but do not force a new feature, reorder, consolidate further, move off or remove a section from these tiny samples. Require one complete unchanged variant-week and 20 unique qualified exposed viewers per compared item.

## Navigation Decisions

Schema `nav-2026-08-18-comparisons-a`; slot test `primary-slot-7-about-vs-comparisons`, variant Comparisons. Historical About is not a concurrent randomized control.

| Item / Surface | Viewers | Clickers / Viewer CTR | Matched Arrival | Decision |
| --- | ---: | ---: | --- | --- |
| Brand / global | 111 | 4 / 3.6% | 7/7 clicking sessions, 261ms mean | Keep; one current-page click explains some raw no-navigation activity |
| AgentStack / desktop slot 6 | 77 | 0 / 0% | No clicks | Keep; no replacement evidence |
| Videos / desktop slot 4 | 63 | 0 / 0% | No clicks | Keep; no replacement evidence |
| Articles / desktop slot 3 | 51 | 2 / 3.9% | 2/2 sessions, 276ms | Keep; one current-page click |
| Comparisons / desktop slot 7 | 51 | 1 / 2.0% | 1/1 session, 324ms | Keep; not a win over About |
| Training menu / desktop | 5 openers, 14 opening sessions | Selection 1/14, 7.1% | Running 1/1 | Insufficient data |
| Projects menu / desktop | 3 openers, 11 sessions | Selection 0/11 | No selection | Insufficient data |
| Reviews menu / desktop | 4 openers, 10 sessions | Selection 0/10 | No selection | Insufficient data |
| Primary menu / mobile | 1 opener, 1 session | Selection 1/1 | AgentStack and Articles recorded arrivals | Insufficient data |

Localized primary exposures six-nine per listed item; no robust device comparison. Global raw navigation clicks/arrivals 16/15 across seven people/12 sessions; saved matched session insight is the completion source, not the raw ratio. Current-page clicks and low dropdown exposure matter. About remains elsewhere; no primary navigation swap is justified.

## Google Visibility, Content And Publishing

Final GSC October 18-24: one click/121 impressions/.83% CTR/position 12.55, versus zero/123/0%/11.41. Seven dates observed, no missing-date inference. Only .915% of healthy August 9-15's 13,219 impressions; visibility cause remains unresolved. One click is not recovery. Current query intent is sparse: Tonal worth-it five impressions; tracker-failure question three; Speediance model queries one-three. Anthropic refund nine page impressions, Tonal video seven, model hub six. No supported high-volume title test or query-page anomaly removal; preserve the existing report hold and source-backed titles rather than manufacture demand.

GSC October 22: approximately 1.59K indexed/1.9K excluded; proper alternates 251, redirects 353, 404s 83, noindex seven, duplicate-without-user-canonical one, crawled-not-indexed 621, discovered-not-indexed 587. Google-different-canonical and 5xx both Passed/zero. Excluded alternates/redirects are not automatically bugs. Further URL-inspection evidence is needed before fixing intended canonical clusters or requesting validation. Sitemaps read October 26 with zero errors/warnings and 2,492 submitted; the legacy API indexed=0 is not the website index total. Live homepage, sitemap and localized search return 200; release meta verified. Episode 122's historically failed image is currently 200. Build indexability audit is zero broken internal links. Manual-actions/security were not freshly re-opened this week; do not promote last week's clean check into a new verification.

Publishing policy changed October 21: `docs/blog-manual-release.md` requires personal approval of an exact immutable package. Four old Hermes prepare/draft/review/publish jobs are intentionally disabled; old helpers reject invocation. The October 20 missing-cover-array build failure is historical, and current cover mapping plus regression tests/build are healthy. Do not rerun or re-enable retired jobs, treat old log silence as a new outage, restore automatic publication, rewrite approved copy or use model approval as Toby approval.

Git evidence this week includes the October 19 automation-QA article and three approved-package publications October 23-24: Wild Rebellion guidance, Pokemon automation, and Muse experience. Image-only corrections are not extra posts. Source inventory, staged approvals and live receipts govern future cadence; not the retired daily schedule. Reviewed creator/project content is a real pillar, but homepage views are not yet sufficient to promote it above fitness. Content ideas requiring editorial approval: deepen the red-day/recovery answer from existing first-hand evidence, cross-link tracker use-case articles to the comparison hub, and publish a distinct useful question from an already reviewed source packet. No speculative ownership/pricing or automated article published here.

## Prioritized Improvements

| # | Status | Improvement | Impact / Evidence / Confidence / Effort | Implementation And Measurement |
| --- | --- | --- | --- | --- |
| 1 | **PARTIAL** | Attribute Facebook ReferenceError and retain older incidents | High / two exceptions, one session / medium attribution, unknown impact / medium | Context captured; source search and primary SDK reference support a Meta-bridge hypothesis. No root-cause fix, suppression or harmlessness claim. Test physical Facebook browser when possible; preserve original CustomEvent, hydration and transition incidents. |
| 2 | **DONE** | Reject nonconsecutive Clarity comparisons | High / missing October 21 falsely labeled ready / high / low | `e3c0867dea5`; date-continuity metadata, calendar-date ordering and operational report regeneration. Fourteen focused tests pass; live DGX report now false/missing October 21 with raw counts retained. Source and Pages workflows succeeded; no historical sessions fabricated. |
| 3 | **DONE** | Measure actual comparison-selection outcomes | Medium / 29 dead clicks in two comparison sessions, target control unresolved / high measurement gap / low | `e3c0867dea5` adds `comparison_selection_outcome` with changed/blocked/unchanged, bounded reasons, public IDs/counts and pair/multi mode. Existing filter events retained, no layout/business logic change. Production browser tests cover limits, successful selection, pair swap and reset. Real-reader arrival and the original dead-click cause remain unverified. |
| 4 | **PARTIAL** | Continue search visibility/indexing investigation | High / .915% healthy impressions, 621 crawled and 587 discovered exclusions / high loss, low cause / medium | Six different-canonical pages validated and zero remaining in that reason. Preserve prior code fixes; inspect representative intended URLs after recrawl. No broad redirect/noindex/title rewrite from stale aggregate counts. |
| 5 | **NEXT** | Detect snapshot gaps within the provider backfill horizon | Medium / missing date currently too old to recover / high / low | Monitor consecutive snapshot dates and delivery/collector health; only legitimate timely provider backfills, never synthesize sessions. Retain deduplicated actionable alerts and raw snapshots. |
| 6 | **DEFERRED** | Select homepage/nav winners or remove sections | Medium / hero 11 desktop/six mobile; lower sections smaller / low / low | Keep consolidated proof/video/newsletter bands and current primary nav. Require full variant week and 20 unique exposed viewers; distinguish content rotation from layout. |
| 7 | **NEXT** | Strengthen recovery and tracker next steps from approved material | Medium / red-day protocol ten entrances, no matched next-step clicks / medium / medium | Review first-hand answer coverage and onward links; needs Toby's content judgment before publishing new explanatory claims. Measure item exposure and selection, not all-pageview rank. |
| 8 | **PARTIAL** | Track the manual approval/release cadence correctly | High / approved-package migration replaces retired daily jobs / high / low | Recognize current exact-version receipts and approved/live state. Previous automatic-runway/Pillow recommendations superseded where they concern retired jobs. Never re-enable daily publication or infer approval. |
| 9 | **NEXT** | Add native entrance dashboard and continue internal-traffic audit | Medium / session entrances differ from pageview rank / high gap / low | Reuse native session entry data; preserve correct Top pages labeling. Separate bots, repeated identities and explicit QA without deleting raw records. |
| 10 | **PARTIAL** | Validate real-reader outcome signals and translation boundaries | Medium / no search/newsletter/calculator arrivals / high gap, low demand / medium | Production search, locale, keyboard/button, result/no-result and failure-recovery QA passed with external analytics blocked. Distinguish tests from reader events, which remain absent. Wild Racing English updates remain intentionally held for locale review with notices, not fully translated. |

First actions: incident triage, Clarity continuity repair, comparison outcome instrumentation. The automation was updated with manual-publishing, current-layout, canonical-validation and date-gap safeguards while retaining its Monday schedule and the requirement to verify live versions. No editorial article or approval was created.

## Delivery Evidence

Source commit `e3c0867dea5599138844c13fe08a95eb714f5e94` pushed through canonical DGX main. Local build passed: 2,492 sitemap URLs, 2,706 HTML files, 19,517 JSON-LD scripts, 30 Product schemas, zero broken links, 191 translated posts/764 files. Release-surface audit explicitly retains Wild Racing locale-review holds. Four comparison browser tests pass, and 14 Clarity-focused tests pass. The report-only CLI regenerated the operational Clarity report without using API quota or sending synthetic alerts.

Delivery confirmed: [source workflow 40365136729](https://github.com/tobyglenn/websiteBuilder/actions/runs/40365136729) and [Pages workflow 40366180063](https://github.com/tobyglenn/websiteBuilder/actions/runs/40366180063) both succeeded. Fresh public `/compare/` HTML identifies release `e3c0867dea5599138844c13fe08a95eb714f5e94`. All 28 production browser tests passed (Chromium/WebKit, 390/1440px), covering comparison outcomes, exception context, standalone/localized/modal search, route revisits, homepage hydration and failure containment, with external analytics blocked. Fourteen focused Clarity tests also passed. Operational latest.json still reports `comparisonReady=false`, missing October 21; raw counts remain intact. Owned preview/tunnel stopped after verification.

Code receipts: `frontend/scripts/lib/clarity-insights.mjs`, `frontend/scripts/tests/clarity-insights.test.mjs`, `frontend/src/lib/comparisonClient.js`, and `frontend/scripts/tests/comparison-outcomes.test.cjs`. Live verification: [comparisons](https://tobyonfitnesstech.com/compare/), [homepage](https://tobyonfitnesstech.com/), [standalone search](https://tobyonfitnesstech.com/search/). No root-cause incident closed, replay unmasked, old scheduler resumed, approval inferred, credentials exposed, or unrelated working-tree file included.

Editorial decision still needed for #7: choose whether the recovery article should lead readers to the existing Garmin/WHOOP comparison or an owner-reviewed practical recovery checklist. Do not publish new health recommendations without Toby's review.
