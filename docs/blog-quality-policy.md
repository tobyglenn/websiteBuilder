# Blog factual quality: incident and publishing contract

## What failed on October 11–13, 2026

The original articles were recovered from the versioned article data, and their sources were matched by video ID. All three source videos are marked as Shorts in the canonical video catalog.

| Published article | Source ID | Transcript words | Article words, approximately | Observed defect |
| --- | --- | ---: | ---: | --- |
| Tonal Clicker vs. Speedy Ring | CEXgb5pr32w | 93 | 911 | A brief demonstration of a movable button and tactile indentations became a broad accessories comparison with unsupported compatibility and performance assertions. |
| Is $7,000 worth this kind of treatment? | 3MfnMT3uozI | 183 | 1,061 | A personal complaint about support and roughly four years of spending became a fabricated itemized hardware, accessories, installation and monthly-membership calculation. The source did not supply those line items. |
| Is Tonal actually worth it? | eGEMi0p2VXU | 130 | 939 | Ambiguous captions saying “Vultr” and “this device” became a supposed “Speediance Vultr” and an unsupported device-purchase narrative. |

The logs show MiniMax draft failures followed by Google fallback on October 11 and 12. October 13 completed the MiniMax draft path. All three completed the Google review path. These are provider-level logs: the old publisher did not preserve exact model receipts. The configured provider routes permitted alternative models, so the precise historical model versions cannot be proved from those logs. There is no evidence that the local fallback authored these three posts.

The failure was systemic: a source floor of only 40 words, a generated-article target of 900–1,600 words, a hard 750-word review minimum, automatic provider/model fallbacks, and a reviewer that received the draft but not the transcript. Its final checks measured format and length, not factual support. A `reviewed: true` flag was enough to proceed. Earlier prompt instructions against invention did not implement an enforceable source check.

## New contract

- A standalone article needs a verified section of a long-form original with at least 600 words. Shorts are excluded from every blog sourcing path, including guide updates; unknown formats are held. The source floor cannot be lowered to the old 40-word threshold through the environment.
- Read and hash the complete selected section, its canonical video ID, timestamp range and timed-caption version. Missing or invalid timestamps and sources too large for the full-context path cause a hold. Never assign estimated timestamps to flat transcripts or silently truncate a section.
- Length follows the evidence: no 750-word publishing minimum or forced 900–1,600-word target. A usable article is at least 300 words and no more than 1.2 times the source length or 1,800 words, whichever is lower. This is a guardrail, not a quality score.
- Pin the writer to `minimax/MiniMax-M3`, the editor to `google/gemini-3-flash-preview`, and the separate fact-check pass to `minimax/MiniMax-M3`. The final editor and fact checker differ. Use explicit model IDs without provider waterfalls or local fallback. If a call fails, hold. Require the requested route and API-reported model to match the pinned identity. Record requested/reported model, completion status, stage, time and prompt/response hashes. Truncated or filtered output is held. Changing the allowlist requires code review and validation.
- Both editing and fact-checking receive the complete selected section. The fact checker reviews the exact final title, excerpt, headings, paragraphs, table/list cells and tags. Every unit needs supporting source-passage IDs that the publisher resolves into exact quotations; named entities require explicit, unambiguous support. Invalid IDs, mismatched quotes and missing entity support cause a hold. One bounded editorial repair may use the failed check as feedback, followed by a fresh fact check; a second failure remains held. The checker must reject an authentic but irrelevant quote that does not support the whole claim.
- Deterministic checks reject numbers absent from the source, the actual invented Speediance/Vultr combination, unresolved “Vultr” captions in this equipment context, transcript-summary voice, clickbait verdicts, excessive expansion, invalid HTML, fabricated quotes and incomplete evidence coverage.
- Unknown device references such as “this one” cannot be resolved from inference. Ambiguous names must be omitted or held for verification. No prices, specifications, compatibility, experiences or medical claims may be added from model memory. Historical/personal statements must remain qualified.
- Bind the approval to the policy version, source video, full-source hash and final article hash. The publisher rechecks it immediately before any publication mutation. A legacy `reviewed` flag or unreviewed override cannot bypass the gate. Changes to content, headline, tags or source require review again.
- Archive the final draft, full evidence verdict and model receipts under `blog-drafts/published-quality/<slug>/<article-hash>.json` before clearing the pending draft. Expected no-source holds are recorded in `blog-drafts/quality-hold.json`; daily cadence never forces a substitute article.
- Preserve broad-topic rotation and guide-consolidation checks. Replace whole-video exclusion with canonical section overlap checks.

