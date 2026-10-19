#!/usr/bin/env bash
# Start the existing DGX browser profile only when the collector needs it.
set -euo pipefail
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=$XDG_RUNTIME_DIR/bus}"
URL="${CHROME_CDP_URL:-http://127.0.0.1:9222}"
ready() { curl --silent --fail --max-time 2 "$URL/json/version" >/dev/null; }
if ready; then exit 0; fi
case "$URL" in
  http://localhost:9222|http://127.0.0.1:9222) ;;
  *) echo "Configured browser endpoint unavailable: $URL" >&2; exit 1 ;;
esac
if [[ ! -d "$HOME/.openclaw/browser-profiles/social-rollup/Default" ]]; then
  echo "The existing social Chrome profile is missing; refusing to create an empty replacement." >&2
  exit 1
fi
systemctl --user start social-rollup-chrome.service
for attempt in {1..30}; do
  if ready; then echo 'DGX social Chrome ready.'; exit 0; fi
  sleep 1
done
echo 'DGX social Chrome did not become ready; inspect journalctl --user -u social-rollup-chrome.service.' >&2
exit 1
