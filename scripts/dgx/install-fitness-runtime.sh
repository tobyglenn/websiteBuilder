#!/usr/bin/env bash
# Install the versioned runtime used by the existing Hermes fitness schedules.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${FITNESS_SCRIPTS_DIR:-/home/toby/.openclaw/workspace/scripts}"
PY="$DEST/.venv/bin/python3"
"$PY" -m pip install -r "$ROOT/requirements-fitness.txt"
BACKUP="$DEST/.runtime-backups/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP/wrappers" "$BACKUP/utils"
for rel in wrappers/morning_pipeline.sh wrappers/nightly_pipeline.sh wrappers/refresh_website_homepage.sh utils/pipeline_watchdog_check.py wrappers/run_social_web_capture.sh wrappers/ensure_social_chrome.sh wrappers/social_chrome_signin.sh; do
  if [[ "$rel" == *.sh ]]; then bash -n "$ROOT/runtime/$rel"; fi
  if [[ -f "$DEST/$rel" ]]; then cp -p "$DEST/$rel" "$BACKUP/$rel"; fi
  cp "$ROOT/runtime/$rel" "$DEST/$rel"
done
mkdir -p "$HOME/.config/systemd/user"
cp "$ROOT/runtime/systemd/social-rollup-chrome.service" "$HOME/.config/systemd/user/"
systemctl --user daemon-reload
"$PY" -m py_compile "$DEST/utils/pipeline_watchdog_check.py"
printf 'Fitness runtime installed; rollback copies: %s\n' "$BACKUP"
