# Search Visibility Investigation - September 14, 2026

## Finding

The loss is real, broad, and begins August 15-16. A verified deployment defect is making Googlebot and readers request deleted CSS/JavaScript bundles. That defect is being repaired, but the evidence does **not** establish it as the sole cause of the search collapse. Do not label this a confirmed Google penalty, a confirmed migration failure, or a tracking-only problem.

## Exact Timing and Scope

Search Console API: domain property, Web search, final data, July 15-September 12. Authenticated UI agrees with the latest complete week. Full query-page exports stayed below the 25,000-row cap (1,414 before; 65 after; 45 recent).

| Date | Clicks | Impressions |
|---|---:|---:|
| August 14 | 12 | 1,889 |
| August 15 | 4 | 848 |
| August 16 | 0 | 39 |
| August 17 | 0 | 35 |
| August 18 | 0 | 46 |

| Comparable 14-day window | Clicks | Impressions |
|---|---:|---:|
| August 2-15 | 169 | 24,578 |
| August 16-29 | 0 | 483 |
| August 30-September 12 | 4 | 612 |

The immediate impression decline is 98.0%. The latest complete seven days, September 6-12, have 3 clicks and 281 impressions versus 99 clicks and 13,219 impressions on August 9-15.

Largest page losses, August 2-15 versus August 16-29:

| Page | Impressions Before | After | Clicks Before |
|---|---:|---:|---:|
| WHOOP 5 not smaller review | 3,276 | 7 | 18 |
| Anthropic refund | 2,220 | 18 | 16 |
| Gym Monster 2 vs original | 1,641 | 3 | 8 |
| WHOOP recovery scores | 942 | 2 | 1 |
| Speediance vs Tonal | 895 | 11 | 9 |

This affects desktop (14,176 to 348 impressions), mobile (10,264 to 135), English blogs, podcasts, and translated pages. Relevant buying/research queries disappeared, including WHOOP 4 vs 5, Speediance vs Tonal, and Claude refunds. Existing anomaly rules flag 788 pre-drop query-page impressions and zero clicks: they cannot explain the lost clicks or most of the decline. Query/page aggregation is not additive to property totals; these are directional decompositions, not an exact attribution of all impressions.

## Cause Assessment

| Candidate | Evidence | Assessment |
|---|---|---|
| Deleted deployment assets | GSC records 601 Googlebot 404 requests over the report window; samples include `/_astro/Layout.B6g4p7ch.css` and `/_astro/Header.BN-Zryq9.js`. Both still returned live 404. PostHog also recorded `/_astro/Layout.CLLa9kvU.css` failing. Deploy replaced the output directory without retaining old hashes. | **Confirmed technical defect; contribution to the 98% decline is unquantified.** Missing styles/scripts can disrupt rendering and navigation. |
| Domain transfer/DNS move | Registrar transfer email dated August 16, 12:30 UTC. Cloudflare detected Spaceship nameservers August 24 and deleted its unused zone August 31. | **Temporal lead, not proven cause.** The first daily decline precedes the transfer completion email. Main-host GSC reports no availability problems over 90 days and acceptable DNS/server/robots failure rates. No reason to switch nameservers again without evidence. |
| August spam update | Official rollout began August 18 and ended August 21. | Cannot explain the August 15-16 onset by its announced timing. An unannounced ranking/serving change remains possible; Google does not disclose every adjustment. |
| GSC logging anomaly | Official August 13-17 issue concerns generative-AI impressions and was restored August 21. | Does not explain the sustained loss of Web clicks and impressions into September. |
| Sitewide noindex, robots block, manual action, security action, removal request | No manual actions or security issues. No temporary-removal or SafeSearch requests in six months. Main/www HTTP/HTTPS robots files fetched successfully. Priority English and German pages inspected as indexed with matching canonicals. | Not supported by current evidence. This does not reconstruct every historical response. |
| Two critical robots errors | The failed hosts are `nutritrack.tobyonfitnesstech.com` and `bjj-buddy.tobyonfitnesstech.com`, not the main site. | Separate app-host health issue, not evidence the main site's robots file is broken. |
| Daily publishing stopped | Seven of seven recent publishing runs succeeded; current translations are complete. | Not the current cause. More automatic publishing alone is not a recovery strategy. |
| Four localized training-log canonical exclusions | Google's stored examples were crawled in July and select the English page. | A small, older duplicate-content classification, not evidence explaining the sitewide August collapse. Do not delete translations wholesale. |

