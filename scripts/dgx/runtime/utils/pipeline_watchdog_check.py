#!/usr/bin/env python3
"""
Pipeline Watchdog Check — Direct Telegram Alerter
==================================================
Reads cron job statuses directly from ~/.openclaw/cron/jobs.json,
checks whether each phase ran recently and successfully, and sends
a Telegram alert if anything is wrong.

This script is designed to be called by the watchdog cron jobs.
It does NOT rely on the LLM to decide how to send the alert.

Usage:
    python3 pipeline_watchdog_check.py --pipeline morning
    python3 pipeline_watchdog_check.py --pipeline nightly
"""

import json
import os
import re
import sys
import time
import argparse
import subprocess
import html
import requests
import tempfile
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
from journal_helper import get_away_from_home_status

# ── Config ───────────────────────────────────────────────────────────────────
JOBS_FILE = os.path.expanduser("~/.openclaw/cron/jobs.json")
ENV_FILE  = os.path.expanduser("~/.openclaw/.env")
CHAT_ID   = "8319992332"
# Phases must have run within this many ms to be considered "ran today"
MAX_AGE_MS = 3 * 3600 * 1000  # 3 hours
CLAWD_HOME = os.path.expanduser("~/clawd")
MORNING_REPORT_PATH = os.path.join(CLAWD_HOME, "docs")
MORNING_REPORT_SCRIPT = os.path.expanduser("~/.openclaw/workspace/scriptsJinja/generate_morning_report_jinja.py")
MORNING_SUMMARY_SCRIPT = os.path.expanduser("~/.openclaw/workspace/scripts/utils/send_morning_telegram_summary.py")
SCRIPTS_VENV_PYTHON = os.path.expanduser("~/.openclaw/workspace/scripts/.venv/bin/python3")

# Phases now run via crontab — check log files for recency/success
# Format: (display_name, log_file, success_marker_or_None)
MORNING_PHASES = [
    ("morning-phase-1-sync",    "/tmp/phase1_morning.log",  None),
    ("morning-phase-2-reports", "/tmp/phase2_morning.log",  "✅ Reports generated"),
    ("morning-phase-3-voice",   "/tmp/phase3_morning.log",  "✅ Voice"),
    ("morning-phase-4-deploy",  "/tmp/phase4_morning.log",  None),
    ("morning-phase-5-notify",  "/tmp/phase5_morning.log",  "✅"),
]

NIGHTLY_PHASES = [
    ("nightly-phase-1-sync",    "/tmp/phase1_nightly.log",  None),
    ("nightly-phase-2-reports", "/tmp/phase2_nightly.log",  "✅ Reports generated"),
    ("nightly-phase-3-voice",   "/tmp/phase3_nightly.log",  "✅ Voice"),
    ("nightly-phase-4-deploy",  "/tmp/phase4_nightly.log",  None),
    ("nightly-phase-5-notify",  "/tmp/phase5_nightly.log",  "✅"),
]


# ── Helpers ───────────────────────────────────────────────────────────────────
def load_env():
    """Source key=value pairs from .env file into os.environ."""
    if not os.path.exists(ENV_FILE):
        return
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Handle: export KEY=VALUE  or  KEY=VALUE
            if line.startswith("export "):
                line = line[7:]
            if "=" in line:
                k, _, v = line.partition("=")
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and k not in os.environ:
                    os.environ[k] = v


def get_bot_token():
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        print("❌ TELEGRAM_BOT_TOKEN not set", file=sys.stderr)
    return token


def send_telegram(token: str, message: str) -> bool:
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    try:
        resp = requests.post(url, json=payload, timeout=30)
        if resp.status_code == 200:
            print(f"✅ Telegram alert sent")
            return True
        else:
            print(f"❌ Telegram API error {resp.status_code}: {resp.text}", file=sys.stderr)
            return False
    except Exception as e:
        print(f"❌ Telegram send failed: {e}", file=sys.stderr)
        return False


def _local_date_from_ms(ms):
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).astimezone().strftime("%Y-%m-%d")


def _validation_python():
    return SCRIPTS_VENV_PYTHON if os.path.exists(SCRIPTS_VENV_PYTHON) else sys.executable


def _report_validation_env(temp_clawd_home):
    env = os.environ.copy()
    env["CLAWD_HOME"] = temp_clawd_home
    env["DATA_DIR"] = os.path.join(CLAWD_HOME, "data")
    scripts_dir = os.path.expanduser("~/.openclaw/workspace/scripts")
    env["PYTHONPATH"] = f"{scripts_dir}:{env.get('PYTHONPATH', '')}"
    return env


def check_phases(phase_specs, now_ms):
    """Return list of (name, failure_reason) for any failed/missing/stale phases."""
    failures = []
    target_date = _local_date_from_ms(now_ms)
    for name, log_file, success_marker in phase_specs:
        if not os.path.exists(log_file):
            failures.append((name, "log file not found — phase may not have run"))
            continue

        mtime_ms = int(os.path.getmtime(log_file) * 1000)
        log_date = _local_date_from_ms(mtime_ms)

        if log_date != target_date:
            age_ms = now_ms - mtime_ms
            age_h = age_ms / 3_600_000
            failures.append((name, f"stale (log date {log_date}, {age_h:.1f}h ago — did not run this cycle)"))
            continue

        if success_marker:
            try:
                content = open(log_file).read()
                if "⏭ Skipped" in content:
                    failures.append((name, "skipped by orchestrator (degraded mode - no same-day WHOOP recovery; email/voice withheld on purpose)"))
                    continue
                if success_marker not in content:
                    # Pull error lines for context
                    lines = content.splitlines()
                    error_lines = [l.strip() for l in lines if any(w in l for w in ["❌", "Error", "Traceback", "KeyError", "failed", "FAILED"])]
                    error_snippet = " | ".join(error_lines[-3:]) if error_lines else next((l.strip() for l in reversed(lines) if l.strip()), "no output")
                    failures.append((name, f"success marker not found\n  → {error_snippet[:300]}"))
            except Exception as e:
                failures.append((name, f"could not read log: {e}"))

    return failures


