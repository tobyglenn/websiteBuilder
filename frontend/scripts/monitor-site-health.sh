#!/usr/bin/env bash

set -Eeuo pipefail

export TZ=${TZ:-America/New_York}

DOMAIN=${SITE_HEALTH_DOMAIN:-tobyonfitnesstech.com}
# Discover delegation; registrar nameservers and proxy addresses can change.
AUTHORITATIVE_NS_CSV=${SITE_HEALTH_AUTHORITATIVE_NS:-}
DNS_MODE=${SITE_HEALTH_DNS_MODE:-auto}
EXPECTED_A=${SITE_HEALTH_EXPECTED_A:-185.199.108.153,185.199.109.153,185.199.110.153,185.199.111.153}
EXPECTED_WWW_CNAME=${SITE_HEALTH_EXPECTED_WWW_CNAME:-tobyglenn.github.io.}
STATE_DIR=${SITE_HEALTH_STATE_DIR:-/home/toby/.openclaw/state/website-health}
LOG_DIR=${SITE_HEALTH_LOG_DIR:-/home/toby/.openclaw/logs/pipeline}
BUILD_LOG_HELPER=${SITE_HEALTH_BUILD_LOG_HELPER:-/home/toby/.openclaw/workspace/scripts/utils/post_build_log.py}
NOTIFY=${SITE_HEALTH_NOTIFY:-1}
CONFIRM_FAILURES=${SITE_HEALTH_CONFIRM_FAILURES:-3}
QUIET_START=${SITE_HEALTH_QUIET_START:-22}
QUIET_END=${SITE_HEALTH_QUIET_END:-7}
STATE_FILE="$STATE_DIR/state"
FAILURE_COUNT_FILE="$STATE_DIR/consecutive_failures"
ALERTED_FILE="$STATE_DIR/alerted"
LOG_FILE="$LOG_DIR/site_health.cron.log"

mkdir -p "$STATE_DIR" "$LOG_DIR"
exec 9>"$STATE_DIR/lock"
flock -n 9 || exit 0
exec > >(tee -a "$LOG_FILE") 2>&1

