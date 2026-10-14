# Blog audit review and implemented optimization — October 14, 2026

The supplied audit has useful maintenance recommendations, but does not establish the cause of the August traffic collapse. Its inventory predates the October 13 content corrections: the live source had 217 canonical articles, and several quoted titles and purported test claims no longer matched production.

## Implemented

- Fixed the DGX publisher's slug and title detection to include historical quoted JavaScript keys. Include static Markdown slugs in collision checks.
- Preserve source video ID and URL in new published records. Check existing editorial video links, explicit metadata, and known transcript inventory/blacklist mappings before selecting a draft and again immediately before publishing. A second filename or a new slug does not bypass the source check. Do not infer source identity from reused thumbnail IDs. New automated articles require a verified source ID.
- Strengthened generation guidance: first-person statements must be supported by Toby's source; preserve attribution to other people; do not manufacture tests, specifications, clinical protocols or table cells.
- Consolidated the two Nano/VOLTRA articles tied explicitly to video `-MfLx3omqzw`. Keep the established `speediance-gym-nano-vs-voltra-clone-controversy` URL, which already receives the older `mflx3omqzw` alias. The newer `speediance-gym-nano-vs-voltra-why-the-debate-took-over` becomes a direct alias in English and four locales.
- Retained the survivor's content and added the duplicate's useful distinction: the Reddit discussion establishes community arguments, not a comparative device test. Added a short-answer decision table in English, German, Spanish, Portuguese and Hindi. Archived the four retired translations outside the active translation inventory. Historical source bodies remain recoverable.
- Added shared category normalization and complete category filters, including Build Logs, Reviews and Training Tips. Reconciled 64 translation records only after proving their source changes were category-only.
- Route introductory links by article intent/category before incidental product mentions. AI build logs lead to AgentStack; BJJ articles lead to BJJ; wearable and gym articles retain appropriate comparisons. Preserve analytics attributes and the refund checklist exception.
- Shared manual aliases between templates and sitemap filtering. Export all built blog redirect stubs for actual Cloudflare 301 redirects, including existing aliases previously served as HTML refresh pages. Export validates every destination against the sitemap.
- Added regression tests to CI. Responsive tables scroll within the article width.

## Recommendations not adopted

- Do not reduce the site to 56 posts based only on broad topic clusters. C41 combines white-, blue- and purple-belt questions; C26 combines architecture, APIs and migration updates; C14 combines different firmware releases and family training; C40 combines competition commentary and injury/community experience. These are not interchangeable reader intents.
- Shared thumbnails are not source identity. Historical records reuse video thumbnails across unrelated articles (for example Oura/WHOOP and WHOOP sizing). Even a shared source video can support distinct questions; editorial mergers still require content review.
- Do not rename every dated slug merely to remove a date. Established URLs are retained unless a verified duplicate has a better existing destination.
- Do not noindex the Node.js tutorial merely because it is a software topic. Software and fitness automation are an established part of the site; there is no demonstrated indexing defect requiring its removal.
- Do not add invented measurements, six-month device testing, calorie logs, billing updates, medical recovery protocols or product-review schema. The attachment proposes several additions without supplying supporting evidence.
- Do not stamp four-column comparison tables onto every article. Use tables only where the actual source supports a useful comparison.
- Self-canonicals and reciprocal language links were repaired/verified earlier today; retain those contracts.

## Validation and deployment procedure

Production build: 2,585 sitemap URLs, zero broken internal links, zero hreflang failures, 216 source articles and 864 valid translation files. Source-identity, category/CTA and existing consolidation regression tests pass.

The versioned DGX scripts are in `scripts/dgx/`. The cron wrappers call `/home/toby/.openclaw/workspace/scripts/blog_pipeline.py`; install both that file and `blog_source_identity.py` together, after backing up the currently installed script. Do not run draft/review/publish as a smoke test: those stages can generate content and send notifications.

Cloudflare uses the existing canonical snapshot plus `toft_blog_consolidation_20261014` (160 exact source variants) ordered FIRST. Fifteen sources override old snapshot destinations; the other 145 are additional aliases. Query strings are preserved, with no wildcard or subpath matching. The exporter produces the complete 8,523-entry desired state for a future full snapshot replacement. Verify both HTTP and HTTPS forms and all locale destinations after activation.

Technical improvements do not prove a ranking recovery. Compare complete GSC weeks with the healthy August baseline separately.
