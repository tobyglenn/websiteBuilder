#!/usr/bin/env bash
set -euo pipefail

export TZ="America/New_York"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$WORKSPACE_DIR/scripts/logs"
PYTHON="$WORKSPACE_DIR/scripts/.venv/bin/python3"
SYNC_TIMEOUT_SECONDS="${ARIA_SYNC_TIMEOUT_SECONDS:-300}"
CREATE_TIMEOUT_SECONDS="${ARIA_CREATE_TIMEOUT_SECONDS:-300}"
mkdir -p "$LOG_DIR"

if ! "$PYTHON" "$WORKSPACE_DIR/scripts/utils/fitness_preferences.py"; then
  echo "Automatic workouts disabled: self-directed training."
  exit 0
fi

DATE_STR="${1:-$(date +%F)}"
REPORT_CONTEXT="${2:-post_bjj}"
LOG_FILE="$LOG_DIR/adaptive_training_workout_${DATE_STR}_$(date +%H%M%S).log"

{
  echo "=== Adaptive Speediance workout start: $(date) ==="
  echo "date=$DATE_STR context=$REPORT_CONTEXT host=$(hostname)"
  source "$HOME/.openclaw/.env" 2>/dev/null || true
  cd "$WORKSPACE_DIR"
  if [ "$REPORT_CONTEXT" = "post_bjj" ]; then
    echo "Running pre-adaptive data sync so post-BJJ plan uses current tracker data..."
    if timeout --signal=TERM --kill-after=15s "$SYNC_TIMEOUT_SECONDS" \
      bash "$WORKSPACE_DIR/scripts/wrappers/sync_data.sh" --morning; then
      :
    else
      code=$?
      echo "Pre-adaptive data sync failed or exceeded ${SYNC_TIMEOUT_SECONDS}s (exit $code)."
      exit "$code"
    fi
    GATE_FILE="$HOME/clawd/data/pipeline_gate/morning_${DATE_STR}.gate"
    WHOOP_STATUS="$("$PYTHON" - "$GATE_FILE" <<'PY'
import json, sys
try:
    with open(sys.argv[1]) as f:
        print(json.load(f).get("whoop", "missing"))
except Exception:
    print("missing")
PY
)"
    if [ "$WHOOP_STATUS" = "sync_failed" ] || [ "$WHOOP_STATUS" = "missing" ]; then
      echo "WHOOP sync status is $WHOOP_STATUS — halting adaptive workout creation."
      exit 1
    fi
  fi
  timeout --signal=TERM --kill-after=15s "$CREATE_TIMEOUT_SECONDS" \
    "$PYTHON" "$WORKSPACE_DIR/scripts/utils/create_adaptive_speediance_workout.py" \
    "$DATE_STR" --context "$REPORT_CONTEXT"
  echo "=== Adaptive Speediance workout complete: $(date) ==="
} >> "$LOG_FILE" 2>&1
