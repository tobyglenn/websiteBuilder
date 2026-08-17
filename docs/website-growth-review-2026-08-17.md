# Website Growth Review - August 17, 2026

## Decision Summary

Search visibility and qualified readership improved, but the site lost its daily publishing and maintenance cadence when the OpenClaw cron entries were disabled on August 15 without corresponding Hermes jobs. This week's highest-confidence work is restoring that operating system, quarantining corrupt translations, and collecting trustworthy homepage and search measurements before a broad navigation redesign.

The strongest reader demand remains WHOOP, Speediance comparisons, Anthropic refunds, and AgentStack. Keep the homepage structure for another measured week, but rotate its featured subject toward one of those demand clusters instead of leading with BJJ alone.

## Measurement Window

- PostHog: August 10-16 versus August 3-9, 2026.
- Search Console: final data August 9-15 versus August 2-8, 2026.
- Homepage layout: `home-2026-08-04-a`.
- Navigation schema: `nav-2026-08-04-a`.
- Decision threshold: at least 20 unique viewers per compared homepage section or navigation item, unless an independent technical failure is clear.
- One homepage visit contained more than ten days of false dwell. Average dwell below excludes the section-summary row above 1,800 seconds.

## Top Wins

1. Search Console editorial clicks increased from 70 to 99 (+41%), impressions from 10,667 to 13,028 (+22%), and CTR from 0.66% to 0.76% (+16%). Average position was essentially flat at 10.15 versus 10.07.
2. PostHog pageviews increased from 437 to 564 (+29%), unique visitors from 368 to 439 (+19%), and qualified visitors from 70 to 97 (+39%).
3. The Anthropic refund article reached 92 PostHog visitors with 43.5% qualified engagement. Its referral spike was genuine Hacker News traffic rather than crawler noise.
4. German WHOOP content is beginning to earn search traffic. `/de/blog/2026-01-14-the-truth-about-whoop-5-is-it-really-smaller/` earned 4 clicks from 45 impressions (8.9% CTR).
5. Search query-page anomaly filtering worked as intended: 96 irrelevant API and transcript-reference impressions were excluded from editorial decision metrics without discarding legitimate AgentStack traffic.
6. Search Console downloaded the sitemap on August 17 with zero reported sitemap errors or warnings.

## Top Risks

1. All website OpenClaw cron entries stopped on August 15, and daily publishing, translation, GSC, and sitemap jobs had no Hermes replacements.
2. Translation QA found 54 corrupt locale files across 39 article slugs. Failures included MiniMax command or prompt leakage, malformed URL backticks, and unbalanced headings.
3. Homepage engagement was not trustworthy while a background Safari tab could accumulate roughly ten days of visible time.
4. Sitewide next-step modules reached 155 viewers but produced one click. The Anthropic module alone reached 66 viewers with zero clicks.
5. PostHog captured 51 exceptions across 24 visitors, up from 31 across 11. The leading Safari error affected 20 users, but PostHog supplied no application stack frames, so a site-code fix is not yet justified.
6. Search Console still reports 2,077 submitted sitemap URLs and `0` indexed through the sitemap field. Indexed pages clearly exist and earn clicks, so this is an unresolved reporting or coverage signal rather than evidence that no pages are indexed.

## Homepage Decisions

| Position | Section | Purpose | Unique reach | Avg visible | 5-second rate | Viewer CTR | Deepest reach | Decision |
|---:|---|---|---:|---:|---:|---:|---:|---|
| 1 | Hero | Orient visitors and offer a primary path | 28/29 (96.6%) | 21.1s | 53.6% | 3.6% | 96.6% | Keep; rotate feature toward current demand |
| 2 | Latest articles | Content discovery | 10/29 (34.5%) | 9.8s | 60.0% | 0% | 34.5% | Insufficient data |
| 3 | Training proof | Establish real-use credibility | 5/29 (17.2%) | 7.5s | 60.0% | 0% | 17.2% | Insufficient data |
| 4 | Video hub | Move readers into video | 5/29 (17.2%) | 4.5s | 20.0% | 0% | 17.2% | Insufficient data |
| 5 | Newsletter | Retain readers | 5/29 (17.2%) | 1.0s | 0% | 0% | 17.2% | Insufficient data |

