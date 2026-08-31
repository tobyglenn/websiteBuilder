#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
HERMES_SCRIPT_DIR="${HERMES_SCRIPT_DIR:-$HOME/.hermes/scripts}"
DISPATCHER="$SCRIPT_DIR/hermes-website-job.sh"
CLARITY_DISPATCHER="$SCRIPT_DIR/hermes-clarity-job.sh"
SITE_HEALTH_DISPATCHER="$SCRIPT_DIR/monitor-site-health.sh"

mkdir -p "$HERMES_SCRIPT_DIR"

job_names=(
  ttoft-blog-draft
  ttoft-blog-review
  ttoft-blog-publish
  ttoft-gsc-weekly
  ttoft-clarity-daily
  ttoft-translation-worker
  ttoft-translation-publish
  ttoft-sitemap-submit
  ttoft-site-health
)
job_schedules=(
  '0 18 * * *'
  '15 18 * * *'
  '0 19 * * *'
  '30 6 * * 1'
  '45 5 * * *'
  '*/1 * * * *'
  '17 0,6,12 * * *'
  '47 0,6,12 * * *'
  '*/5 * * * *'
)

for index in "${!job_names[@]}"; do
  name="${job_names[$index]}"
  wrapper="$name.sh"
  source_script="$DISPATCHER"
  if [[ "$name" == "ttoft-clarity-daily" ]]; then
    source_script="$CLARITY_DISPATCHER"
  elif [[ "$name" == "ttoft-site-health" ]]; then
    source_script="$SITE_HEALTH_DISPATCHER"
  fi
  install -m 755 "$source_script" "$HERMES_SCRIPT_DIR/$wrapper"

  if hermes cron list 2>/dev/null | grep -Fq "$name"; then
    printf 'Exists: %s\n' "$name"
    continue
  fi

  hermes cron create "${job_schedules[$index]}" \
    --name "$name" \
    --script "$wrapper" \
    --no-agent \
    --deliver local

  if ! hermes cron list 2>/dev/null | grep -Fq "$name"; then
    printf 'Failed to verify Hermes job after creation: %s\n' "$name" >&2
    exit 1
  fi
done

hermes cron status
hermes cron list
