# Website Growth Review - August 17, 2026

## Decision Summary

Search visibility and qualified readership improved, but the site lost its daily publishing and maintenance cadence when all OpenClaw cron entries were disabled on August 15 without corresponding Hermes jobs. This week should restore that operating system, clean corrupted translations, and collect trustworthy homepage/search measurements before making a broad navigation redesign.

The strongest reader demand remains WHOOP, Speediance comparisons, Anthropic refunds, and AgentStack. The homepage hero can keep its current structure, but its featured subject should rotate toward those demand clusters rather than leading with BJJ alone.

## Measurement Window

- PostHog: August 10-16 versus August 3-9, 2026.
- Search Console: final data for August 9-15 versus August 2-8, 2026.
- Homepage layout: `home-2026-08-04-a`.
- Navigation schema: `nav-2026-08-04-a`.
- Decision threshold: at least 20 unique viewers for a compared homepage section or navigation item, unless a technical defect is independently clear.
- One homepage visit contained more than ten days of false dwell. Average dwell below excludes the one section-summary row above 1,800 seconds.

## Top Wins

1. Search Console editorial clicks increased from 70 to 99 (+41%), impressions from 10,667 to 13,028 (+22%), and CTR from 0.66% to 0.76% (+16%). Average position was essentially flat at 10.15 versus 10.07.
2. PostHog pageviews increased from 437 to 564 (+29%), unique visitors from 368 to 439 (+19%), and qualified visitors from 70 to 97 (+39%).
3. The Anthropic refund article reached 92 PostHog visitors with 43.5% qualified engagement. The referral spike was genuine Hacker News traffic, not crawler noise.
4. German WHOOP content is beginning to earn search traffic: `/de/blog/2026-01-14-the-truth-about-whoop-5-is-it-really-smaller/` earned 4 clicks from 45 impressions (8.9% CTR).
5. Search Console accepted and downloaded the sitemap on August 17 with zero reported sitemap errors or warnings.

## Top Risks

1. Daily blog publishing, translation work, sitemap submission, and weekly GSC reporting stopped after August 14 because the jobs were disabled during OpenClaw retirement and Hermes had no replacements.
2. Translation QA found 54 corrupted locale files across 39 article slugs. Failures include MiniMax command/prompt leakage, malformed URL backticks, and unbalanced headings.
3. Homepage engagement data is not trustworthy until the dwell fix is live. A background Safari tab accumulated roughly ten days as visible time.
4. Sitewide next-step modules reached 155 viewers but produced one click. The Anthropic module alone had 66 viewers and zero clicks.
5. PostHog captured 51 exceptions from 24 visitors, up from 31 exceptions from 11 visitors. The leading Safari error affected 20 users, but PostHog supplied no application stack frames, so a site-code fix is not yet justified.
6. Search Console still reports 2,077 sitemap URLs and `0` indexed through its sitemap field. Indexed pages clearly exist and earn clicks, so this is an unresolved GSC sitemap/index-reporting signal rather than evidence of zero indexed pages.

## Homepage Decisions

| Position | Section | Purpose | Unique reach | Avg visible | 5-second rate | Viewer CTR | Deepest reach | Decision |
|---:|---|---|---:|---:|---:|---:|---:|---|
| 1 | Hero | Orient visitors and offer a primary path | 28/29 (96.6%) | 21.1s | 53.6% | 3.6% | 96.6% | Keep; rotate feature toward current demand |
| 2 | Latest articles | Content discovery | 10/29 (34.5%) | 9.8s | 60.0% | 0% | 34.5% | Insufficient data |
| 3 | Training proof | Establish real-use credibility | 5/29 (17.2%) | 7.5s | 60.0% | 0% | 17.2% | Insufficient data |
| 4 | Video hub | Move readers into video | 5/29 (17.2%) | 4.5s | 20.0% | 0% | 17.2% | Insufficient data |
| 5 | Newsletter | Retain readers | 5/29 (17.2%) | 1.0s | 0% | 0% | 17.2% | Insufficient data |

The hero is the only section above the 20-viewer threshold. Its desktop and mobile splits are each below the threshold: desktop had 15 viewers, 33.9 seconds average dwell, 60.0% five-second engagement, and zero clicks; mobile had 13 viewers, 7.4 seconds, 46.2% engagement, and one click. No device-specific redesign should be made from this sample.

The current BJJ-led hero does not match sitewide demand. WHOOP, Speediance, AgentStack, and Anthropic content account for the strongest search and entry-page evidence. Keep the hero structure, but feature a WHOOP or Gym Monster comparison next week and measure its item-level CTR.

## Navigation Decisions

| Item | Unique viewers | Clickers | Viewer CTR | Current-page clicks | Decision |
|---|---:|---:|---:|---:|---|
| TobyOnFitnessTech | 424 | 7 | 1.7% | 0 | Keep |
| AgentStack | 247 | 2 | 0.8% | 0 | Keep |
| Videos | 232 | 1 | 0.4% | 0 | Keep and monitor |
| Articles | 217 | 2 | 0.9% | 1 | Keep |
| About | 217 | 0 | 0% | 0 | Test replacing with Comparisons; retain About in the secondary/footer navigation |

Desktop recorded 64 menu opens from 28 people and 13 selections (20.3% event-level open-to-selection). Mobile recorded only five opens from three people and two selections, so it remains insufficient for a mobile structure decision. Navigation produced 21 destination arrivals from 22 clicks (95.5% completion); inspect the unmatched click only if the gap repeats.

## Content Clusters

