#!/usr/bin/env bash

set -Eeuo pipefail

WEBSITE_ROOT="${WEBSITE_ROOT:-/home/toby/.openclaw/workspace/websiteBuilder}"

exec "$WEBSITE_ROOT/frontend/scripts/run-clarity-daily-snapshot.sh"
