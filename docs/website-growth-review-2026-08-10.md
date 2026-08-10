# Website Growth Review - August 10, 2026

## Decision

Keep the current five-section homepage and seven-item navigation structure unchanged for another complete measurement week. Homepage/navigation instrumentation began August 4, and both the PostHog connector and authenticated Chrome fallback were unavailable during this review, so there is not enough trustworthy evidence to promote, reorder, consolidate, move, or remove any section or navigation item.

This week's strongest usable signal is Search Console: impressions and average position improved while clicks and CTR fell. The highest-confidence work is therefore to improve search snippets on four high-impression pages, preserve the homepage's LCP image as a priority request, and make the weekly GSC report expose the exact query-page pairs creating low CTR.

## Comparison Windows

- Search Console current: August 2-8, 2026. Prior: July 26-August 1, 2026.
- Current editorial traffic after classified AgentStack anomalies: 70 clicks, 10,667 impressions, 0.66% CTR, average position 10.07.
- Prior editorial traffic: 83 clicks, 9,763 impressions, 0.85% CTR, average position 10.83.
- Raw current traffic: 70 clicks, 11,359 impressions, 0.62% CTR, average position 9.77.
- AgentStack anomaly block: 692 current impressions versus 951 prior impressions. The classified block is excluded from editorial decisions.
- PostHog target: project `498166`, dashboard `1840395`, homepage layout `home-2026-08-04-a`, navigation schema `nav-2026-08-04-a`.
- PostHog connector result: `Mcp error: -32603 Internal error`. Authenticated Chrome fallback result: `Browser is not available: chrome`.

## Top Wins

- Editorial search impressions increased 9.3%, from 9,763 to 10,667.
- Average editorial position improved from 10.83 to 10.07, so more pages are close to first-page visibility.
- The live sitemap contains 2,032 URLs. Search Console reports sitemap success with zero errors and zero warnings.
- Daily blog publishing succeeded through August 9, and the August 10 morning pipeline and deployment completed successfully.
- The production build generated 2,053 pages and found zero broken internal links.
- Spanish Oura comparison content earned two clicks from seven impressions, early evidence that translated pages can be discovered and clicked.
- Lighthouse found no layout instability: mobile CLS is 0. Accessibility is 99, Best Practices 100, and SEO 100.

## Top Risks

- Editorial clicks fell 15.7%, from 83 to 70, while CTR fell from 0.85% to 0.66%. Search visibility is growing faster than search appeal.
- The WHOOP 4.0 vs 5.0 page produced 1,729 impressions and seven clicks (0.40% CTR) at position 8.14. Its exact query `whoop 4.0 vs 5.0` produced 241 impressions and one click.
- The Anthropic refund page produced 908 impressions and seven clicks (0.77% CTR) at position 9.98.
- The Gym Monster comparison produced 782 impressions and two clicks (0.26% CTR) at position 7.22.
- The WHOOP recovery page produced 473 impressions and zero clicks at position 10.20.
- Mobile homepage Lighthouse performance was 68. LCP was 6.4 seconds, and the hero video thumbnail was incorrectly lazy-loaded despite being the LCP element.
- Homepage, navigation, engagement, conversion, replay, Web Vitals, exception, resource-failure, and long-task PostHog comparisons could not be refreshed. Do not treat missing MCP output as zero activity.
- Search Console's sitemap API still reports zero indexed URLs despite search traffic and successful sitemap processing. That field is not suitable for index-coverage decisions; the Page Indexing UI remains the source for indexed/not-indexed reason totals.

## Homepage Decisions

Decision threshold: do not recommend a homepage or navigation change until the compared item has at least 20 unique viewers. A technical failure can override that threshold. Low reach on a lower section is a position effect until viewer-normalized engagement and CTR say otherwise.

| Position | Section | Purpose | Unique viewer reach | Avg visible seconds | 5-second engagement | CTR among viewers | Deepest-section reach | Device split | Decision |
|---:|---|---|---:|---:|---:|---:|---:|---|---|
| 1 | Hero | Orient visitors and offer one featured next step | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Insufficient data |
| 2 | Latest articles | Discover current written content | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Insufficient data |
| 3 | Training proof | Show current training and data credibility | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Insufficient data |
| 4 | Video hub | Move readers into featured/latest video viewing | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Insufficient data |
| 5 | Newsletter | Convert engaged visitors into return readers | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Insufficient data |

