#!/usr/bin/env python3
"""Keep the blog transcript backlog synchronized with the YouTube catalog.

The old importer copied a fixed 101-file snapshot from an obsolete Mac path.
This version reads the live ``videos.json`` catalog, fetches English captions
for missing long-form videos, and maintains an inspectable topic queue outside
the website Git checkout.
"""

from __future__ import annotations

import argparse
import html
import json
import math
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable


CHANNEL_ID = "UCmSwMp2gPo5PGl32d4oCu-Q"
MIN_LONG_FORM_SECONDS = 180
DEFAULT_RETRY_DAYS = 7

SEARCH_INTENT_RULES: tuple[tuple[re.Pattern[str], int], ...] = (
    (re.compile(r"\b(vs\.?|versus|comparison|compared?)\b", re.I), 70),
    (re.compile(r"\b(review|worth it|recommend(?:ed)?|best)\b", re.I), 50),
    (re.compile(r"\b(how to|setup|guide|tutorial|fix|problem|bugs?)\b", re.I), 38),
    (re.compile(r"\b(what|why|which|explained|truth|scam)\b", re.I), 24),
)
DOMAIN_TERMS = re.compile(
    r"\b(speediance|gym monster|tonal|aeke|whoop|garmin|oura|fitness tracker|"
    r"jiu[- ]?jitsu|bjj|strength|progressive overload|running|recovery)\b",
    re.I,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utc_now().replace(microsecond=0).isoformat().replace("+00:00", "Z")


def atomic_write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temp.replace(path)


def atomic_write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(value, encoding="utf-8")
    temp.replace(path)


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"could not read JSON {path}: {exc}") from exc


def parse_duration_seconds(video: dict[str, Any]) -> int:
    raw = str(video.get("duration") or video.get("duration_formatted") or "").strip()
    if raw:
        try:
            parts = [int(part) for part in raw.split(":")]
            seconds = 0
            for part in parts:
                seconds = seconds * 60 + part
            return seconds
        except ValueError:
            pass

    iso = str(video.get("duration_iso") or "")
    match = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso)
    if match:
        hours, minutes, seconds = (int(value or 0) for value in match.groups())
        return hours * 3600 + minutes * 60 + seconds
    return 0


def clean_title(value: Any) -> str:
    return re.sub(r"\s+", " ", html.unescape(str(value or ""))).strip()


def safe_filename(title: str) -> str:
    value = re.sub(r"[\\/:*?\"<>|]", " ", title)
    value = re.sub(r"[^A-Za-z0-9()&+'.,! -]+", " ", value)
    value = re.sub(r"\s+", "_", value).strip("._-")
    return value[:150] or "youtube-video"


def topic_score(video: dict[str, Any]) -> int:
    title = clean_title(video.get("title"))
    score = 0
    for pattern, weight in SEARCH_INTENT_RULES:
        if pattern.search(title):
            score += weight
    if DOMAIN_TERMS.search(title):
        score += 22

    duration = parse_duration_seconds(video)
    if 8 * 60 <= duration <= 45 * 60:
        score += 20
    elif duration > 45 * 60:
        score += 8
    elif duration >= MIN_LONG_FORM_SECONDS:
        score += 12

    views = max(0, int(video.get("viewCount") or 0))
    score += min(16, int(math.log2(views + 1) * 2))
    return score


def load_catalog(path: Path) -> list[dict[str, Any]]:
    raw = load_json(path, {})
    videos = raw.get("videos", []) if isinstance(raw, dict) else raw
    if not isinstance(videos, list):
        raise RuntimeError(f"YouTube catalog has no video list: {path}")

    unique: dict[str, dict[str, Any]] = {}
    for value in videos:
        if not isinstance(value, dict):
            continue
        video_id = str(value.get("id") or value.get("video_id") or "").strip()
        title = clean_title(value.get("title"))
        if not video_id or not title:
            continue
        item = dict(value)
        item["id"] = video_id
        item["title"] = title
        item["duration_seconds"] = parse_duration_seconds(item)
        item["topic_score"] = topic_score(item)
        unique.setdefault(video_id, item)
    return list(unique.values())


