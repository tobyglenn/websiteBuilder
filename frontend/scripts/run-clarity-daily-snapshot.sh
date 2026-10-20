#!/usr/bin/env bash

set -Eeuo pipefail

export TZ=${TZ:-America/New_York}

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OPENCLAW_DIR="${OPENCLAW_HOME:-${HOME}/.openclaw}"
AGENTSTACK_DIR="${AGENTSTACK_HOME:-${HOME}/.agentstack-daily}"
REPORT_DIR=${CLARITY_REPORT_DIR:-$OPENCLAW_DIR/logs/analytics/clarity}
LOG_DIR=${CLARITY_LOG_DIR:-$OPENCLAW_DIR/logs/pipeline}
SECRET_FILE=${CLARITY_SECRET_FILE:-${HOME}/.config/tobyonfitnesstech/clarity.env}
BUILD_LOG_HELPER=${CLARITY_BUILD_LOG_HELPER:-$AGENTSTACK_DIR/workspace-scripts/utils/post_build_log.py}
if [[ ! -f "$BUILD_LOG_HELPER" && -f "$OPENCLAW_DIR/workspace/scripts/utils/post_build_log.py" ]]; then
  BUILD_LOG_HELPER="$OPENCLAW_DIR/workspace/scripts/utils/post_build_log.py"
fi
FAILURE_TARGET=${CLARITY_FAILURE_TARGET:-telegram:8319992332}
LOG_FILE="$LOG_DIR/clarity_daily_snapshot.cron.log"
LOCK_FILE="$REPORT_DIR/clarity.lock"
FAILURE_MARKER="$REPORT_DIR/failure-notified"

mkdir -p "$REPORT_DIR" "$LOG_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

notify_failure() {
  local exit_code=$?
  local line=${1:-unknown}
  trap - ERR
  local message="Website analytics: today's Clarity refresh could not complete. The last successful report is preserved. The next daily run will retry. Details are saved on DGX."
  local diagnostic="[WEBSITE AUTOMATION FAILURE] stage: clarity-daily exit: $exit_code line: $line log: $LOG_FILE"

  # One Telegram notice per incident. Only a successful collection resets it.
  if [[ -f "$FAILURE_MARKER" ]]; then
    printf '[%s] %s (incident already notified)\n' "$(date --iso-8601=seconds)" "$diagnostic" >&2
    exit "$exit_code"
  fi

  printf '[%s] %s\n' "$(date --iso-8601=seconds)" "$diagnostic" >&2
  if [[ -f "$BUILD_LOG_HELPER" ]]; then
    python3 "$BUILD_LOG_HELPER" --error "$diagnostic" || true
  fi
  if command -v hermes >/dev/null 2>&1; then
    if printf '%s\n' "$message" | hermes send --to "$FAILURE_TARGET" --file - --quiet; then
      touch "$FAILURE_MARKER"
    else
      printf '[%s] Clarity notification delivery failed; will retry next run.\n' "$(date --iso-8601=seconds)" >&2
    fi
  fi
  exit "$exit_code"
}
trap 'notify_failure "$LINENO"' ERR

if ! command -v flock >/dev/null 2>&1; then
  flock() {
    python3 -c "
import sys, fcntl, time

args = sys.argv[1:]
timeout = 0
non_blocking = False
fd = None

i = 0
while i < len(args):
    arg = args[i]
    if arg in ('-n', '--nonblock', '--nb'):
        non_blocking = True
        i += 1
    elif arg in ('-w', '--timeout'):
        timeout = float(args[i+1])
        i += 2
    elif arg.isdigit():
        fd = int(arg)
        i += 1
    else:
        i += 1

if fd is None:
    sys.exit(0)

flags = fcntl.LOCK_EX
if non_blocking:
    flags |= fcntl.LOCK_NB

start = time.time()
while True:
    try:
        fcntl.flock(fd, flags)
        sys.exit(0)
    except (BlockingIOError, OSError):
        if non_blocking:
            sys.exit(1)
        if timeout > 0 and (time.time() - start) >= timeout:
            sys.exit(1)
        time.sleep(0.5)
" "$@"
  }
fi

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(date --iso-8601=seconds)] Clarity collection already running; skipped duplicate."
  exit 0
fi

if [[ ! -r "$SECRET_FILE" ]]; then
  echo "Missing readable Clarity secret file: $SECRET_FILE" >&2
  false # Trigger the same concise failure handler as collection errors.
fi

set -a
source "$SECRET_FILE"
set +a
if [[ -z "${CLARITY_API_TOKEN:-}" ]]; then
  echo "CLARITY_API_TOKEN is missing from $SECRET_FILE" >&2
  false
fi

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

