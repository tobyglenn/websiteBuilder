#!/usr/bin/env bash

set -Eeuo pipefail

export TZ=${TZ:-America/New_York}

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR=${CLARITY_REPORT_DIR:-/home/toby/.openclaw/logs/analytics/clarity}
LOG_DIR=${CLARITY_LOG_DIR:-/home/toby/.openclaw/logs/pipeline}
SECRET_FILE=${CLARITY_SECRET_FILE:-/home/toby/.config/tobyonfitnesstech/clarity.env}
BUILD_LOG_HELPER=${CLARITY_BUILD_LOG_HELPER:-/home/toby/.openclaw/workspace/scripts/utils/post_build_log.py}
FAILURE_TARGET=${CLARITY_FAILURE_TARGET:-telegram:8319992332}
LOG_FILE="$LOG_DIR/clarity_daily_snapshot.cron.log"
LOCK_FILE="$REPORT_DIR/clarity.lock"
FAILURE_MARKER="$REPORT_DIR/failure-notified"

mkdir -p "$REPORT_DIR" "$LOG_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

notify_failure() {
  local exit_code=$?
  local line=${1:-unknown}
  local message="[WEBSITE AUTOMATION FAILURE] stage: clarity-daily exit: $exit_code line: $line log: $LOG_FILE"

  if [[ -f "$FAILURE_MARKER" ]] && find "$FAILURE_MARKER" -mmin -60 -print -quit | grep -q .; then
    printf '[%s] %s (notification cooldown active)\n' "$(date --iso-8601=seconds)" "$message" >&2
    exit "$exit_code"
  fi

  touch "$FAILURE_MARKER"
  if [[ -f "$BUILD_LOG_HELPER" ]]; then
    python3 "$BUILD_LOG_HELPER" --error --to build-log --quiet "$message" || true
  fi
  if command -v hermes >/dev/null 2>&1; then
    hermes send --to "$FAILURE_TARGET" --file "$LOG_FILE" --quiet || true
  fi
  exit "$exit_code"
}
trap 'notify_failure "$LINENO"' ERR

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(date --iso-8601=seconds)] Clarity collection already running; skipped duplicate."
  exit 0
fi

if [[ ! -r "$SECRET_FILE" ]]; then
  echo "Missing readable Clarity secret file: $SECRET_FILE" >&2
  exit 1
fi

set -a
source "$SECRET_FILE"
set +a
: "${CLARITY_API_TOKEN:?CLARITY_API_TOKEN is missing from $SECRET_FILE}"

cd "$FRONTEND_ROOT"
npm run collect:clarity

LATEST_REPORT="$REPORT_DIR/latest.json"
jq -e '
  .provider == "microsoft-clarity"
  and (.periods.current.snapshots >= 1)
  and (.currentPageDeviceFriction | type == "array")
  and (.currentAcquisition | type == "array")
' "$LATEST_REPORT" >/dev/null

SUMMARY=$(jq -r '
  "Clarity refreshed: "
  + (.periods.current.snapshots | tostring) + "/7 current snapshots, "
  + (.periods.prior.snapshots | tostring) + "/7 prior; "
  + (.periods.current.readerSessions | tostring) + " reader sessions, "
  + (.periods.current.botSessions | tostring) + " bot sessions; comparisonReady="
  + (.comparisonReady | tostring)
' "$LATEST_REPORT")

rm -f "$FAILURE_MARKER"
if [[ -f "$BUILD_LOG_HELPER" ]]; then
  python3 "$BUILD_LOG_HELPER" --info "OK: $SUMMARY" || true
fi
echo "[$(date --iso-8601=seconds)] $SUMMARY"