- **WHOOP:** `/blog/whoop-5-not-smaller-review/` earned 11 clicks from 1,543 impressions (0.71% CTR, position 8.1). `/blog/whoop-recovery-scores-explained/` earned 1 click from 462 impressions. WHOOP 4-vs-5 query variants remain the largest comparison opportunity.
- **Speediance:** `/blog/gym-monster-2-vs-original/` rose to 6 clicks from 858 impressions. `speediance vs tonal` impressions increased to 125, while `tonal vs speediance` had 69 impressions and zero clicks. The canonical comparison hub should receive more contextual links from these entry pages.
- **Anthropic:** `/blog/anthropic-refund-scam/` earned 9 clicks from 1,311 impressions. Search CTR remains 0.69%, and its next-step block produced no clicks from 66 viewers.
- **WHOOP versus Oura:** `/blog/oura-vs-whoop-sleep-comparison/` rose to 527 impressions and position 10.3 but had zero clicks. This is the clearest near-page-one title and opening-answer opportunity.
- **AgentStack:** the hub had 573 impressions and zero clicks. The report correctly excluded 96 irrelevant API/transcript-reference impressions from aggregate decision metrics, down from 692 in the prior week.
- **Translations:** German and Spanish pages are already earning clicks, validating the localization strategy. Quality and reliable publishing are now more important than adding languages.

## Prioritized Improvements

| Rank | Improvement | Impact | Evidence | Confidence | Effort | Implementation |
|---:|---|---|---|---|---|---|
| 1 | Restore website automation in Hermes | Very high | Publishing and reports stopped after August 14 | High | Low | Install seven no-agent Hermes jobs for daily blog stages, translation worker/publisher, weekly GSC, and sitemap submission |
| 2 | Quarantine and regenerate corrupt translations | Very high | 54 invalid files across 39 slugs; malformed live German URL | High | Medium | Reject prompt/CLI leakage, malformed URL backticks, and unbalanced headings; remove all four variants for an affected slug from publish state and regenerate atomically |
| 3 | Fix homepage dwell and settled-search tracking | High | Ten-day dwell outlier; 23 prefix queries from one search | High | Low | Pause section timers while hidden and capture search only after 700ms with at least two characters |
| 4 | Rewrite the WHOOP recovery and Oura comparison SERP promise | High | 989 combined impressions and one click | High | Low | Put the direct comparison/recovery answer in title, description, first paragraph, and answer table |
| 5 | Strengthen Gym Monster and Tonal internal-link cluster | High | 858 and 452 page impressions; comparison queries rank 6-9 | High | Low | Add descriptive links from all relevant entry pages to the canonical model comparison and Tonal comparison hubs |
| 6 | Replace Anthropic's generic next-step block | Medium | 66 viewers, zero clicks despite 43.5% qualified engagement | High | Low | Offer one article-specific next action tied to refund evidence or the Hacker News discussion instead of a broad topic card set |
| 7 | Test a demand-led homepage feature | Medium | Hero meets threshold; featured BJJ topic conflicts with search demand | Medium | Low | Feature WHOOP 5 vs 4 or Gym Monster 1 vs 2 vs 2S for one full week; retain layout/version measurement |
| 8 | Test Comparisons in the primary navigation | Medium | About had 217 exposed viewers and zero clicks | Medium | Low | Replace About with Comparisons for one versioned test; keep About in secondary/footer navigation |
| 9 | Diagnose the Safari exception with source evidence | Medium | 24 occurrences across 20 users, no app stack | Low | Medium | Add release/source-map context or isolate by script/resource before changing site code |
| 10 | Resolve GSC sitemap/index coverage discrepancy | Medium | Sitemap is valid with 2,077 submitted and zero reported indexed | Medium | Medium | Inspect Page Indexing and canonical validation in authenticated GSC; compare samples against live canonical, redirect, and sitemap output |

## Implemented This Week

1. Homepage section timers now stop when the document is hidden or leaving, and resume only for sections still intersecting in a visible document. Page lifecycle setup creates a new homepage visit ID.
2. Site-modal and video-grid searches now require a settled two-character query after 700ms. Events include `search_surface` and `search_settle_ms`; video-grid zero results now emit `search_no_results`.
3. Translation validation now rejects provider command leakage, prompt leakage, malformed URL backticks, and unbalanced H1-H3 tags. A slug-atomic quarantine command clears all locale variants and cached segments so the worker regenerates a coherent four-language set.
4. A versioned Hermes installer restores daily publishing, translation, weekly GSC, and sitemap jobs without an LLM agent. Existing scripts retain build-log and Telegram failure reporting.
5. The disabled Speediance Workout Hub redirect is excluded from the sitemap, removing the only local indexability-audit failure.

## Tracking and GSC Gaps

- The new dwell tracking needs one clean full week before section reordering.
- Mobile navigation item exposure is too small and may undercount items opened for less than 500ms.
- The Safari `@context.toLowerCase()` exception has no application stack frame in PostHog. Do not suppress it or claim it is fixed without source attribution.
- PostHog still has too little newsletter, contact, affiliate, calculator, and search-result-click volume for optimization decisions.
- The Search Console API provides performance and sitemap data but not the full Page Indexing validation drilldown used in the UI. The authenticated Chrome control surface was unavailable in this runtime, so the remaining `Alternate page with proper canonical tag` samples still require UI inspection.

## First Actions

1. Deploy the analytics, translation-QA, and sitemap fixes and install the Hermes schedules.
2. Run the translation quarantine on DGX, let MiniMax regenerate the 39 affected slugs, and publish only completed four-locale sets.
3. Use the next complete week to test a WHOOP or Gym Monster homepage feature, then decide whether to replace About with Comparisons in the primary navigation.