def load_indexes(paths: Iterable[Path]) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    writable_entries: list[dict[str, Any]] = []
    combined: dict[str, dict[str, Any]] = {}
    for position, path in enumerate(paths):
        values = load_json(path, [])
        if not isinstance(values, list):
            raise RuntimeError(f"transcript index is not a list: {path}")
        for value in values:
            if not isinstance(value, dict):
                continue
            video_id = str(value.get("video_id") or "").strip()
            if video_id:
                combined[video_id] = value
            if position == 0:
                writable_entries.append(value)
    return writable_entries, combined


def load_state(path: Path) -> dict[str, Any]:
    value = load_json(path, {"failures": {}})
    if not isinstance(value, dict):
        value = {"failures": {}}
    if not isinstance(value.get("failures"), dict):
        value["failures"] = {}
    return value


def eligible_for_article(video: dict[str, Any]) -> bool:
    return not bool(video.get("is_short")) and int(video.get("duration_seconds") or 0) >= MIN_LONG_FORM_SECONDS


def retry_is_due(video_id: str, state: dict[str, Any]) -> bool:
    failure = state.get("failures", {}).get(video_id)
    if not isinstance(failure, dict):
        return True
    retry_after = str(failure.get("retry_after") or "")
    if not retry_after:
        return True
    try:
        return datetime.fromisoformat(retry_after.replace("Z", "+00:00")) <= utc_now()
    except ValueError:
        return True


def normalize_transcript(snippets: Iterable[Any]) -> str:
    lines: list[str] = []
    previous = ""
    for snippet in snippets:
        text = html.unescape(str(getattr(snippet, "text", "") or ""))
        text = re.sub(r"\s+", " ", text).strip()
        if not text or text == previous or text in {"[Music]", "[Applause]"}:
            continue
        lines.append(text)
        previous = text
    return "\n".join(lines).strip() + "\n"


def fetch_transcript(video_id: str) -> tuple[str, str]:
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError as exc:
        raise RuntimeError(
            "youtube-transcript-api is missing; run this with the blog pipeline venv"
        ) from exc

    api = YouTubeTranscriptApi()
    transcript = api.fetch(video_id, languages=["en", "en-US", "en-GB"])
    text = normalize_transcript(transcript)
    language = str(getattr(transcript, "language_code", "en") or "en")
    if len(text.split()) < 40:
        raise RuntimeError(f"caption transcript too short ({len(text.split())} words)")
    return text, language


def filename_for(video: dict[str, Any], used_files: dict[str, str]) -> str:
    video_id = str(video["id"])
    base = safe_filename(str(video["title"]))
    filename = f"{base}.txt"
    owner = used_files.get(filename.lower())
    if owner and owner != video_id:
        filename = f"{base}__{video_id}.txt"
    return filename


def queue_item(video: dict[str, Any], indexed_ids: set[str], state: dict[str, Any]) -> dict[str, Any]:
    video_id = str(video["id"])
    if video_id in indexed_ids:
        status = "transcript_ready"
    elif bool(video.get("is_short")):
        status = "short_enrichment_candidate"
    elif int(video.get("duration_seconds") or 0) < MIN_LONG_FORM_SECONDS:
        status = "too_short_for_article"
    elif not retry_is_due(video_id, state):
        status = "caption_retry_wait"
    else:
        status = "needs_transcript"
    return {
        "video_id": video_id,
        "title": video["title"],
        "published_at": video.get("publishedAt"),
        "duration_seconds": video.get("duration_seconds", 0),
        "view_count": int(video.get("viewCount") or 0),
        "is_short": bool(video.get("is_short")),
        "topic_score": int(video.get("topic_score") or 0),
        "status": status,
        "url": f"https://www.youtube.com/watch?v={video_id}",
    }


