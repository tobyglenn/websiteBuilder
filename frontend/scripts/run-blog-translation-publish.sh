#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/blog-translation-common.sh"

STAGE="publisher"
on_error() {
  local exit_code=$?
  translation_notify_failure "$STAGE" "$exit_code" "$1"
  exit "$exit_code"
}
trap 'on_error "$LINENO"' ERR

exec 9>"$TRANSLATION_LOCK"
flock -w 1200 9

cd "$TRANSLATION_FRONTEND_ROOT"
npm run translate:blog:promote
npm run translate:blog:validate

cd "$TRANSLATION_REPO_ROOT"
if [[ -z "$(git status --short -- frontend/src/generated/blog-translations)" ]]; then
  exit 0
fi

npm --prefix frontend run build
git add -- frontend/src/generated/blog-translations

if git diff --cached --quiet -- frontend/src/generated/blog-translations; then
  exit 0
fi

translated_count="$(find frontend/src/generated/blog-translations -type f -name '*.json' | wc -l | tr -d ' ')"
git commit -m "content: publish validated blog translations"
git pull --rebase --autostash origin main
git push origin HEAD:main
translation_notify_info "[BLOG TRANSLATIONS] published $translated_count validated translations; GitHub deployment started"
