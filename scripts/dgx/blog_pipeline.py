#!/usr/bin/env python3
"""Daily blog automation for tobyonfitnesstech.com.

Stages:
  smoke   - verify paths, transcript inventory, and model access
  draft   - create blog-drafts/pending.json from the next unused transcript
  review  - review/fix pending.json and generate a thumbnail
  publish - append the reviewed post to mock.js, build, commit, and push
"""

from __future__ import annotations

from blog_source_identity import (read_used_slugs as identity_slugs, published_video_ids, source_video_id, assert_unpublished_source)

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any


VALID_CATEGORIES = {
    "Field Reports",
    "The Long Game",
    "Signal vs. Noise",
    "Speediance",
    "Training Tips",
    "Mat Science",
    "The Numbers",
    "BJJ",
    "Reviews",
    "Wearables",
    "Build Logs",
    "Transformation",
    "Tips & Guides",
}

COMPARISON_CLUSTERS = (
    "whoop",
    "garmin",
    "oura",
    "fitness tracker",
    "speediance",
    "gym monster",
    "tonal",
    "voltra",
    "aeke",
    "oxfit",
    "vitruvian",
)
COMPARISON_INTENT_TERMS = {
    "vs",
    "versus",
    "compare",
    "compared",
    "comparison",
    "difference",
    "differences",
    "upgrade",
    "worth",
    "which",
}


# This pipeline runs on the DGX only. Paths are intentionally hard-coded to
# the DGX layout (env vars override for testing) — earlier Mac fallback paths
# risked publishing from a stale or trashed copy of the repo if the script
# ever ran on the wrong machine.
WORKSPACE_ROOT = Path(os.environ.get("BLOG_WORKSPACE_ROOT", "/home/toby/.openclaw/workspace"))
WEBSITE_DIR = Path(os.environ.get("WEBSITE_DIR", str(WORKSPACE_ROOT / "websiteBuilder")))
SCRIPTS_DIR = Path(os.environ.get("BLOG_SCRIPTS_DIR", WORKSPACE_ROOT / "scripts"))
DRAFT_DIR = Path(os.environ.get("BLOG_DRAFT_DIR", WORKSPACE_ROOT / "blog-drafts"))
LOG_DIR = Path(os.environ.get("BLOG_LOG_DIR", "/home/toby/.openclaw/logs/pipeline"))
PENDING = DRAFT_DIR / "pending.json"
FAILED_DIR = DRAFT_DIR / "failed"
BLACKLIST = DRAFT_DIR / "blacklist.txt"
MOCK_JS = WEBSITE_DIR / "frontend/src/data/mock.js"
FRONTEND_DIR = WEBSITE_DIR / "frontend"
TRANSCRIPTS_DIR = FRONTEND_DIR / "src/data/transcripts"
SYNCED_TRANSCRIPTS_DIR = Path(
    os.environ.get("BLOG_SYNCED_TRANSCRIPTS_DIR", str(DRAFT_DIR / "transcripts"))
)
SYNCED_TRANSCRIPT_INDEX = Path(
    os.environ.get("BLOG_SYNCED_TRANSCRIPT_INDEX", str(DRAFT_DIR / "transcript_index.json"))
)
LEGACY_TRANSCRIPT_INDEX = WEBSITE_DIR / "transcript_index.json"
TRANSCRIPT_SYNC_SCRIPT = WEBSITE_DIR / "scripts/fetch_transcripts.py"
THUMBS_DIR = FRONTEND_DIR / "public/images/blog"
FREECALL_ROOT = Path(os.environ.get("FREECALL_ROOT", "/home/toby/.openclaw/scripts"))


def now_stamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def log(stage: str, message: str) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    line = f"[{now_stamp()}] {stage}: {message}"
    print(line)
    with (LOG_DIR / f"blog_{stage}.log").open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def pending_summary() -> str:
    if not PENDING.exists():
        return "no pending draft"
    try:
        draft = json.loads(PENDING.read_text(encoding="utf-8"))
        age_hours = (datetime.now().timestamp() - PENDING.stat().st_mtime) / 3600
        return (
            f"pending slug={draft.get('slug', 'unknown')} "
            f"reviewed={draft.get('reviewed')} age={age_hours:.1f}h"
        )
    except Exception as exc:
        return f"pending exists but could not be read: {exc}"


def notify_message(stage: str, message: str) -> None:
    helper = SCRIPTS_DIR / "utils/post_build_log.py"
    if not helper.exists():
        print(f"[{now_stamp()}] {stage}: build-log helper missing: {helper}", file=sys.stderr)
        return
    proc = run(["python3", str(helper), message], timeout=30)
    if proc.returncode != 0:
        output = (proc.stderr or proc.stdout or "").strip()
        print(f"[{now_stamp()}] {stage}: build-log notification failed: {output[:500]}", file=sys.stderr)


def notify_failure(stage: str, exc: Exception) -> None:
    stage_log = LOG_DIR / f"blog_{stage}.log"
    cron_log = LOG_DIR / {
        "draft": "blog_draft.log",
        "review": "blog_review.log",
        "publish": "blog_publish.log",
    }.get(stage, f"blog_{stage}.cron.log")
    message = "\n".join(
        [
            "[BLOG PIPELINE FAILURE]",
            f"stage: {stage}",
            f"error: {str(exc)[:500]}",
            f"state: {pending_summary()}",
            f"stage log: {stage_log}",
            f"cron log: {cron_log}",
            "action: inspect the logs, fix/review pending.json if present, then rerun the failed stage.",
        ]
    )
    notify_message(stage, message)


