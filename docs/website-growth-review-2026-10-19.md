# Website Growth Review: October 19, 2026

## First Priority: Fresh Browser Failures

Five exceptions affected two tracked people and four sessions in complete UTC October 12-18, versus zero October 5-11. Four are React hydration error 418 on the homepage, one Chrome identity across three sessions and three releases (`62edeb7d987`, `482e2d16dbd`, `92ef9039dd0`). They include page ages of 12 seconds, 44 minutes and about 20-23 hours. One additional person/session has `InvalidStateError: Transition was aborted because of invalid state. Prepaint layout check failed` on `/podcasts/agentstack/`, release `94347db05ac`, October 14. These are not the original opaque CustomEvent issue.

Original issue `019fe7cf-330d-7c60-bb61-3b536617c778` remains Active, with no occurrence in this complete week. The visitor is not Toby. No new original occurrence supplies fresh context; do not interpret quiet time as repair. Prior opaque Safari and legacy Opera incidents remain unresolved. Original exceptions, capture settings and masking are unchanged; nothing was suppressed or marked resolved.

Clean Chromium/WebKit homepage initial and visible-newsletter hydration tests did not reproduce the fresh homepage failures. That excludes only the tested clean-session paths, not extensions, long-lived tabs, or all navigation histories. New diagnostics record navigation phase, pending island counts and allowlisted component names without DOM text, props, query strings or CustomEvent detail. This is attribution work, not a root-cause fix. React's [418 documentation](https://react.dev/errors/418) identifies a hydration mismatch but lists multiple possible causes; no single trigger has been established here.

Targeted recording `01a14008-c025-7f9d-a885-018f282e435f` inspected in authenticated PostHog after verifying all text/input masking and image blocking. Inspector confirms the 418 error at replay time 00:05 and later hidden-window event; the visual player did not render the recorded page. This is a replay-inspection limitation, not proof that the visitor saw a blank website. No component-specific trigger or recovery behavior was established; no unmasking performed.

## Sources And Scope

