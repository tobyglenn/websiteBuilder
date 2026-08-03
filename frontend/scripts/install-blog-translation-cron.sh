#!/usr/bin/env bash

set -Eeuo pipefail

MARKER_BEGIN="# BEGIN TTOFT BLOG TRANSLATIONS"
MARKER_END="# END TTOFT BLOG TRANSLATIONS"
WORKER="/home/toby/.openclaw/workspace/websiteBuilder/frontend/scripts/run-blog-translation-worker.sh"
PUBLISHER="/home/toby/.openclaw/workspace/websiteBuilder/frontend/scripts/run-blog-translation-publish.sh"
LOG_ROOT="/home/toby/.openclaw/logs/analytics/blog-translations"
temporary_file="$(mktemp)"
trap 'rm -f "$temporary_file"' EXIT

mkdir -p "$LOG_ROOT"
{
  crontab -l 2>/dev/null | awk -v begin="$MARKER_BEGIN" -v end="$MARKER_END" '
    $0 == begin { skipping = 1; next }
    $0 == end { skipping = 0; next }
    !skipping { print }
  '
  printf '%s\n' "$MARKER_BEGIN"
  printf '*/1 * * * * %s >> %s/worker.cron.log 2>&1\n' "$WORKER" "$LOG_ROOT"
  printf '17 0,6,12 * * * %s >> %s/publisher.cron.log 2>&1\n' "$PUBLISHER" "$LOG_ROOT"
  printf '%s\n' "$MARKER_END"
} > "$temporary_file"

crontab "$temporary_file"
crontab -l | sed -n "/^$MARKER_BEGIN$/,/^$MARKER_END$/p"