Only the hero cleared the 20-viewer threshold. Desktop had 15 hero viewers, 33.9 seconds average dwell, 60.0% five-second engagement, and zero clicks. Mobile had 13 viewers, 7.4 seconds average dwell, 46.2% five-second engagement, and one click. Neither device segment supports a structural redesign yet.

The current BJJ-led hero does not match sitewide demand. WHOOP, Speediance, AgentStack, and Anthropic account for the strongest search and entry-page evidence. Keep the hero structure, but feature WHOOP 5 versus 4 or the Gym Monster comparison for one full week and measure item-level CTR.

## Navigation Decisions

| Item | Unique viewers | Clickers | Viewer CTR | Current-page clicks | Decision |
|---|---:|---:|---:|---:|---|
| TobyOnFitnessTech | 424 | 7 | 1.7% | 0 | Keep |
| AgentStack | 247 | 2 | 0.8% | 0 | Keep |
| Videos | 232 | 1 | 0.4% | 0 | Keep and monitor |
| Articles | 217 | 2 | 0.9% | 1 | Keep |
| About | 217 | 0 | 0% | 0 | Test replacing with Comparisons; retain About in secondary/footer navigation |

Desktop recorded 64 menu opens from 28 people and 13 selections (20.3% event-level open-to-selection). Mobile recorded five opens from three people and two selections, which is insufficient for a mobile navigation decision. Navigation produced 21 destination arrivals from 22 clicks (95.5% completion); inspect the unmatched click only if the gap repeats.

## Content Clusters

- **WHOOP:** `/blog/whoop-5-not-smaller-review/` earned 11 clicks from 1,543 impressions (0.71% CTR, position 8.1). `/blog/whoop-recovery-scores-explained/` earned 1 click from 462 impressions. WHOOP 4-versus-5 query variants remain the largest comparison opportunity.
- **Speediance:** `/blog/gym-monster-2-vs-original/` rose to 6 clicks from 858 impressions. `speediance vs tonal` impressions increased to 125, while `tonal vs speediance` produced 69 impressions and zero clicks. Relevant entry pages should link more clearly to the canonical model and Tonal comparison hubs.
- **Anthropic:** `/blog/anthropic-refund-scam/` earned 9 clicks from 1,311 impressions (0.69% CTR). Its generic next-step module produced no clicks from 66 viewers.
- **WHOOP versus Oura:** `/blog/oura-vs-whoop-sleep-comparison/` had 527 impressions, zero clicks, and average position 10.3, making its title and opening answer a near-page-one opportunity.
- **AgentStack:** the hub had 573 impressions and zero clicks. The report excluded 96 irrelevant API or transcript-reference impressions, down from 692 in the prior week.
- **Translations:** German and Spanish pages are already earning clicks, validating localization. Reliable publishing is now more important than adding languages.

## Prioritized Improvements

