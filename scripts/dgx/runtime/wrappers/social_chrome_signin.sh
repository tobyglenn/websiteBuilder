#!/usr/bin/env bash
# Open the exact collector profile interactively for the owner's sign-in.
set -euo pipefail
if [[ -z "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]]; then
  echo 'Open this launcher from the DGX desktop session to sign in.' >&2
  exit 1
fi
systemctl --user stop social-rollup-chrome.service
exec /usr/bin/google-chrome --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir="$HOME/.openclaw/browser-profiles/social-rollup" --no-first-run https://www.instagram.com/ https://www.facebook.com/ https://www.linkedin.com/
