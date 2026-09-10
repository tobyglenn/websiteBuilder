#!/usr/bin/env bash

set -Eeuo pipefail

OPENCLAW_DIR="${OPENCLAW_HOME:-${HOME}/.openclaw}"
WEBSITE_ROOT="${WEBSITE_ROOT:-$OPENCLAW_DIR/workspace/websiteBuilder}"

exec "$WEBSITE_ROOT/frontend/scripts/run-clarity-daily-snapshot.sh"
