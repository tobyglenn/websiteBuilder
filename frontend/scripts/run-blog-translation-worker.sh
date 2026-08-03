#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/blog-translation-common.sh"

STAGE="worker"
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
npm run translate:blog:one
