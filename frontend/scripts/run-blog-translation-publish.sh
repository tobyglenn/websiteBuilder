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

cd "$TRANSLATION_REPO_ROOT"

# Defensive: detect and recover from a stuck previous rebase before doing
# any work. A previous `git pull --rebase --autostash` can leave the repo
# in a state with `.git/rebase-merge/` present and conflict markers in
# tracked files; subsequent runs die at the `git push` step. We auto-abort
# any such leftover state here so this run starts clean.
if [[ -d .git/rebase-merge ]] || [[ -d .git/rebase-apply ]]; then
  echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') WARN: leftover rebase state detected — aborting to start clean"
  git rebase --abort || true
fi
if git status --short | grep -q '^UU\|^AA\|^DD\|^UA\|^AU'; then
  echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') WARN: unresolved merge conflicts present — resetting tracked conflicted files to HEAD"
  while IFS= read -r path; do
    [[ -n "$path" ]] && git checkout -- "$path" || true
  done < <(git status --short | awk '/^[UAD]{2}/ {sub(/^.../, "", $0); print}')
fi

cd "$TRANSLATION_FRONTEND_ROOT"
npm run translate:priority-pages:promote
npm run translate:priority-pages:validate

# Categorize any new YouTube videos before the build runs. The Astro
# content-collection schema requires `category` (and several other fields)
# on every videos.json entry — refresh_videos.py adds bare entries without
# it, and the GitHub Actions deploy.yml does this same step, so the local
# build path needs it too or every translation publish will crash on the
# first new Short that lands.
node ../scripts/generate_videos_data.mjs

priority_remaining="$(node ./scripts/priority-page-translations.mjs status | jq -r '.remaining')"
if (( priority_remaining > 0 )); then
  echo "Translation publish deferred: priority_remaining=$priority_remaining"
  exit 0
fi

cd "$TRANSLATION_REPO_ROOT"
# No blog path may be staged by this independent priority-page publisher.
publish_paths=()
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

git commit --only -m "content: publish validated priority-page translations" -- "${publish_paths[@]}"

# Use plain pull (merge) rather than --rebase so concurrent automation pushes
# to the same repo don't trap this script in an unresolvable rebase state.
# If a merge conflict does occur, fail loudly and notify — but don't leave
# `.git/rebase-merge/` behind for the next run to trip over.
if ! git pull --no-rebase --autostash origin main; then
  echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') ERROR: pull --no-rebase failed; leaving working tree as-is for human review"
  exit 1
fi

if ! git push origin HEAD:main; then
  echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') ERROR: push failed; leaving working tree as-is for human review"
  exit 1
fi

translation_notify_info "[PRIORITY PAGE TRANSLATIONS] published $priority_count priority-page translations; GitHub deployment started"
