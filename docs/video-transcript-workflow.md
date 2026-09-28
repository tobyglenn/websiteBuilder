# Video transcripts: local sources to the website

The website previously read only its own transcript index. New captions remained inside local video production packages, and the DGX blog pipeline maintained a separate transcript directory. Building captions during video production did not import them into the website.

## Import and translate after publication

Refresh the website's YouTube catalog first, so the newly published YouTube ID is present. Use Node 24 and the Python environment containing the existing `freecall` MiniMax provider. `FREECALL_ROOT` can point to the parent directory of the `freecall` package; credentials stay in that environment, never in Git.

Run from the repository root, supplying real production directories (final corrected packages first):

```sh
npm --prefix frontend run transcripts:sync -- \
  --source-root /path/to/final-production-packages \
  --source-root /path/to/older-packages \
  --latest 9
npm --prefix frontend run build
```

The command imports verified English captions, regenerates the video catalog, and translates the selected latest videos into German, Spanish, Brazilian Portuguese, and Hindi using `minimax/MiniMax-M3`. Use `--latest N` to change the window or `--locales de es` to restrict languages. Unchanged translations are reused. It does not commit, push, or publish videos.

GitHub Actions cannot read local/removable disks. Run this local command when a newly published video's catalog entry and publishing sidecar are available, then review, commit and push the website changes through the normal deployment workflow. Missing mounted sources fail visibly. No background import schedule is installed by this change.

## Source contract and validation

Each local package needs adjacent files:

- `video.mp4.youtube-publish.json`: actual YouTube ID, expected Toby channel ID, `asset.sha256`, and optional `duration_seconds`.
- `video.mp4`: original published media matching that SHA-256.
- `captions.srt`: the actual production captions.

The importer matches by exact video ID and channel, verifies the media bytes on every run, and rejects invalid timestamps or captions extending past the media duration. Only catalog entries already dated as published and not marked live/scheduled are eligible. Source roots have explicit priority; corrected masters override old packages with the same ID. An invalid candidate stops promotion rather than silently substituting another file. Source media, captions and publishing sidecars are read-only.

For the existing DGX transcript backlog, copy the index and adjacent `transcripts/` directory to a local temporary directory and pass `--backlog-index /path/to/transcript_index.json`. This imports missing catalog-matched English text without pretending it has timestamps. It does not create blog articles or change the blog pipeline.

Dry-run imports and independent translations are available:

```sh
python3 scripts/sync_video_transcripts.py --source-root /path/to/final-packages
npm --prefix frontend run transcripts:translate -- --latest 9
# Retry one video without scanning a newer release window:
npm --prefix frontend run transcripts:translate -- --video-id YOUTUBE_ID --locales de es pt hi
```

## Committed artifacts

- `frontend/src/data/video-transcripts/`: normalized English text, actual paragraph timestamps when available, source hash, and source provenance without local absolute paths.
- `frontend/src/data/transcripts/`: English plain text compatible with the existing catalog and search index.
- Both `transcript_index.json` files: kept synchronized.
- `frontend/src/generated/video-transcripts/{locale}/`: complete validated machine translations, source title/hash, provider/model and generation metadata.
- `frontend/.cache/video-transcript-translations/`: ignored, resumable per-chunk cache and `latest-run.json` failure report.

MiniMax translates authentic source text; it does not invent English transcripts from video titles. Translation validation preserves segment order, timestamps, names and numeric placeholders, and rejects missing segments or truncated responses. Generation uses MiniMax directly, without a fallback model. If a request fails, rerun the same command to reuse completed work.

Localized routes are generated only for complete translations matching the current English source hash and video title. Stale translations disappear from the available-language links until regenerated. Pages label machine translations clearly; the video's audio language remains English. The site preserves existing transcript text for older videos without local timing metadata.

## Verification

```sh
python3 scripts/tests/video-transcripts.test.py
node --test scripts/tests/generate-videos-data.test.mjs frontend/scripts/tests/video-transcript-validation.test.mjs
npm --prefix frontend run build
# With Playwright installed and a built preview running:
SITE_TEST_URL=http://127.0.0.1:4329 node --test frontend/scripts/tests/video-transcripts.test.cjs
```

CI runs the source/translation regression checks before its production build. Browser checks cover transcript seeking, Astro navigation, language links, metadata, and horizontal overflow in Chromium and WebKit at phone and desktop widths. Tests block external traffic, so they do not produce analytics events or newsletter subscriptions on external services.
