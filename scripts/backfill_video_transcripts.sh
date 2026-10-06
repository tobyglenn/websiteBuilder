#!/usr/bin/env bash
# Backfill YouTube captions for all catalog videos missing transcripts.
#
# WHY THIS EXISTS
# ---------------
# ~360 /video/<id>/ pages (mostly Shorts) have no transcript, leaving them as
# ~270-word duplicates of their YouTube description — the bulk of Google Search
# Console's "Crawled - currently not indexed" bucket. Transcripts are unique,
# crawlable text (YouTube does not expose captions as indexable text), so each
# backfilled transcript directly makes its page indexable. The page template
# (frontend/src/pages/video/[id].astro + lib/videoTranscripts.ts) already
# renders transcripts, chapters, takeaways and JSON-LD the moment the data
# file exists — no template changes needed.
#
# WHY THIS RUNS HERE AND NOT IN CI
# --------------------------------
# YouTube blocks caption fetches from datacenter IPs (this VM gets
# "YouTube is blocking requests from your IP"). Run this on a residential IP
# (e.g. your Mac, where the blog pipeline venv already lives).
#
# WHAT IT DOES
# ------------
# 1. fetch_transcripts.py --max-new 0 --include-shorts
#    Fetches English captions for every catalog video missing one (long-form
#    and Shorts), writing .txt files + transcript_index.json into the draft dir.
# 2. sync_video_transcripts.py --apply
#    Converts new captions into frontend/src/data/video-transcripts/<id>.json
#    (the format the site renders).
# 3. Prints coverage before/after.
#
# USAGE
# -----
#   ./scripts/backfill_video_transcripts.sh            # full backfill
#   ./scripts/backfill_video_transcripts.sh --dry-run  # show what would fetch
#
# After it completes: git add frontend/src/data/video-transcripts && git commit
# && git push — the next deploy picks the transcripts up automatically.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

DRY_RUN=""
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN="--dry-run"
  echo ">>> DRY RUN — no files will be written"
fi

# The fetch script expects the blog pipeline venv (youtube-transcript-api).
if ! python3 -c "import youtube_transcript_api" 2>/dev/null; then
  echo "ERROR: youtube-transcript-api is not installed." >&2
  echo "Run this with the blog pipeline venv (see scripts/fetch_transcripts.py header)." >&2
  exit 1
fi

count_transcripts() {
  ls frontend/src/data/video-transcripts/*.json 2>/dev/null | wc -l | tr -d ' '
}

BEFORE=$(count_transcripts)
echo ">>> Transcripts before: $BEFORE"

echo ">>> Step 1/2: fetching missing captions (this takes a while — ~0.35s per video plus retries)…"
python3 scripts/fetch_transcripts.py --max-new 0 --include-shorts $DRY_RUN

if [[ -n "$DRY_RUN" ]]; then
  echo ">>> Dry run complete — re-run without --dry-run to fetch."
  exit 0
fi

# The sync script imports from --source-root (draft transcripts dir).
# Default draft dir: <repo-parent>/blog-drafts/transcripts (see fetch_transcripts.py).
DRAFT_TRANSCRIPTS="${BLOG_DRAFT_DIR:-$(dirname "$REPO_ROOT")/blog-drafts}/transcripts"

echo ">>> Step 2/2: syncing new captions into frontend/src/data/video-transcripts …"
python3 scripts/sync_video_transcripts.py --source-root "$DRAFT_TRANSCRIPTS" --apply

AFTER=$(count_transcripts)
echo ">>> Transcripts after: $AFTER ($((AFTER - BEFORE)) new)"
echo ">>> Done. Review with: git status --short frontend/src/data/video-transcripts"
echo ">>> Then commit + push; the site renders new transcripts on the next deploy."
