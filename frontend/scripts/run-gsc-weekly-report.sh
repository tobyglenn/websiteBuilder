#!/usr/bin/env bash
set -Eeuo pipefail

export TZ=${TZ:-America/New_York}

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
FRONTEND_ROOT=$(cd -- "$SCRIPT_DIR/.." && pwd)
REPO_ROOT=$(cd -- "$FRONTEND_ROOT/.." && pwd)
REPORT_DIR=${GSC_REPORT_DIR:-/home/toby/.openclaw/logs/analytics/gsc}
LOG_DIR=${GSC_LOG_DIR:-/home/toby/.openclaw/logs/pipeline}
BUILD_LOG_HELPER=/home/toby/.openclaw/workspace/scripts/utils/post_build_log.py
LOG_FILE="$LOG_DIR/gsc_weekly_report.cron.log"
TEMP_REPORT=''

mkdir -p "$REPORT_DIR" "$LOG_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

notify_failure() {
  local status=$?
  local line=${1:-unknown}
  trap - ERR
  [[ -n "$TEMP_REPORT" ]] && rm -f "$TEMP_REPORT"

  local message="ERROR: Search Console weekly report failed on $(hostname) at line $line (exit $status). Log: $LOG_FILE"
  echo "[$(date --iso-8601=seconds)] $message"
  python3 "$BUILD_LOG_HELPER" --error "$message" || true
  hermes send --to telegram --quiet "$message" || true
  exit "$status"
}
trap 'notify_failure $LINENO' ERR

echo "[$(date --iso-8601=seconds)] Starting Search Console weekly report"
TEMP_REPORT=$(mktemp "$REPORT_DIR/.gsc-report.XXXXXX.json")

cd "$FRONTEND_ROOT"
node ./scripts/gsc-weekly-report.mjs > "$TEMP_REPORT"
jq -e '
  .site == "sc-domain:tobyonfitnesstech.com"
  and (.periods.current.impressions >= 0)
  and (.periods.prior.impressions >= 0)
  and (.sitemaps | type == "array")
' "$TEMP_REPORT" >/dev/null

REPORT_DATE=$(jq -r '.periods.current.end' "$TEMP_REPORT")
DATED_REPORT="$REPORT_DIR/gsc-weekly-$REPORT_DATE.json"
LATEST_REPORT="$REPORT_DIR/latest.json"
install -m 600 "$TEMP_REPORT" "$DATED_REPORT"
install -m 600 "$TEMP_REPORT" "$LATEST_REPORT"
rm -f "$TEMP_REPORT"
TEMP_REPORT=''

SUMMARY=$(jq -r '
  "Search Console refreshed: "
  + (.periods.current.start + " to " + .periods.current.end)
  + ", " + (.periods.current.clicks | tostring) + " clicks"
  + ", " + (.periods.current.impressions | tostring) + " impressions"
  + ", " + ((.periods.current.ctr * 10000 | round) / 100 | tostring) + "% CTR"
  + ", position " + ((.periods.current.position * 10 | round) / 10 | tostring)
' "$LATEST_REPORT")

python3 "$BUILD_LOG_HELPER" --info "OK: $SUMMARY" || true
echo "[$(date --iso-8601=seconds)] $SUMMARY"
echo "[$(date --iso-8601=seconds)] Saved $LATEST_REPORT and $DATED_REPORT"
