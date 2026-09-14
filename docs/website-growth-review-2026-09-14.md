# Website Growth Review - September 14, 2026

## Decisions First

### Search Investigation Follow-Up

Code `69dd3eb1b0` repairs a verified deployment defect: old hashed CSS/navigation bundles were deleted while Googlebot and readers still requested them. Production now retains 335 historical bundles for 30 days; the exact GSC/PostHog examples return 200 with their original hashes. The GSC warning now retains the verified August 9-15 baseline instead of aging the collapse out of its four-week window; live reporting and build-log-errors delivery are verified. These two repairs are **DONE**. Priority 1 remains **IN PROGRESS** because the cause of the entire August 15-16 visibility collapse is not proven. The main WHOOP page's stored Google crawl loaded all resources, and the announced August 18 spam update starts after the initial loss. See [the detailed investigation](search-visibility-investigation-2026-09-14.md) for evidence, counterevidence, and remaining decisions.

Three evidence-backed improvements were implemented in `1ee3bdfbbeb786d1c3ebd672b3d64127e82050e1`: remove unsupported sleep merchant markup, repair dashboard denominators, and make homepage/navigation impressions visibility-aware with complete homepage experiment attribution. Delivery verification is recorded below.

The largest business risk is still the August search visibility collapse. **It is not just an API problem:** authenticated Search Console and the API agree on 3 clicks and 281 impressions for September 6-12. Four inspected priority articles/hubs are indexed with matching canonicals. No manual actions or security issues are reported. The cause of the broader decline is not established, and this review does not claim recovery.

Do not replace the homepage feature or navigation based on this week's sparse clicks. The corrected hero count is 12 desktop people across 23 visits, not 23 independent viewers. Keep the existing tests running while collecting reliable exposure data.

## Windows And Evidence

