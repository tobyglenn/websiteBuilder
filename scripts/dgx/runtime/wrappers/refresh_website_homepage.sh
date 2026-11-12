#!/bin/bash
# refresh_website_homepage.sh
# ============================
# Nightly/morning homepage refresh for tobyonfitnesstech.com
#
# 1. Locks main and reconciles only known generated-data outputs with the remote
# 2. Rebuilds aggregate data files (speediance + garmin) from latest sync outputs
# 3. Runs both homepage refresh scripts (hero video + fitness data)
# 4. Builds the Astro site locally
# 5. Commits and pushes the refreshed homepage data
# 6. Reports success or any errors to Telegram

set -uo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_DIR="$(cd "$SCRIPTS_DIR/.." && pwd)"
REPO="$WORKSPACE_DIR/websiteBuilder"
FRONTEND="$REPO/frontend"
CLAWD_DATA="$HOME/clawd/data"
TODAY=$(date +%Y-%m-%d)

VENV_PYTHON="$SCRIPTS_DIR/.venv/bin/python3"
if [ ! -f "$VENV_PYTHON" ]; then
    VENV_PYTHON="$(which python3)"
fi

# Load env for API keys used by the refresh steps. Homepage refresh notices are
# sent via Hermes Telegram by default so they land in the DGX Hermes/Toby DM,
# not the ARIA fitness bot conversation.
source ~/.openclaw/.env 2>/dev/null || true

HOMEPAGE_TELEGRAM_TARGET="${HOMEPAGE_TELEGRAM_TARGET:-telegram:8319992332}"
LOG_FILE="/tmp/homepage_refresh_${TODAY}.log"

# Quiet-hours + importance gate: silence routine homepage pings overnight and
# dedupe them daily. Real failures still surface (warn/critical levels).
TG_GATE="${TG_GATE:-/home/toby/.openclaw/workspace/scripts/utils/tg_gate.sh}"
# shellcheck source=/home/toby/.openclaw/workspace/scripts/utils/tg_gate.sh
source "$TG_GATE" 2>/dev/null || true

# Redirect all stdout+stderr to log file AND terminal from here on.
# Using exec with process substitution avoids the pipefail/tee issue.
exec > >(tee -a "$LOG_FILE") 2>&1

log() { echo "[$(date +%H:%M:%S)] $*"; }

tg_send() {
    # Routed through tg_gate.sh so routine homepage pings are silenced during
    # quiet hours (default 22:00–07:00 local) and deduped daily.
    local text="$1" level="${2:-info}"
    if declare -F tg_notify >/dev/null 2>&1; then
        local title
        title="$(printf '%s' "$text" | head -n1 | sed -E 's/<[^>]+>//g; s/[🔁✅❌⚠️ℹ️🚨🎬💪]//g; s/[[:space:]]+$//')"
        [ -z "$title" ] && title="Homepage refresh"
        tg_notify "$title" "$(printf '%s' "$text" | tail -n +2)" "$level" || true
    elif command -v hermes >/dev/null 2>&1; then
        printf '%s\n' "$text" | hermes send --to "$HOMEPAGE_TELEGRAM_TARGET" --file - --quiet \
            >/dev/null 2>&1 || true
    else
        log "⚠️  hermes CLI not found; homepage notification not sent"
    fi
}

die() {
    local msg="$1"
    log "❌ FATAL: $msg"
    tg_send "❌ <b>Homepage refresh FAILED — ${TODAY}</b>
${msg}
Log: /tmp/homepage_refresh_${TODAY}.log" "critical"
    exit 1
}

warn() {
    log "⚠️  WARNING: $1"
    WARNINGS="${WARNINGS}  • ${1}
"
}

# BEGIN WEBSITE_GIT_FUNCTIONS (also exercised by the local regression tests)
HOMEPAGE_PATHS=(
    frontend/src/data/videos.json
    frontend/src/data/homepageHeroVideo.json
    frontend/src/data/homepageFitnessData.json
    frontend/src/data/speediance_dashboard_data.json
    frontend/src/data/garmin_all_activities.json
    frontend/src/data/garmin_processed_activities.json
    frontend/src/data/whoop_v2_latest.json
    frontend/src/data/siteMetrics.json
    frontend/src/data/bodyCompositionData.json
)

website_preflight() {
    local common commit subject
    [ "$(git branch --show-current)" = main ] || return 1
    git diff --name-only --diff-filter=U | grep -q . && return 1
    common=$(git rev-parse --git-common-dir) || return 1
    # Shared with the podcast writer. All writers must hold this through push.
    exec {WEBSITE_WRITER_FD}>"$common/website-podcast-publish.lock" || return 1
    flock -x "$WEBSITE_WRITER_FD" || return 1
    git fetch origin main || return 1
    validate_homepage_commits || return 1
    # Upstream fitness producers legitimately prepare these files first.
    # Checkpoint only those known outputs; do not stash or consume other work.
    stage_homepage_outputs || return 1
    if ! git diff --cached --quiet; then
        commit_homepage_outputs "chore: pre-refresh checkpoint ${TODAY}" || return 1
    fi
    if ! git rebase origin/main; then
        git rebase --abort || return 1
        warn "Generated-data reconciliation conflicted; local checkpoint preserved"
        return 1
    fi
}

