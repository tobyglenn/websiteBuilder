#!/bin/bash
# run_social_web_capture.sh - Refresh signed-in Instagram/Facebook cache files
# through Toby's authenticated Google Chrome profile.

set -u

WORKSPACE="${OPENCLAW_WORKSPACE:-$HOME/.openclaw/workspace}"
LOG="${SOCIAL_WEB_CAPTURE_LOG:-/tmp/social_web_capture.log}"
if [ -x "$WORKSPACE/scripts/.venv/bin/python3" ]; then
  PY="${SOCIAL_WEB_CAPTURE_PYTHON:-$WORKSPACE/scripts/.venv/bin/python3}"
else
  PY="${SOCIAL_WEB_CAPTURE_PYTHON:-/usr/bin/python3}"
fi
LOCK_HELPER="$WORKSPACE/scripts/utils/chrome_automation_lock.sh"

echo "[$(date)] Starting social web capture..." >> "$LOG"

if [ "${SOCIAL_WEB_SKIP:-0}" = "1" ]; then
  echo "[$(date)] SOCIAL_WEB_SKIP=1, skipping." >> "$LOG"
  exit 0
fi

if [ ! -x "$PY" ]; then
  echo "[$(date)] Social capture Python missing: $PY" >> "$LOG"
  exit 2
fi

if [ ! -r "$LOCK_HELPER" ]; then
  echo "[$(date)] Chrome automation lock helper missing: $LOCK_HELPER" >> "$LOG"
  exit 2
fi
. "$LOCK_HELPER"

cleanup() {
  chrome_automation_lock_release
}
trap cleanup EXIT

if ! chrome_automation_lock_acquire \
  "Podcast social web capture" \
  "${SOCIAL_WEB_CHROME_LOCK_WAIT_SECONDS:-900}" >> "$LOG" 2>&1; then
  echo "[$(date)] Social web capture could not acquire shared Chrome lock." >> "$LOG"
  exit 3
fi

cd "$WORKSPACE" || exit 2
if [ "$(uname -s)" = "Linux" ]; then
  if ! bash "$WORKSPACE/scripts/wrappers/ensure_social_chrome.sh" >> "$LOG" 2>&1; then
    echo "[$(date)] DGX Chrome unavailable; existing social caches preserved." >> "$LOG"
    exit 1
  fi
  CAPTURE_ARGS=(
    scripts/capture_social_playwright.py
    --cdp-url "${CHROME_CDP_URL:-http://localhost:9222}"
    --platforms "${SOCIAL_WEB_PLATFORMS:-instagram,facebook,linkedin}"
  )
else
  CAPTURE_ARGS=(
    scripts/capture_social_web_stats.py
    --platforms "${SOCIAL_WEB_PLATFORMS:-instagram,facebook,linkedin}"
    --manager-email "${SOCIAL_WEB_CHROME_MANAGER_EMAIL:-tobypeters@gmail.com}"
    --login-wait-seconds "${SOCIAL_WEB_LOGIN_WAIT_SECONDS:-0}"
  )
  if [ -n "${SOCIAL_WEB_CHROME_PROFILE_DIRECTORY:-}" ]; then
    CAPTURE_ARGS+=(--profile-directory "$SOCIAL_WEB_CHROME_PROFILE_DIRECTORY")
  fi
  if [ -n "${SOCIAL_WEB_CHROME_APP:-}" ]; then
    CAPTURE_ARGS+=(--chrome-app "$SOCIAL_WEB_CHROME_APP")
  fi
fi

CAPTURE_ATTEMPTS="${SOCIAL_WEB_CAPTURE_ATTEMPTS:-2}"
case "$CAPTURE_ATTEMPTS" in
  ''|*[!0-9]*|0)
    echo "[$(date)] Invalid SOCIAL_WEB_CAPTURE_ATTEMPTS: $CAPTURE_ATTEMPTS" >> "$LOG"
    exit 2
    ;;
esac

ATTEMPT=1
while true; do
  "$PY" "${CAPTURE_ARGS[@]}" >> "$LOG" 2>&1
  EXIT_CODE=$?
  if [ "$EXIT_CODE" -eq 0 ] || [ "$EXIT_CODE" -ne 1 ] || [ "$ATTEMPT" -ge "$CAPTURE_ATTEMPTS" ]; then
    break
  fi
  echo "[$(date)] Social web capture returned a transient platform failure; retrying attempt $((ATTEMPT + 1))/$CAPTURE_ATTEMPTS under the same Chrome lock." >> "$LOG"
  ATTEMPT=$((ATTEMPT + 1))
  sleep 2
done

echo "[$(date)] Finished social web capture exit=$EXIT_CODE" >> "$LOG"
exit $EXIT_CODE