The strongest remaining broad explanation is a change in search visibility/ranking/serving, potentially affected by technical or content signals. This describes the pattern; it does not identify Google's internal cause. Average rank among surviving impressions cannot establish a fixed-query ranking change.

Important counterevidence: Google's stored crawl of the main WHOOP review shows HTTP 200, index/follow, its own canonical, and **all resources loaded**. The asset defect is real elsewhere in Google's crawl history, but this prevents attributing that page's entire search loss to a failed render without more evidence.

## Repairs and Verification

| Status | Change | Evidence |
|---|---|---|
| DONE | Restore and retain immutable browser bundles for 30 days | Code `69dd3eb1b0`: `frontend/scripts/retain-deploy-assets.mjs` and deployment workflow. QA restores 336 historical bundles, 34 MB total `_astro` directory; production retains 335 (build-specific current hashes differ). All 1,390 checked relative JS/CSS references resolve. Does not restore retired HTML or source maps; manifests preserve original last-use dates so retained files expire. GitHub build `34863094557` and Pages deployment `34863404820` succeeded. All three exact missing-asset examples now return 200 with the original SHA-256 bytes and correct content types. |
| DONE | Preserve the verified pre-collapse baseline in future GSC reports | Same commit: `scripts/config/gsc-visibility-reference.json`, `scripts/lib/gsc-data-quality.mjs`, and weekly report integration. Regression covers four depressed weeks falsely appearing normal. Operational report now reports `unresolved_visibility_incident`, 2.1% of reference; build-log-errors delivery verified at September 14 11:34 EDT. |

Nine targeted tests pass on macOS and DGX. Full production-equivalent build passes: 2,292 sitemap URLs, 2,325 HTML files, zero broken internal links, 18,005 JSON-LD scripts, 30 Product schemas. The unrelated Garmin working-tree modification is preserved.

Production release `69dd3eb1b04186659093381d3ff39c401c8e32bb` is present in rendered HTML. Eight live Chromium/WebKit checks at 390px and 1440px passed for homepage/sleep, including overflow and analytics attribution checks with telemetry blocked. Google accepted the WHOOP article indexing request and confirmed addition to its priority crawl queue; that is not a promise of ranking recovery.

## Next Decisions and Measurements

1. Verify repaired assets return 200 with original bytes in production; request a fresh crawl of the main WHOOP entry page after deploy. Check GSC missing-resource examples over subsequent crawls, not just total 404 count.
2. Measure recovery against August 9-15, not only the preceding depressed week. Watch priority page/query pairs, clicks, impressions, and crawl results over complete weeks. No recovery claim based on deployment success alone.
3. Review overlapping WHOOP/Gym Monster articles for genuinely duplicate material and weak source evidence before consolidation. Keep original testing, dated observations, video sources, and useful translated content. Do not mass-delete, blanket-noindex, or invent new measurements to chase recovery.
4. Resolve the two app-subdomain availability problems only against their established app hosting configuration. They are separate from this main-site repair.

Limitations: Chrome blocked GSC's crawl CSV export (`ERR_BLOCKED_BY_CLIENT`), so detailed historical daily crawl-volume/failure timing was not exported. The authenticated host-status and 404 sample reports were readable. Historical CDN edge/DNS response logs around August 15-16 were not available; a short or geographically limited problem cannot be ruled out. GSC inspection represents Google's stored crawl, not every current live fetch.

## Sources

- [Google: debugging Search traffic drops](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops)
- [Google: August 2026 spam update](https://status.search.google.com/incidents/LEubPCm2octf2uMqCFKE)
- [Search Console data anomalies](https://support.google.com/webmasters/answer/6211453)
- [Google: changing hosting without changing URLs](https://developers.google.com/search/docs/crawling-indexing/site-move-no-url-changes)
- [Google: JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Vite: deployment load errors](https://vite.dev/guide/build.html#load-error-handling)
- First-party GSC aggregate evidence: `docs/analytics/search-drop-2026-09-14.json`; authenticated GSC host status, robots, removals, and crawl-404 reports inspected September 14.