def parse_args() -> argparse.Namespace:
    repo_root = Path(__file__).resolve().parents[1]
    workspace_root = Path(os.environ.get("BLOG_WORKSPACE_ROOT", str(repo_root.parent)))
    draft_root = Path(os.environ.get("BLOG_DRAFT_DIR", str(workspace_root / "blog-drafts")))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--videos", type=Path, default=repo_root / "frontend/src/data/videos.json")
    parser.add_argument("--legacy-index", type=Path, default=repo_root / "transcript_index.json")
    parser.add_argument("--index", type=Path, default=draft_root / "transcript_index.json")
    parser.add_argument("--output-dir", type=Path, default=draft_root / "transcripts")
    parser.add_argument("--queue", type=Path, default=draft_root / "topic_queue.json")
    parser.add_argument("--state", type=Path, default=draft_root / "transcript_sync_state.json")
    parser.add_argument("--max-new", type=int, default=3, help="maximum transcripts fetched per run; 0 means unlimited")
    parser.add_argument("--retry-days", type=int, default=DEFAULT_RETRY_DAYS)
    parser.add_argument("--include-shorts", action="store_true", help="allow individual Shorts as article sources")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sleep", type=float, default=0.35, help="seconds between transcript requests")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    catalog = load_catalog(args.videos)
    writable, combined = load_indexes([args.index, args.legacy_index])
    state = load_state(args.state)
    indexed_ids = set(combined)
    used_files = {
        str(item.get("file") or "").lower(): str(item.get("video_id") or "")
        for item in combined.values()
        if item.get("file")
    }

    candidates = [
        video
        for video in catalog
        if str(video["id"]) not in indexed_ids
        and retry_is_due(str(video["id"]), state)
        and (args.include_shorts or eligible_for_article(video))
    ]
    candidates.sort(
        key=lambda video: (
            -int(video.get("topic_score") or 0),
            -int(video.get("viewCount") or 0),
            str(video.get("publishedAt") or ""),
        )
    )
    selected = candidates if args.max_new == 0 else candidates[: max(0, args.max_new)]

    fetched = 0
    failures = 0
    if not args.dry_run:
        args.output_dir.mkdir(parents=True, exist_ok=True)
        for number, video in enumerate(selected, 1):
            video_id = str(video["id"])
            print(f"[{number}/{len(selected)}] {video['title']} ({video_id})", flush=True)
            try:
                text, language = fetch_transcript(video_id)
                filename = filename_for(video, used_files)
                atomic_write_text(args.output_dir / filename, text)
                entry = {
                    "file": filename,
                    "title": video["title"],
                    "description": str(video.get("description") or "")[:2000],
                    "date": str(video.get("publishedAt") or "")[:10],
                    "video_id": video_id,
                    "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
                    "word_count": len(text.split()),
                    "duration_seconds": int(video.get("duration_seconds") or 0),
                    "view_count": int(video.get("viewCount") or 0),
                    "topic_score": int(video.get("topic_score") or 0),
                    "source": "youtube-captions",
                    "language": language,
                    "synced_at": iso_now(),
                }
                writable.append(entry)
                combined[video_id] = entry
                indexed_ids.add(video_id)
                used_files[filename.lower()] = video_id
                state["failures"].pop(video_id, None)
                fetched += 1
                atomic_write_json(args.index, writable)
                print(f"  saved {filename} ({entry['word_count']} words)")
            except Exception as exc:
                retry_after = utc_now() + timedelta(days=max(1, args.retry_days))
                state["failures"][video_id] = {
                    "title": video["title"],
                    "last_attempt": iso_now(),
                    "retry_after": retry_after.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
                    "error": str(exc)[:500],
                }
                failures += 1
                print(f"  skipped: {exc}", file=sys.stderr)
            atomic_write_json(args.state, state)
            if number < len(selected) and args.sleep > 0:
                time.sleep(args.sleep)

    queue = [queue_item(video, indexed_ids, state) for video in catalog]
    queue.sort(key=lambda item: (-item["topic_score"], -item["view_count"], item["title"].lower()))
    summary = {
        "catalog_total": len(catalog),
        "transcript_ready": sum(item["status"] == "transcript_ready" for item in queue),
        "long_form_needing_transcript": sum(item["status"] == "needs_transcript" for item in queue),
        "short_enrichment_candidates": sum(item["status"] == "short_enrichment_candidate" for item in queue),
        "caption_retry_wait": sum(item["status"] == "caption_retry_wait" for item in queue),
        "fetched_this_run": fetched,
        "failed_this_run": failures,
    }
    document = {
        "generated_at": iso_now(),
        "channel_id": CHANNEL_ID,
        "strategy": "Long-form, search-intent videos become articles; Shorts enrich or update related articles instead of creating thin duplicate pages.",
        "summary": summary,
        "items": queue,
    }
    if not args.dry_run:
        atomic_write_json(args.queue, document)

    print(json.dumps(summary, indent=2))
    remaining = [item for item in queue if item["status"] == "needs_transcript"][:10]
    if remaining:
        print("Top remaining long-form candidates:")
        for item in remaining:
            print(f"  {item['topic_score']:3d}  {item['title']} ({item['video_id']})")
    return 0 if failures == 0 or fetched > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