The prior consolidation remains the correct baseline: do not split training/activity, video, or newsletter sections again. When PostHog recovers, use `homepage_section_summary` for reach, dwell, engagement, click count, position, device, and visit; `homepage_item_viewed` with `homepage_section_click` for item CTR; and `homepage_sections_summary` for deepest reach.

## Navigation Decisions

| Navigation item/group | Purpose | Impression-to-click | Open-to-selection | Destination completion | Desktop/mobile | Current-page clicks | Decision |
|---|---|---:|---:|---:|---|---:|---|
| Reviews | Speediance, wearables, gear, comparisons, calculators | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Insufficient data |
| Training Data | Training, running, recovery, transformation, BJJ, PRs | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Insufficient data |
| Articles | Direct route to written content | Unavailable | N/A | Unavailable | Unavailable | Unavailable | Insufficient data |
| Videos | Direct route to video library | Unavailable | N/A | Unavailable | Unavailable | Unavailable | Insufficient data |
| Projects | Projects and product work | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Insufficient data |
| AgentStack | Direct route to AI automation pillar | Unavailable | N/A | Unavailable | Unavailable | Unavailable | Insufficient data |
| About | Toby's background and proof | Unavailable | N/A | Unavailable | Unavailable | Unavailable | Insufficient data |

When data returns, compare `navigation_header_viewed`, `navigation_item_viewed`, `navigation_menu_opened`, `navigation_click`, and `navigation_destination_reached`. Separate desktop hover opens from deliberate clicks, and discount current-page clicks before calling an item confusing or redundant.

## Content Clusters Needing Attention

1. **WHOOP comparisons:** Strong first-page visibility but weak CTR. The canonical comparison needs an exact-match title, compact dimensions/band-compatibility table, and links from all WHOOP 4/5 posts.
2. **WHOOP recovery:** 473 impressions and zero clicks. Add a concise answer block for green/yellow/red ranges and strengthen internal links from comparison and wearable pages.
3. **Speediance comparisons:** Gym Monster ranks at position 7.22 but gets 0.26% CTR. Keep routing related Speediance articles to the canonical comparison and make the opening answer clearly distinguish 1, 2, and 2S.
4. **Anthropic refund:** Search demand remains high. The page should answer eligibility, denial reasons, and escalation steps without presenting the article as a generic complaint.
5. **AgentStack/OpenClaw:** Keep as a real content pillar, but continue removing copied API/domain query anomalies from editorial CTR so transcript artifacts do not dictate publishing decisions.
6. **Translations:** Early Spanish search clicks are encouraging. Continue monitoring localized query-page pairs and hreflang/canonical discovery rather than judging translations by aggregate English CTR.

## Priority Improvements

| Rank | Improvement | Evidence | Impact | Confidence | Effort | Status |
|---:|---|---|---|---|---|---|
| 1 | Refresh titles and descriptions on WHOOP comparison, WHOOP recovery, Anthropic refund, and Gym Monster comparison | 3,892 combined impressions; CTR ranges from 0% to 0.77% around positions 7-10 | High | High | Low | Implemented |
| 2 | Prioritize the hero thumbnail request | Homepage LCP 6.4s; LCP image was lazy-loaded with about 1.16s resource-load delay | High | High | Low | Implemented |
| 3 | Add query-page low-CTR opportunities to the weekly GSC report | Aggregate queries cannot identify which URL Google selected; anomaly blocks distort CTR | High | High | Low | Implemented |
| 4 | Add a concise comparison table and short answer to canonical WHOOP 4.0 vs 5.0 page | 1,729 impressions, 0.40% CTR; exact query has 241 impressions | High | High | Medium | Next |
| 5 | Add a green/yellow/red answer table to WHOOP recovery page | 473 impressions, zero clicks, position 10.20 | Medium | High | Medium | Next |
| 6 | Strengthen the Gym Monster 1 vs 2 vs 2S opening and internal-link cluster | 782 impressions, 0.26% CTR, position 7.22 | High | High | Medium | Next |
| 7 | Continue daily publishing, but bias the queue toward wearable and smart-gym comparison questions | WHOOP and Speediance pages dominate actionable first-page impressions | Medium | High | Medium | Next |
| 8 | Restore PostHog connector access and rerun the baseline before moving homepage or navigation content | Required events are instrumented, but this review could not retrieve them | High | High | Low | Blocked by connector |
| 9 | Inspect Page Indexing canonical-validation details in authenticated GSC UI | Sitemap is healthy, but API cannot report reason totals or validation examples | Medium | Medium | Low | Next |

