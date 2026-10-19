#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${BLOG_SCRIPTS_DIR:-/home/toby/.openclaw/workspace/scripts}"
HERMES_SCRIPTS="${BLOG_HERMES_SCRIPTS_DIR:-$HOME/.hermes/scripts}"
BACKUP="$DEST/.daily-blog-backups/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP" "$DEST" "$HERMES_SCRIPTS"
for name in blog_pipeline.py blog_quality.py blog_sources.py blog_models.py blog_sections.py blog_source_identity.py blog_editorial_policy.py blog_prepare_stage.sh; do
  if [[ -f "$DEST/$name" ]]; then cp -p "$DEST/$name" "$BACKUP/$name"; fi
  cp "$ROOT/$name" "$DEST/$name"
done
if [[ -f "$HERMES_SCRIPTS/ttoft-blog-prepare.sh" ]]; then cp -p "$HERMES_SCRIPTS/ttoft-blog-prepare.sh" "$BACKUP/ttoft-blog-prepare.sh"; fi
cp "$ROOT/blog_prepare_stage.sh" "$HERMES_SCRIPTS/ttoft-blog-prepare.sh"
chmod +x "$DEST/blog_prepare_stage.sh" "$HERMES_SCRIPTS/ttoft-blog-prepare.sh"
bash -n "$DEST/blog_prepare_stage.sh"
python3 -m py_compile "$DEST/blog_pipeline.py" "$DEST/blog_quality.py" "$DEST/blog_sources.py"
printf 'Daily blog runtime installed; rollback copies: %s\n' "$BACKUP"