def _is_away_from_home_for_date(target_date):
    eight_sleep_dir = os.path.join(CLAWD_HOME, "data", "eight_sleep")
    away = get_away_from_home_status(eight_sleep_dir, target_date)
    if away is not None:
        return away

    daily_path = os.path.join(eight_sleep_dir, f"{target_date}.json")
    if os.path.exists(daily_path):
        try:
            with open(daily_path) as f:
                daily = json.load(f)
            if str(daily.get("note") or "").strip().lower() == "no_trend_data" and daily.get("sleep_score") is None:
                return True
        except Exception:
            pass
    return False



def validate_morning_artifacts(now_ms):
    failures = []
    target_date = datetime.fromtimestamp(now_ms / 1000, tz=timezone.utc).astimezone().strftime("%Y-%m-%d")
    away_from_home = _is_away_from_home_for_date(target_date)
    report_path = os.path.join(MORNING_REPORT_PATH, f"morning_report_{target_date}.html")

    if not os.path.exists(report_path):
        failures.append(("morning-report-artifact", f"report missing: {report_path}"))
    else:
        mtime_ms = int(os.path.getmtime(report_path) * 1000)
        if _local_date_from_ms(mtime_ms) != target_date:
            age_ms = now_ms - mtime_ms
            failures.append(("morning-report-artifact", f"report stale ({age_ms / 3_600_000:.1f}h old): {report_path}"))
        else:
            try:
                content = open(report_path).read()
                # Strip base64 image data before checking for nan, to avoid false positives from image encoding
                content_stripped = re.sub(r'data:image/[^;]+;base64,[A-Za-z0-9+/=]+', '[BASE64]', content)
                if 'nan' in content_stripped.lower():
                    failures.append(("morning-report-artifact", f"report contains 'nan': {report_path}"))
            except Exception as e:
                failures.append(("morning-report-artifact", f"could not read report: {e}"))

    if os.path.exists(MORNING_REPORT_SCRIPT):
        try:
            with tempfile.TemporaryDirectory(prefix="morning-report-validation-") as temp_clawd_home:
                proc = subprocess.run(
                    [_validation_python(), MORNING_REPORT_SCRIPT, target_date],
                    capture_output=True,
                    text=True,
                    timeout=180,
                    env=_report_validation_env(temp_clawd_home),
                )
            if proc.returncode != 0:
                output = (proc.stderr or proc.stdout or '').strip().replace('\n', ' | ')
                if away_from_home and '8Sleep' in output and any(token in output for token in ['stale', 'date mismatch', 'invalid']):
                    pass
                else:
                    failures.append(("morning-report-validation", f"regeneration fails closed as expected/required check triggered: {output[:300]}"))
        except Exception as e:
            failures.append(("morning-report-validation", f"could not run report validation: {e}"))

    if os.path.exists(MORNING_SUMMARY_SCRIPT):
        try:
            proc = subprocess.run(
                [_validation_python(), MORNING_SUMMARY_SCRIPT, target_date, '--dry-run'],
                capture_output=True,
                text=True,
                timeout=120,
            )
            if proc.returncode != 0:
                output = (proc.stderr or proc.stdout or '').strip().replace('\n', ' | ')
                if away_from_home and '8Sleep' in output and any(token in output for token in ['stale', 'date mismatch', 'invalid']):
                    pass
                else:
                    failures.append(("morning-summary-validation", f"summary dry-run refused send / validation failed: {output[:300]}"))
        except Exception as e:
            failures.append(("morning-summary-validation", f"could not run summary validation: {e}"))

    return failures



def build_alert_message(pipeline: str, failures, now_ms: int) -> str:
    ts = datetime.fromtimestamp(now_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        f"🚨 <b>{pipeline.upper()} PIPELINE FAILURE DETECTED</b>",
        f"<i>Watchdog check at {ts}</i>",
        "",
        f"<b>{len(failures)} phase(s) failed:</b>",
    ]
    for name, reason in failures:
        safe_name = html.escape(str(name))
        safe_reason = html.escape(str(reason))
        lines.append(f"  • <code>{safe_name}</code>: {safe_reason}")
    lines += [
        "",
        "Downstream notifications may NOT have fired.",
        "Check logs and restart affected phases manually if needed.",
    ]
    return "\n".join(lines)


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Pipeline watchdog — sends Telegram alert on failure")
    parser.add_argument("--pipeline", choices=["morning", "nightly"], required=True)
    args = parser.parse_args()

    load_env()
    token = get_bot_token()
    if not token:
        sys.exit(2)

    now_ms = int(time.time() * 1000)
    phase_specs = MORNING_PHASES if args.pipeline == "morning" else NIGHTLY_PHASES

    failures = check_phases(phase_specs, now_ms)
    if args.pipeline == "morning":
        failures.extend(validate_morning_artifacts(now_ms))

    if not failures:
        print(f"✅ All {args.pipeline} pipeline phases OK — no alert needed.")
        sys.exit(0)

    print(f"⚠️  {len(failures)} failure(s) detected in {args.pipeline} pipeline:")
    for name, reason in failures:
        print(f"   • {name}: {reason}")

    alert = build_alert_message(args.pipeline, failures, now_ms)
    ok = send_telegram(token, alert)
    sys.exit(1 if ok else 2)  # A delivered failure alert is still a failed pipeline.


if __name__ == "__main__":
    main()
