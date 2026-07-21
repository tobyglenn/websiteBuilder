# Website Growth Review: July 20, 2026

> **July 21 Search Console update:** The access gap is resolved. `tobypeters@gmail.com` is confirmed as a site owner, application-default credentials are installed on the DGX, and a quota-aware API report now runs every Monday at 6:30 AM. The first current report covers July 13-19: 59 clicks, 7,388 impressions, 0.8% CTR, and average position 9.7. Search Console shows both submitted sitemaps as successful with 1,255 discovered pages; the page-indexing reason report remains stale with a July 9 update date.

## Decision Summary

This week's highest-confidence changes are measurement and crawl-quality fixes, not a wholesale homepage deletion. Only 21 visitors generated homepage section-view data, and just one reached below the second section. The evidence does support moving fresh articles from position 8 to position 3, making video and next-step exposure measurable, and stopping the sitemap from claiming that every page changes daily. Those changes are implemented.

Next, the homepage should be simplified around three jobs: establish Toby's credibility, surface current useful content, and send readers into the best topic hub. The overlapping training, activity, YouTube, and newsletter blocks should be consolidated after the new exposure tracking reaches the decision threshold below.

## Evidence Window And Limits

- PostHog project: `498166`; dashboard: `1840395`, Website Growth Weekly Review.
- Current complete window: July 13 00:00 UTC through July 20 00:00 UTC.
- Prior complete window: July 6 00:00 UTC through July 13 00:00 UTC.
- Homepage instrumentation began July 13 around 18:16 UTC. Homepage results are a six-day baseline, not a valid week-over-week comparison.
- The prior Google Search Console snapshot is stale: 57 clicks, 9.85K impressions, 0.6% CTR, and average position 9.3. The current Chrome session is authenticated as an account without access to the site property, the DGX has no GSC token, and no GSC connector is available.
- PostHog's bot virtual properties are not populated. Direct desktop Chrome traffic fell sharply, but the available data cannot classify it confidently as human or automation traffic.

## Top Wins

- Search/referral mix improved despite lower total volume: Reddit sessions rose from 2 to 15, DuckDuckGo from 4 to 12, and Bing from 6 to 7.
- The OpenClaw fitness report is the top entry page with 31 entry sessions. AgentStack/OpenClaw is now a demonstrated content pillar, not a speculative one.
- Anthropic refund readers show strong depth: 9 of 20 sessions reached qualified engagement.
- Core Web Vitals are healthy in the valid aggregate sample: desktop p75 LCP 848 ms, INP 30 ms, CLS 0; mobile p75 LCP 880 ms, INP 46 ms, CLS 0.
- Daily publishing worked for July 13 through July 19. Stage 3 logs show successful builds and publication each day, and the live sitemap was refreshed July 20.
- On-site search tracking is validated. Real searches for `speediance` and `Speediance safety` produced result clicks; the only no-result terms were QA strings.

## Top Risks And Drop-Offs

- Total volume declined: pageviews 638 to 443 (-30.6%), sessions 563 to 348 (-38.2%), and people 548 to 325 (-40.7%). Google sessions declined from 136 to 99 (-27.2%).
- High-traffic entry pages rarely create a next step. OpenClaw had 34 sessions, 6% qualified engagement, and 3% onward action. Anthropic had 20 sessions and 45% qualified engagement, but no next-step action.
- A severe homepage depth cliff occurs after section 2: 21 visitors saw the hero, 11 saw Weekly Focus, and only one saw any section from position 3 through 10.
- `video_embed_loaded` overstated exposure by loading below-fold players. The homepage logged 23 video-load sessions even though only one measured visitor reached a video section.
- PostHog recorded 251 resource errors, largely blocked third-party scripts. One persistent first-party image fallback was genuinely missing and is fixed.
- Dead-click concentration needs replay inspection: OpenClaw had 15 events in 6 desktop sessions; WHOOP Recovery had 13 in 4 sessions. The connector does not expose replay inspection, so this requires the masked PostHog UI.
- Search Console's last available indexing snapshot showed 1,123 not indexed: 250 crawled-not-indexed, 210 discovered-not-indexed, 68 404s, 240 redirects, 346 alternate canonicals, and smaller canonical/noindex groups.

## Homepage Decisions

Reach uses 25 homepage sessions in the instrumentation-aligned period. Engagement and click-through rates are normalized by section viewers, not all homepage visitors. Desktop has 19 aligned sessions and mobile has 6; only the first two sections have enough data for a directional device comparison.

Evidence rule: keep or promote when at least 20 viewers show useful engagement/click behavior, or when sitewide demand plus a clear depth obstruction supports a reversible move. Do not remove for performance until at least 30 viewers see a section and both engagement is below 5% and viewer-normalized CTR is below 1%. Device conclusions require at least 10 section viewers per device. Structural consolidation may be proposed from purpose overlap, but deletion waits for exposure data.