validate_homepage_commits() {
    local commit subject
    # Only this job's allowlisted generated-data commits may be reconciled.
    # An unrelated author change must never hitchhike on an automatic push.
    for commit in $(git rev-list origin/main..HEAD); do
        subject=$(git log -1 --format=%s "$commit") || return 1
        case "$subject" in
            "update: homepage refresh "*|"chore: pre-refresh checkpoint "*) ;;
            *) warn "Unrecognized local commit preserved: $commit"; return 1 ;;
        esac
        git rev-parse "$commit^2" >/dev/null 2>&1 && { warn "Local merge commit requires review"; return 1; }
        homepage_paths_only < <(git diff-tree --no-commit-id --name-only -r -z "$commit") || return 1
    done
}

homepage_paths_only() {
    local path allowed candidate
    while IFS= read -r -d '' path; do
        allowed=false
        for candidate in "${HOMEPAGE_PATHS[@]}"; do
            [ "$candidate" != "$path" ] || allowed=true
        done
        if [ "$allowed" != true ]; then
            warn "Unexpected changed path preserved: $path"
            return 1
        fi
    done
}

stage_homepage_outputs() {
    local path
    # Never consume a concurrently staged edit or another writer's output.
    homepage_paths_only < <(git diff --name-only -z HEAD; git ls-files --others --exclude-standard -z) || return 1
    for path in "${HOMEPAGE_PATHS[@]}"; do
        if [ -e "$path" ] || git ls-files --error-unmatch -- "$path" >/dev/null 2>&1; then
            git add -- "$path" || return 1
        fi
    done
}

commit_homepage_outputs() {
    local path
    local -a paths=()
    homepage_paths_only < <(git diff --name-only -z HEAD; git ls-files --others --exclude-standard -z) || return 1
    for path in "${HOMEPAGE_PATHS[@]}"; do
        if [ -e "$path" ] || git ls-files --error-unmatch -- "$path" >/dev/null 2>&1; then
            paths+=("$path")
        fi
    done
    [ "${#paths[@]}" -gt 0 ] || return 1
    git commit --only -m "$1" -- "${paths[@]}"
}

push_with_rebase_retry() {
    local attempt
    for attempt in 1 2 3; do
        if git push origin main; then
            return 0
        fi
        [ "$attempt" -lt 3 ] || break
        warn "Push failed; checking remote advancement before retrying"
        # Never stash user work or leave an interrupted rebase behind.
        [ -z "$(git status --porcelain)" ] || return 1
        git fetch origin main || return 1
        if ! git rebase origin/main; then
            git rebase --abort || return 1
            warn "Concurrent remote changes conflict; local refresh commit preserved"
            return 1
        fi
    done
    return 1
}
finish_homepage_publish() {
    stage_homepage_outputs || return 1
    if ! git diff --cached --quiet; then
        commit_homepage_outputs "update: homepage refresh ${TODAY}" || return 1
    fi
    # Preflight can have checkpointed data or recovered an earlier failed push.
    # Those commits still need publication even if this generation is unchanged.
    validate_homepage_commits || return 1
    local ahead
    ahead=$(git rev-list --count origin/main..HEAD) || return 1
    if [ "$ahead" -gt 0 ]; then
        push_with_rebase_retry || return 1
        CHANGED=true
    fi
}
# END WEBSITE_GIT_FUNCTIONS

WARNINGS=""
CHANGED=false
STARTED_FITNESS_HUB_PID=""

cleanup() {
    if [ -n "${STARTED_FITNESS_HUB_PID:-}" ]; then
        kill "$STARTED_FITNESS_HUB_PID" >/dev/null 2>&1 || true
    fi
}
trap cleanup EXIT

ensure_fitness_hub() {
    # Prefer a directly reachable local URL. The LAN alias at 192.168.1.249 can
    # redirect to a stale host/IP; Node fetch then fails with only "fetch failed".
    export FITNESS_HUB_BASE="${FITNESS_HUB_BASE:-http://127.0.0.1:8082/fitness}"

    if curl -fsS -m 5 "$FITNESS_HUB_BASE/strength/index.html" >/dev/null 2>&1; then
        log "Fitness hub reachable at $FITNESS_HUB_BASE"
        return 0
    fi

    if ! ss -ltn '( sport = :8082 )' 2>/dev/null | grep -q ':8082'; then
        log "Fitness hub not listening on :8082 — starting temporary local server"
        python3 /home/toby/clawd/local_fitness_root/serve_fitness.py >/tmp/local_fitness_hub_8082.log 2>&1 &
        STARTED_FITNESS_HUB_PID=$!
        for _ in {1..20}; do
            if curl -fsS -m 2 "$FITNESS_HUB_BASE/strength/index.html" >/dev/null 2>&1; then
                log "Fitness hub started at $FITNESS_HUB_BASE"
                return 0
            fi
            sleep 0.5
        done
    fi

    curl -sS -m 5 -i "$FITNESS_HUB_BASE" | head -20 || true
    return 1
}