## Validation and limits

`python3 scripts/tests/blog-quality.test.py` includes the three actual short-source regressions, unsupported prices/products, altered approvals, missing/false quotes, pinned-model routing, full-source editor inputs and the final publishing boundary. Existing source-identity and topic-rotation tests remain required in CI.

An isolated live-provider exercise writes only under `/tmp/toft-section-quality-dryrun*`, uses a separate test log directory and does not invoke real draft/review/publish stages, create pending production work, send notifications, or publish articles. Its outcome is recorded in the task evidence.

Verbatim quotes prove where evidence came from, not that speech recognition or the underlying real-world claim is correct. Semantic support still requires model judgment; uncertain cases are held rather than treated as verified. This repair addresses factual/editorial quality, not a claimed Google ranking recovery.

## Reusing long videos and resolving clips

`blog_sections.py` compares the transcript words of non-Short uploads. A qualifying excerpt needs at least 300 matching words, at least 80% coverage, and compact matching spans in a longer original (disjoint spans are preserved for edited compilations). Titles alone do not establish lineage. Partial/ambiguous matches and explicit excerpt descriptions without verified mappings are held. Only original uploads supply article text; excerpt uploads are aliases, never fresh independent candidates.

Real timed captions define ranges. Source sections follow authored chapters; uncovered remainders of chapters are allowed when enough complete captions remain. An unchaptered video is one section until a coherent subdivision is curated. No arbitrary equal-time chopping. Caption cues extending past a section's end are excluded, so material outside the selected interval does not enter the writer.

The publisher commits `source_section` (canonical ID, start/end, section ID, text/timing hashes) with every article in `mock.js`, alongside the original timestamped `source_url` and a deterministic visible source citation. This is the authoritative coverage ledger and survives a crash after push. Coverage is re-read at final publication. A used interval blocks overlap, including overlap reached through another uploaded clip, while leaving other intervals on the original eligible. New publications do not blacklist the whole video's transcript.

`blog-legacy-coverage.json` captures the pre-migration source IDs. When an old article used a matched excerpt, conservatively reserve that excerpt's verified original range. Historical use of an original without a known range remains explicitly unresolved; do not pretend the rest was unused. Retired/merged articles still count as prior coverage. Historical Short coverage does not make the Short eligible for any future use.

The read-only command `WEBSITE_DIR=/home/toby/.openclaw/workspace/websiteBuilder python3 /home/toby/.openclaw/workspace/scripts/blog_pipeline.py inventory` reports available, covered, insufficient, and unresolved sections, clip mappings, hashes and holds. It neither calls models nor publishes/notifies. The committed audit snapshot records the migration inventory; runtime inventory is rebuilt from current captions and committed article metadata.

`fetch_transcripts.py` retains caption start/end times and backfills missing timing on existing long-form sources in bounded batches. The former `--include-shorts` bypass is removed. Existing website video/Short catalog pages remain intact; this policy concerns blog sources.

Additional CI coverage: `blog-sections.test.py` verifies distinct sections of one original, aliased overlap, preserved unused chapter remainders, never using Shorts, invalid timing, unresolved legacy coverage, immutable source identity, and the final publication boundary. The caption importer tests verify Shorts cannot enter even when already indexed.

Initial migration results and honest coverage limits: [validation receipt](audits/blog-quality-validation-2026-10-14.md), [source inventory](audits/blog-source-inventory-2026-10-14.json).