| Observed position | Section | Purpose | Unique reach | 5-second engagement | Viewer CTR | Decision |
| ---: | --- | --- | ---: | ---: | ---: | --- |
| 1 | Hero | Establish promise and route to identity/topic | 21/25 (84%) | 15/21 (71%) | 2/21 (10%) | Keep |
| 2 | Weekly Focus | Show current training and lived use | 11/25 (44%) | 8/11 (73%) | 0/11 (0%) | Keep; add one clear topic route later |
| 3 | Week over Week | Weekly training comparison | 1/25 (4%) | 1/1 | 0/1 | Consolidate with Weekly Focus |
| 4 | Lifetime Stats | Long-term proof and credibility | 1/25 (4%) | 0/1 | 0/1 | Consolidate into one training-proof band |
| 5 | Yearly Goals | Current goal progress | 1/25 (4%) | 0/1 | 0/1 | Consolidate into one training-proof band |
| 6 | Muscle Heatmap | Visual training distribution | 1/25 (4%) | 1/1 | 0/1 | Consolidate into one training-proof band |
| 7 | Weekly Progress | Weekly volume and consistency | 1/25 (4%) | 1/1 | 0/1 | Consolidate with Weekly Focus |
| 8 | Latest Articles | Route readers to fresh analysis | 1/25 (4%) | 1/1 | 1/1 | Promote to position 3; implemented |
| 9 | Featured Video | Start video consumption | 1/25 (4%) | 1/1 | 0/1 | Insufficient data; keep temporarily |
| 10 | Mid-page Newsletter | Capture returning-reader intent | 1/25 (4%) | 1/1 | 0/1; 1 form start | Consolidate with footer newsletter |
| 11 | Latest Videos | Route to recent video work | 0/25 | N/A | N/A | Consolidate with Featured/Popular/Shorts |
| 12 | Latest Activity | Show current Garmin activity | 0/25 | N/A | N/A | Consolidate with training-proof band |
| 13 | YouTube Social Proof | Establish channel credibility | 0/25 | N/A | N/A | Consolidate with channel stats |
| 14 | YouTube Channel Stats | Quantify audience and output | 0/25 | N/A | N/A | Consolidate with social proof |
| 15 | Popular Videos | Route to evergreen video content | 0/25 | N/A | N/A | Consolidate with Featured/Latest/Shorts |
| 16 | Today's Training | Show same-day workout details | 0/25 | N/A | N/A | Consolidate with Weekly Focus/activity |
| 17 | Recent Summary | Summarize recent training | 0/25 | N/A | N/A | Consolidate with training-proof band |
| 18 | Recent Activity Grid | Browse recent workouts | 0/25 | N/A | N/A | Move detailed grid to training hub |
| 19 | Data Deep Dive | Route to detailed personal data | 0/25 | N/A | N/A | Move detail off homepage; retain one route |
| 20 | Shorts | Route to short-form videos | 0/25 | N/A | N/A | Consolidate with video band |
| 21 | Footer Newsletter | Capture reader intent at page end | 0/25 | N/A | N/A | Keep as eventual sole newsletter block |

Desktop/mobile note: hero engagement was 11/17 desktop and 4/4 mobile; Weekly Focus was 7/10 desktop and 1/1 mobile. The lower-page sample is one mobile visitor, so no lower-section device conclusion is valid. That visitor reached position 10, clicked Latest Articles, and started the newsletter form.

## Pages And Topic Clusters

| Page or cluster | Evidence | This week's direction |
| --- | --- | --- |
| OpenClaw / AgentStack | Top entry page; 34 sessions, 6% qualified, 3% next step, 15 dead clicks | Give it a clearer current-status summary and a non-self-referential route into the AgentStack hub/podcast |
| Anthropic refund | 20 sessions, 45% qualified, zero next step; stale GSC snapshot showed 469 impressions and 1 click | Refresh SERP title/meta and add a related support/consumer-tech next step after Toby verifies current policy claims |
| WHOOP 5 and Garmin/WHOOP | WHOOP 5 had 12 sessions but 8% qualified; Garmin/WHOOP had 8 sessions and 63% qualified, both with no next step | Sharpen comparison intent and route to the canonical wearable comparison hub |
| Speediance / Gym Monster | Multiple entry pages and established GSC comparison demand | Keep the canonical Gym Monster 1 vs 2 vs 2S hub central and add links from new daily posts |
| Podcast / AgentStack | 8 page sessions, 3 podcast audio clicks sitewide, 1 subscribe | Surface one clear episode and one subscription action in the AgentStack cluster |

## Prioritized Improvements

