# Website Growth Review - August 3, 2026

## Decision

Keep the five-section homepage structure for another week. Change what the hero highlights before changing the layout: the next featured destination should be the canonical Speediance Gym Monster comparison, because Speediance comparison pages are the strongest search-demand cluster while the hero reached all 15 measured homepage visitors and produced no clicks.

This week, fix the incorrect related-content routing, prevent automatic language redirects from creating 404 visits, and finish anomaly handling in the Search Console report. Those three changes are implemented in this review.

## Comparison Windows

- PostHog: July 27-August 2 versus July 20-26, complete UTC weeks, with known bot traffic excluded.
- Search Console: July 26-August 1 versus July 19-25. Search Console final data ends two days before the review.
- PostHog project `498166`, dashboard `1840395`.
- Search Console decision metrics exclude only explicit AgentStack URL/API query-page anomalies. Anonymous queries remain in the totals because they cannot be classified safely.

## Top Wins

- Search clicks increased 20.3%, from 69 to 83. Editorial impressions increased 9.8%, from 8,893 to 9,763, and editorial CTR improved from 0.78% to 0.85%.
- PostHog pageviews increased 22.4%, from 393 to 481, and visitors increased 18.4%, from 293 to 347.
- Qualified-engagement sessions increased 32.2%, from 59 to 78. Scroll-depth sessions increased 26.1%, from 111 to 140.
- The OpenClaw fitness-report page increased from one click to three, with 136 current impressions and a 2.21% CTR.
- The daily pipeline published on all seven days. On August 2, the Google review provider returned malformed JSON and the configured MiniMax fallback completed the review and publish successfully.
- The live sitemap index was regenerated August 3. Search Console reports zero sitemap errors and warnings, and the production build passed with zero broken internal links.

## Top Risks

- Average editorial search position worsened from 9.81 to 10.83 even as clicks grew.
- The Garmin/WHOOP explainer fell from 12 clicks to one on 490 impressions. Anthropic refund fell from nine clicks to five on 838 impressions.
- Only three of 45 sessions exposed to a next-step block clicked, a 6.7% participation rate. The code was also routing some smart-gym articles into AgentStack calls to action.
- Video exposure-to-play declined from 8/24 (33.3%) to 6/22 (27.3%). The sample is too small for a player redesign, but it is large enough to keep monitoring.
- On-site search and newsletter intent were both zero this week. Search had only three uses in the prior week, so this is a discovery-volume problem rather than evidence that search is broken.
- PostHog's technical dashboard tiles do not align with the custom production event names `frontend_resource_error` and `frontend_long_task`. A structured audit of 1,309 built HTML files found no missing first-party images, scripts, stylesheets, or icons.
- PostHog recorded a visitor on `/de/blog/whoop-18-percent-red-day-protocol/`; the live localized URL is a 404. The automatic language redirect was constructing localized paths without checking that a translated page existed.

## Homepage Decisions

Structural decision threshold: at least 10 section viewers and five engagement/click outcomes for a keep/promote/reorder decision. Moving or removing a section requires at least 20 viewers across two complete weeks with consistently weak viewer-normalized rates. Five to nine viewers are directional; fewer than five are insufficient. Mobile and desktop are not split because the total homepage sample is only 15 visitors.

"Deepest stop" is derived from sequential section reach: viewers of a section minus viewers of the next section, with newsletter reach treated as the bottom of the page.

| Position | Section | Purpose | Unique reach | 5-second engagement | CTR among viewers | Deepest stop | Decision |
|---:|---|---|---:|---:|---:|---:|---|
| 1 | Hero and featured story | Orientation and primary route | 15/15 (100%) | 9/15 (60.0%) | 0/15 (0%) | 9/15 (60.0%) | Keep |
| 2 | Latest articles | Written-content discovery | 6/15 (40.0%) | 4/6 (66.7%) | 1/6 (16.7%) | 2/15 (13.3%) | Insufficient data |
| 3 | Current training proof | Credibility through current data | 4/15 (26.7%) | 3/4 (75.0%) | 0/4 (0%) | 1/15 (6.7%) | Insufficient data |
| 4 | Featured/latest videos | Video discovery | 3/15 (20.0%) | 3/3 (100%) | 0/3 (0%) | 1/15 (6.7%) | Insufficient data |
| 5 | Newsletter | Return-reader conversion | 2/15 (13.3%) | 2/2 (100%) | 0/2 (0%) | 2/15 (13.3%) | Insufficient data |

The overlapping training, activity, video, and newsletter blocks were already consolidated before this period. Do not split them again. Low reach below the latest-articles section is primarily a page-position signal until more visitors reach those sections.

## Priority Improvements

