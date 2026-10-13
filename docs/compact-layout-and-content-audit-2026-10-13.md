# Compact layouts and source-led content audit — October 13, 2026

## Scope and limits

This release combines compact page introductions with a focused audit of former search-entry pages. Priorities came from the October 13 Search Console investigation's August 2–15 Web page report, plus clear duplicate clusters. It does not establish the cause of the August visibility decline or promise recovery.

All 220 original canonical articles were included in the inventory. All 880 original translated article files passed the existing source-hash, link, number, structure and model-leakage checks before editing. That is structural validation, not proof of semantic accuracy. The editorial pass below covers 11 retained articles and four retired duplicates; it is not a claim of a line-by-line review of the entire archive.

## Consolidation decisions

| Retired slug | Retained slug | Reason |
| --- | --- | --- |
| `2026-01-14-the-truth-about-whoop-5-is-it-really-smaller` | `whoop-5-not-smaller-review` | Same size, comfort, accessories and upgrade question; retain the established search entry. |
| `whoop-vs-garmin-bjj-review` | `whoop-vs-garmin-jiu-jitsu-strength-training` | Same training account; the full video/transcript remains available separately. |
| `2026-01-16-whoop-vs-garmin-for-jiu-jitsu-strength-training-honest-review` | `whoop-vs-garmin-jiu-jitsu-strength-training` | Same grappling/training question; retain the stronger pre-decline entry URL. |
| `speediance-vs-tonal-the-warranty-debate-uncovered` | `2025-09-14-speediance-vs-tonal-the-warranty-debate-uncovered` | Same short support clip; preserve the established dated URL. |

The mappings apply to English, German, Spanish, Portuguese and Hindi: 20 old URLs. GitHub Pages serves instant HTML redirects with a destination canonical, not HTTP 301 responses. Old URLs remain reachable but leave the sitemap, article listings and Pagefind body index. Destination translations generate the localized redirect routes, so obsolete translation files are unnecessary.

No whole category, language or collection is removed. The original videos, transcripts, photos and complaint screenshot are retained. Historical article revisions remain in Git.

## Editorial findings and repairs

| Article | Evidence retained | Repair |
| --- | --- | --- |
| WHOOP size/upgrade | `DHYERsqckrA`, January 2026 transcript; current user buying verdict | Removed the false direct side-by-side testing claim and metadata promise of exact dimensions. The video explicitly says WHOOP 4 is not present. Separate wearing opinion from measurements. |
| Garmin/WHOOP for grappling | `apsAL3x_V3k` | Corrected the contradiction about Garmin overnight wear; removed invented blanket placement and accuracy claims; retained the smaller-watch choice and historical ownership context. |
| Speediance/Tonal ownership | `Kjwo6nYNceg`, `ZbEstduW90I` | Removed generic AI superlatives and stale universal pricing. Distinguish original Tonal experience from untested Tonal 2, and direct current costs to the maintained comparison. |
| Safety Start | `ZbEstduW90I` | Corrected minimum retraction versus maximum extension; removed engineering-cause certainty, invented fixed ROM percentages and universal instructions to disable a feature. Keep observations tied to the demonstrated firmware. |
| Warranty/support | `aNmpUevc3Sk` | Removed a detailed invented support-case sequence expanded from a short clip. Separate personal support opinion from contractual coverage and guarantees. |
| Claude refund complaint | Original `/images/anthropic-refund-scam.jpg`, published April account | Preserve the denial and complaint; remove claims about every customer, deliberate internal engineering and current policy that the account does not establish. |
| Gym Monster 2S price reaction | `fa2_cLcIuvs` | Condensed an expanded ownership story to the short actual reaction. Historical prices are labeled; no invented months-long test or return story. |
| Gym Monster 2S lowering adjustment | `ZspIOVs0XDo` | Keep the demonstrated behavior, explicitly uncertain generation attribution, and estimated weight. Remove broad safety guarantees and an inferred internal mechanism. |
| Unlimited Sets | `udS5Iu6SXWM` | Keep the actual settings demonstration. Correct multi-rep-at-1RM wording and the claim that subtracting predicted rep counts measures actual reps in reserve. |
| Full V3.1 review | `ZbEstduW90I` | Retain its distinct wider firmware-review purpose and full observations; add the direct source and version context. |
| Gym Monster 1 versus 2 | Existing model guide and `J3W59IR2Las` | Retain the specification-based model question. Explicitly distinguish it from the first-hand original-versus-2S video. |

Nine articles were rewritten; two received evidence-context additions. All four translations were updated for every changed article. Editorial review also corrected untranslated Hindi link labels in newly generated drafts. Automatic validation alone did not catch those labels.

## Prevention

`npm run build` now runs `audit:blog-translations`. It rejects stale published source hashes, missing source URLs/numbers, malformed translation structure, model instructions, leaked reasoning tags and unexpanded protected tokens. Unit coverage exercises leakage rejection and checks that retired articles leave listings while each retained destination exists in all languages.

This gate cannot establish whether a fluent generated claim is true. New generated articles still need comparison with the actual transcript, footage or documented measurements. An opinion is not a measurement, a short clip is not a long-term test, and a historical offer is not a current price.

## Layout coverage

Explicit introduction/title markers cover 237 Astro templates and the shared React introductions, including all five languages. The homepage uses a short introduction, two comparison links, a compact weekly pick and immediately adjacent recent reviews. Games, projects, articles, podcasts, comparison and data pages use the compact title scale without shrinking tables or body copy globally.

Local browser checks covered 54 English page families at desktop width, phone samples across those families, translated homepage/comparison samples, light mode, menus and comparison navigation. The homepage intro ends at 258px on a 1440px desktop and 382px on a 390px phone; the English comparison intro ends at 174px on that phone. Four desktop comparison devices and two phone devices remain available. Calendar labels and long podcast descriptions were repaired to prevent page-wide overflow.

## Verification

- 32 targeted regression tests passed locally and on the canonical DGX checkout.
- The full local build passed: 2,582 sitemap URLs, 2,651 HTML files, zero broken internal links, and 30 Product schemas.
- Article translation validation passed for all 216 retained articles / 864 translated files. Release-interface translation validation passed in all four languages.
- Generated-output checks verified all 20 redirect/canonical pairs, their sitemap exclusions, retained destination URLs, and the October 13 modification dates for the 11 changed articles in all five languages.
- Revised article samples in English and all four translated languages passed phone-width overflow checks. English and German old URLs were verified navigating to the retained articles.
- Existing PostHog capture code and comparison data are unchanged. The compact homepage exposes its layout version and preserves tracked review/comparison links; this is instrumentation preservation, not a claim that the redesign improves conversion.
