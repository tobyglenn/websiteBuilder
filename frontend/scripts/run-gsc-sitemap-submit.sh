#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/blog-translation-common.sh"

STAGE="gsc-sitemap-submit"

on_error() {
  local exit_code=$?
  translation_notify_failure "$STAGE" "$exit_code" "$1"
  exit "$exit_code"
}

trap 'on_error "$LINENO"' ERR

cd "$TRANSLATION_FRONTEND_ROOT"
npm run submit:gsc-sitemap