| Rank | Improvement | Impact | Evidence | Confidence | Effort | Exact action / status |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Promote fresh articles | High | 96% of measured visitors never reached the old position 8; the lone viewer clicked | High | Low | Moved Latest Articles from position 8 to 3. Implemented. |
| 2 | Make exposure metrics truthful | High | Video loads and one-shot summaries overstated what visitors saw | High | Medium | Deferred YouTube/API initialization, added `video_embed_viewed`, `content_next_step_viewed`, position metadata, and checkpointed homepage summaries. Implemented. |
| 3 | Improve crawl truth and remove small content defects | High | 1,249 sitemap URLs claimed a daily change; GSC has a large crawl/index backlog | High | Low | Removed global build-time `lastmod`; 149 URLs now carry source-backed dates. Removed a missing image fallback and OpenClaw self-link. Implemented. |
| 4 | Consolidate the four training/activity groups | Medium-high | The page has at least nine overlapping training sections and a depth cliff at position 2 | Medium | Medium | Design one compact proof band containing current week, lifetime proof, one visual, and a route to the detailed training page. Wait for 30 exposed visitors before deleting originals. |
| 5 | Repair OpenClaw's entry journey | High | It leads entries but has only 6% qualified engagement, 3% onward action, and concentrated dead clicks | High | Medium | Review masked replays, then add a concise current-state block and routes to AgentStack, the podcast, and the connector/build guide. Toby's voice is needed for the status copy. |
| 6 | Refresh high-impression comparison/support snippets | High | Stale GSC showed very low CTR on WHOOP 5 and Anthropic; PostHog still shows those pages as entries | Medium until GSC refresh | Medium | Test specific titles/meta for WHOOP 5, Anthropic refund, Garmin vs WHOOP, and Gym Monster; avoid policy claims until reverified. |
| 7 | Consolidate video and newsletter duplication | Medium | Four video bands and two newsletter blocks compete below the depth cliff; actual video play was only 2 sessions | Medium | Medium | Keep one featured/latest video band and one newsletter block. Reassess with `video_embed_viewed` and section-view data after 30 viewers. |
| 8 | Restore automated Search Console evidence | High | Current GSC UI account lacks property access and DGX has no token | High | Low-medium | Add a read-only Search Console API service account/token to the existing `gsc-weekly-report.mjs` path, or switch Chrome to the owning Google profile. |
| 9 | Focus the daily editorial queue on proven clusters | Medium-high | OpenClaw, WHOOP, Garmin, Gym Monster, and Speediance pages dominate entries and prior search demand | High | Editorial | Publish practical follow-ups: OpenClaw fitness-report failures/fixes; WHOOP 5 vs 4 thickness and compatibility; Gym Monster 1 vs 2 vs 2S ownership update; current Speediance workflow comparisons. |

## Tracking And Dashboard Gaps

- Add dashboard tiles for `video_embed_viewed -> video_play`, `content_next_step_viewed -> content_next_step_click`, and homepage summary coverage. The new events must first arrive from production.
- Keep the next weekly comparison labeled baseline until two complete weeks of the corrected events exist.
- No real newsletter submit, calculator, rage-click, or contact events occurred. Code paths should remain monitored; absence is not yet an instrumentation failure.
- PostHog virtual bot properties are empty, so reader-versus-crawler reporting is not trustworthy. Add server/CDN bot classification or a documented traffic exclusion before using direct traffic as a growth KPI.
- Use masked replay in PostHog for the OpenClaw and WHOOP Recovery dead-click clusters. Aggregate data identifies the pages but not the elements.
- Restore current Search Console access before making CTR/indexing claims next week. The current snapshot should not be reused as if it were July 20 data.

## Implementation And Validation

- Homepage ordering: `frontend/src/pages/index.astro`
- Exposure and journey tracking: `frontend/public/js/posthog-analytics.js`
- Entry/next-step impressions and self-link filtering: `frontend/src/components/PriorityEntryPath.astro` and `frontend/src/components/TopicNextSteps.astro`
- Missing fallback prevention: `frontend/src/lib/blogPosts.ts`
- Truthful sitemap dates: `frontend/astro.config.mjs`
- Production build: 1,273 pages built; Pagefind indexed 1,264 pages and 100,344 words; indexability audit passed with 1,249 sitemap URLs and zero broken internal links.
- Responsive QA: passed at 1440x900 and 390x844 with no horizontal overflow. The promoted article cards fit at mobile width, and the YouTube API remains unloaded above the video viewport threshold.

## First Three Actions

1. Ship the implemented homepage, measurement, and sitemap corrections.
2. Inspect masked replays for OpenClaw and WHOOP Recovery, then fix the exact dead-click targets.
3. Restore read-only Search Console automation so next week's title, indexing, and homepage-topic decisions use current query/page demand.
