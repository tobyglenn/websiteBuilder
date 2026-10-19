#!/bin/bash
# Nightly fitness pipeline — single sequential orchestrator (system cron).
# See morning_pipeline.sh for the rationale; this is the nightly twin.
#
# Phase log files match pipeline_watchdog_check.py:
#   1 sync -> /tmp/phase1_nightly.log, 2 reports -> /tmp/phase2_nightly.log,
#   3 voice -> /tmp/phase3_nightly.log, 4 deploy -> /tmp/phase4_nightly.log,
#   5 notify -> /tmp/phase5_nightly.log

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_PY="$SCRIPTS_DIR/.venv/bin/python3"
TODAY=$(date +%Y-%m-%d)
FAILURE_COUNT=0
LOG_DIR="$HOME/.openclaw/logs/pipeline"
mkdir -p "$LOG_DIR"
MAIN_LOG="$LOG_DIR/nightly_${TODAY}.log"
LOCK_FILE="/tmp/nightly_pipeline.lock"

source ~/.openclaw/.env 2>/dev/null || true

# Quiet-hours + importance gate. Real pipeline failures always surface;
# routine info-level pings are silenced 22:00–07:00 local and deduped daily.
TG_GATE="${TG_GATE:-/home/toby/.openclaw/workspace/scripts/utils/tg_gate.sh}"
# shellcheck source=/home/toby/.openclaw/workspace/scripts/utils/tg_gate.sh
source "$TG_GATE" 2>/dev/null || true

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$MAIN_LOG"; }

telegram_alert() {
    # Routed through tg_gate.sh so pipeline failure alerts always reach you but
    # other info-level noise is silenced during quiet hours. Failures pass as
    # `warn` so they bypass quiet hours automatically.
    local text="$1" level="${2:-warn}"
    if declare -F tg_notify >/dev/null 2>&1; then
        local title
        title="$(printf '%s' "$text" | head -n1 | sed -E 's/<[^>]+>//g; s/[[:space:]]+$//')"
        [ -z "$title" ] && title="Nightly pipeline"
        tg_notify "$title" "$(printf '%s' "$text" | tail -n +2)" "$level" || true
        return 0
    fi
    local token="${TELEGRAM_BOT_TOKEN:-$(grep TELEGRAM_BOT_TOKEN ~/.openclaw/.env 2>/dev/null | cut -d= -f2 | tr -d '"')}"
    [ -z "$token" ] && { log "⚠️ No TELEGRAM_BOT_TOKEN — cannot alert"; return 1; }
    curl -s -X POST "https://api.telegram.org/bot${token}/sendMessage" \
        --data-urlencode "chat_id=8319992332" \
        --data-urlencode "text=$text" > /dev/null 2>&1
}

run_phase() {
    local phase_log="$1"; shift
    local label="$1"; shift
    log "▶ $label"
    if "$@" > "$phase_log.tmp" 2>&1; then
        mv "$phase_log.tmp" "$phase_log"
        cat "$phase_log" >> "$MAIN_LOG"
        log "✅ $label"
        return 0
    else
        local code=$?
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        mv "$phase_log.tmp" "$phase_log" 2>/dev/null
        cat "$phase_log" >> "$MAIN_LOG" 2>/dev/null
        log "❌ $label failed (exit $code)"
        return $code
    fi
}

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    log "Another nightly pipeline run is active — exiting."
    exit 0
fi

log "🌙 Nightly pipeline start — $TODAY"

if ! run_phase /tmp/phase1_nightly.log "Phase 1: data sync" \
        bash "$SCRIPT_DIR/sync_data.sh" --nightly; then
    telegram_alert "🚨 Nightly pipeline $TODAY: data sync FAILED. Reports/notifications withheld. See $MAIN_LOG" "critical"
    exit 1
fi

if ! run_phase /tmp/phase2_nightly.log "Phase 2: report generation" \
        bash "$SCRIPT_DIR/generate_reports.sh" --nightly; then
    telegram_alert "🚨 Nightly pipeline $TODAY: report generation FAILED. Nothing deployed or sent. See $MAIN_LOG" "critical"
    exit 1
fi

if ! run_phase /tmp/phase5_nightly.log "Phase 5: notifications (email + Telegram)" \
        bash "$SCRIPT_DIR/send_notifications.sh" --nightly; then
    telegram_alert "🚨 Nightly pipeline $TODAY: notification send FAILED. See $MAIN_LOG" "critical"
fi

if ! run_phase /tmp/phase3_nightly.log "Phase 3: voice summary" \
        bash "$SCRIPT_DIR/send_triple_voice.sh" --nightly; then
    telegram_alert "⚠️ Nightly pipeline $TODAY: voice summary failed. See $MAIN_LOG" "warn"
fi

if ! run_phase /tmp/phase4_nightly.log "Phase 4: deploy GitHub Pages" \
        bash "$SCRIPT_DIR/deploy_github.sh"; then
    telegram_alert "⚠️ Nightly pipeline $TODAY: deploy failed (report generated locally). See $MAIN_LOG" "warn"
fi
bash "$SCRIPT_DIR/refresh_website_homepage.sh" >> "$MAIN_LOG" 2>&1 \
    || { FAILURE_COUNT=$((FAILURE_COUNT + 1)); log "⚠️ Homepage refresh failed"; }

log "▶ Watchdog verification"
"$VENV_PY" "$SCRIPTS_DIR/utils/pipeline_watchdog_check.py" --pipeline nightly >> "$MAIN_LOG" 2>&1 \
    || { FAILURE_COUNT=$((FAILURE_COUNT + 1)); log "⚠️ Watchdog reported failures (see alert/log)"; }

if [ "$FAILURE_COUNT" -gt 0 ]; then
    log "❌ Nightly pipeline incomplete — $TODAY ($FAILURE_COUNT failed checks)"
    exit 1
fi
date -Iseconds > "/tmp/nightly_pipeline_done_${TODAY}"
log "🏁 Nightly pipeline complete — $TODAY"
exit 0
