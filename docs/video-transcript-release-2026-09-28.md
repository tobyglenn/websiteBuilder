# Video transcript recovery and translated pages — September 28, 2026

The production website had 494 catalog entries but only 101 English transcript records. Latest production captions were present on the Mac, while additional YouTube captions had been ingested into the DGX blog-drafts directory instead of the website's transcript store.

## Source recovery

Imported 38 missing English transcripts, bringing the website to 139 indexed English transcripts without changing the 494-video inventory. Nine came from local publishing packages, including corrected full-length AI and Speediance masters; 29 came from the existing DGX caption backlog. Local sources were matched by exact YouTube ID and Toby channel ID, with the actual media bytes verified against their publishing SHA-256. Importing again produced zero changes and zero failures.

The nine latest published IDs are `qTgprkmjw4w`, `9JA9pjANcPo`, `XGpE2Pj2Nqo`, `-MfLx3omqzw`, `fT2KxCurdrM`, `MV-PdS86i4E`, `0b821O5dU64`, `pIlSEnF9SnY`, and `txBZRCIcbXA`.

## MiniMax translation coverage

All nine latest videos now have complete German, Spanish, Portuguese and Hindi translations: 36 validated locale files, zero missing translations. The final runner verification reused all 36 completed outputs and reported zero failures. Seven Shorts and two full-length videos are covered. Translations record the actual `MiniMax-M3` model and current English source hash.

## Reader experience

- A prominent transcript link on each transcript-ready video page.
- Readable paragraphs with timestamp links for verified local caption sources.
- Dedicated translated transcript pages with language navigation and explicit MiniMax machine-translation labels. The original audio remains English.
- Canonical and hreflang links limited to actual, complete translations of the current source. The header returns readers to the translated video directory when a video lacks the requested translation.
- Source hash, title, segment order, timestamp, placeholder and completeness checks. Failed or stale translations are excluded from public routes.
- Astro-compatible timestamp seeking, including navigation between English and translated pages.
- The video sidebar now uses the working Kit newsletter component and retains privacy-safe conversion events.

This work preserves the existing WHOOP experiment and navigation measurements. Transcript-language, transcript-open and timestamp clicks use the existing analytics attribute contract. Content is recovered from actual video speech; this release does not create speculative takeaways or change topic priorities from small analytics samples.

## Ongoing workflow

See [video-transcript-workflow.md](video-transcript-workflow.md) for the local import-and-translate command, source contracts, retry behavior, generated files, and tests. GitHub Actions cannot access local disks: the explicit local sync command must run after a newly published video has entered the website catalog. This change does not install a scheduled job or alter the DGX blog publishing pipeline.

## Validation

Source and translation guard tests pass. Browser tests cover Chromium and WebKit at 390- and 1440-pixel widths, including timestamp seeking, transcript expansion, Astro navigation, header language switching, locale metadata and overflow. Existing Gemini-review browser regressions also pass (eight combined browser scenarios). External traffic is blocked during browser tests; they verify iframe timestamp URLs, not streaming playback or a real newsletter submission.

The generated translations receive structural checks and semantic spot checks, not native-speaker certification. Numeric comparisons flagged three passages for review: German and Portuguese render the spoken words “five one version” as “5.1”; Hindi renders “five, five” as “5.5”. These match the spoken version references rather than adding prices or measurements. All protected source digits and all source timestamps were preserved.

Final local build: 2,440 sitemap URLs, 2,473 HTML files, zero broken internal links. All 45 latest video/transcript pages were checked for their canonical URL, language, five real language alternates and all 500 rendered source/translation paragraphs. All 38 recovered English transcript pages contain their complete source text.