# ── Step 1: Serialize writers and synchronize before generating data ─────────
log "=== Step 1: Pre-flight git check ==="
cd "$REPO" || die "websiteBuilder checkout missing at $REPO"
website_preflight || die "Homepage preflight failed; existing work preserved"

# ── Step 2: Rebuild aggregate data files ──────────────────────────────────────
log "=== Step 2: Rebuild garmin_all_activities.json ==="
cd "$SCRIPTS_DIR/sync"
"$VENV_PYTHON" build_garmin_all_activities.py \
    || warn "build_garmin_all_activities.py failed — using existing file"

log "=== Step 2b: Rebuild speediance_dashboard_data.json ==="
"$VENV_PYTHON" build_speediance_dashboard.py \
    || warn "build_speediance_dashboard.py failed — using existing file"

log "Copying data files to websiteBuilder..."
WEBSITE_DATA="$FRONTEND/src/data"
for f in garmin_all_activities.json speediance_dashboard_data.json garmin_processed_activities.json whoop_v2_latest.json; do
    if [ -f "$CLAWD_DATA/$f" ]; then
        cp "$CLAWD_DATA/$f" "$WEBSITE_DATA/$f"
        log "  Copied $f"
    else
        warn "Source not found: $CLAWD_DATA/$f"
    fi
done

# ── Step 3: Refresh videos.json from YouTube API ─────────────────────────────
log "=== Step 3: Refresh videos.json ==="
cd "$REPO/backend"
"$VENV_PYTHON" refresh_videos.py \
    || warn "refresh_videos.py failed — hero video fallback will use existing videos.json"

# ── Step 3b: Categorize new videos ────────────────────────────────────────────
# refresh_videos.py adds bare-bones entries (id/title/thumbnail/duration) for any
# new uploads it discovers. The Astro content-collection schema requires `category`
# (and several other fields) before `npm run build` will accept the file — without
# this step a YouTube refresh that adds new videos crashes the build, the wrapper
# never reaches the commit/push step, and tobyonfitnesstech.com keeps serving
# yesterday's homepageFitnessData.json. Categorize AFTER refresh, BEFORE build.
log "=== Step 3b: Categorize new videos ==="
cd "$REPO"
node scripts/generate_videos_data.mjs \
    || warn "generate_videos_data.mjs failed — build may fail on missing category field"

# ── Step 4: Refresh hero video from YouTube feed ──────────────────────────────
log "=== Step 4: Refresh homepage hero video ==="
cd "$FRONTEND"
node scripts/refresh-homepage-hero-video.mjs \
    || die "refresh-homepage-hero-video.mjs failed (YouTube feed unavailable?)"

# ── Step 5: Refresh homepage fitness data ─────────────────────────────────────
log "=== Step 5: Refresh homepage fitness data ==="
ensure_fitness_hub || die "fitness hub unavailable at ${FITNESS_HUB_BASE}"
FITNESS_OUTPUT=$(node scripts/refresh-homepage-fitness-data.mjs 2>&1)
FITNESS_CODE=$?
if [ $FITNESS_CODE -ne 0 ]; then
    echo "$FITNESS_OUTPUT"
    die "refresh-homepage-fitness-data.mjs failed (exit ${FITNESS_CODE}; see error above)"
fi
echo "$FITNESS_OUTPUT"

# ── Step 6: Astro build ────────────────────────────────────────────────────────
log "=== Step 6: Build ==="
npm run build || die "npm run build failed"

# ── Step 7: Commit and push ───────────────────────────────────────────────────
log "=== Step 7: Commit and push ==="
cd "$REPO"
finish_homepage_publish || die "Homepage commit/push failed; local work preserved"

# ── Step 8: Telegram report ───────────────────────────────────────────────────
log "=== Step 8: Notify ==="
HERO_TITLE=$(python3 -c "
import json, sys
try:
    v = json.load(open('$FRONTEND/src/data/homepageHeroVideo.json')).get('video', {})
    print(v.get('title','?')[:60])
except Exception as e:
    print('unknown')
" 2>/dev/null || echo "unknown")

if [ "$CHANGED" = true ]; then
    STATUS_LINE="✅ Homepage update submitted for deployment"
else
    STATUS_LINE="ℹ️ Homepage unchanged"
fi

MSG="${STATUS_LINE} — <b>Homepage Refresh ${TODAY}</b>"$'\n'
MSG+="🎬 Hero: ${HERO_TITLE}"$'\n'
if [ -n "$FITNESS_OUTPUT" ]; then
    MSG+="💪 ${FITNESS_OUTPUT}"$'\n'
fi
if [ -n "$WARNINGS" ]; then
    MSG+=$'\n'"⚠️ Warnings:"$'\n'"${WARNINGS}"
fi

tg_send "$MSG"
log "Done ✅"