## Implemented This Week

1. `frontend/src/components/Hero.jsx` now gives the featured-video LCP image `loading="eager"`, `decoding="async"`, and `fetchPriority="high"`.
2. `frontend/src/lib/blogPosts.ts` now presents the WHOOP comparison as `WHOOP 4.0 vs 5.0: Size, Thickness & Upgrade Differences` with a concrete dimensions/compatibility description.
3. Frontmatter now targets search intent directly on the Anthropic refund, Gym Monster comparison, and WHOOP recovery pages. The translation worker regenerates every localized title and description from these source changes.
4. `frontend/scripts/lib/gsc-query-pages.mjs` compares query-page rows after classified anomalies are removed. It identifies low-CTR opportunities with at least 10 impressions, CTR at or below 2%, and average position 20 or better.
5. `frontend/scripts/gsc-weekly-report.mjs` now emits `lowCtrQueryPages` and `queriesByLowCtrPage`, and `frontend/scripts/tests/gsc-query-pages.test.mjs` covers aggregation, anomaly exclusion, ranking, and page grouping.

## Content Ideas

- `WHOOP 4.0 vs 5.0 dimensions: width, thickness, sensor, bands, and battery` as a table-led refresh, not a duplicate article.
- `WHOOP recovery colors explained: what to do on green, yellow, and red days` using Toby's actual training behavior and caveats.
- `Speediance Gym Monster 1 vs 2 vs 2S: which upgrade changes the workout` as the canonical comparison's short-answer section.
- `Claude refund eligibility and escalation: what Anthropic support asks for` as a practical update to the existing firsthand article.
- `Garmin vs WHOOP for BJJ, lifting, and running` built around activity-specific ownership of GPS, recovery, strain, and long-term history.

## Tracking and Search Console Gaps

- Retry PostHog aggregate queries before next week's run. Required homepage/navigation events and schema versions are already in code; this failure was connector-side.
- Once available, verify each homepage section has at least 20 unique viewers before making structural changes. Report viewer-normalized CTR and engagement, never raw clicks alone.
- Validate click-to-arrival completion for homepage and navigation destinations; a click without arrival can indicate routing, translation, or unload problems.
- Break technical events down by page, device, first-party/third-party hostname, and resource type. Missing output is not evidence of no exceptions or slow pages.
- Use masked replays only after aggregate dead-click/rage-click data identifies a specific page and element.
- Refresh Page Indexing, canonical validation, Core Web Vitals groups, and video-indexing totals through authenticated Search Console because those details are not exposed by the sitemap/Search Analytics APIs.
- Keep the AgentStack anomaly report visible beside editorial totals. This week it removed 692 irrelevant-looking impressions and prevented a false CTR diagnosis.

## First Actions

1. Deploy the four SERP metadata updates and LCP priority fix, then verify live HTML and the next complete GSC period.
2. Use the new query-page report to update the WHOOP comparison and recovery answer blocks next.
3. Restore PostHog access and collect a complete baseline before changing homepage order or navigation labels.

## Validation

- GSC unit tests: nine passed.
- GSC report: executed successfully and ranked `whoop 4.0 vs 5.0` as the leading query-page opportunity.
- Translation validation: 163 posts and 652 localized files valid; zero translation tasks remain and zero failed.
- DGX production build: 2,053 pages generated. Pagefind indexed 2,047 pages and 134,830 words.
- Indexability audit: 2,032 sitemap URLs, 2,060 HTML files, and zero broken internal links.
- Production deployment and live HTML verification are recorded in the review completion message.
