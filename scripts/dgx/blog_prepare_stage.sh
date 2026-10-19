#!/usr/bin/env bash
set -euo pipefail

# DGX-only pipeline: no Mac fallback path. If the script is missing, fail
# loudly (cron log + nonzero exit) rather than running a stale copy.
ROOT="${BLOG_WORKSPACE_ROOT:-/home/toby/.openclaw/workspace}"
SCRIPT="$ROOT/scripts/blog_pipeline.py"
STAGE="prepare"
CRON_LOG="/home/toby/.openclaw/logs/pipeline/blog_prepare.log"
HELPER="$ROOT/scripts/utils/post_build_log.py"
FAILURE_TARGET="${BLOG_FAILURE_TARGET:-telegram:8319992332}"

notify_failure() {
  local exit_code="$1"
  local reason="$2"
  local post_build_log="${3:-yes}"
  local message="[BLOG PIPELINE WRAPPER FAILURE]
stage: $STAGE
reason: $reason
exit: $exit_code
script: $SCRIPT
cron log: $CRON_LOG"

  if [[ "$post_build_log" == "yes" ]]; then
    if [[ -f "$HELPER" ]]; then
      if ! python3 "$HELPER" --error "$message"; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $STAGE: build-log notification failed" >&2
      fi
    else
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] $STAGE: build-log helper missing: $HELPER" >&2
    fi
  fi

  if command -v hermes >/dev/null 2>&1; then
    if ! printf '%s\n' "$message" | hermes send --to "$FAILURE_TARGET" --file - --quiet; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] $STAGE: Hermes notification failed for $FAILURE_TARGET" >&2
    fi
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $STAGE: Hermes command unavailable" >&2
  fi
}

if [[ ! -f "$SCRIPT" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] prepare: FATAL: $SCRIPT missing" >&2
  notify_failure 1 "pipeline script missing"
  exit 1
fi

set +e
python3 "$SCRIPT" "$STAGE"
rc=$?
set -e
if [[ $rc -ne 0 ]]; then
  # blog_pipeline.py already posts the detailed error to build-log-errors.
  notify_failure "$rc" "pipeline stage returned nonzero" no
fi
exit "$rc"