- PostHog project 498166, [Website Growth Weekly Review](https://us.posthog.com/project/498166/dashboard/1840395): September 7-13 versus August 31-September 6, complete UTC days. Timestamp-form date overrides unexpectedly included the incomplete current day; those results were discarded and date-only ranges verified. Saved SQL uses complete day boundaries.
- GSC snapshot generated September 14 at 10:30 UTC: September 6-12 versus August 30-September 5, final data. These are not identical to PostHog's windows.
- Clarity snapshot generated September 14 at 09:45 UTC: daily snapshot labels September 8-14 versus September 1-7; `comparisonReady=true`. Rolling daily capture windows are not identical to calendar-day PostHog data.
- Known PostHog bots are excluded from the corrected SQL via `$virt_is_bot`; that virtual property is exposed by schema discovery but the SQL tool emits an inconsistent taxonomy warning. Unknown automation/internal readers are not conclusively excluded. PostHog people are measured identities, not guaranteed distinct humans.
- The warehouse-schema endpoint still reports `Tool read-data-warehouse-schema not found` / `INVALID_ARGUMENT`. Dashboard execution, event-property discovery, SQL, and insight updates work. Existing saved-query table/column definitions and current event schemas were used.
- Aggregate evidence: `docs/analytics/weekly-evidence-2026-09-14.json`. Reversible dashboard definitions: `docs/analytics/dashboard-repair-2026-09-14.json`. No credentials or replay contents are included.

## Google Email Review

Search: `from:sc-noreply@google.com newer_than:8d`. One message found and read in full.

| Message ID | Date | Subject | Reported issue | Verification | Disposition |
|---|---|---|---|---|---|
| `1a081414eba26ef3` | September 8, 2026, 13:42 UTC | Your August Search performance for tobyonfitnesstech.com | Monthly performance summary, not an indexing alert | Email reports 177 clicks, 26.6K impressions, 379 pages with first impressions; two highlighted translated article URLs return 200 | Informational demand evidence; no code change based solely on the message |

The email's leading pages were WHOOP 5 (20 clicks), Anthropic refund (18), and Speediance versus Tonal (9). Growing queries included `speediance 2 vs 2s`, `speediance vs tonal`, and `whoop maße`. Germany contributed 17 August clicks. This supports continuing comparison content and maintaining translated canonicals, but is not a current-week CTR comparison.

## Wins And Risks

| Signal | Current | Prior | Interpretation |
|---|---:|---:|---|
| PostHog dashboard pageviews, original filters | 192 | 251 | -23.5%; includes some known automated traffic |
| PostHog pageviews, known bots excluded | 184 | 237 | -22.4%; 109 versus 170 measured people |
| Qualified engagement events / people | 24 / 13 | 19 / 16 | More events, fewer people; not a conversion-rate improvement |
| Content-card clicks | 3 | 2 | Current clicks all come from one measured person |
| CTA clicks | 5 | 1 | Current clicks come from two people |
| Video embed exposures / plays | 10 / 0 | 7 / 1 | Current exposure-to-play funnel: seven exposed people, no plays; insufficient sample |
| Podcast audio clicks / plays | 1 / 0 | 0 / 0 | An outbound audio click is not verified playback |
| Contact intent | 1 | 1 | Flat, very small sample |
| Newsletter starts, attempts, signups, errors | 0 | 0 | No observed funnel activity, not proof of a broken form |
| Affiliate clicks / calculator activity | 0 / 0 | 0 / 0 | Do not reintroduce affiliate language or infer demand from zeros |
| Search performed / result clicks | 2 / 0 | 0 / 0 | `oura` and `oura ring`, one person on `/wearables/`; no no-result event observed |
| Exceptions / affected people | 7 / 1 | 7 / 4 | Identity-concentrated, not seven independent failures |
| Dead clicks / affected people | 28 / 6 | 38 / 8 | Lower event volume; individual page clusters still small |
| Rage clicks | 2 | 2 | One affected person in each period |
| Resource-error events / people | 43 / 15 | 31 / 22 | More events, fewer affected identities |
| Long-task events / people | 42 / 34 | 73 / 62 | Lower volume, not a latency percentile comparison |
| Clarity reader sessions / bot sessions | 133 / 138 | 161 / 53 | Readers -17.4%; bots +160%; never combine into audience growth |
| Clarity pages/session / scroll depth | 1.29 / 39.83% | 1.17 / 31.88% | Directionally deeper exploration among recorded readers |
| Clarity quick-back sessions | 6 | 1 | Follow up, but small page-level samples |
| Clarity script-error sessions | 2 | 7 | Improved breadth, still unresolved errors |
| GSC clicks / impressions | 3 / 281 | 1 / 331 | UI corroborates API; low totals are real reported search performance |

Clarity's only qualifying page/device combination is homepage desktop: 24 reader sessions, one bot, two dead-click sessions, two script-error sessions, one quick-back session. Daily distinct-user sums are not weekly unique people. Direct accounts for 103 reader sessions and 137 bots; ChatGPT contributes eight readers, Bing five, Google three. Some self-referral/LAN traffic exists, so these are not all independent external readers.

Sampled PostHog Web Vitals: desktop LCP p75 1,158 ms (23 samples), INP p75 72 ms (15), CLS p75 0 (6); mobile LCP 789 ms (7), INP 60 ms (4), no CLS samples. Sparse SDK samples are not a CrUX pass. GSC Core Web Vitals has no data for either device class.

## Homepage Decisions

Current layout: `home-2026-08-18-gym-monster-a`. Test: `hero-demand-topic`, variant `gym-monster-comparison`. At least **20 unique measured viewers per compared section/item** and one complete week are required for content/layout decisions, with additional caution when total clicks are tiny. No section meets the current-week unique-viewer threshold.

Rates below use unique section viewers. Dwell is deduplicated per visit, not per person; mean/median are both shown because prior-week long-lived tabs heavily distorted means. Reach must not be interpreted as relevance without accounting for position.

| Position / section | Purpose | Desktop unique people / visits | Mean / median visible seconds | Five-second engagement | Viewer CTR | Mobile people; engagement; CTR | Decision |
|---|---|---:|---:|---:|---:|---|---|
| 1. Hero and featured story | Orientation | 12 / 23 | 80.9 / 5.3 | 58.3% | 0% | 1; 100%; 100% (About link, not the comparison feature) | **Insufficient data**; retain current feature |
| 2. Latest articles | Content discovery | 3 / 9 | 32.2 / 7.0 | 66.7% | 33.3% | 1; 100%; 0% | **Insufficient data**; keep position |
| 3. Current training proof | Proof | 2 / 5 | 38.6 / 4.6 | 50% | 0% | 1; 100%; 0% | **Insufficient data**; do not remove because reach is lower |
| 4. Featured and latest videos | Video discovery | 2 / 4 | 3.5 / 2.3 | 50% | 0% | No measured viewers | **Insufficient data**; keep consolidated block |
| 5. Newsletter signup | Conversion | 2 / 2 | 1.1 / 1.1 | 0% | 0% | No measured viewers | **Insufficient data**; keep single block |

Desktop checkpoint summaries recorded deepest positions 1/2/3/4/5 for 11/3/2/2/2 people respectively. These overlap as readers continue scrolling; they are not additive final-depth cohorts. Two people reached the newsletter checkpoint. One mobile person reached position three. All sections share the same layout; only the hero carried test metadata historically. Today's code propagates page-test context to sections 2-5 without backfilling old events or claiming each section was separately randomized.

Current homepage arrivals: three events from two people, corresponding to two latest-article visits and one About visit. The comparison hero had no current-week recorded clicks. Older item-impression insight `sc2ADZSP` still uses visit-based terminology; treat its counts as diagnostic until its denominator is aligned too. Do not declare the hero a loser from this.

## Navigation Decisions

Schema `nav-2026-08-18-comparisons-a`; test `primary-slot-7-about-vs-comparisons`, variant `comparisons`. This is a sequential version comparison, not a randomized A/B test. Historical About denominators need recomputation with the corrected identity definition before choosing a winner.

| Surface / item | Unique exposed people / exposed sessions | Matched selecting sessions | Viewer CTR | Prior viewer CTR | Decision |
|---|---:|---:|---:|---:|---|
| Desktop Articles | 63 / 73 | 0 | 0% | 2.2% (89 people) | Keep; do not infer lost relevance from two prior clickers |
| Desktop Videos | 63 / 73 | 1 | 1.6% | 1.1% (89 people) | Keep |
| Desktop AgentStack | 72 / 82 | 1 | 1.4% | 0% (104 people) | Keep; meaningful search cluster, sparse selection |
| Desktop Comparisons, slot 7 | 63 / 73 | 0 | 0% | 0% (89 people) | Keep collecting; no About-versus-Comparisons winner established |
| Global brand/home | 98 / 108 | 1 | 1.0% | 0.7% | Keep; current-page clicks tracked separately |
| Mobile primary items | 2 each | 0 | 0% | 1-2 exposed people | Insufficient data; no mobile redesign |
| Desktop Projects menu | 3 unique openers / 15 opening sessions | 8 selections | 53.3% of opening sessions | 14.3% | Insufficient unique people; likely repeated exploration |
| Desktop Training menu | 4 unique openers / 13 sessions | 1 | 7.7% | 0% | Insufficient data |
| Desktop Reviews menu | 2 unique openers / 8 sessions | 0 | 0% | 0% | Insufficient data |

Navigation logged 36 click events and 32 arrival events from three people; those event totals are not a matched funnel percentage. Saved destination tables contain mostly successful arrivals; the old `#one-peter-memory` selection lacks a matched arrival. Exposure gaps include Running (one click, no exposure) and two Pokemon project click sessions without matching exposure. The repaired dashboard exposes these gaps rather than fabricating 100% or 133% CTR. Brand and always-visible desktop primary links have no menu-open step; their menu conversion is now null, not 100-300%.

## Search Console And Publishing

- Current GSC CTR 1.0676%, average position 8.52; prior 0.3021%, position 12.46. All three current clicks belong to the Anthropic refund page (14 impressions). These small denominators do not support broad title testing.
- Four-week reference August 9-15: 99 clicks, 13,219 impressions. Current impressions are 2.1% of that baseline. The report's discontinuity guard correctly holds automatic recommendations; this week's UI check confirms the observation, not its cause.
- The unfiltered three-month UI chart shows a sharp break around mid-August. No manual actions or security issues detected. Do not attribute the break to DNS, translations, a Google update, or markup without evidence.
- Indexed URL inspections: WHOOP English, Anthropic refund, Gym Monster comparison hub, WHOOP German, and sleep page all indexed. Priority article/hub Google-selected canonicals match their declared URLs. Crawl allowed and successful. WHOOP English last crawled September 7; Gym Monster September 11; German WHOOP August 28; Anthropic September 6.
- Page-indexing report remains dated September 3: about 1,889 indexed, 1,314 excluded. Reasons: 91 404, 394 redirects, 8 noindex, 287 crawled-not-indexed, 189 discovered-not-indexed, 341 alternate canonical (validation started), 4 different Google canonical (validation started). This is not a fresh September 14 inventory. The four mismatch samples were not fully inspected during this run.
- Sitemap API has no errors/warnings; current submitted count in the morning snapshot was 2,287. Its `indexed=0` field is not evidence of zero indexed pages. Today's new build contains 2,292 sitemap URLs and 2,325 HTML files, zero broken internal links.
- Merchant report September 12: four missing-image examples on `/sleep/`, `/de/sleep/`, `/es/sleep/`, `/pt/sleep/`. Live source and indexed URL API corroborated the unsupported Product/Offer/rating block. Removed from these plus Hindi. Google must recrawl before its stored issue counts clear; no promise of an immediate validation pass.
- Product snippets show one invalid item; merchant failures were investigated directly. Video rich-result markup shows 86 valid/zero invalid, but video-indexing exclusions were not fully inspected. August email reports zero video-search clicks.
- Two email-highlighted German/Spanish article URLs return 200. The German WHOOP translated canonical is independently indexed. Sitemap and canonical checks pass in the full build. Legacy `/podcasts/hi/` is still a real 404; do not redirect it to an unrelated page simply to reduce a count.
- Daily blog pipeline published successfully September 7-13, seven of seven days. Latest published article: `/blog/why-should-anyone-listen-to-me/`. The publisher logs record builds and live URLs.
- Translation worker: 192 complete posts, 768 translations, zero remaining and zero failed tasks on September 13. Current publishing is working; do not revive an obsolete translation-queue diagnosis.
- Fitness report service is active; port 8082 returns 200 and report modified September 13. The LAN website preview was not listening on 4331; restored via a user systemd transient service using an explicit `--directory` after rebuilding. `/gear/` now returns 200. Reboot persistence for that preview service is not claimed.

## Prioritized Improvements

| # | Status | Improvement | Impact | Evidence / confidence | Effort | Implementation And Measurement |
|---|---|---|---|---|---|---|
| 1 | **IN PROGRESS** | Diagnose mid-August search visibility loss | High | UI and API agree; five indexed URL checks rule out simple blanket deindexing / high observation confidence, low cause confidence | Medium | Continue query-page/device/country and crawl-history analysis around August 15-18; inspect four canonical mismatch samples and representative 404s. Keep discontinuity warning active; require recovery across complete weeks. |
| 2 | **DONE** | Remove false merchant/rating claims from sleep dashboards | High | Four GSC examples, live unsupported offer and 2,847-review claim / high | Low | All five `src/pages/**/sleep.astro` pages remove the Product block; build audit rejects Product on sleep routes. Live 200/no-Product verification passed in all languages. Google validation started September 14. |
| 3 | **DONE** | Repair unique-viewer and conversion denominators | High | 133.3% item CTR and 100-300% menu rates without opens / high | Low | Updated and executed `KZu0kTpu`, `lnqy7ORh`, `z7xk5gn9`; person versus visit counts, matched sessions, current-page clicks, known-bot filtering, null denominators and exposure gaps. Before/after definitions and SQL committed. All rates verified within 0-100 or null. |
| 4 | **DONE** | Make exposure tracking visible-tab-only and complete experiment context | Medium | Item timers had no visibility guard; sections 2-5 had empty test IDs / high | Low | `posthog-analytics.js` clears hidden timers and resumes uncounted exposure without duplicating viewed items; section properties inherit page-test context. Loader `20260914-visible-exposure`; four browser regression tests and live Chromium/WebKit desktop/mobile checks passed. |
| 5 | **DEFERRED** | Decide homepage feature and section order | Medium | Hero 12 desktop people, later sections 2-3 / high confidence that sample is insufficient | Low | Preserve Gym Monster test and consolidated training/video/newsletter blocks. Align remaining item/depth insights to people, then compare historical baseline after 20 unique exposed people and adequate clicks. |
| 6 | **PARTIAL** | Finish About-versus-Comparisons navigation evaluation | Medium | Comparisons 63 desktop people, zero clicks; mobile two / medium | Low | Keep current slot while recomputing About baseline with corrected identity definitions. Do not use the old visit-as-viewer counts or declare superiority from a single click. |
| 7 | **NEXT** | Publish a focused comparison answer from existing evidence | Medium | August WHOOP/Tonal/Gym Monster demand; current `is tonal worth it` has 10 impressions / medium | Medium | Prioritize a dated Speediance-versus-Tonal answer with current costs, what Toby personally tested, and links to existing comparisons. Alternatively WHOOP dimensions/fit evidence. Editorial approval needed for recommendations and product claims; no speculative copy published. |
| 8 | **NEXT** | Validate Oura search-to-result and consumption journeys | Medium | Two Oura searches by one person, no result click; seven video-exposed people, no play / low diagnostic confidence | Low | Reproduce Pagefind Oura results and click capture; exercise no-results and video/audio playback with telemetry isolated. Missing events are not automatically bugs. Keep existing WHOOP answer tables; do not duplicate them. |
| 9 | **PARTIAL** | Attribute remaining Safari and resource failures | Medium | Seven exceptions from one person; three diagnostics show zero bad JSON-LD contexts/arrays/parse failures / medium | Medium | New diagnostics implicate homepage and a React client asset, not proof of the former context bug. Resource errors include trackers and an episode112 cover that now returns 200. Inspect only targeted fully masked replays; none were opened in this run. Separate blockers/cache/network from missing site assets before code changes. |
| 10 | **BLOCKED** | Complete source-map attribution and carry remaining analysis gaps | Medium | Release diagnostics shipped previously; authorized source-map upload credentials not verified / high | Medium | Resolve approved source-map upload access without committing secrets; carry OpenClaw opening-answer evaluation, video-indexing inspection, remaining canonical samples, and final-depth/item insight normalization into the next review. |

**First three actions:** complete the sleep-schema deployment, retain the corrected measurement baseline, and continue the GSC decline investigation. Do not spend this week repeatedly renaming titles or reshuffling the homepage without trustworthy samples.

## Delivery Evidence

- Code and dashboard-definition commit: `1ee3bdfbbeb786d1c3ebd672b3d64127e82050e1`.
- Fifty-six Node regression tests passed, including all-language sleep-schema rejection.
- Four isolated Chromium/WebKit tests passed at 390px and 1440px: hidden impressions, resume, deduplication, inherited experiment context.
- Eight full-built-page Chromium/WebKit checks passed across homepage/sleep and mobile/desktop: 200 responses, nonempty headings, no horizontal overflow, correct analytics version, no Product markup on sleep, and real latest-article exposure context. Analytics network requests were blocked during QA.
- Build passed: 2,292 sitemap URLs, 2,325 HTML files, 18,005 JSON-LD scripts, 30 Product schemas, zero broken internal links.
- Unrelated `frontend/src/data/garmin_all_activities.json` modification preserved throughout.
- GitHub [build run 34851528708](https://github.com/tobyglenn/websiteBuilder/actions/runs/34851528708) and [Pages run 34851719089](https://github.com/tobyglenn/websiteBuilder/actions/runs/34851719089) both succeeded. All five live sleep URLs return 200, identify release `1ee3bdfbbe`, load `20260914-visible-exposure`, and contain no Product block or 2,847-review claim. Eight production Chromium/WebKit mobile/desktop checks also passed with telemetry blocked.
- Google accepted the merchant-fix validation request: **Validation started, September 14, 2026**. This is not a completed Google validation or a claim that all search issues are resolved.
- Canonical follow-up: the four different-canonical samples are translated `/training-log/` pages. Spanish and German indexed-state API checks select English `/training-log/` despite self-declared localized canonicals; their last crawls are July 30 and July 7. Current live localized canonicals are correct. Do not change canonical targets based solely on this old duplicate-content decision; inspect current translated content and request fresh URL testing next.
- Production links: [sleep dashboard](https://tobyonfitnesstech.com/sleep/), [German sleep](https://tobyonfitnesstech.com/de/sleep/), [homepage](https://tobyonfitnesstech.com/).

Google's [merchant listing guidance](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) and [review snippet guidance](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) support removing unsupported sales/review claims, not manufacturing missing fields. PostHog query reference: [SQL aggregations](https://posthog.com/docs/sql/aggregations).
