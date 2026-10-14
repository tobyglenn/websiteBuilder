# Blog consolidation and homepage variety — October 14, 2026

This release supersedes the one-pair consolidation scope in the earlier October 14 review. The user requested substantial selective merges and three different homepage subjects.

## Decision

Consolidate 36 articles into eight expanded, edited guides. Redirect 28 retired English slugs and their four translated routes. This reduces the canonical English catalogue from 216 to 188 articles. Keep distinct product launches, later software developments, competition events, and unrelated personal experiences separate.

The uploaded audit is a source of candidate clusters, not proof of why Google visibility collapsed. Its blanket 160-URL removal recommendation is not applied. These changes improve editorial organization; they do not establish the cause of the August loss or guarantee recovery.

## Merge rules

- Merge repeated answers to the same reader question, including repeated accounts of the same test.
- Keep existing descriptive destination URLs and preserve original publication dates. Show the October 14 revision date on revised articles.
- Rewrite a coherent guide rather than concatenate repeated introductions. Include a short answer, decision table, useful details, evidence limits and links to related guides.
- Preserve old article text in Git/source data and archive obsolete translations. Old public URLs remain accessible through one-hop permanent redirects.
- Keep historical software versions and observed tests distinct from current product guarantees. Do not carry forward erroneous product names, unsupported accusations or conflicting precise measurements.
- Translate the revised guide in full; do not stamp a new source hash on an old translation.

## Destination and retired slugs

### /blog/speediance-vs-tonal-comparison/

- `is-tonal-actually-worth-it-the-brutal-truth-about-high-end-home-gym-tech`
- `is-7000-worth-this-kind-of-treatment-the-brutal-truth-about-tonal`
- `tonal-clicker-vs-speedy-ring-which-reigns-supreme`
- `2025-09-14-two-speediances-vs-tonal-2-a-costly-comparison-you-wont-believe`
- `2026-01-30-tonal-vs-speediance-the-arnold-blueprint-problem`

### /blog/is-tonal-a-scam-honest-review/

- `tonal-scam-review`
- `2025-08-26-is-tonal-a-scam`
- `paul-sklar-tonal-review-exposed`
- `2025-08-30-reaction-paul-sklars-tonal-2-review-plus-scam-on-tonal-membership-page`

### /blog/speediance-260lb-lat-pulldown-machine-test/

- `speediance-lat-pulldown-260lbs-test`
- `speediance-2s-max-lat-pulldown-260lbs`
- `2025-09-06-speediance-2s-max-lat-pulldown-260lbs-does-it-break-the-machine`
- `2025-09-06-speediance-2s-max-lat-pulldown-260lbs--does-it-break-the-machine`
- `2025-09-08-can-you-handle-260-pounds-find-out`

### /blog/speediance-1rm-system-exposed/

- `speediance-2s-1rm-exposed`
- `2025-11-21-speediance-2s-1rm-exposed-how-to-actually-unlock-260lbs-on-the-2s`

### /blog/speediance-unlimited-sets-eccentric-mode-setup/

- `speediance-unlimited-sets-setting`

### /blog/build-your-best-training-split/

- `training-split-physique-build-vs-maintain`
- `2026-01-14-build-your-best-training-split-arnold-blueprint-ppl-full-body-or-bro-split`
- `full-body-minus-legs-current-training-split-explained`
- `full-body-minus-legs-training-split`
- `2026-01-18-full-body-minus-legs-my-current-training-split-explained`

### /blog/speediance-partner-mode-v2-vs-v3/

- `speediance-partner-mode-v3-removed`
- `speediance-broke-partner-mode-lost-freelift-feature-demo-daughter`
- `2026-01-24-speediance-broke-partner-mode-the-lost-free-lift-feature-demo-with-my-daughter`

### /blog/mike-israetel-bjj-black-belt-defence/

- `mike-israetel-black-belt-controversy`
- `mike-israetel-bjj-black-belt-legit`
- `2025-11-13-is-mike-israetel-really-a-legit-bjj-black-belt-my-experience-why-the-internet-is`

## What stays separate

The Tonal buying comparison and long-term ownership review answer different questions and cross-link. The 260 lb field test, 1RM guide and eccentric/Unlimited Sets guide also answer different questions. Later partner custom-workout releases remain distinct from the January V2/V3 report. Different BJJ events and the white/blue/purple-belt learning stages are not collapsed into one generic post. AI build logs and personal medical/weight-loss accounts are not merged merely because they share a broad category.

## Homepage policy

Choose the newest publication or substantive revision in each of the existing reader topics: smart gyms, training, BJJ, wearables and AI. Select at most one from each topic and three total. Break ties deterministically and never pad the row with a duplicate topic. All five homepages use the same English topic classification and their available localized articles. Localized cards link to localized URLs.

At this release the selected guides are Speediance versus Tonal, training splits, and the Israetel BJJ discussion. The selection remains dynamic as new distinct topics appear.

## Prevention

The existing source-video identity check remains in place. Narrow intent rules for these eight guides prevent repeat candidates from becoming a new standalone URL. A matching draft is held with the destination guide identified. Sources remain in the backlog for an editorial update; they are not silently deleted or blacklisted. Distinct new developments remain eligible. This does not automatically rewrite a guide from an unreviewed new video.

Internal links in built HTML and RSS are rewritten to final destinations, preserving language, query and fragment. Canonical listings, RSS, search and sitemaps exclude retired routes. Deployment requires all revised translations, build audits, route tests and production redirect verification.

## Pre-deployment verification

- 39 JavaScript tests passed, plus three source-identity and two editorial-policy Python tests.
- Production-flag build passed: 2,445 sitemap pages and 9,951 hreflang links, zero hreflang failures; all 752 translated articles matched their current English sources.
- Release-specific build audit passed for all five homepages, 40 revised canonical guide routes and 140 retired article routes.
- The redirect exporter produced 8,663 unique exact mappings. The verified change set contains 572 rows: 560 variants of the 28 retired slugs, plus 12 variants of three older aliases that must bypass the retired destinations.
- Original publication dates are retained. Eight revised guides contain approximately 800–1,000 words each, before their source and revision notes.