in_quiet_hours() {
  local hour start end
  hour=$((10#$(date +%H)))
  start=$((10#$QUIET_START))
  end=$((10#$QUIET_END))
  if ((start > end)); then
    ((hour >= start || hour < end))
  else
    ((hour >= start && hour < end))
  fi
}

notify_error() {
  local message=$1
  [[ "$NOTIFY" == "1" ]] || return 1
  if in_quiet_hours; then
    printf '[%s] INFO: Overnight notification deferred until %02d:00 local if the outage remains active.\n' \
      "$(date --iso-8601=seconds)" "$QUIET_END"
    return 1
  fi
  python3 "$BUILD_LOG_HELPER" --error "$message" || true
  hermes send --to telegram --quiet "$message" || true
  return 0
}

notify_recovery() {
  local message=$1
  [[ "$NOTIFY" == "1" ]] || return 1
  if in_quiet_hours; then
    printf '[%s] INFO: Overnight recovery notification suppressed.\n' "$(date --iso-8601=seconds)"
    return 1
  fi
  python3 "$BUILD_LOG_HELPER" --info "$message" || true
  hermes send --to telegram --quiet "$message" || true
  return 0
}

normalize_csv() {
  tr ',' '\n' | sed '/^$/d' | sort | paste -sd, -
}

previous_state=unknown
[[ -f "$STATE_FILE" ]] && previous_state=$(<"$STATE_FILE")
failure_count=0
if [[ -f "$FAILURE_COUNT_FILE" ]]; then
  failure_count=$(<"$FAILURE_COUNT_FILE")
fi
[[ "$failure_count" =~ ^[0-9]+$ ]] || failure_count=0
failures=()

dns_query() {
  local server=$1 record=$2 name=$3 answer
  answer=$(dig "@$server" +norecurse +time=4 +tries=1 +short "$record" "$name" 2>/dev/null || true)
  if [[ -z "$answer" ]]; then
    answer=$(dig "@$server" +tcp +norecurse +time=4 +tries=1 +short "$record" "$name" 2>/dev/null || true)
  fi
  printf '%s\n' "$answer"
}

if [[ -z "$AUTHORITATIVE_NS_CSV" ]]; then
  AUTHORITATIVE_NS_CSV=$(dig +time=4 +tries=2 +short NS "$DOMAIN" 2>/dev/null |
    sed -nE '/^[[:alnum:]_.-]+\.$/p' | sort | paste -sd, - || true)
fi
IFS=',' read -r -a authoritative_nameservers <<< "$AUTHORITATIVE_NS_CSV"
if [[ "$DNS_MODE" == auto ]]; then
  DNS_MODE=proxied
  for nameserver in "${authoritative_nameservers[@]}"; do
    if [[ "${nameserver%.}" != *.ns.cloudflare.com ]]; then DNS_MODE=direct; fi
  done
fi
if [[ "$DNS_MODE" != direct && "$DNS_MODE" != proxied ]]; then
  failures+=("unsupported DNS mode: $DNS_MODE")
fi
if [[ -z "$AUTHORITATIVE_NS_CSV" ]]; then
  failures+=("DNS verification failed: cannot discover authoritative nameservers")
fi
expected_a_sorted=$(printf '%s' "$EXPECTED_A" | normalize_csv)
a_matches=0
www_matches=0
for nameserver in "${authoritative_nameservers[@]}"; do
  nameserver=${nameserver//[[:space:]]/}
  [[ -n "$nameserver" ]] || continue
  actual_a=$(dns_query "$nameserver" A "$DOMAIN" | sed -nE '/^([0-9]{1,3}\.){3}[0-9]{1,3}$/p' | sort | paste -sd, -)
  if [[ "$DNS_MODE" == proxied ]]; then
    # Cloudflare hides origin A/CNAME records and legitimately serves IPv6.
    # Require public address answers; HTTPS/content/redirect checks below verify service.
    [[ -z "$actual_a" ]] || ((a_matches += 1))
    actual_www=$(dns_query "$nameserver" A "www.$DOMAIN" | sed -nE '/^([0-9]{1,3}\.){3}[0-9]{1,3}$/p' | sort | paste -sd, -)
    [[ -z "$actual_www" ]] || ((www_matches += 1))
  else
    if [[ "$actual_a" == "$expected_a_sorted" ]]; then
      ((a_matches += 1))
    elif [[ -n "$actual_a" ]]; then
      failures+=("DNS configuration mismatch at $nameserver: expected A $expected_a_sorted; got $actual_a")
    fi
    actual_aaaa=$(dns_query "$nameserver" AAAA "$DOMAIN" | sed -n '/^[0-9a-fA-F:]*:[0-9a-fA-F:]*$/p' | sort | paste -sd, -)
    if [[ -n "$actual_aaaa" ]]; then failures+=("unexpected direct-origin AAAA at $nameserver: $actual_aaaa"); fi
    actual_www=$(dns_query "$nameserver" CNAME "www.$DOMAIN" | head -n 1)
    if [[ "$actual_www" == "$EXPECTED_WWW_CNAME" ]]; then
      ((www_matches += 1))
    elif [[ -n "$actual_www" ]]; then
      failures+=("DNS configuration mismatch at $nameserver: expected www CNAME $EXPECTED_WWW_CNAME; got $actual_www")
    fi
  fi
done
if ((a_matches == 0)); then failures+=("DNS verification failed: no authoritative apex A answer matched $DNS_MODE mode"); fi
if ((www_matches == 0)); then failures+=("DNS verification failed: no authoritative www answer matched $DNS_MODE mode"); fi
printf '[%s] INFO: DNS mode=%s; authoritative nameservers=%s\n' "$(date --iso-8601=seconds)" "$DNS_MODE" "${AUTHORITATIVE_NS_CSV:-unavailable}"

curl_args=(--fail --silent --show-error --location --max-time 20 --retry 2 --retry-delay 2 --retry-all-errors)
homepage=$(mktemp "$STATE_DIR/.homepage.XXXXXX")
sitemap=$(mktemp "$STATE_DIR/.sitemap.XXXXXX")
trap 'rm -f "$homepage" "$sitemap"' EXIT

if ! curl "${curl_args[@]}" "https://$DOMAIN/" -o "$homepage"; then
  failures+=("HTTPS homepage request failed")
elif ! grep -Eqi '<html|<!doctype html' "$homepage" || ! grep -qi 'Toby' "$homepage"; then
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
  ((failure_count += 1))
  printf '%s' "$failure_count" > "$FAILURE_COUNT_FILE"
  detail=$(printf '%s; ' "${failures[@]}")
  detail=${detail%; }
  if ((failure_count < CONFIRM_FAILURES)) && [[ "$previous_state" != "unhealthy" ]]; then
    printf '[%s] WARN: Public website health check anomaly on %s (%d/%d before alert): %s\n' \
      "$timestamp" "$(hostname)" "$failure_count" "$CONFIRM_FAILURES" "$detail"
    exit 1
  fi

  printf 'unhealthy' > "$STATE_FILE"
  message="ERROR: Public website health checks failed on $(hostname) for $failure_count consecutive checks: $detail. Log: $LOG_FILE"
  printf '[%s] %s\n' "$timestamp" "$message"
  if [[ "$previous_state" != "unhealthy" || ! -f "$ALERTED_FILE" ]]; then
    if notify_error "$message"; then
      : > "$ALERTED_FILE"
    fi
  fi
  exit 1
fi

printf 'healthy' > "$STATE_FILE"
printf '0' > "$FAILURE_COUNT_FILE"
if [[ "$previous_state" == "unhealthy" ]]; then
  message="OK: Public website recovered on $(hostname): current authoritative DNS ($DNS_MODE mode), HTTPS, redirects, and sitemap pass. This confirms the checks now pass; the previous DNS alert may have reflected outdated monitor assumptions."
  printf '[%s] %s\n' "$timestamp" "$message"
  if [[ -f "$ALERTED_FILE" ]]; then
    notify_recovery "$message" || true
  else
    printf '[%s] INFO: Outage recovered before quiet hours ended; no overnight alert was delivered.\n' "$timestamp"
  fi
  rm -f "$ALERTED_FILE"
else
  printf '[%s] OK: Public website health check passed.\n' "$timestamp"
fi
