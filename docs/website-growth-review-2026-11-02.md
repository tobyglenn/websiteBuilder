# Website Growth Review: November 2, 2026

## Decisions And Incidents First

Restore the verified HTTP redirect failure, harden video-page hydration without suppressing errors, and retain the current compact homepage until exposure supports a decision. Do not rewrite titles or publish new editorial content from sparse search data.

**New React incident remains open.** PostHog issue `01a10645-3813-7352-a018-8d1f180f5839`: one unhandled React #418, one person/session, October 30 15:44:26 UTC, English `/video/7SbAqizIdzM/`, Android Chrome, French browser language, release `d5cdd7442a1039482da5d0549c135a080497b080`. Context: visible, ready, page age 42,280ms, three islands, zero pending islands, existing browser/UI diagnostics present. Stack points to React's `client.DdREcT8I.js`; source maps were unavailable. [React documents #418 as a hydration mismatch](https://react.dev/errors/418), not evidence that the page was harmlessly unaffected.

The targeted 48-second replay had one error and no clicks. Full text/input masking and image blocking were verified before inspection. Initial player load failed; one retry recovered playback. French-translated accessible controls were visible on the English URL, corroborated by `fr-FR` in the event. This supports browser-translation interference with delayed hydration, but does not prove the exact mismatched node or physical Chrome behavior. The newsletter's pre-hydration translation hold and stable embed origin are hardening, not a confirmed resolution. No exception was filtered, suppressed, replaced with a noop, or marked resolved.

Original Safari CustomEvent `019fe7cf-330d-7c60-bb61-3b536617c778`, prior hydration/view-transition incidents, and Facebook `_AutofillCallbackHandler` remain unresolved. This complete week's exception query contains only the React occurrence; absence of fresh events does not close older incidents or establish impact. The original Safari visitor is not Toby.

**Verified live configuration failure repaired.** HTTP returned `200` on both Mac and DGX while HTTPS remained available. The health log's first matching warning is October 31 20:00:54 EDT; 461 consecutive failures were logged by November 2 09:25 EST. Authenticated Cloudflare showed Always Use HTTPS off. Enabled that single switch; no DNS, TLS encryption mode, certificates, HSTS, origin, or redirect-list changes. Both machines then received `301` to HTTPS with path/query preserved. This newly observed failure is not an established cause of August's search collapse. Who disabled the setting and when is not established.

## Scope And Email