| Rank | Improvement | Impact | Evidence | Confidence | Effort | Implementation |
|---:|---|---|---|---|---|---|
| 1 | Restore website automation in Hermes | Very high | Publishing and reports stopped August 14 | High | Low | Install no-agent jobs for daily blog stages, translation, weekly GSC, and sitemap submission |
| 2 | Quarantine and regenerate corrupt translations | Very high | 54 invalid files across 39 slugs | High | Medium | Reject leakage and malformed output; remove every locale variant for an affected slug and regenerate atomically |
| 3 | Fix homepage dwell and settled-search tracking | High | Ten-day dwell outlier; 23 prefix queries from one search | High | Low | Pause section timers while hidden; capture search only after 700ms and at least two characters |
| 4 | Rewrite WHOOP recovery and Oura comparison SERP promises | High | 989 combined impressions and one click | High | Low | Put the direct answer in the title, description, first paragraph, and answer table |
| 5 | Strengthen the Gym Monster and Tonal internal-link cluster | High | 858 and 452 page impressions; comparison queries rank 6-9 | High | Low | Add descriptive links from relevant entry pages to the canonical model and Tonal comparison hubs |
| 6 | Replace Anthropic's generic next-step block | Medium | 66 viewers and zero clicks despite 43.5% qualified engagement | High | Low | Offer one article-specific next action tied to refund evidence or the Hacker News discussion |
| 7 | Test a demand-led homepage feature | Medium | Hero meets threshold; featured BJJ topic conflicts with search demand | Medium | Low | Feature WHOOP 5 versus 4 or Gym Monster 1 versus 2 versus 2S for one full week |
| 8 | Test Comparisons in primary navigation | Medium | About had 217 exposed viewers and zero clicks | Medium | Low | Replace About with Comparisons in one versioned test; retain About in the footer |
| 9 | Diagnose the Safari exception with source evidence | Medium | 24 occurrences across 20 users, no app stack | Low | Medium | Add release/source-map context or isolate the script/resource before changing site code |
| 10 | Resolve GSC sitemap/index coverage discrepancy | Medium | Valid sitemap with 2,077 submitted URLs but zero reported indexed | Medium | Medium | Inspect Page Indexing canonical validation in authenticated GSC and compare samples with live canonical and redirect output |

## Implemented This Week

1. Homepage section timers now stop while the document is hidden and resume only for sections still intersecting in a visible document. Page lifecycle setup creates a new homepage visit ID.
2. Site-modal and video-grid searches now require a settled two-character query for 700ms. Events include `search_surface` and `search_settle_ms`; video-grid zero results emit `search_no_results`.
3. Translation validation now rejects provider or prompt leakage, malformed URL backticks, and unbalanced H1-H3 tags. A slug-atomic quarantine command clears every locale variant and cached segment so the worker regenerates a coherent four-language set.
4. A versioned Hermes installer restores daily publishing, translation, weekly GSC, and sitemap jobs without an LLM agent. Existing scripts retain build-log and Telegram failure reporting.
5. The disabled Speediance Workout Hub redirect is excluded from the local sitemap. The DGX production build deliberately includes it because `PUBLIC_WORKOUT_HUB_ENABLED=true`, yielding 2,077 instead of 2,076 URLs.
6. Podcast RSS builds now pin GitHub content when possible, authenticate GitHub requests in Actions, and retry through jsDelivr when GitHub Raw is rate-limited. Authorization is restricted to GitHub-owned hosts and never sent to the mirror.
7. Translation publishing now waits until both blog and priority-page backlogs reach zero, preventing quarantine deletions from creating temporary localized 404s while MiniMax regenerates the set.

## Tracking And GSC Gaps

- The corrected dwell tracking needs one clean full week before section reordering.
- Mobile navigation item exposure is too small and may undercount items visible for less than 500ms.
- The Safari `@context.toLowerCase()` exception has no application stack frame in PostHog. Do not suppress it or claim it is fixed without source attribution.
- PostHog still has too little newsletter, contact, affiliate, calculator, and search-result-click volume for optimization decisions.
- The Search Console API provides performance and sitemap data, but not the full Page Indexing validation drilldown. Remaining `Alternate page with proper canonical tag` samples require authenticated GSC UI inspection.

## First Actions

1. Deploy the analytics, translation-QA, sitemap, and podcast feed reliability fixes and keep the Hermes schedules active.
2. Let MiniMax regenerate the quarantined slugs on the DGX, publishing only complete four-locale sets.
3. Use the next complete week to test a WHOOP or Gym Monster homepage feature, then decide whether to replace About with Comparisons in primary navigation.