| Rank | Improvement | Evidence | Impact | Confidence | Effort | Status |
|---:|---|---|---|---|---|---|
| 1 | Refresh the Garmin/WHOOP title, description, and opening summary around "what each is for" | 490 impressions, one click, 0.20% CTR; clicks fell by 11 and position worsened 1.54 | High | High | Low | Next |
| 2 | Use the canonical Gym Monster 1 vs 2 vs 2S comparison as the next homepage hero destination | Hero had 15 viewers and zero clicks; Gym Monster page had 641 impressions at position 7.35; several Speediance pages are rising | High | Medium | Low | Toby content decision |
| 3 | Refresh the Anthropic refund description and SERP promise | 838 impressions, five clicks, 0.60% CTR; clicks fell by four; current description is grammatically weak | High | High | Low | Next |
| 4 | Route smart-gym next steps to smart-gym comparisons even when tags mention AI | 45 exposed sessions produced three clicks; broad `AI` matching overrode Speediance intent | Medium | High | Low | Implemented |
| 5 | Prevent language detection from redirecting valid English articles to nonexistent translations | PostHog identified a German article URL that returns a live 404 | High | High | Low | Implemented |
| 6 | Include AgentStack hubs in GSC query-page anomaly handling | The podcast hub had 448 raw impressions; 21 current and eight prior impressions were explicit API URLs | Medium | High | Low | Implemented |
| 7 | Retune the daily backlog toward demonstrated comparison demand and add a final prose-quality gate | Seven daily posts published, but the strongest demand is WHOOP/Garmin and smart-gym comparison intent; several generated excerpts have dropped words | Medium | High | Medium | Next |
| 8 | Correct PostHog technical insight event names and separate first-party from third-party resource failures | Source emits `frontend_resource_error` and `frontend_long_task`; technical tiles show no usable recent rows; static resource audit found zero first-party misses | Medium | High | Low | Next |
| 9 | Add a compact WHOOP 4 vs 5 vs Oura dimensions and compatibility table to the comparison hub | `whoop 4.0 vs 5.0` had 169 impressions, `whoop 4 vs 5` had 124, and `whoop vs oura` is rising | Medium | High | Medium | Next |

## Implementation

1. `frontend/src/lib/contentTopic.js` now classifies explicit AgentStack branding first, product/training topics next, and generic AI wording last. `TopicNextSteps.astro` uses the tested classifier, so Gym Monster content no longer exposes podcast CTAs simply because its metadata says "AI."
2. `frontend/scripts/lib/gsc-anomalies.mjs` now applies the narrow API/domain/boolean-query rules to AgentStack hubs and localized hubs as well as episode pages. The rerun isolated 951 current anomalous impressions across 55 queries and 13 pages, versus 1,248 prior impressions.
3. `frontend/src/components/LangDetect.astro` now sends a same-origin HEAD request before an automatic locale redirect. Existing translated pages still redirect; missing translations remain on their valid English URL.

## Content To Publish

- Garmin versus WHOOP for runners, lifting, and BJJ: a decision table that states which device owns GPS, recovery, strain, HRV, and activity history.
- Gym Monster 1 versus 2 versus 2S: update the canonical comparison with a short answer for `tonal 2 vs gym monster 2`, `gym monster 1 vs 2`, and `speediance 2 vs 2s`.
- Anthropic refund eligibility: a concise timeline, the exact denial reason, and what a reader should try next. Keep the first-person evidence; remove vague or adversarial SERP wording.
- WHOOP physical dimensions and band compatibility: answer thickness, on-wrist size, WHOOP 4 compatibility, and Oura tradeoffs in one table.

Do not create AgentStack content from the apparent API-query demand. Those queries are transcript/indexing anomalies, not reader intent.

## Measurement Gaps

- Update dashboard technical insights to query `$exception`, `$dead_click`, `$rageclick`, `$web_vitals`, `frontend_resource_error`, and `frontend_long_task`. Break resource failures down by `resource_type`, hostname, and page URL.
- Keep first-party and third-party resource errors separate. Cloudflare/PostHog blocking should not enter the website-fix queue unless it prevents a reader action.
- Homepage section data is still too small for device segmentation. Revisit mobile/desktop decisions after at least 10 viewers per device and 20 viewers per lower section.
- Search Console's API does not expose page-indexing reason totals, Core Web Vitals groups, video-indexing totals, or validation progress. The authenticated Chrome session was unavailable during this run, so those UI-only totals were not refreshed.
- Search Console's sitemap API still reports `indexed: 0` despite successful crawling and nonzero search traffic. Treat that field as unusable; use Page Indexing in the UI for indexed totals.
- The Safari JSON-LD-like TypeError occurred 17 times across 15 sessions but has no matching repository expression or actionable stack. Monitor it; do not suppress it or change schema markup without a reproducible site-owned frame.

## Validation

- Unit tests: nine passed for content-topic routing and GSC anomaly handling.
- DGX production build: 1,358 pages generated; Pagefind indexed 1,352 pages and 108,566 words.
- Indexability audit: 1,337 sitemap URLs, 1,365 HTML files, zero broken internal links.
- Static first-party resource audit: zero missing resources across 1,309 locally built HTML files.
- Live sitemap before deployment: fresh August 3 timestamp; Search Console sitemap API reports zero errors and warnings.

## First Actions

1. Deploy the three implemented routing/reporting fixes and verify the Gym Monster CTA topic and locale behavior live.
2. Rewrite the Garmin/WHOOP and Anthropic SERP descriptions, then track page-level CTR for a complete Search Console week.
3. Point the next homepage hero content slot at the canonical Speediance comparison without changing section order, then compare hero viewer-to-click rate next Monday.
