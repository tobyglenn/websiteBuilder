#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/blog-translation-common.sh"

STAGE="worker"
exec > >(tee -a "$TRANSLATION_LOG_ROOT/${STAGE}.log") 2>&1

on_error() {
  local exit_code=$?
  translation_notify_failure "$STAGE" "$exit_code" "$1"
  exit "$exit_code"
}
trap 'on_error "$LINENO"' ERR

exec 9>"$TRANSLATION_LOCK"
if ! flock -n 9; then
  exit 0
fi

cd "$TRANSLATION_FRONTEND_ROOT"
blog_remaining="$(node ./scripts/blog-translations.mjs status | jq -r '.remaining')"
priority_remaining="$(node ./scripts/priority-page-translations.mjs status | jq -r '.remaining')"

if (( priority_remaining > 0 )); then
  translation_command=(npm run translate:priority-pages:one)
elif (( blog_remaining > 0 )); then
  translation_command=(npm run translate:blog:one)
else
  exit 0
fi

set +e
"${translation_command[@]}"
translation_exit=$?
set -e

if (( translation_exit == 75 )); then
  printf '%s worker: translation quality retry deferred without outage alert\n' "$(date -Is)"
  exit 0
fi
if (( translation_exit != 0 )); then
  failure_line="$LINENO"
  translation_notify_failure "$STAGE" "$translation_exit" "$failure_line"
  exit "$translation_exit"
fi
