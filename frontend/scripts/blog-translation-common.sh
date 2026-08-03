#!/usr/bin/env bash

set -Eeuo pipefail

TRANSLATION_REPO_ROOT="${BLOG_TRANSLATION_REPO_ROOT:-/home/toby/.openclaw/workspace/websiteBuilder}"
TRANSLATION_FRONTEND_ROOT="$TRANSLATION_REPO_ROOT/frontend"
TRANSLATION_STATE_ROOT="${BLOG_TRANSLATION_STATE_DIR:-/home/toby/.openclaw/state/website-blog-translations}"
TRANSLATION_LOG_ROOT="${BLOG_TRANSLATION_LOG_DIR:-/home/toby/.openclaw/logs/analytics/blog-translations}"
TRANSLATION_LOCK="${BLOG_TRANSLATION_LOCK:-$TRANSLATION_STATE_ROOT/translation.lock}"
TRANSLATION_BUILD_LOG_HELPER="${BLOG_TRANSLATION_BUILD_LOG_HELPER:-/home/toby/.openclaw/workspace/scripts/utils/post_build_log.py}"
TRANSLATION_FAILURE_TARGET="${BLOG_TRANSLATION_FAILURE_TARGET:-telegram:8319992332}"
TRANSLATION_FAILURE_COOLDOWN_MINUTES="${BLOG_TRANSLATION_FAILURE_COOLDOWN_MINUTES:-60}"

mkdir -p "$TRANSLATION_STATE_ROOT" "$TRANSLATION_LOG_ROOT"

translation_notify_failure() {
  local stage="$1"
  local exit_code="$2"
  local line="$3"
  local cooldown_file="$TRANSLATION_STATE_ROOT/${stage}.failure-notified"
  local message="[BLOG TRANSLATION FAILURE] stage: $stage exit: $exit_code line: $line log: $TRANSLATION_LOG_ROOT"

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
