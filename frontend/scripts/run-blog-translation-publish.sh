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
npm run translate:priority-pages:promote
npm run translate:priority-pages:validate

blog_remaining="$(node ./scripts/blog-translations.mjs status | jq -r '.remaining')"
priority_remaining="$(node ./scripts/priority-page-translations.mjs status | jq -r '.remaining')"
if (( blog_remaining > 0 || priority_remaining > 0 )); then
  echo "Translation publish deferred: blog_remaining=$blog_remaining priority_remaining=$priority_remaining"
  exit 0
fi

cd "$TRANSLATION_REPO_ROOT"
publish_paths=(frontend/src/generated/blog-translations)
priority_count=0
priority_sources=(
  agentstack.astro
  projects.astro
  wearables.astro
  speediance/gym-monster-1-vs-2-vs-2s.astro
  wearables/whoop-5-vs-4-vs-oura.astro
)

for locale in de es pt hi; do
  for source in "${priority_sources[@]}"; do
    path="frontend/src/pages/$locale/$source"
    if [[ -e "$path" ]]; then
      publish_paths+=("$path")
      ((priority_count += 1))
    fi
  done
done

if [[ -z "$(git status --short -- "${publish_paths[@]}")" ]]; then
  exit 0
fi

npm --prefix frontend run build
git add -- "${publish_paths[@]}"

if git diff --cached --quiet -- "${publish_paths[@]}"; then
  exit 0
fi

translated_count="$(find frontend/src/generated/blog-translations -type f -name '*.json' | wc -l | tr -d ' ')"
git commit -m "content: publish validated translations"
git pull --rebase --autostash origin main
git push origin HEAD:main
translation_notify_info "[BLOG TRANSLATIONS] published $translated_count blog and $priority_count priority-page translations; GitHub deployment started"