- Gmail: authenticated `tobypeters@gmail.com`, exact `from:sc-noreply@google.com newer_than:8d` returned zero message IDs. No new matching messages to read or dispositions to invent; prior alerts remain carried below.
- PostHog connector works; pinned [Website Growth Weekly Review dashboard 1840395](https://us.posthog.com/project/498166/dashboard/1840395) inspected. Current October 12-18 versus prior October 5-11, complete UTC days. Native saved video/next-step funnels and navigation journey insights queried. Session entrances use the native sessions entry pathname, not Top pages by pageviews.
- Clarity `/home/toby/.openclaw/logs/analytics/clarity/latest.json`, generated October 19 09:45 UTC: `comparisonReady=true`, rolling daily snapshots October 13-19 versus October 6-12. Provider windows differ from PostHog; daily distinct-user sums are not weekly unique people.
- GSC `/home/toby/.openclaw/logs/analytics/gsc/latest.json`, generated October 19 10:30 UTC: final October 11-17 versus October 4-10, seven observed dates. Authenticated Chrome account verified; indexing UI is stale through October 11, video report through October 14, CrUX through October 16.
- DGX canonical checkout started at `2aa98f74d98`; live homepage meta matched it. Preserve its unrelated `siteMetrics.json` and subsequent historical-range changes, plus existing Mac translation-worker/video/prototype work. Changes use isolated review worktrees.

## Wins And Risks

| Signal | Current | Prior | Decision |
| --- | ---: | ---: | --- |
| Pageviews / tracked people / sessions | 347 / 180 / 219 | 178 / 103 / 119 | More tracked traffic, not proof of search recovery |
| Qualified engagement events / people / sessions | 44 / 25 / 35 | 30 / 21 / 23 | Modest increase in breadth, smaller than traffic growth |
| Content-card clicks / people | 32 / 8 | 15 / 7 | Repeated actions dominate the increase |
| Video exposed-to-play, native person funnel | 4/10, 40% | 1/11, 9.1% in prior review | Small samples; not a content winner |
| Video completions / people | 1 / 1 | 1 / 1 | No broad completion gain |
| Next-step item funnel | 1/9, 11.1%, Gym Monster destination | Prior six Gym Monster viewers/no matched clicks | Keep useful route; insufficient decision sample |
| Contact-intent people | 0 | 4 | Investigate only after more observations; not delivered messages |
| Podcast audio-click events / people | 3 / 2 | 0 | Intent, not verified play or completion |
| Exceptions / people / sessions | 5 / 2 / 4 | 0 | First investigation, see above |
| Dead clicks / people / sessions | 20 / 13 / 14 | 16 / 9 / 10 | `/compare/`: eight events/four people/four sessions; WHOOP Recovery three/one/one; OpenClaw two/two/two |
| Resource errors / people | 17 / 13 | 16 / 7 | Four first-party events; current CSS and both image URLs all return 200, not a verified persistent 404 |
| Long-task events / people | 120 / 93 | 56 / 36 | Larger exposure, not a normalized regression conclusion |

PostHog classifies 340 pageviews as Regular, six Bot and one AI Agent. Classification is not proof that every Regular session is a reader. Clarity readers 227 versus 94; bots 95 versus 114; pages/session 2.82 versus 1.48. Its acquisition includes nine reader-classified sessions referred by `127.0.0.1`; inspect internal/QA contamination before claiming organic growth. Google contributes one Clarity reader session, versus DuckDuckGo 15, Reddit 10, ChatGPT eight and Bing five. Direct/unknown contains 153 readers and 93 bots.

Clarity dead-click sessions 23/227 (10.1%) versus 16/94 (17.0%); quick-backs 12 versus three; script-error sessions five versus zero. Rage clicks, excessive scroll and error clicks zero. Scroll depth 36.29% versus 43.63%; active engagement 862 versus 659 seconds, rate 44.87% versus 53.10%. Qualified page/device segments: homepage PC 31 readers, four script-error sessions, seven quick-backs and two dead-click sessions; Wild Rebellion PC 26 readers, one script-error session, four quick-backs and one dead-click session. Neither establishes the cause or control involved. Do not unmask replays or redesign from these labels alone.

RUM p75: desktop LCP 554ms (40 samples), INP 70ms (26), CLS .003 (35); mobile LCP 983.5ms (31), INP 96ms (21), CLS 0 (six). GSC still reports insufficient CrUX data for both devices, not a pass. No rage-click event this week. No observed search opens/performed/result/no-results, newsletter or calculator outcomes; absence of real events is not proof these controls work or fail. Four outbound clicks; no affiliate revival. Podcast play/completion/subscription outcomes remain unverified.

Native session entrances this week include homepage 24, `/compare/` 17, OpenClaw fitness reports 12, Wild Rebellion ten, episode 122 seven, Gym Nano/VOLTRA debate five, and several comparison pages four each. Source/platform mix and internal activity require caution.

## Homepage Decision Table

The deployed layout is **`compact-2026-10-13`**, test **`compact-introduction`**, variant **`compact-comparison-and-reviews`**, not the prompt's September WHOOP test. Six sections now include Projects. October 12-18 is mixed with October 7 weekly-pick layout; never pool these or old WHOOP/Gym Monster cohorts to declare a winner. Summary rows deduplicated by visit/section using maximum dwell, viewed/engaged flags and click count. Engagement and CTR below are unique-person rates among qualified section viewers, not all homepage visitors. Repeated visit counts are not unique reach.

| Position / Section | Unique Viewers | Avg Visible Seconds | Five-Second Engagement | Viewer CTR | Purpose | Decision |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 1 Hero / compact introduction | 7 | 18.4 | 71.4% | 28.6% | Orientation, comparisons, weekly pick | **Insufficient data**; keep |
| 2 Latest articles | 7 | 19.8 | 71.4% | 14.3% | Recent first-hand content | **Insufficient data**; keep |
| 3 Training proof | 2 | 54.7 | 100% | 0% | Credibility and current training | **Insufficient data**; do not demote based on reach |
| 4 Featured/latest video hub | 1 | 2.4 | 0% | 0% | Viewing/discovery | **Insufficient data**; keep single hub |
| 5 Projects | 1 | 5.8 | 100% | 0% | Tools and game discovery | **Insufficient data**; don't mistake sitewide game visits for homepage exposure |
| 6 Newsletter | 1 | 1.6 | 0% | 0% | Subscription intent | **Insufficient data**; retain one signup band |

All observed summary cohorts above are Desktop; no usable Mobile summary cohort. Eight compact-layout depth-summary people, median deepest position three, maximum six. Hero section has seven qualified viewers; depth-summary visitors and qualified section viewers use different exposure definitions. New-layout clicks/arrivals 13/12 across two people: not an experiment winner or an exact person funnel. Prior-in-current-week weekly-pick cohort: hero nine viewers, 10.4s, 55.6% engagement, 11.1% CTR; articles three/5s/33.3%/0%, proof two/11s/50%/0%, videos two/2.5s/0%/0%; deepest median one, maximum four. No observed summaries for its newsletter in this period.

Require a full measured week per unchanged variant and at least 20 unique qualified viewers per compared section/item. Weekly changing editorial payload, repeated sessions, mixed layouts and only two clickers preclude a winner. Keep consolidated training/video/newsletter bands. Recommend next week's feature only from reviewed first-hand material; existing new Tonal cost/ownership articles are candidates, not license for speculative price claims. No promote/reorder/move-off/remove decision is justified yet.

## Navigation Decision Table

Schema remains `nav-2026-08-18-comparisons-a`; primary slot test `primary-slot-7-about-vs-comparisons`, variant `comparisons`. About remains available outside that primary slot. Historical About is not a concurrent randomized control.

| Item / Surface | Exposed People | Clickers / Viewer CTR | Click Sessions To Arrival | Decision |
| --- | ---: | ---: | --- | --- |
| Brand / global | 177 | 3 / 1.7% | 9/10, 90%, mean 1,976ms | Keep; investigate unmatched arrival before broad changes |
| AgentStack / desktop slot 6 | 131 | 1 / .8% | 2/2, 68ms | Keep; destination has demand, clicks concentrated |
| Videos / desktop slot 4 | 124 | 1 / .8% | 1/1, 55ms | Keep |
| Comparisons / desktop slot 7 | 121 | 1 / .8% | 3/3, 329ms | Keep; no About-versus-Comparisons winner |
| Articles / desktop slot 3 | 121 | 1 / .8% | 4/4, 254ms | Keep; one current-page click |
| Reviews dropdown / desktop | 8 openers, 23 opening sessions | Matched selection 1/23, 4.3% | Speediance 1/1, 374ms | Insufficient data |
| Projects dropdown / desktop | 6 openers, 20 opening sessions | Matched selection 6/20, 30% | Wild Rebellion and other recorded destinations arrive | Insufficient data; repeated use not broad preference |
| Training dropdown / desktop | 6 openers, 18 opening sessions | Matched selection 1/18, 5.6% | Recorded training destinations arrive | Insufficient data |
| Primary menu / mobile | 2 openers, 2 sessions | Matched selection 1/2, 50% | Comparisons 1/1, 120ms | Insufficient data |

Primary desktop items meet the exposure minimum but have only one clicker each; no simultaneous About control. Global brand has two current-page clicks. Localized primary samples mostly three-four people, dropdown item samples five; no reliable mobile/desktop preference conclusion. Overall raw clicks/arrivals 44/43, five people/14 sessions; use saved matched session insight above rather than treating raw ratios as native conversion. Keep current navigation pending clearer evidence.

## Google Search And Publishing

GSC final October 11-17: **zero clicks / 123 impressions / 0% CTR / position 11.41**, versus four / 269 / 1.49% / 9.43. Only **0.93%** of healthy August 9-15's 13,219 impressions. Seven observed dates; unresolved visibility incident hold remains correct. No classified query-page anomalies this week or prior; no current low-CTR opportunity meets the report's ten-impression minimum. Avoid rewriting titles from one-to-seven-impression samples. Query 'is tonal worth it' has four impressions; the existing new Tonal posts address that cluster, but no ranking lift is established.

GSC October 11 indexing snapshot: ~1.66K indexed / 1.76K excluded; alternates 297 Failed, redirects 364, 404s 84, noindex eight, duplicate-without-user-canonical one, crawled-not-indexed 503, discovered-not-indexed 497, Google-different-canonical four Started, server errors zero Passed. Feed example `/podcasts/feed.xml` still last crawled September 26, before the Atom self-link repair; live feed/self-link returns 200. XML-feed exclusion is not automatically an intended-web-page failure. No blanket redirects, mass validation or canonical changes justified from these stale counts.

Sitemaps live 200; API zero errors/warnings, not pending, index downloaded October 19 and child October 18, 2,455 submitted. API indexed=0 is not actual website index count. Live homepage, comparison, localized INNODIGYM and retained comparison blog pages return 200/self-canonicals; current release confirmed. Historical failed CSS and two image resources now return 200 with correct media types. Video indexing October 14: 339 indexed, 18 not on a watch page. Supporting article videos should not all become watch pages. Manual-actions and Security issues pages both freshly show "No issues detected"; this excludes only those reported categories, not every ranking/serving cause.

Publishing: October 12 and 13 stages built/published two Tonal articles. October 14 review rejected unsupported 2026 then a 288-word repair below the 300-word evidence threshold; publish rejected unreviewed draft. October 15-18 explicitly held because no eligible unused long-form section with verified timing/lineage/different topic. This is **2/7 published**, not a successful daily cadence, but bypassing the quality gate would be wrong. Reconcile source inventory/captions before restarting; never pad, fabricate timestamps, use Shorts or re-release duplicate source. Fitness-reports service active. Scheduled workspace Python and its venv both currently import Pillow (10.2.0 and 12.1.1); prior missing-Pillow runtime symptom is not current, but durable preflight remains unimplemented. Latest episode 122 is receiving entrances; do not alter the separate podcast approval workflow.

## Prioritized Improvements

| # | Status | Improvement | Impact / Evidence / Confidence / Effort | Implementation And Measurement |
| --- | --- | --- | --- | --- |
| 1 | **PARTIAL** | Attribute fresh hydration/view-transition incidents without suppressing | High / five exceptions, Clarity five error sessions / high incident, low cause / medium | `13c7e99e6a0` adds UI phase/pending-island structural diagnostics and versioned loader. Production diagnostic injection retains original exceptions and new phase fields; clean-browser hydration tests pass. Root cause remains unresolved, including original CustomEvent; this is not incident closure or a real-user recovery proof. |
| 2 | **DONE** | Complete localized standalone search and navigation lifecycle | High / four locales lacked form/outcome events / high / low | Same commit adds localized forms, privacy-safe outcomes and result selection, query-free event URL, per-page scope and Astro rerun/old-listener cleanup across five search pages. All four localized routes are live on this release; final production browser suite 24/24 passes. Real-reader arrivals remain unobserved. |
| 3 | **PARTIAL** | Restore source-backed publishing inventory and reference validation | High / two publishes, one rejection, four quality holds / high / medium | Concurrent work committed `15b6acb749e`, refreshing the spelling-only corpus hash, stating review length limits and adding once-daily hold notifications; `e6e6f10e5c5` retains prior audit findings and `93ef168d158` isolates notification tests. Preserved, not authored here. Today's biography/photo draft failed review again at 09:21:55 with invalid source-passage reference. Verify reference lineage, quality, next cycle, deployment and alert routing. Do not call daily publishing restored; no bypass or thin substitute authorized. |
| 4 | **PARTIAL** | Continue Google visibility/canonical recovery | High / .93% healthy impressions, indexing lag / high drop, low cause / medium | Preserve prior consolidation/indexability repairs and healthy baseline; inspect representative intended pages after Google's recrawl. No causal penalty claim, new title churn or mass redirects. |
| 5 | **NEXT** | Attribute comparison/WHOOP/OpenClaw dead clicks | Medium / compare eight/four people, recurring article clusters / medium / medium | Inspect only aggregate-targeted masked replay controls and reproduce exact behavior; no control-specific cause established today. Keep privacy masking. |
| 6 | **DEFERRED** | Decide compact homepage and navigation winners | Medium / compact hero seven viewers, one clicker per nav item / low / low | Preserve compact-layout cohorts and weekly content IDs. Require full week and 20 unique exposed viewers per comparison; don't demote low-position sections for low reach. |
| 7 | **NEXT** | Audit internal/QA traffic and unmatched arrivals | Medium / localhost-referred Clarity sessions, brand 9/10 matched arrival / high gap / low | Separate explicit QA/referrer cohorts without deleting raw records or misclassifying real readers; inspect single missing destination and repeated sessions before growth claims. |
| 8 | **PARTIAL** | Improve source-backed ownership-cost content cluster | Medium / prior Tonal demand, current four query impressions / medium / medium | New October 12-13 Tonal articles exist; verify factual source/prices and consolidate onward links before commissioning another near-duplicate. Toby approves experiential claims and prices. |
| 9 | **NEXT** | Add durable thumbnail runtime preflight | Medium / previous PIL failure, both interpreters work now / high current check / low | Pin/check actual scheduled interpreter, test missing-dependency failure routing without notifications from synthetic QA. Do not call this repaired solely because Pillow imports today. |
| 10 | **PARTIAL** | Maintain search/newsletter/tools/media measurement | Medium / absent real-reader outcome events / high gap / medium | Localized search gap addressed by #2; pending native session-entry dashboard tile, real event arrival, video/podcast outcome breadth and noncontaminating QA. Prior dependency/GSC missing-date fixes remain deployed. |

First actions this review: investigate fresh exceptions, deploy bounded attribution/search fixes, then verify production. Next operational priority is source inventory, not unreviewed daily publishing. Editorial decision needed: approve a genuinely new long-form topic/source if no eligible existing range survives review.

## Delivery Evidence

Source commit `13c7e99e6a05491c0370c6b5dc958c3d78cfe2bb`, DGX main pushed; [build/deploy run 39258135200](https://github.com/tobyglenn/websiteBuilder/actions/runs/39258135200) and [Pages run 39258967033](https://github.com/tobyglenn/websiteBuilder/actions/runs/39258967033) both succeeded. All four localized search pages returned 200, matched this release meta, displayed the new standalone form and loaded `20261019-ui-phase-search`. Live JS contains the new bounded phase/island diagnostics.

Production build passed: 2,454 sitemap URLs, 2,668 HTML files, 19,221 JSON-LD scripts, 30 Product schemas, zero broken internal links; complete release-surface translations and 188 posts / 752 translation files validated. Local new browser suite 8/8 passed; two exception fixture tests passed. Broad local modal-search QA was stopped because the isolated build intentionally lacked the public analytics configuration those legacy tests expect, not because this was verified as a production failure. First production QA exposed a hardcoded old analytics-version assertion and an artificial popstate navigation; fixtures now check the configured loader plus new UI-context version, and repeat the actual search form. Final production suite **24/24 passed, zero skips**, Chromium/WebKit at 390/1440 with third-party analytics blocked and the real exception-capture SDK exercised in isolation. Synthetic diagnostic events are not reader occurrences. Desktop German and mobile Hindi screenshots inspected; no horizontal overflow or overlapping controls.

Concurrent publishing commits followed this release and remain preserved. Their initial CI failed because a quality-hold unit test called live `hermes` on a GitHub runner. Concurrent fix `93ef168d158` mocks that boundary; its CI validation phase has passed, with full build/deploy still running at this receipt. Do not conflate the verified live search release with a claim that every newer publishing commit is already live. No source-quality guard was relaxed by this review.

Implementation map: `frontend/public/js/posthog-analytics.js` adds structural UI-phase context while retaining original exceptions; `frontend/src/components/PostHogAnalytics.astro` versions the loader as `20261019-ui-phase-search`; `frontend/src/pages/{de,es,pt,hi}/search.astro` adds forms/outcome tracking and scoped rerunnable scripts; all five search routes clean their old popstate listener at Astro swaps. `frontend/scripts/tests/localized-standalone-search.test.cjs` covers locale forms, success/no-results, selection, navigation back, privacy, viewport containment and visible-island hydration. `frontend/scripts/tests/exception-context.test.cjs` verifies phase attribution without losing original exceptions or leaking private values. Diagnostics require a fresh loader; old tabs do not acquire them without reload.

No root-cause incident closed; no editorial article, account change, analytics suppression, unmasking or source-quality bypass performed. Recommendation #2 is delivered; #1 has delivered diagnostics but unresolved cause/impact. Prior incomplete work remains explicitly carried forward.
