#!/usr/bin/env bash

set -Eeuo pipefail

OPENCLAW_DIR="${OPENCLAW_HOME:-${HOME}/.openclaw}"
AGENTSTACK_DIR="${AGENTSTACK_HOME:-${HOME}/.agentstack-daily}"
DEFAULT_REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
TRANSLATION_REPO_ROOT="${BLOG_TRANSLATION_REPO_ROOT:-$DEFAULT_REPO_ROOT}"
TRANSLATION_FRONTEND_ROOT="$TRANSLATION_REPO_ROOT/frontend"
TRANSLATION_STATE_ROOT="${BLOG_TRANSLATION_STATE_DIR:-$OPENCLAW_DIR/state/website-blog-translations}"
TRANSLATION_LOG_ROOT="${BLOG_TRANSLATION_LOG_DIR:-$OPENCLAW_DIR/logs/analytics/blog-translations}"
TRANSLATION_LOCK="${BLOG_TRANSLATION_LOCK:-$TRANSLATION_STATE_ROOT/translation.lock}"
TRANSLATION_BUILD_LOG_HELPER="${BLOG_TRANSLATION_BUILD_LOG_HELPER:-$AGENTSTACK_DIR/workspace-scripts/utils/post_build_log.py}"
if [[ ! -f "$TRANSLATION_BUILD_LOG_HELPER" && -f "$OPENCLAW_DIR/workspace/scripts/utils/post_build_log.py" ]]; then
  TRANSLATION_BUILD_LOG_HELPER="$OPENCLAW_DIR/workspace/scripts/utils/post_build_log.py"
fi
TRANSLATION_FAILURE_TARGET="${BLOG_TRANSLATION_FAILURE_TARGET:-telegram:8319992332}"
TRANSLATION_FAILURE_COOLDOWN_MINUTES="${BLOG_TRANSLATION_FAILURE_COOLDOWN_MINUTES:-60}"

mkdir -p "$TRANSLATION_STATE_ROOT" "$TRANSLATION_LOG_ROOT"

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

translation_notify_failure() {
  local stage="$1"
  local exit_code="$2"
  local line="$3"
  local cooldown_file="$TRANSLATION_STATE_ROOT/${stage}.failure-notified"
  local stage_log="$TRANSLATION_LOG_ROOT/${stage}.log"
  local failure_context=""
  if [[ "$stage" == "worker" && -f "$TRANSLATION_STATE_ROOT/failures.json" ]]; then
    failure_context="$(jq -r '
      to_entries
      | sort_by(.value.lastFailedAt // "")
      | last
      | if . then "task: \(.key) error: \(.value.error)" else "" end
    ' "$TRANSLATION_STATE_ROOT/failures.json" 2>/dev/null || true)"
  fi
  local message="[WEBSITE AUTOMATION FAILURE]
stage: $stage
exit: $exit_code
line: $line
${failure_context:+$failure_context$'\n'}log: $stage_log
status: $TRANSLATION_LOG_ROOT/latest.json"

  if [[ -f "$cooldown_file" ]] && find "$cooldown_file" -mmin "-$TRANSLATION_FAILURE_COOLDOWN_MINUTES" -print -quit | grep -q .; then
    printf '%s %s\n' "$(date -Is)" "$message (notification cooldown active)" >&2
    return 0
  fi
  touch "$cooldown_file"

  if [[ -f "$TRANSLATION_BUILD_LOG_HELPER" ]]; then
    python3 "$TRANSLATION_BUILD_LOG_HELPER" --error "$message" || true
  else
    printf '%s build-log helper missing: %s\n' "$(date -Is)" "$TRANSLATION_BUILD_LOG_HELPER" >&2
  fi

  if command -v hermes >/dev/null 2>&1; then
    printf '%s\n' "$message" | hermes send --to "$TRANSLATION_FAILURE_TARGET" --file - --quiet || true
  else
    printf '%s Hermes command unavailable\n' "$(date -Is)" >&2
  fi
}

translation_notify_info() {
  local message="$1"
  if [[ -f "$TRANSLATION_BUILD_LOG_HELPER" ]]; then
    python3 "$TRANSLATION_BUILD_LOG_HELPER" --info "$message" || true
  fi
}
