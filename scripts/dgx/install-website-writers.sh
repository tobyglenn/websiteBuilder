#!/usr/bin/env bash
# Install reviewed website writer code only; never publishes or changes schedules.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${WEBSITE_RUNTIME_DIR:-$(cd "$ROOT/../../.." && pwd)/scripts}"
BACKUP="$DEST/.runtime-backups/website-writers-$(date -u +%Y%m%dT%H%M%SZ)"
bash -n "$ROOT/runtime/wrappers/refresh_website_homepage.sh"
python3 - "$ROOT/runtime/publish_podcast_website_update.py" <<'PYTHON'
import ast,sys
ast.parse(open(sys.argv[1]).read())
PYTHON
mkdir -p "$BACKUP/wrappers" "$DEST/wrappers"
for rel in publish_podcast_website_update.py wrappers/refresh_website_homepage.sh; do
  if [ -f "$DEST/$rel" ]; then cp -p "$DEST/$rel" "$BACKUP/$rel"; fi
  cp "$ROOT/runtime/$rel" "$DEST/$rel"
  cmp "$ROOT/runtime/$rel" "$DEST/$rel"
done
printf 'Website writer runtime installed. Rollback copies: %s\n' "$BACKUP"