def run(
    args: list[str],
    *,
    cwd: Path | None = None,
    timeout: int = 120,
    env_extra: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    if env_extra:
        env.update(env_extra)
    return subprocess.run(
        args,
        cwd=str(cwd) if cwd else None,
        env=env,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )


def frontend_build() -> subprocess.CompletedProcess[str]:
    """Build with the same workout-hub feature state used by production CI."""
    return run(
        ["npm", "run", "build"],
        cwd=FRONTEND_DIR,
        timeout=int(os.environ.get("BLOG_BUILD_TIMEOUT", "600")),
        env_extra={
            "PUBLIC_WORKOUT_HUB_ENABLED": os.environ.get(
                "PUBLIC_WORKOUT_HUB_ENABLED", "true"
            )
        },
    )


def ensure_dirs() -> None:
    DRAFT_DIR.mkdir(parents=True, exist_ok=True)
    SYNCED_TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
    FAILED_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    THUMBS_DIR.mkdir(parents=True, exist_ok=True)
    if not BLACKLIST.exists():
        BLACKLIST.write_text("# Transcript basenames published or skipped by blog automation\n", encoding="utf-8")


def require_paths() -> None:
    missing = []
    for path in [WEBSITE_DIR, FRONTEND_DIR, MOCK_JS, TRANSCRIPTS_DIR, SCRIPTS_DIR]:
        if not path.exists():
            missing.append(str(path))
    if missing:
        raise RuntimeError("Missing required path(s): " + ", ".join(missing))


def slugify(name: str) -> str:
    slug = name.lower().replace("_", "-").replace(" ", "-")
    slug = re.sub(r"[^a-z0-9-]", "", slug)
    return re.sub(r"-+", "-", slug).strip("-")


def read_used_slugs() -> set[str]:
    return identity_slugs(MOCK_JS, FRONTEND_DIR / "src/pages/blog")


def read_used_video_ids() -> set[str]:
    return published_video_ids(MOCK_JS, FRONTEND_DIR / "src/pages/blog", transcript_index(), read_blacklist(), candidate_slug)


def has_post_dated(date: str) -> bool:
    """Return whether the blog inventory contains a post for ``date``."""
    pattern = r'\b(?:date|published_at)["\']?\s*:\s*["\']' + re.escape(date) + r'["\']'
    return bool(re.search(pattern, MOCK_JS.read_text(encoding="utf-8")))


def read_blacklist() -> set[str]:
    if not BLACKLIST.exists():
        return set()
    items = set()
    for raw in BLACKLIST.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        line = line.split("  #", 1)[0].strip()
        if line:
            items.add(line)
    return items


def transcript_index() -> dict[str, dict[str, Any]]:
    """Return transcript metadata keyed by filename from both inventories."""
    entries: dict[str, dict[str, Any]] = {}
    for index_path in (LEGACY_TRANSCRIPT_INDEX, SYNCED_TRANSCRIPT_INDEX):
        if not index_path.exists():
            continue
        try:
            values = json.loads(index_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            log("draft", f"ignoring unreadable transcript index {index_path}: {exc}")
            continue
        if not isinstance(values, list):
            continue
        for value in values:
            if isinstance(value, dict) and value.get("file"):
                entries[str(value["file"]).lower()] = value
    return entries


def transcript_metadata(path: Path) -> dict[str, Any]:
    return transcript_index().get(path.name.lower(), {})


def candidate_slug(path: Path) -> str:
    """Create a clean article slug without source dates or collision IDs.

    The ``<safe_title>__<video_id>`` naming convention is now used in both
    ``SYNCED_TRANSCRIPTS_DIR`` and ``TRANSCRIPTS_DIR``, so the ``__<id>``
    suffix is stripped from any stem that carries it.
    """
    stem = re.sub(r"__[A-Za-z0-9_-]{6,}$", "", path.stem)
    stem = re.sub(r"(?<=\d)\.(?=\d)", "-", stem)
    return slugify(stem)


# Bare YouTube video IDs (or slugified forms) must never be used as article
# slugs: they are unreadable, collide with future title-based imports, and
# immediately get renamed on the live site. Block them so the muse pipeline
# quarantines the underlying transcript instead of publishing.
#
# Three patterns are rejected:
#   1. Strict 11-char (or with leading dash) YouTube ID exactly.
#   2. The same chars slugified (no leading dash) — that's what bare-ID files
#      like ``-MfLx3omqzw.txt`` produce after ``slugify`` strips the dash.
#   3. Files whose stem is itself the bare ID with optional leading dash —
#      caught upstream by the suffix-stripping in ``candidate_slug``.
YOUTUBE_ID_SLUG_STRICT = re.compile(r"^-?[A-Za-z0-9_-]{11}$")
YOUTUBE_ID_SLUG_LOOSE = re.compile(r"^[A-Za-z0-9_-]{10,11}$")


def _looks_like_video_id_slug(slug: str, basename: str) -> bool:
    """True when either the slug or the transcript stem looks like a video ID."""
    if YOUTUBE_ID_SLUG_STRICT.fullmatch(slug) or YOUTUBE_ID_SLUG_STRICT.fullmatch(basename):
        return True
    if YOUTUBE_ID_SLUG_LOOSE.fullmatch(slug):
        return True
    return False


TOPIC_STOPWORDS = {
    "a", "an", "and", "are", "at", "for", "from", "here", "i", "in", "is",
    "it", "my", "of", "on", "the", "this", "to", "with", "your",
}


def topic_tokens(value: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", value.lower())
        if len(token) > 1 and token not in TOPIC_STOPWORDS
    }


def published_titles() -> list[str]:
    text = MOCK_JS.read_text(encoding="utf-8")
    marker = text.find("BLOG_POSTS")
    if marker >= 0:
        text = text[marker:]
    return [
        match[1]
        for match in re.findall(r"\btitle[\"\']?\s*:\s*([\"'])(.*?)(?<!\\)\1", text)
    ]


def is_near_duplicate_topic(title: str, existing_titles: list[str]) -> bool:
    candidate = topic_tokens(title)
    if len(candidate) < 3:
        return False
    for existing_title in existing_titles:
        existing = topic_tokens(existing_title)
        if len(existing) < 3:
            continue
        overlap = len(candidate & existing)
        containment = overlap / min(len(candidate), len(existing))
        union = overlap / len(candidate | existing)
        if containment >= 0.86 or union >= 0.72:
            return True
    return False


def editorial_score(path: Path) -> int:
    metadata = transcript_metadata(path)
    if metadata.get("topic_score") is not None:
        try:
            return int(metadata["topic_score"])
        except (TypeError, ValueError):
            pass

    searchable = f"{metadata.get('title', '')} {path.stem}"
    score = 0
    if re.search(r"\b(vs|versus|comparison|compare)\b", searchable, re.I):
        score += 70
    if re.search(r"\b(review|worth|recommend|best)\b", searchable, re.I):
        score += 50
    if re.search(r"\b(how to|guide|setup|fix|problem|bug)\b", searchable, re.I):
        score += 35
    if re.search(r"\b(what|why|which|explained|truth)\b", searchable, re.I):
        score += 20
    if any(cluster in searchable.lower() for cluster in COMPARISON_CLUSTERS):
        score += 20
    return score


def sync_transcript_backlog() -> bool:
    """Refresh a small long-form transcript batch before each draft run."""
    if os.environ.get("BLOG_DISABLE_TRANSCRIPT_SYNC") == "1":
        return False
    if not TRANSCRIPT_SYNC_SCRIPT.exists():
        log("draft", f"transcript sync script missing: {TRANSCRIPT_SYNC_SCRIPT}")
        return False

    configured_python = os.environ.get("BLOG_SYNC_PYTHON")
    venv_python = SCRIPTS_DIR / ".venv/bin/python3"
    python = configured_python or (str(venv_python) if venv_python.exists() else sys.executable)
    max_new = os.environ.get("BLOG_SYNC_MAX_NEW", "3")
    proc = run(
        [python, str(TRANSCRIPT_SYNC_SCRIPT), "--max-new", max_new],
        cwd=WEBSITE_DIR,
        timeout=int(os.environ.get("BLOG_SYNC_TIMEOUT", "600")),
    )
    output = (proc.stdout or proc.stderr or "").strip()
    if proc.returncode != 0:
        log("draft", f"transcript sync warning (exit {proc.returncode}): {output[-800:]}")
        return False
    summary = next((line for line in reversed(output.splitlines()) if line.strip()), "ok")
    log("draft", f"transcript sync complete: {summary[:500]}")
    return True


def transcript_word_count(path: Path) -> int:
    return len(re.findall(r"\S+", path.read_text(encoding="utf-8", errors="ignore")))


def min_transcript_words() -> int:
    return int(os.environ.get("BLOG_MIN_TRANSCRIPT_WORDS", "40"))


def comparison_priority(text: str) -> int:
    """Rank comparison demand ahead of other publishable transcript topics."""
    normalized = re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()
    tokens = set(normalized.split())
    has_cluster = any(cluster in normalized for cluster in COMPARISON_CLUSTERS)
    has_intent = bool(tokens & COMPARISON_INTENT_TERMS) or "best value" in normalized
    if has_cluster and has_intent:
        return 0
    if has_cluster:
        return 1
    return 2


def _legacy_prioritize_transcripts(items: list[tuple[Path, str]]) -> list[tuple[Path, str]]:
    """Sort comparison-intent transcripts first while keeping stable filename order."""
    def rank(item: tuple[Path, str]) -> tuple[int, str]:
        path, _ = item
        content = path.read_text(encoding="utf-8", errors="ignore")
        searchable = f"{path.stem} {content[:20000]}"
        return comparison_priority(searchable), path.name.lower()

    return sorted(items, key=rank)


def _legacy_usable_transcripts() -> list[tuple[Path, str]]:
    """All unused, non-blacklisted transcripts long enough to draft from."""
    used = read_used_slugs()
    blacklisted = read_blacklist()
    usable = []
    for path in sorted(TRANSCRIPTS_DIR.glob("*.txt")):
        basename = path.stem
        slug = candidate_slug(path)
        if slug in used or basename in blacklisted:
            continue
        if _looks_like_video_id_slug(slug, basename):
            log("draft", f"skipping transcript with bare video-ID slug: {path.name}")
            continue
        if transcript_word_count(path) < min_transcript_words():
            continue
        usable.append((path, slug))
    return prioritize_transcripts(usable)


def prioritize_transcripts(items: list[tuple[Path, str]]) -> list[tuple[Path, str]]:
    """Rank durable search-intent topics ahead of chronological filename order."""
    def rank(item: tuple[Path, str]) -> tuple[int, int, str]:
        path, _ = item
        return (-editorial_score(path), -transcript_word_count(path), path.name.lower())

    return sorted(items, key=rank)


def usable_transcripts() -> list[tuple[Path, str]]:
    """All unused, sufficiently substantial, non-duplicate transcript topics."""
    used = read_used_slugs()
    blacklisted = read_blacklist()
    existing_titles = published_titles()
    metadata = transcript_index()
    used_video_ids = read_used_video_ids()
    seen_video_ids: set[str] = set()
    usable: list[tuple[Path, str]] = []
    seen_files: set[str] = set()

    for directory in (SYNCED_TRANSCRIPTS_DIR, TRANSCRIPTS_DIR):
        if not directory.exists():
            continue
        for path in sorted(directory.glob("*.txt")):
            file_key = path.name.lower()
            if file_key in seen_files:
                continue
            seen_files.add(file_key)
            basename = path.stem
            slug = candidate_slug(path)
            source_title = str(metadata.get(file_key, {}).get("title") or basename.replace("_", " "))
            if slug in used or basename in blacklisted or slug in blacklisted:
                continue
            if _looks_like_video_id_slug(slug, basename):
                log("draft", f"skipping transcript with bare video-ID slug: {path.name}")
                continue
            if transcript_word_count(path) < min_transcript_words():
                continue
            if is_near_duplicate_topic(source_title, existing_titles):
                continue
            video_id = source_video_id(metadata.get(file_key, {}))
            if not video_id or video_id in used_video_ids or video_id in seen_video_ids:
                continue
            seen_video_ids.add(video_id)
            usable.append((path, slug))
    return prioritize_transcripts(usable)


def check_content_runway(remaining: int) -> None:
    """Alert before the transcript queue starves the daily pipeline.

    Silent exhaustion already caused a 15-day gap (2026-06-17 to 07-01):
    the draft stage logged "no unused transcripts found" and exited 0 daily
    with no notification.
    """
    threshold = int(os.environ.get("BLOG_RUNWAY_WARN_DAYS", "7"))
    if remaining > threshold:
        return
    if remaining <= 0:
        notify_message(
            "draft",
            "[BLOG PIPELINE CONTENT EXHAUSTED]\n"
            "No distinct long-form transcript topics remain for a new article.\n"
            f"topic queue: {DRAFT_DIR / 'topic_queue.json'}\n"
            "action: inspect caption retries or plan a Shorts-based content update.",
        )
    else:
        notify_message(
            "draft",
            f"[BLOG PIPELINE LOW RUNWAY] Only {remaining} usable transcript(s) "
            f"left (~{remaining} days of daily posts). The automatic YouTube "
            "transcript sync will keep checking for new long-form videos.",
        )


def choose_transcript() -> tuple[Path, str] | None:
    usable = usable_transcripts()
    return usable[0] if usable else None


def strip_model_footer(text: str) -> str:
    lines = text.strip().splitlines()
    while lines and re.fullmatch(r"\[via .+\]", lines[-1].strip()):
        lines.pop()
    return "\n".join(lines).strip()


def strip_think_blocks(text: str) -> str:
    """Drop <think>...</think> reasoning blocks (and any unterminated tail).

    freecall now strips these itself, but the local exo fallback (Qwen3) also
    emits them and bypasses freecall — and a think block quoting a JSON sketch
    would otherwise be picked up by extract_json_object as the answer.
    """
    cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    start = cleaned.find("<think>")
    if start != -1:
        cleaned = cleaned[:start]
    return cleaned.strip()


def extract_json_object(text: str) -> dict[str, Any]:
    cleaned = strip_think_blocks(strip_model_footer(text))
    cleaned = re.sub(r"^\s*```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```\s*$", "", cleaned)
    decoder = json.JSONDecoder()
    start = cleaned.find("{")
    if start == -1:
        raise ValueError("no JSON object found")
    obj, _ = decoder.raw_decode(cleaned[start:])
    if not isinstance(obj, dict):
        raise ValueError("model returned JSON, but not an object")
    return obj


def freecall(prompt: str, *, provider: str, timeout: int) -> str:
    env_extra = {
        "PYTHONPATH": str(FREECALL_ROOT),
        "PATH": os.environ.get("PATH", ""),
    }
    # Per-model-call timeout inside freecall; the outer `timeout` caps the
    # whole subprocess (freecall may try several models per provider).
    call_timeout = min(timeout, int(os.environ.get("BLOG_MODEL_CALL_TIMEOUT", "240")))
    proc = run(
        ["python3", "-m", "freecall.cli", provider, prompt, "--timeout", str(call_timeout)],
        timeout=timeout,
        env_extra=env_extra,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            "freecall failed "
            f"(exit {proc.returncode}): {(proc.stderr or proc.stdout).strip()}"
        )
    return strip_model_footer(proc.stdout)


def exo_generate(prompt: str, *, timeout: int) -> str:
    """Local fallback: the exo cluster's OpenAI-compatible API on the DGX."""
    url = os.environ.get("BLOG_EXO_URL", "http://127.0.0.1:52415/v1/chat/completions")
    model = os.environ.get("BLOG_EXO_MODEL", "mlx-community/Qwen3-Coder-Next-8bit")
    payload = json.dumps(
        {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": int(os.environ.get("BLOG_EXO_MAX_TOKENS", "8000")),
            "temperature": 0.7,
            "stream": False,
        }
    ).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        data = json.load(res)
    return str(data["choices"][0]["message"]["content"])


def generate_text(prompt: str, *, stage: str, provider: str, timeout: int) -> str:
    """Try freecall providers in order, then the local exo model."""
    providers: list[str] = []
    for name in [provider, "google"]:
        if name and name not in providers:
            providers.append(name)
    errors: list[str] = []
    for name in providers:
        try:
            return freecall(prompt, provider=name, timeout=timeout)
        except Exception as exc:
            errors.append(f"{name}: {exc}")
            log(stage, f"provider {name} failed, trying next: {str(exc)[:300]}")
    try:
        log(stage, "falling back to local exo model")
        return exo_generate(prompt, timeout=timeout)
    except Exception as exc:
        errors.append(f"exo: {exc}")
    raise RuntimeError("all text providers failed: " + " | ".join(errors))


def normalize_draft(draft: dict[str, Any], *, slug: str | None = None, basename: str | None = None) -> dict[str, Any]:
    if slug:
        draft["slug"] = slugify(str(draft.get("slug") or slug))
    if basename:
        draft["transcript_basename"] = basename
        metadata = transcript_index().get(f"{basename}.txt".lower(), {})
        source_title = str(metadata.get("title") or "").strip()
        if source_title:
            draft["source_title"] = source_title
            draft.setdefault("target_query", source_title)
        if metadata.get("video_id"):
            draft["source_video_id"] = str(metadata["video_id"])
        source_url = metadata.get("youtube_url")
        if not source_url and metadata.get("video_id"):
            source_url = f"https://www.youtube.com/watch?v={metadata['video_id']}"
        if source_url:
            draft["source_url"] = str(source_url)
    if "readTime" not in draft and "content" in draft:
        words = len(re.findall(r"\w+", str(draft["content"])))
        draft["readTime"] = f"{max(1, round(words / 200))} min read"
    if "date" not in draft:
        draft["date"] = datetime.now().strftime("%Y-%m-%d")
    raw_tags = draft.get("tags", [])
    if isinstance(raw_tags, str):
        raw_tags = [part.strip() for part in raw_tags.split(",")]
    if not isinstance(raw_tags, list):
        raw_tags = []
    tags: list[str] = []
    for value in raw_tags:
        tag = re.sub(r"\s+", " ", str(value)).strip().strip("#")
        if tag and tag.lower() not in {item.lower() for item in tags}:
            tags.append(tag)
    if not tags:
        source = str(draft.get("source_title") or draft.get("title") or "").lower()
        for tag, needle in (
            ("Speediance", "speediance"), ("Tonal", "tonal"), ("AEKE", "aeke"),
            ("WHOOP", "whoop"), ("Garmin", "garmin"), ("BJJ", "jiu-jitsu"),
            ("BJJ", "bjj"), ("Running", "running"),
        ):
            if needle in source and tag.lower() not in {item.lower() for item in tags}:
                tags.append(tag)
    draft["tags"] = tags[:6]
    return draft


def save_pending(draft: dict[str, Any]) -> None:
    PENDING.write_text(json.dumps(draft, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def provider_order(primary: str, *fallbacks: str) -> list[str]:
    providers: list[str] = []
    for name in [primary, *fallbacks]:
        if name and name not in providers:
            providers.append(name)
    return providers


def quarantine_pending(stage: str, reason: str) -> Path:
    FAILED_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    slug = "unknown"
    try:
        draft = json.loads(PENDING.read_text(encoding="utf-8"))
        slug = slugify(str(draft.get("slug") or slug)) or slug
    except Exception:
        pass
    target = FAILED_DIR / f"{stamp}_{slug}.json"
    PENDING.rename(target)
    log(stage, f"quarantined pending draft: {target} ({reason})")
    return target


def draft_stage() -> int:
    ensure_dirs()
    require_paths()
    if PENDING.exists():
        draft: dict[str, Any] | None = None
        reviewed = False
        try:
            draft = json.loads(PENDING.read_text(encoding="utf-8"))
            reviewed = draft.get("reviewed") is True
        except Exception:
            pass  # unreadable pending counts as unreviewed -> eligible for quarantine
        max_age_hours = float(os.environ.get("BLOG_PENDING_MAX_AGE_HOURS", "20"))
        age_hours = (datetime.now().timestamp() - PENDING.stat().st_mtime) / 3600
        if reviewed:
            if age_hours < max_age_hours:
                log("draft", f"reviewed draft awaiting publish (age {age_hours:.1f}h); skipping new draft")
                return 0
            if draft is None:
                raise RuntimeError("stale reviewed draft could not be read")
            draft["slug"] = slugify(str(draft["slug"]))
            if draft["slug"] not in read_used_slugs() or not remote_has_matching_draft(draft):
                raise RuntimeError(
                    "reviewed draft is still pending from the prior daily cycle and "
                    f"is not published on origin/main: {draft['slug']}"
                )
            dirty_mock = git_status(["frontend/src/data/mock.js"])
            if dirty_mock:
                raise RuntimeError(
                    "prior-cycle post is on origin/main, but mock.js has uncommitted "
                    f"changes: {dirty_mock}"
                )
            build = frontend_build()
            if build.returncode != 0:
                raise RuntimeError(
                    "prior-cycle post is on origin/main, but frontend verification failed:\n"
                    f"{build.stdout}\n{build.stderr}"
                )
            finalize_published_draft(draft)
            log(
                "draft",
                f"recovered prior-cycle publication {draft['slug']}; continuing with today's draft",
            )
            notify_message(
                "draft",
                "[BLOG PIPELINE RECOVERY] Reconciled prior-cycle post "
                f"{draft['slug']} and continued today's daily publishing cycle.",
            )
        elif age_hours >= max_age_hours:
            quarantine_pending("draft", f"stale for {age_hours:.1f}h")
        else:
            log("draft", f"{PENDING} already exists; skipping new draft")
            return 0
    today = datetime.now().strftime("%Y-%m-%d")
    if has_post_dated(today):
        log("draft", f"post dated {today} already exists; skipping duplicate daily draft")
        return 0

    sync_transcript_backlog()
    usable = usable_transcripts()
    if not usable:
        log("draft", "no unused transcripts found — content queue exhausted")
        check_content_runway(0)
        return 0
    transcript_path, slug = usable[0]
    check_content_runway(len(usable) - 1)
    basename = transcript_path.stem
    source_metadata = transcript_metadata(transcript_path)
    source_title = str(source_metadata.get("title") or basename.replace("_", " "))
    source_url = str(
        source_metadata.get("youtube_url")
        or (
            f"https://www.youtube.com/watch?v={source_metadata['video_id']}"
            if source_metadata.get("video_id")
            else ""
        )
    )
    source_description = str(source_metadata.get("description") or "")[:2000]
    char_limit = int(os.environ.get("BLOG_TRANSCRIPT_CHAR_LIMIT", "30000"))
    transcript = transcript_path.read_text(encoding="utf-8", errors="ignore")[:char_limit]
    today = datetime.now().strftime("%Y-%m-%d")
    categories = ", ".join(sorted(VALID_CATEGORIES))
    prompt = f"""You are writing a blog post for tobyonfitnesstech.com.

Source transcript filename: {basename}
Source video title: {source_title}
Source video URL: {source_url or "not available"}
Source video description: {source_description or "not available"}
Use this exact slug: {slug}
Use this exact date: {today}
Valid categories: {categories}

Transcript (first-party source evidence; do not invent unsupported numbers,
injuries, product specifications, prices, tests, ownership experience, or events):
---
{transcript}
---

Comparison-first editorial guidance:
- If the source compares products or asks which one is better, lead with a direct
  answer before background or scene-setting.
- Include a compact comparison table when the transcript supports one.
- State who should choose each option and the deciding tradeoff.
- Link claims only to facts in the transcript; never invent measurements,
  specifications, prices, test results, or ownership experience.

People-first search guidance:
- This is Toby's own channel. Use first-person voice only for Toby's supported
  experiences. Do not call him "the narrator", "the speaker", or "the author".
- Keep quotes and experiences from other people attributed to those people.
- Never convert a community reaction into a product test, ownership claim,
  spec comparison, medical protocol, or recommendation the source did not make.
- A table is optional; never invent cells to fill a four-column template.
- Choose one natural target query that matches the source and answer it in the
  opening paragraph. Do not stuff keyword variants.
- Use a specific 45-70 character title; remove YouTube clickbait phrasing.
- Make the excerpt a useful 140-160 character search description.
- Use descriptive H2/H3 headings, concrete first-person evidence, and a concise
  comparison table only when the transcript supports one.
- Include a natural link to the source video when a URL is available.
- Do not create filler sections just to reach a word count.

Write the strongest standalone article supported by the transcript. Return ONLY valid JSON:
{{
  "slug": "{slug}",
  "title": "<specific natural search title, 45-70 characters>",
  "target_query": "<one primary reader query>",
  "excerpt": "<useful 140-160 character description>",
  "category": "<one valid category exactly>",
  "date": "{today}",
  "readTime": "<X min read>",
  "tags": ["<3-6 specific topic entities>"],
  "content": "<substantial blog post HTML, usually 900-1600 words, using p, h2, h3, ul, li, table and a only when useful>"
}}

The response must parse with Python json.loads exactly as returned. Use only
bare HTML tags without attributes, encode line breaks as \\n, and JSON-escape
every double quote inside a string value."""
    primary_provider = os.environ.get("BLOG_DRAFT_PROVIDER", "minimax")
    timeout = int(os.environ.get("BLOG_DRAFT_TIMEOUT", "600"))
    errors: list[str] = []
    for provider in provider_order(primary_provider, "google"):
        log("draft", f"generating draft from {basename} with {provider}")
        try:
            response = freecall(prompt, provider=provider, timeout=timeout)
            draft = normalize_draft(extract_json_object(response), slug=slug, basename=basename)
            validate_draft(draft, require_review=False)
            save_pending(draft)
            log("draft", f"saved pending draft: {draft['slug']}")
            return 0
        except Exception as exc:
            errors.append(f"{provider}: {exc}")
            log("draft", f"provider {provider} produced unusable draft: {str(exc)[:300]}")
    try:
        log("draft", "falling back to local exo model")
        response = exo_generate(prompt, timeout=timeout)
        draft = normalize_draft(extract_json_object(response), slug=slug, basename=basename)
        validate_draft(draft, require_review=False)
        save_pending(draft)
        log("draft", f"saved pending draft: {draft['slug']}")
        return 0
    except Exception as exc:
        errors.append(f"exo: {exc}")
    raise RuntimeError("draft failed with all providers: " + " | ".join(errors))


def review_stage() -> int:
    ensure_dirs()
    require_paths()
    if not PENDING.exists():
        log("review", "no pending draft; nothing to review")
        return 0
    draft = json.loads(PENDING.read_text(encoding="utf-8"))
    if draft.get("reviewed") is True:
        log("review", f"{draft.get('slug', 'unknown')} already reviewed")
        ensure_thumbnail(draft)
        return 0

    today = datetime.now().strftime("%Y-%m-%d")
    categories = json.dumps(sorted(VALID_CATEGORIES))
    prompt = f"""You are a quality reviewer for tobyonfitnesstech.com.

Today's date: {today}
Valid categories: {categories}

Here is a draft JSON object:
{json.dumps(draft, ensure_ascii=False)}

Fix all issues and return ONLY the corrected JSON object. Rules:
- date must be {today}
- category must be exactly one valid category
- title must be specific, grammatical, natural, and 45-70 characters
- target_query must be one natural reader query, not a keyword list
- excerpt must be a useful 140-160 character search description
- content must be substantial people-first HTML, normally 900-1600 words,
  without padding or claims not supported by the source
- tags must contain 3-6 specific entities or topic phrases
- when the source has comparison intent, the opening must answer it directly and
  the article must explain who should choose each option without invented facts
- readTime should match the content at about 200 words per minute
- preserve slug, transcript_basename, source_title, source_video_id, source_url,
  target_query, and tags
- add "reviewed": true"""
    timeout = int(os.environ.get("BLOG_REVIEW_TIMEOUT", "600"))
    errors: list[str] = []
    for provider in provider_order(os.environ.get("BLOG_REVIEW_PROVIDER", "google"), "google", "minimax"):
        log("review", f"reviewing {draft.get('slug', 'unknown')} with {provider}")
        try:
            response = generate_text(prompt, stage="review", provider=provider, timeout=timeout)
            fixed = normalize_draft(extract_json_object(response))
            for field in (
                "slug", "transcript_basename", "source_title", "source_video_id",
                "source_url", "target_query",
            ):
                if draft.get(field):
                    fixed[field] = draft[field]
            if draft.get("tags") and not fixed.get("tags"):
                fixed["tags"] = draft["tags"]
            fixed["reviewed"] = True
            validate_draft(fixed, require_review=True)
            save_pending(fixed)
            ensure_thumbnail(fixed)
            log("review", f"review complete: {fixed['slug']}")
            return 0
        except Exception as exc:
            errors.append(f"{provider}: {exc}")
            log("review", f"provider {provider} produced unusable review: {str(exc)[:300]}")
    raise RuntimeError("review failed with all providers: " + " | ".join(errors))


def validate_draft(draft: dict[str, Any], *, require_review: bool) -> None:
    errors = []
    for field in ["slug", "title", "excerpt", "category", "date", "readTime", "content"]:
        if not draft.get(field):
            errors.append(f"missing {field}")
    if draft.get("category") not in VALID_CATEGORIES:
        errors.append(f"invalid category: {draft.get('category')}")
    try:
        post_date = datetime.strptime(str(draft.get("date", "")), "%Y-%m-%d")
        if abs((datetime.now() - post_date).days) > 7:
            errors.append(f"date is not within 7 days: {draft.get('date')}")
    except ValueError:
        errors.append(f"invalid date: {draft.get('date')}")
    content = str(draft.get("content", ""))
    if len(content) < 500:
        errors.append(f"content too short: {len(content)} chars")
    title = str(draft.get("title", "")).strip()
    if title and len(title) > 75:
        errors.append(f"title too long: {len(title)} characters")
    excerpt = str(draft.get("excerpt", "")).strip()
    if require_review and not 120 <= len(excerpt) <= 180:
        errors.append(f"excerpt should be 120-180 characters: {len(excerpt)}")
    words = len(re.findall(r"\b\w+\b", re.sub(r"<[^>]+>", " ", content)))
    if require_review and words < 750:
        errors.append(f"reviewed content too short: {words} words")
    if require_review and "<h2" not in content.lower():
        errors.append("reviewed content has no H2 structure")
    tags = draft.get("tags")
    if require_review and (not isinstance(tags, list) or not 2 <= len(tags) <= 6):
        errors.append("reviewed draft must have 2-6 tags")
    if require_review and draft.get("reviewed") is not True and os.environ.get("BLOG_ALLOW_UNREVIEWED") != "1":
        errors.append("draft has not been reviewed")
    if errors:
        raise RuntimeError("; ".join(errors))


def ensure_thumbnail(draft: dict[str, Any]) -> Path:
    slug = slugify(str(draft["slug"]))
    thumb_path = THUMBS_DIR / f"{slug}.jpg"
    if thumb_path.exists():
        draft["thumbnail"] = f"/images/blog/{slug}.jpg"
        save_pending(draft)
        return thumb_path
    hero = SCRIPTS_DIR / "generate_blog_hero.py"
    if hero.exists() and os.environ.get("BLOG_DISABLE_HERO") != "1":
        proc = run(
            [
                "python3",
                str(hero),
                "--title",
                str(draft["title"]),
                "--category",
                str(draft["category"]),
                "--slug",
                slug,
                "--excerpt",
                str(draft.get("excerpt", "")),
                "--out",
                str(thumb_path),
            ],
            timeout=int(os.environ.get("BLOG_HERO_TIMEOUT", "420")),
        )
        if proc.returncode == 0 and thumb_path.exists():
            draft["thumbnail"] = f"/images/blog/{slug}.jpg"
            save_pending(draft)
            log("review", f"hero image generated: {thumb_path}")
            return thumb_path
        log(
            "review",
            f"hero image generation failed, falling back to card: {(proc.stderr or proc.stdout).strip()[:400]}",
        )
    generator = SCRIPTS_DIR / "generate_blog_thumbnail.py"
    if not generator.exists():
        raise RuntimeError(f"thumbnail generator missing: {generator}")
    proc = run(
        [
            "python3",
            str(generator),
            "--title",
            str(draft["title"]),
            "--category",
            str(draft["category"]),
            "--slug",
            slug,
            "--out",
            str(thumb_path),
        ],
        timeout=120,
    )
    if proc.returncode != 0 or not thumb_path.exists():
        raise RuntimeError(f"thumbnail generation failed: {(proc.stderr or proc.stdout).strip()}")
    draft["thumbnail"] = f"/images/blog/{slug}.jpg"
    save_pending(draft)
    log("review", f"thumbnail generated (fallback card): {thumb_path}")
    return thumb_path


def js_entry(draft: dict[str, Any]) -> str:
    slug = slugify(str(draft["slug"]))
    thumbnail = draft.get("thumbnail") or f"/images/blog/{slug}.jpg"
    return """  {{
    id: "{id}",
    slug: "{slug}",
    title: {title},
    excerpt: {excerpt},
    category: "{category}",
    date: "{date}",
    readTime: "{read_time}",
    thumbnail: {thumbnail},
    source_video_id: {source_video_id},
    source_url: {source_url},
    content: {content},
    featured: false,
    tags: {tags},
  }},""".format(
        id=slug.replace("-", "_"),
        slug=slug,
        title=json.dumps(draft["title"], ensure_ascii=False),
        excerpt=json.dumps(draft["excerpt"], ensure_ascii=False),
        category=draft["category"],
        date=draft["date"],
        read_time=draft.get("readTime", "5 min read"),
        thumbnail=json.dumps(thumbnail, ensure_ascii=False),
        source_video_id=json.dumps(source_video_id(draft)),
        source_url=json.dumps(draft.get("source_url") or "https://www.youtube.com/watch?v=" + source_video_id(draft)),
        content=json.dumps(draft["content"], ensure_ascii=False),
        tags=json.dumps(draft.get("tags", []), ensure_ascii=False),
    )


def git_status(paths: list[str]) -> str:
    proc = run(["git", "status", "--porcelain", "--", *paths], cwd=WEBSITE_DIR, timeout=60)
    if proc.returncode != 0:
        raise RuntimeError(f"git status failed: {proc.stderr.strip()}")
    return proc.stdout.strip()


def remote_has_matching_draft(draft: dict[str, Any]) -> bool:
    fetch = run(["git", "fetch", "origin", "main"], cwd=WEBSITE_DIR, timeout=180)
    if fetch.returncode != 0:
        raise RuntimeError(f"git fetch origin main failed:\n{fetch.stdout}\n{fetch.stderr}")

    remote = run(
        ["git", "show", "origin/main:frontend/src/data/mock.js"],
        cwd=WEBSITE_DIR,
        timeout=60,
    )
    if remote.returncode != 0:
        raise RuntimeError(f"could not read mock.js from origin/main:\n{remote.stderr}")

    slug = str(draft["slug"])
    marker = f'slug: "{slug}"'
    index = remote.stdout.find(marker)
    if index == -1:
        return False

    nearby = remote.stdout[max(0, index - 1500): index + 3000]
    if str(draft["title"]) not in nearby:
        raise RuntimeError(
            f"slug exists on origin/main but title does not match pending draft: {slug}"
        )
    return True


def finalize_published_draft(draft: dict[str, Any]) -> None:
    existing = BLACKLIST.read_text(encoding="utf-8") if BLACKLIST.exists() else ""
    additions: list[str] = []
    transcript_basename = str(draft.get("transcript_basename", "")).strip()
    if transcript_basename and transcript_basename not in existing:
        additions.append(
            f"{transcript_basename}  # published: {draft['slug']} "
            f"on {datetime.now().strftime('%Y-%m-%d')}"
        )
    slug_marker = f"# slug: {draft['slug']}"
    if slug_marker not in existing:
        additions.append(
            f"{slug_marker} published {datetime.now().strftime('%Y-%m-%d')}"
        )
    if additions:
        with BLACKLIST.open("a", encoding="utf-8") as fh:
            fh.write("\n".join(additions) + "\n")
    PENDING.unlink(missing_ok=True)


def push_main_with_rebase_retry() -> None:
    push = run(["git", "push", "origin", "main"], cwd=WEBSITE_DIR, timeout=300)
    if push.returncode == 0:
        return

    output = f"{push.stdout}\n{push.stderr}"
    retryable = any(
        marker in output.lower()
        for marker in ("fetch first", "non-fast-forward", "rejected")
    )
    if not retryable:
        raise RuntimeError(f"git push origin main failed:\n{output}")

    rebase = run(
        ["git", "pull", "--rebase", "--autostash", "origin", "main"],
        cwd=WEBSITE_DIR,
        timeout=300,
    )
    if rebase.returncode != 0:
        run(["git", "rebase", "--abort"], cwd=WEBSITE_DIR, timeout=60)
        raise RuntimeError(
            "git push was rejected and automatic rebase failed; rebase was aborted:\n"
            f"{rebase.stdout}\n{rebase.stderr}"
        )

    build = frontend_build()
    if build.returncode != 0:
        raise RuntimeError(f"frontend build failed after rebase:\n{build.stdout}\n{build.stderr}")

    retry = run(["git", "push", "origin", "main"], cwd=WEBSITE_DIR, timeout=300)
    if retry.returncode != 0:
        raise RuntimeError(f"git push origin main failed after rebase:\n{retry.stdout}\n{retry.stderr}")


def publish_stage() -> int:
    ensure_dirs()
    require_paths()
    if not PENDING.exists():
        today = datetime.now().strftime("%Y-%m-%d")
        if has_post_dated(today):
            log("publish", f"no pending draft; post dated {today} already exists")
            return 0
        raise RuntimeError(
            f"no pending draft and no post dated {today}; daily publication target missed"
        )
    draft = json.loads(PENDING.read_text(encoding="utf-8"))
    draft["slug"] = slugify(str(draft["slug"]))
    validate_draft(draft, require_review=True)
    if draft["slug"] in read_used_slugs():
        if not remote_has_matching_draft(draft):
            raise RuntimeError(
                f"slug exists locally but not as a matching post on origin/main: {draft['slug']}"
            )
        dirty_mock = git_status(["frontend/src/data/mock.js"])
        if dirty_mock:
            raise RuntimeError(
                f"matching slug is published, but mock.js has uncommitted changes: {dirty_mock}"
            )
        build = frontend_build()
        if build.returncode != 0:
            raise RuntimeError(
                f"matching slug is on origin/main, but frontend verification failed:\n"
                f"{build.stdout}\n{build.stderr}"
            )
        log("publish", "frontend build passed for recovered publication")
        finalize_published_draft(draft)
        log(
            "publish",
            f"recovered already-published draft https://tobyonfitnesstech.com/blog/{draft['slug']}",
        )
        notify_message(
            "publish",
            "[BLOG PIPELINE RECOVERY] Reconciled already-published post "
            f"https://tobyonfitnesstech.com/blog/{draft['slug']}",
        )
        today = datetime.now().strftime("%Y-%m-%d")
        if str(draft.get("date")) != today:
            raise RuntimeError(
                f"recovered prior-cycle post dated {draft.get('date')}, but no post "
                f"was published for {today}; daily publication target missed"
            )
        return 0
    assert_unpublished_source(draft, read_used_video_ids())
    dirty_mock = git_status(["frontend/src/data/mock.js"])
    if dirty_mock:
        raise RuntimeError(f"mock.js has uncommitted changes; refusing publish: {dirty_mock}")

    thumb_path = ensure_thumbnail(draft)
    original_mock = MOCK_JS.read_text(encoding="utf-8")
    insert_at = original_mock.rfind("\n];")
    if insert_at == -1:
        raise RuntimeError("could not find blogPosts array ending in mock.js")
    MOCK_JS.write_text(original_mock[:insert_at] + "\n" + js_entry(draft) + original_mock[insert_at:], encoding="utf-8")
    log("publish", f"injected {draft['slug']} into mock.js")

    build = frontend_build()
    if build.returncode != 0:
        MOCK_JS.write_text(original_mock, encoding="utf-8")
        raise RuntimeError(f"frontend build failed; mock.js restored:\n{build.stdout}\n{build.stderr}")
    log("publish", "frontend build passed")

    rel_thumb = f"frontend/public/images/blog/{thumb_path.name}"
    for cmd in [
        ["git", "add", "frontend/src/data/mock.js", rel_thumb],
        ["git", "commit", "-m", f"Blog: add post '{draft['slug']}' ({datetime.now().strftime('%Y-%m-%d')})"],
    ]:
        proc = run(cmd, cwd=WEBSITE_DIR, timeout=300)
        if proc.returncode != 0:
            raise RuntimeError(f"{' '.join(cmd)} failed:\n{proc.stdout}\n{proc.stderr}")
    push_main_with_rebase_retry()
    finalize_published_draft(draft)
    published_url = f"https://tobyonfitnesstech.com/blog/{draft['slug']}"
    log("publish", f"published {published_url}")
    notify_message(
        "publish",
        f"[BLOG PIPELINE SUCCESS] Published today's post: {published_url}",
    )
    return 0


def smoke_stage() -> int:
    ensure_dirs()
    require_paths()
    transcripts = {
        path.resolve()
        for directory in (TRANSCRIPTS_DIR, SYNCED_TRANSCRIPTS_DIR)
        if directory.exists()
        for path in directory.glob("*.txt")
    }
    usable = usable_transcripts()
    used = read_used_slugs()
    dates = re.findall(r'\bdate:\s*"(\d{4}-\d{2}-\d{2})"', MOCK_JS.read_text(encoding="utf-8"))
    latest_date = max(dates) if dates else "unknown"
    log("smoke", f"workspace={WORKSPACE_ROOT}")
    log("smoke", f"website={WEBSITE_DIR}")
    log(
        "smoke",
        f"transcripts={len(transcripts)} usable={len(usable)} "
        f"used_slugs={len(used)} latest_blog_date={latest_date}",
    )
    response = generate_text(
        "Reply with PONG only.",
        stage="smoke",
        provider=os.environ.get("BLOG_SMOKE_PROVIDER", "minimax"),
        timeout=int(os.environ.get("BLOG_SMOKE_TIMEOUT", "90")),
    )
    if "PONG" not in response.upper():
        raise RuntimeError(f"freecall smoke check returned unexpected output: {response!r}")
    log("smoke", "freecall model check passed")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("stage", choices=["smoke", "draft", "review", "publish"])
    args = parser.parse_args()
    try:
        if args.stage == "smoke":
            return smoke_stage()
        if args.stage == "draft":
            return draft_stage()
        if args.stage == "review":
            return review_stage()
        if args.stage == "publish":
            return publish_stage()
    except Exception as exc:
        log(args.stage, f"ERROR: {exc}")
        notify_failure(args.stage, exc)
        return 1
    return 2


if __name__ == "__main__":
    sys.exit(main())
