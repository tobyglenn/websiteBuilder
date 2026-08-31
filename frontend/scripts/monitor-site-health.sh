#!/usr/bin/env bash

set -Eeuo pipefail

export TZ=${TZ:-America/New_York}

DOMAIN=${SITE_HEALTH_DOMAIN:-tobyonfitnesstech.com}
AUTHORITATIVE_NS=${SITE_HEALTH_AUTHORITATIVE_NS:-launch1.spaceship.net}
EXPECTED_A=${SITE_HEALTH_EXPECTED_A:-185.199.108.153,185.199.109.153,185.199.110.153,185.199.111.153}
EXPECTED_WWW_CNAME=${SITE_HEALTH_EXPECTED_WWW_CNAME:-tobyglenn.github.io.}
STATE_DIR=${SITE_HEALTH_STATE_DIR:-/home/toby/.openclaw/state/website-health}
LOG_DIR=${SITE_HEALTH_LOG_DIR:-/home/toby/.openclaw/logs/pipeline}
BUILD_LOG_HELPER=${SITE_HEALTH_BUILD_LOG_HELPER:-/home/toby/.openclaw/workspace/scripts/utils/post_build_log.py}
NOTIFY=${SITE_HEALTH_NOTIFY:-1}
STATE_FILE="$STATE_DIR/state"
LOG_FILE="$LOG_DIR/site_health.cron.log"

mkdir -p "$STATE_DIR" "$LOG_DIR"
exec 9>"$STATE_DIR/lock"
flock -n 9 || exit 0
exec > >(tee -a "$LOG_FILE") 2>&1

notify_error() {
  local message=$1
  [[ "$NOTIFY" == "1" ]] || return 0
  python3 "$BUILD_LOG_HELPER" --error "$message" || true
  hermes send --to telegram --quiet "$message" || true
}

notify_recovery() {
  local message=$1
  [[ "$NOTIFY" == "1" ]] || return 0
  python3 "$BUILD_LOG_HELPER" --info "$message" || true
  hermes send --to telegram --quiet "$message" || true
}

normalize_csv() {
  tr ',' '\n' | sed '/^$/d' | sort | paste -sd, -
}

previous_state=unknown
[[ -f "$STATE_FILE" ]] && previous_state=$(<"$STATE_FILE")
failures=()

expected_a_sorted=$(printf '%s' "$EXPECTED_A" | normalize_csv)
actual_a=$(dig "@$AUTHORITATIVE_NS" +time=5 +tries=2 +short A "$DOMAIN" 2>/dev/null | sort | paste -sd, - || true)
if [[ "$actual_a" != "$expected_a_sorted" ]]; then
  failures+=("authoritative A mismatch: expected $expected_a_sorted; got ${actual_a:-none}")
fi

actual_aaaa=$(dig "@$AUTHORITATIVE_NS" +time=5 +tries=2 +short AAAA "$DOMAIN" 2>/dev/null | sort | paste -sd, - || true)
if [[ -n "$actual_aaaa" ]]; then
  failures+=("unexpected authoritative AAAA: $actual_aaaa")
fi

actual_www=$(dig "@$AUTHORITATIVE_NS" +time=5 +tries=2 +short CNAME "www.$DOMAIN" 2>/dev/null | head -n 1 || true)
if [[ "$actual_www" != "$EXPECTED_WWW_CNAME" ]]; then
  failures+=("www CNAME mismatch: expected $EXPECTED_WWW_CNAME; got ${actual_www:-none}")
fi

curl_args=(--fail --silent --show-error --location --max-time 20 --retry 2 --retry-delay 2 --retry-all-errors)
homepage=$(mktemp "$STATE_DIR/.homepage.XXXXXX")
sitemap=$(mktemp "$STATE_DIR/.sitemap.XXXXXX")
trap 'rm -f "$homepage" "$sitemap"' EXIT

if ! curl "${curl_args[@]}" "https://$DOMAIN/" -o "$homepage"; then
  failures+=("HTTPS homepage request failed")
elif ! grep -Eqi '<html|<!doctype html' "$homepage"; then
  failures+=("HTTPS homepage returned unexpected content")
fi

http_result=$(curl --silent --show-error --location --max-time 20 --retry 2 --retry-delay 2 --retry-all-errors \
  --output /dev/null --write-out '%{http_code} %{url_effective}' "http://$DOMAIN/" 2>/dev/null || true)
if [[ "$http_result" != "200 https://$DOMAIN/" ]]; then
  failures+=("HTTP-to-HTTPS redirect failed: ${http_result:-no response}")
fi

www_result=$(curl --silent --show-error --location --max-time 20 --retry 2 --retry-delay 2 --retry-all-errors \
  --output /dev/null --write-out '%{http_code} %{url_effective}' "https://www.$DOMAIN/" 2>/dev/null || true)
if [[ "$www_result" != "200 https://$DOMAIN/" ]]; then
  failures+=("www-to-apex redirect failed: ${www_result:-no response}")
fi

if ! curl "${curl_args[@]}" "https://$DOMAIN/sitemap-index.xml" -o "$sitemap"; then
  failures+=("HTTPS sitemap request failed")
elif ! grep -q '<sitemapindex' "$sitemap"; then
  failures+=("sitemap returned unexpected content")
fi

timestamp=$(date --iso-8601=seconds)
if ((${#failures[@]})); then
  printf 'unhealthy' > "$STATE_FILE"
  detail=$(printf '%s; ' "${failures[@]}")
  detail=${detail%; }
  message="ERROR: Public website health check failed on $(hostname): $detail. Log: $LOG_FILE"
  printf '[%s] %s\n' "$timestamp" "$message"
  if [[ "$previous_state" != "unhealthy" ]]; then
    notify_error "$message"
  fi
  exit 1
fi

printf 'healthy' > "$STATE_FILE"
if [[ "$previous_state" == "unhealthy" ]]; then
  message="OK: Public website recovered on $(hostname): authoritative DNS, HTTPS, redirects, and sitemap are healthy."
  printf '[%s] %s\n' "$timestamp" "$message"
  notify_recovery "$message"
else
  printf '[%s] OK: Public website health check passed.\n' "$timestamp"
fi