PostHog project 498166, pinned [Website Growth Weekly Review](https://us.posthog.com/project/498166/dashboard/1840395). Complete UTC October 26-November 1 versus October 19-25. Counts distinguish events, tracked people and sessions; identities are not automatically independent readers. Native session-start query is used for entrances, not Top pages by pageviews or InitialPage-associated pageviews. GSC final data covers October 25-31 versus October 18-24, generated November 2 11:30 UTC. Clarity uses daily 24-hour exports, a different window and grain.

| Gmail Search | Messages / IDs / Dates / Subjects / Issues | Verification / Disposition |
| --- | --- | --- |
| `from:sc-noreply@google.com newer_than:8d`, Toby's authenticated account | Zero matching messages; no message IDs or full messages to read | Connector succeeded, no new emailed issue to fix. Independently inspected authenticated GSC and API report; October 22 six-page canonical validation remains Passed, not visibility recovery. |

DGX `/home/toby/.openclaw/workspace/websiteBuilder` is production truth. Started at `e080dabc8502a5c2897f3578639ad43bd4748d69`, public source/live/events match compact layout. Canonical `frontend/src/data/siteMetrics.json` was already modified and preserved. Mac's existing three translation-script edits, staged videos file, prior memos and prototypes were not reconciled or deployed.

## Wins And Risks

| Signal | Current | Prior | Decision |
| --- | ---: | ---: | --- |
| Pageviews / people / sessions | 235 / 195 / 200 | 240 / 114 / 134 | Similar views, more shallow identities; not proof of reader growth |
| Qualified events / people / sessions | 17 / 15 / 16 | 24 / 19 / 21 | Lower engaged breadth; prioritize onward journeys |
| Content-card clicks / people | 5 / 5 | 19 / 10 | Fewer onward actions |
| Video viewed / played native person funnel | 7 / 1, 14.3% | 7 / 3, 42.9% | Very small denominator; inspect failures before content judgment |
| Video completion | 0 | 1, one person | No broad completion claim |
| Next-step native funnel | Gym Monster 0/3, AgentStack 0/2, training 0/1 | Gym Monster 0/5; other tiny groups | No CTA winner; preserve destination-level exposure |
| Dead clicks / people / sessions | 12 / 3 / 4 | 43 / 11 / 11 | Ten events on comparisons, two on Pokemon project; not necessarily broken clicks |
| Exceptions / people / sessions | 1 / 1 / 1 | 2 / 1 / 1 | New hydration incident, still unknown impact |
| Resource errors / people | 48 / 34 | 24 / 19 | More load failures, investigate resource and page/device cohorts |
| Long tasks / people | 85 / 78 | 51 / 36 | Increased counts; no CPU regression diagnosis from counts alone |
| Homepage clicks / arrivals | 2 / 2, two people | 9 / 9, six people | Current smart-gym destinations arrive successfully |
| Navigation clicks / arrivals | 2 / 1, one person | 16 / 15, seven people | Current brand click repeats current page; matched journey reaches home |

No current rage clicks, search opens/performed/results/no-results, newsletter/contact intent or calculator outcomes. Podcast audio clicks: three people; no current subscribe click versus one prior. One outbound click. Affiliate events are not expected after removal. Isolated QA is blocked from external analytics and is not counted as reader arrival.

Traffic classification on current pageviews: Regular 229 events/190 people/195 sessions, Bot four/four/four, AI Agent two/one/one. Regular is provider classification, not verified human identity. Do not erase raw data or classify unfamiliar visitors as bots without evidence.

Native session entrances: homepage 15 versus 39; OpenClaw fitness reports ten versus five; episode 47 eight; Pokemon project seven; comparisons seven; episodes 46/44 six/five; episode 125 five. These are session-start counts. Native InitialPage tables were also checked, but their visitor/associated-view columns are not substituted for entrances.

Comparison outcomes now **arrive in captured traffic**: five `changed / selection_updated / pair` events, two people/three sessions, across releases `c529a1e1e43`, `d5cdd7442a1`, `f84ded37cde`. No captured blocked outcome this week. Ten comparison dead clicks across two people/three sessions cannot be causally mapped to failed selections from aggregate totals alone. Last week's instrumentation is operationally verified; root-cause attribution is still incomplete.

Desktop RUM LCP p75 5,409ms (58 samples), INP 40ms (eight), CLS zero (36). Mobile LCP 1,274ms (19), INP 78ms (ten), CLS zero (six). Slow desktop examples include Anthropic refund (two people/two samples, p75 26,070ms) and scattered one-sample localized podcast/articles. Home is 1,446ms with three desktop samples; comparisons 1,165ms with three. Do not attribute the sitewide p75 to the homepage or certify a CrUX pass. GSC October 31 CrUX report has insufficient usage for both devices.

Resource clusters include Cloudflare beacon 19, Clarity eight, YouTube iframe API three, plus isolated images and PostHog extension scripts. Counts alone cannot distinguish transient blocking, connectivity or missing assets. Three implicated first-party images currently return 200: Pokemon hero 1,941,435 bytes, boats/tracks approved image 545,112 bytes, episode 91 cover 1,429,183 bytes. These are candidates for responsive derivatives, not confirmed missing assets or proven LCP causes. Preserve immutable approved originals; do not overwrite their package-bound bytes. Keep telemetry enabled.

## Homepage Decisions

Verified layout `compact-2026-10-13`, test `compact-introduction`, variant `compact-comparison-and-reviews`. Keep separate from earlier WHOOP/Gym Monster variants. Editorial stories rotate within this layout; a fixed layout is not a fixed content experiment. Require a full unchanged variant week and 20 unique exposed viewers per compared section/item. D/M denotes desktop/mobile. Dwell is per-visit deduplicated maximum; engagement and CTR use unique viewers, not total homepage visitors.

| Position / Purpose | Viewers D/M | Avg Visible Seconds D/M | Five-Second Engagement D/M | Viewer CTR D/M | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| 1 Hero / orientation | 12 / 4 | 3.0 / 5.8 | 41.7% / 75% | 8.3% / 25% | **Insufficient data**; keep |
| 2 Latest articles / discovery | 12 / 4 | 3.4 / 9.5 | 41.7% / 75% | 0% / 0% | **Insufficient data**; retain, no headline winner |
| 3 Training proof / credibility | 1 / 2 | 28.6 / 3.9 | 100% / 50% | 0% / 0% | **Insufficient data**; do not demote for low reach |
| 4 Featured/latest videos | 1 / 1 | 2.9 / 14.9 | 0% / 100% | 0% / 0% | **Insufficient data**; keep consolidated hub |
| 5 Games/Lilly / projects | 0 / 1 | n/a / 23.2 | n/a / 100% | n/a / 0% | **Insufficient data**; no removal evidence |
| 6 Newsletter / conversion | 2 / 1 | 3.1 / 9.0 | 50% / 100% | 0% / 0% | **Insufficient data**; retain one homepage band |

Deepest-position summaries: desktop 12 people/mobile four, median deepest position two on both; maximum six. Reach is not relevance. Smart-gym item: HTTPS 11 desktop/four mobile viewers, one clicker each; one separate HTTP desktop exposure had no click. Wearables: zero clicks among the same HTTPS exposures. Individual rotating story exposures are one to five people; no topic winner. Two matched arrivals took 2,117ms desktop and 382ms mobile, one each. These are descriptive, not an A/B win.

The saved section query lacked an explicit qualified-view guard. Added that guard after visit-level deduplication and monotonic dwell aggregation. Raw audit found all 345 summaries in these two weeks already qualified, so current/prior figures are **unchanged**. This is future-proofing, not a discovered inflation of this week's audience. Earlier provisional commentary was corrected after the raw audit. Tracker visibility means 800ms intersecting the central viewport; a low intersection ratio on a tall section is not automatically an unqualified view.

## Navigation Decisions

Schema `nav-2026-08-18-comparisons-a`; test `primary-slot-7-about-vs-comparisons`, variant `comparisons`. No concurrent About control. Counts below are current complete-week viewers and viewer-normalized CTR; exclude current-page clicks from onward-selection success.

| Surface / Item | Exposure / Action | Arrival / Interpretation | Decision |
| --- | --- | --- | --- |
| Global English brand | 155 viewers; one clicking identity; one current-page click; onward CTR 0.6% | One matched session reached in 360ms | Keep; don't count repeated-home click as discovery |
| Desktop AgentStack | 114 viewers, zero clicks | No onward journey observed | Keep pending better entry-page context; not a tested alternative winner |
| Desktop Articles / Videos / Comparisons | 88 viewers each, zero clicks | Zero matched actions | Keep; no About-versus-Comparisons winner |
| Desktop training dropdown | Three openers/four opening sessions, zero selections | 0% open-to-selection | Insufficient data; no removal |
| Desktop projects dropdown | Three openers/three sessions, zero selections | 0% | Insufficient data |
| Desktop reviews dropdown | One opener/one session, zero selections | 0% | Insufficient data |
| Mobile primary / projects | Two openers/two sessions; one/one respectively; zero selections | No selection comparison supported | Insufficient data; retain mobile controls |
| Localized primary items | Three to ten exposed viewers per locale/item, zero clicks | Small cohorts | Insufficient data |

Mobile and desktop samples differ substantially; do not pool surfaces or interpret low menu exposure as low usefulness. Current-page brand activity explains part of the click count, not missing primary-item clicks.

## Search, Publishing And Pipeline

GSC final October 25-31: four clicks, 111 impressions, 3.60% CTR, position 9.97; prior one click/121 impressions/.826%/12.55. This is still **0.84%** of the fixed healthy August 9-15 impression baseline (13,219, 99 clicks). The report correctly holds comparative content recommendations. Four clicks do not establish visibility recovery or prove a cause. No current AgentStack query-page anomalies were removed.

Clicks include homepage, Speediance-versus-Tonal, one German Gym Monster article and Spanish comparisons (one each). Top low-click exposures include German blog index 14 impressions, Spanish videos 12 and Portuguese WHOOP 12. Visible queries are tiny: `tonal vs speediance` one click/one impression; `speediance 2 vs 3` two impressions. No mass title/meta rewrite, translation deletion or blanket noindex justified.

Authenticated GSC page-index report is still dated October 22: 1.59K indexed, 1.9K excluded; alternate canonicals 251, redirects 353, 404s 83, noindex seven, duplicate-without-selected-canonical one, crawled-not-indexed 621, discovered-not-indexed 587. Different-Google-canonical and 5xx validations Passed/zero. These are stale snapshots, not newly worsened counts. Video report updated October 28: 331 indexed, 19 not-on-watch-page versus prior 337/18; inspect specific intended watch pages before changing supporting article embeds. Sitemaps downloaded successfully November 2/November 1, zero errors/warnings, 2,537 submitted in API snapshot. Legacy sitemap `indexed=0` is not the indexed-site count.

Read `docs/blog-manual-release.md`. Exact approved releases this week: `eb016e2762f` (October 26, Wild Racing track redesign/Wild Skies), `5ae67951091` (October 28, boats/tracks/AI choices), `f63ea4bad44` (October 29, black belt/home training); receipts say pushed, not inherently live. No new article, approval, rewrite or translation release was generated by this review. Four retired Hermes blog jobs remain intentionally paused; October 20 blog-generation/translation logs are historical. Current morning/nightly, Clarity/GSC and site-health logs were inspected; HTTP redirect failure is the actionable active infrastructure issue, not a silent daily-publishing failure.

Clarity generated November 2 10:45 UTC. Current seven snapshots October 27-November 2 are consecutive; prior seven span October 19-26 and omit October 21. `comparisonReady=false` remains correct. Current descriptive reader/bot sessions 125/76; pages/session 1.08, scroll 31.13%, active engagement 259 seconds/40.98%; five dead-click sessions/13 events, three quick-backs, zero script/rage/error-click/excessive-scroll sessions. No page/device segment reaches 20 reader sessions. Current acquisition: direct/unknown 91 readers/76 bots, YouTube seven, Bing six, DuckDuckGo six, Google five, ChatGPT four, Yahoo two, localhost referral one. The last merits QA-source audit, not wholesale deletion. Do not compare partial prior totals as equal weeks or fabricate October 21. Recompute continuity next week rather than permanently forcing false.

## Prioritized Improvements

| # | Status | Improvement | Impact / Evidence / Confidence / Effort | Implementation And Measurement |
| --- | --- | --- | --- | --- |
| 1 | **PARTIAL** | Attribute React #418 and retain earlier incidents | High / one fresh reader-classified session, masked French controls / medium mechanism, unknown impact / medium | Incident reviewed first; known-signature diagnostics and no suppression. Hardening below is not root-cause closure. Source-map upload and physical translated Chrome reproduction remain gaps. |
| 2 | **DONE** | Restore HTTPS enforcement | High / HTTP 200 reproduced on two machines; monitor failures / high / low | Cloudflare switch persisted on; both machines verify path/query-preserving 301. HTTP www follows to canonical HTTPS 200 without a loop. Scheduled monitor recovered at 09:40 EST and posted to build-log. No DNS/TLS-mode changes. |
| 3 | **DONE** | Stabilize video SSR and deferred form hydration | High / server/client origin branch and translation-exposed deferred form / high hardening, medium incident link / low | `22d19db0310` live: canonical origin prop on English/localized watch pages; translation held only until newsletter hydration. Bounded recent known-island/age context, swap reset, cache-version loader. All 33 production tests pass; incident #1 remains open. |
| 4 | **DONE** | Make homepage qualification contract explicit | Medium / query omitted flag, but all current summaries already qualified / high guard, no current uplift / low | Same live source adds post-dedup `viewed=1` and maximum dwell; saved insight KZu0kTpu updated and re-executed. Regression test passes; audience totals unchanged. |
| 5 | **PARTIAL** | Resolve comparison dead-click interpretation | Medium / ten events, two people/three sessions; five successful pair outcomes / medium / medium | Last week's event arrives; retain outcomes. Next: correlate exact same-session event timing/controls, not aggregate equality. No speculative selector redesign. |
| 6 | **NEXT** | Diagnose slow desktop LCP cohorts and first-party failures | High / p75 5.4s, 58 samples; scattered slow pages / medium / medium | Inspect LCP element/resource timing and sizes for identified pages. Require technical reproduction or adequate page/device exposure; don't optimize homepage against unrelated slow pages. |
| 7 | **PARTIAL** | Investigate search visibility and watch-page eligibility | High / 111 impressions versus 13,219 baseline; 19 non-watch exclusions / high loss, low cause / medium | Preserve validated canonicals; fresh representative inspection and recrawl. Newly fixed HTTP issue is not attributed to August. No unsupported bulk index changes. |
| 8 | **DEFERRED** | Declare homepage/nav winners or remove blocks | Medium / homepage 12 desktop/four mobile; menu openers tiny / low / low | Keep compact proof/video/newsletter layout and Comparisons. Need full unchanged week and 20 viewers per tested alternative; no About control exists now. |
| 9 | **NEXT** | Strengthen approved OpenClaw/media next steps | Medium / OpenClaw ten entrances, low media/next-step completion / medium / medium | Editorial choice: lead with an existing fitness-automation guide, video, or privacy/setup checklist. Use approved firsthand material; Toby must approve any new article or health/product claim. |
| 10 | **PARTIAL** | Sustain clean weekly evidence and manual-release cadence | Medium / correct Clarity gap hold, three reviewed releases, zero search/newsletter signals / high / low | Carry prior gap alerts/native entrance dashboard/QA-source audit forward. Check real reader signals separately from blocked QA; validate approved URLs and never resume retired jobs. |

First actions this week: exception triage, verified HTTPS restoration, hydration safeguards. Content ideas requiring Toby's approval: a source-backed OpenClaw setup/privacy checklist, practical home-training changes after the black belt, and a precise Tonal-versus-Speediance decision guide using already documented experience. Query counts are insufficient to assert topic winners or new product facts.

## Delivery Evidence

Source commit `22d19db031000a1ec21c16bcd1dfa7461d636846`, canonical DGX main to GitHub Pages; [source workflow 41464025409](https://github.com/tobyglenn/websiteBuilder/actions/runs/41464025409). Isolated build passed, including indexability/hreflang/translation audits, 194 translated posts/776 files. Wild Racing English update remains held for translation review with notices on retained locales. Four local Chromium/WebKit video tests passed at 390/1440px on the actual English incident route and an existing translated route. Three fixture/query tests passed; two production-only tests intentionally skipped locally because preview has no analytics key. An initial combined preview run timed out on that missing-key expectation, and initial video test selectors/routes were corrected to the actual page contract; these were QA harness issues, not hidden release failures.

**Final receipts:** source workflow above and [Pages workflow 41464694185](https://github.com/tobyglenn/websiteBuilder/actions/runs/41464694185) succeeded. Fresh public incident-page HTML identifies `22d19db031000a1ec21c16bcd1dfa7461d636846`. All 33 production tests passed, zero skipped: comparison outcomes; English/localized video SSR origin and hash seeking; deferred newsletter hydration and post-hydration translation permission; privacy-safe exception diagnostics with the real SDK; homepage query contract; mobile keyboard/button search, result/no-results, locale metadata, route revisits and failure containment. External analytics were blocked. Native browser translation on physical Android was not reproduced and no original error is declared fixed.

Build receipts: 2,541 sitemap URLs, 2,755 HTML files, 19,905 JSON-LD scripts, 30 Product schemas, zero broken internal links; 10,261 hreflang links/zero failures; 194 translated posts/776 files valid. The API's earlier 2,537-URL snapshot and this build count refer to different capture times, not an indexing-loss diagnosis. The three approved article URLs above return 200.

Operational receipt: scheduled health check November 2 09:40:54 EST confirms DNS/proxy, HTTPS, redirects and sitemap pass, posted to build-log channel `1485243812442804327`. Its generic historical DNS caveat is not evidence that this HTTP failure was a false alarm; two-machine 200-to-301 verification establishes the actual repair. [Comparisons](https://tobyonfitnesstech.com/compare/), [incident watch page](https://tobyonfitnesstech.com/video/7SbAqizIdzM/), [translated watch-page check](https://tobyonfitnesstech.com/de/video/9JA9pjANcPo/), [standalone search](https://tobyonfitnesstech.com/search/).

The weekly automation retains Monday 09:00 and now carries HTTP enforcement, new React incident/context version, qualified-view semantics, page-specific LCP and recomputed Clarity continuity forward. No personal approval, content rewrite or publishing bypass was created. Canonical generated metrics and all unrelated Mac changes remain preserved. The documentation follow-up uses skip-ci; live application release remains the source commit above.
