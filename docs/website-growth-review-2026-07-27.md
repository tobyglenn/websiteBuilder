# Website Growth Weekly Review - July 27, 2026

## Decision Summary

Search visibility is growing, but search-result conversion is not keeping pace. Google clicks rose from 60 to 69 and impressions rose from 7,626 to 10,141, while CTR fell from 0.79% to 0.68%. PostHog traffic softened slightly, but qualified readers increased: qualified-engagement events rose 37% and qualified people rose 19%.

The homepage is too new and too lightly sampled for another restructure. Keep the five-section layout in place for one complete week. This week, fix the definite `/speediance/` chart error, make next-step exposure measurable per destination, and improve the highest-volume WHOOP search snippet.

PostHog reference: [HogQL and SQL documentation](https://posthog.com/docs/product-analytics/sql).

## Comparison Windows

- PostHog current: July 20-26 UTC; prior: July 13-19 UTC.
- Search Console current: July 19-25; prior: July 12-18. Search Console final data intentionally ends two days before this review.
- Homepage section analysis: July 21 at 17:40 UTC through July 27. This isolates the simplified five-section homepage deployed during the week.

## Top Wins

- Google clicks increased 15% (60 to 69), impressions increased 33% (7,626 to 10,141), and average position improved from 9.86 to 9.23.
- Google-origin sessions increased from 98 to 110 even though total PostHog sessions fell 2.6%.
- Qualified engagement increased from 62 to 85 events and from 48 to 57 people.
- `/blog/speediance-vs-tonal-comparison/` gained 422 impressions and six clicks; average position improved by 2.13 places.
- `/blog/garmin-and-whoop-what-each-is-actually-for/` gained 214 impressions and six clicks.
- Long tasks fell 23% (141 to 109).
- The sitemap is healthy: Search Console last read both sitemap files July 26, reports Success with 1,293 discovered pages, and the live sitemap now contains 1,295 URLs.
- Daily publishing succeeded July 20-26, with a production build and published article each day.

## Top Risks And Drop-Offs

- Overall PostHog pageviews fell 6.5% (443 to 414), people fell 3.4% (325 to 314), and sessions fell 2.6% (348 to 339).
- Search CTR declined to 0.68% despite better positions. WHOOP and Gym Monster snippets are the clearest opportunities.
- `/blog/whoop-5-not-smaller-review/` received 1,316 impressions, six clicks, 0.46% CTR, and average position 9.14.
- `/blog/gym-monster-2-vs-original/` received 596 impressions, two clicks, 0.34% CTR, and lost five clicks week over week.
- Exceptions rose from 14 events/six people to 24 events/18 people. The definite site-owned issue is `Chart is not defined` on `/speediance/`.
- Dead clicks rose from 60 to 90 events, but affected people were flat (23 to 22). The increase is repeated behavior by a small number of readers, not a sitewide spread.
- Next-step blocks reached 102 people, but only five clicked, a 4.9% click-participation rate. Existing exposure data cannot identify which destination was actually seen.
- Search Console's page-indexing reason report remains stale as of July 9: 1,123 not indexed and 882 indexed.

## Homepage Decisions

Decision threshold: at least 20 viewer sessions per section and at least five engagement or click outcomes before promoting, moving, or removing a section. Reach is measured against homepage sessions; engagement and click rates are normalized by section viewers. Mobile has one session and cannot support a separate decision.

| Position | Section | Purpose | Unique reach | 5-second engagement | Click rate among viewers | Decision |
|---:|---|---|---:|---:|---:|---|
| 1 | Hero and featured story | Establish Toby, current proof, and primary route | 16/16 (100%) | 11/16 (69%) | 2/16 (13%) | Keep |
| 2 | Latest articles | Expose current written work | 6/16 (38%) | 4/6 (67%) | 0/6 | Keep; insufficient click data |
| 3 | Training proof | Show current training record and credibility | 2/16 (13%) | 2/2 (100%) | 0/2 | Insufficient data |
| 4 | Video hub | Move readers into current video work | 1/16 (6%) | 1/1 (100%) | 0/1 | Insufficient data |
| 5 | Newsletter | Capture returning-reader intent | 1/16 (6%) | 0/1 | 0/1 | Insufficient data |

No section should be promoted, reordered, consolidated again, moved off, or removed this week. Low reach below position two is position-driven and the sample is below the evidence threshold. The previous weekly training/activity blocks, four video blocks, and duplicate newsletter blocks are already consolidated in the live five-section layout.

## Priority Recommendations

| Rank | Improvement | Evidence | Impact | Confidence | Effort | This week |
|---:|---|---|---|---|---|---|
| 1 | Bundle Chart.js and make chart initialization navigation-safe | Three current `Chart` exceptions across three readers on `/speediance/` | High | High | Low | Implemented |
| 2 | Measure next-step exposure per destination | 102 exposed people, five clickers; container exposure cannot identify link opportunity | High | High | Low | Implemented |
| 3 | Refresh WHOOP 5 vs 4 title and description | 1,316 impressions, 0.46% CTR, position 9.14; strong `whoop 4 vs 5`, thickness, size demand | High | High | Low | Implemented |
| 4 | Refresh and strengthen the Gym Monster original-vs-2 entry page | 596 impressions, 0.34% CTR, five clicks lost; comparison queries rank around positions 5-7 | High | High | Medium | Next |
| 5 | Keep homepage order stable for another complete week | Only 16 post-deploy homepage sessions; positions 3-5 have one or two viewers | Medium | High | None | Measure |
| 6 | Replace raw timestamped podcast meta descriptions with concise episode summaries | Episode 26 has 1,054 impressions and zero clicks; current description begins with `[00:00]` show notes | Medium | High | Medium | Next |
| 7 | Add query-page anomaly handling to the GSC weekly report | Large irrelevant-looking query blocks map to AgentStack episodes and distort aggregate CTR | Medium | Medium | Low | Next |
| 8 | Monitor Safari structured-data exception before changing code | 18 occurrences, but no matching site code or actionable stack frame | Medium | Medium | Low | Monitor |
| 9 | Recheck mobile video INP after at least 20 samples | Current mobile INP p75 is 256 ms with only seven samples | Medium | Low | Medium | Measure |

## Implementation Notes

1. `frontend/src/pages/speediance.astro` now imports `chart.js/auto` from the application bundle. It destroys an existing chart before rebuilding and listens for `astro:page-load`, removing the CDN/global race that produced `Chart is not defined`.
2. `frontend/src/components/TopicNextSteps.astro` now labels the topic, item count, and each destination's position.
3. `frontend/public/js/posthog-analytics.js` now emits `content_next_step_item_viewed` only after an individual card is at least 25% visible for 800 ms. The event carries the same source, title, topic, position, destination type, and `destination_url` fields as the click event.
4. `frontend/src/lib/blogPosts.ts` now targets current search wording with `WHOOP 5 vs 4: Size, Thickness and Upgrade Differences` and a concise hands-on description.
5. Anthropic metadata was inspected but left unchanged. It already reflects refund-policy intent and improved to nine clicks from eight; another rewrite is not supported this week.

## Content Opportunities

- Upgrade `gym-monster-2-vs-original` around the observed questions: Gym Monster 1 vs 2, 2 vs 2S, and Tonal 2 vs Gym Monster 2. Keep the canonical three-model hub as the next step.
- Publish a compact WHOOP dimensions table showing on-wrist thickness, body dimensions, band compatibility, and upgrade tradeoffs. Search demand explicitly includes `whoop thickness`, `whoop dimensions`, and `whoop size`.
- Add a practical AgentStack article explaining OpenClaw inference routing and release monitoring without exposing raw API URLs in the title or description.
- Improve AgentStack episode summaries so search snippets state the episode's two or three real subjects instead of showing timestamped transcript text.

## Replay And Technical Review

- The largest dead-click cluster came from two sessions. One fully masked recording was available and showed the reader reaching the canonical Gym Monster comparison hub; no reproducible broken control was visible. The second recording had zero playable duration.
- Do not change the comparison UI from these two sessions. Revisit when at least five affected sessions identify the same visible target.
- Resource errors are dominated by blocked Cloudflare and PostHog modules. Sampled first-party images currently return HTTP 200.
- Core Web Vitals in Search Console has insufficient 90-day field data for both mobile and desktop. PostHog LCP and CLS remain healthy; mobile INP needs more samples.
- Video indexing last updated July 22: 309 videos indexed and 25 not indexed because the video is not on a watch page.

## Analytics And Search Console Gaps

- Update the saved next-step funnel to use `content_next_step_item_viewed` as its first step once production events arrive. Break down by `destination_url`.
- Keep the existing video exposure-to-play funnel. It is present on dashboard 1840395 and currently has enough volume to monitor, not enough to redesign the player.
- `homepage_sections_summary` has two orphan summary sessions without matching section-view events. Section events remain authoritative.
- PostHog bot/virtual-traffic properties exist in schema but are not populated, so reader and crawler traffic cannot yet be separated reliably.
- Search Console API covers performance and sitemaps. Continue using authenticated Chrome for indexing reasons, validation state, Core Web Vitals, and video-index totals.
- Add query-page pairs and an anomaly bucket to `gsc-weekly-report.mjs`; current separate query/page tables make irrelevant query bursts look like editorial demand.

## Validation

- DGX production build: 1,319 pages generated.
- Pagefind: 1,310 pages and 104,362 words indexed.
- Indexability audit: 1,295 sitemap URLs, 1,323 HTML files, zero broken internal links.
- Desktop 1440x900: both Speediance charts render, zero horizontal overflow, no console errors.
- Mobile 390x844: both charts and all next-step cards render without overlap or horizontal overflow, no console errors.

## First Actions

1. Deploy the three implemented fixes and verify the production chart and WHOOP metadata.
2. Confirm `content_next_step_item_viewed` arrives in PostHog, then update the existing next-step funnel to item exposure-to-click by destination.
3. Rewrite the Gym Monster original-vs-2 entry page and AgentStack podcast descriptions in the next implementation pass.
