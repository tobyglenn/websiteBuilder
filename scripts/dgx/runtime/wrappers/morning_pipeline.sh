#!/bin/bash
# Morning fitness pipeline — single sequential orchestrator (system cron).
#
# Replaces the staggered Hermes cron jobs (2026-06-12). Those ran each phase at
# a fixed wall-clock time with a 120s kill, so phases raced each other and
# notifications went out before WHOOP recovery existed. Here every phase runs
# only after the previous one actually finished, and nothing is emailed or
# voiced until today's WHOOP recovery is present.
#
# Phases (log files match what pipeline_watchdog_check.py expects):
#   1 sync     -> /tmp/phase1_morning.log
#   2 reports  -> /tmp/phase2_morning.log
#   4 deploy   -> /tmp/phase4_morning.log
#   5 notify   -> /tmp/phase5_morning.log
#   3 voice    -> /tmp/phase3_morning.log
#   watchdog (artifact verification + Telegram alert on failure)

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_PY="$SCRIPTS_DIR/.venv/bin/python3"
TODAY=$(date +%Y-%m-%d)
FAILURE_COUNT=0
LOG_DIR="$HOME/.openclaw/logs/pipeline"
mkdir -p "$LOG_DIR"
MAIN_LOG="$LOG_DIR/morning_${TODAY}.log"
LOCK_FILE="/tmp/morning_pipeline.lock"

# WHOOP recovery wait window
RECOVERY_DEADLINE="09:15"
RECOVERY_POLL_SECONDS=300

source ~/.openclaw/.env 2>/dev/null || true

# Quiet-hours + importance gate. Real pipeline failures always surface;
# routine info-level pings are silenced 22:00–07:00 local and deduped daily.
TG_GATE="${TG_GATE:-/home/toby/.openclaw/workspace/scripts/utils/tg_gate.sh}"
# shellcheck source=/home/toby/.openclaw/workspace/scripts/utils/tg_gate.sh
source "$TG_GATE" 2>/dev/null || true

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$MAIN_LOG"; }

is_bjj_day() {
    local dow
    dow="$(date -d "$TODAY" +%u)"  # 1=Mon ... 7=Sun
    [ "$dow" = "1" ] || [ "$dow" = "3" ] || [ "$dow" = "5" ]
}

morning_adaptive_already_created() {
    [ -f "$HOME/clawd/data/training_plans/${TODAY}_morning_speediance_create.json" ]
}

telegram_alert() {
    # Routed through tg_gate.sh so pipeline failure alerts always reach you but
    # other info-level noise is silenced during quiet hours. Failures pass as
    # `warn` so they bypass quiet hours automatically.
    local text="$1" level="${2:-warn}"
    if declare -F tg_notify >/dev/null 2>&1; then
        local title
        title="$(printf '%s' "$text" | head -n1 | sed -E 's/<[^>]+>//g; s/[[:space:]]+$//')"
        [ -z "$title" ] && title="Morning pipeline"
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
    # run_phase <phase_log> <label> <command...>
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

# ── single-instance lock ─────────────────────────────────────────────────────
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    log "Another morning pipeline run is active — exiting."
    exit 0
fi

log "🚀 Morning pipeline start — $TODAY"

# ── Phase 1: sync ────────────────────────────────────────────────────────────
if ! run_phase /tmp/phase1_morning.log "Phase 1: data sync" \
        bash "$SCRIPT_DIR/sync_data.sh" --morning; then
    telegram_alert "🚨 Morning pipeline $TODAY: data sync FAILED. Reports/notifications withheld. See $MAIN_LOG" "critical"
    exit 1
fi

# ── Phase 1b: wait for same-day WHOOP recovery ──────────────────────────────
RECOVERY_OK=0
log "▶ Phase 1b: waiting for same-day WHOOP recovery (deadline $RECOVERY_DEADLINE)"
if "$VENV_PY" "$SCRIPTS_DIR/utils/wait_for_whoop_recovery.py" "$TODAY" \
        --deadline "$RECOVERY_DEADLINE" --interval "$RECOVERY_POLL_SECONDS" \
        >> /tmp/phase1_morning.log 2>&1; then
    RECOVERY_OK=1
    log "✅ Same-day WHOOP recovery present"
else
    log "⚠️ No same-day WHOOP recovery by $RECOVERY_DEADLINE — degraded mode (report only, no email/voice)"
    telegram_alert "⚠️ Morning pipeline $TODAY: no same-day WHOOP recovery by $RECOVERY_DEADLINE. Web report will be generated, but email/voice/adaptive workout are withheld so no wrong numbers go out. Check WHOOP sync/auth or whether the strap was worn." "warn"
fi

# ── Phase 2: reports ─────────────────────────────────────────────────────────
if [ "$RECOVERY_OK" = "1" ]; then
    export REQUIRE_SAME_DAY_RECOVERY=1
fi
if ! run_phase /tmp/phase2_morning.log "Phase 2: report generation" \
        bash "$SCRIPT_DIR/generate_reports.sh" --morning; then
    telegram_alert "🚨 Morning pipeline $TODAY: report generation FAILED. Nothing deployed or sent. See $MAIN_LOG" "critical"
    exit 1
fi

# ── Phase 4: deploy + homepage ───────────────────────────────────────────────
if ! run_phase /tmp/phase4_morning.log "Phase 4: deploy GitHub Pages" \
        bash "$SCRIPT_DIR/deploy_github.sh"; then
    telegram_alert "⚠️ Morning pipeline $TODAY: deploy failed (report generated locally). See $MAIN_LOG" "warn"
fi
bash "$SCRIPT_DIR/refresh_website_homepage.sh" >> "$MAIN_LOG" 2>&1 \
    || { FAILURE_COUNT=$((FAILURE_COUNT + 1)); log "⚠️ Homepage refresh failed"; }

# ── Phase 5 + 3: notifications and voice — only with same-day recovery ──────
if [ "$RECOVERY_OK" = "1" ]; then
    if ! run_phase /tmp/phase5_morning.log "Phase 5: notifications (email + Telegram)" \
            bash "$SCRIPT_DIR/send_notifications.sh" --morning; then
        telegram_alert "🚨 Morning pipeline $TODAY: notification send FAILED. See $MAIN_LOG" "critical"
    fi

    # Non-BJJ-day adaptive workouts should arrive with the morning report.
    # BJJ days keep the separate post-BJJ refresh after class.
    if is_bjj_day; then
        log "⏭ Skipped non-BJJ adaptive workout — BJJ day uses post-BJJ job"
    elif morning_adaptive_already_created; then
        log "✅ Non-BJJ adaptive workout already created for $TODAY; skipping duplicate"
    elif ! run_phase /tmp/phase2b_morning_adaptive.log "Phase 2b: non-BJJ adaptive Speediance workout" \
            bash "$SCRIPT_DIR/run_adaptive_training_report.sh" "$TODAY" morning; then
        telegram_alert "🚨 Morning pipeline $TODAY: adaptive Speediance workout creation FAILED. Morning report was sent; see $MAIN_LOG" "critical"
    fi

    if ! run_phase /tmp/phase3_morning.log "Phase 3: voice summary" \
            bash "$SCRIPT_DIR/send_triple_voice.sh" --morning; then
        telegram_alert "⚠️ Morning pipeline $TODAY: voice summary failed. See $MAIN_LOG" "warn"
    fi
else
    echo "⏭ Skipped — no same-day WHOOP recovery (degraded mode)" > /tmp/phase5_morning.log
    echo "⏭ Skipped — no same-day WHOOP recovery (degraded mode)" > /tmp/phase3_morning.log
fi

# ── Watchdog: verify artifacts, alert on anything wrong ─────────────────────
log "▶ Watchdog verification"
"$VENV_PY" "$SCRIPTS_DIR/utils/pipeline_watchdog_check.py" --pipeline morning >> "$MAIN_LOG" 2>&1 \
    || { FAILURE_COUNT=$((FAILURE_COUNT + 1)); log "⚠️ Watchdog reported failures (see alert/log)"; }

if [ "$FAILURE_COUNT" -gt 0 ]; then
    log "❌ Morning pipeline incomplete — $TODAY ($FAILURE_COUNT failed checks)"
    exit 1
fi
date -Iseconds > "/tmp/morning_pipeline_done_${TODAY}"
log "🏁 Morning pipeline complete — $TODAY"
exit 0
