#!/usr/bin/env python3
"""Import existing captions by verified YouTube ID; never generate speech from titles.

Pass --source-root repeatedly, in priority order (final masters before archives).
Only videos already in the website catalog are eligible. Writes require --apply.
"""
from __future__ import annotations
import argparse
import hashlib
import html
import json
import re
from datetime import datetime, timezone
from typing import Any
from pathlib import Path

CHANNEL_ID = 'UCmSwMp2gPo5PGl32d4oCu-Q'
VIDEO_ID = re.compile(r'^[A-Za-z0-9_-]{11}$')
TIMING = re.compile(r'(?P<a>\d{2}:\d{2}:\d{2}[,.]?\d{3})\s*-->\s*(?P<b>\d{2}:\d{2}:\d{2}[,.]?\d{3})')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def safe_filename(title: str) -> str:
    """Mirror fetch_transcripts.py: filesystem-safe title with title-preserving underscores."""
    value = re.sub(r'[\\/:*?"<>|]', ' ', title)
    value = re.sub(r'[^A-Za-z0-9()&+\'.,! -]+', ' ', value)
    value = re.sub(r'\s+', '_', value).strip('._-')
    return value[:150] or 'youtube-video'


def transcript_filename(video_id: str, title: str, used_names: dict[str, str]) -> str:
    """Build .txt matching fetch_transcripts.py conventions.

    The bare ``<video_id>.txt`` form was ambiguous: blog_pipeline slugified the
    stem to the video ID itself, producing unreadable slugs. The new form
    ``<safe_title>__<video_id>.txt`` keeps an inspectable title while staying
    unambiguous when two videos share one title. ``used_names`` maps existing
    lower-cased filenames to the owning video_id so renames and collisions are
    handled deterministically.
    """
    base = safe_filename(title)
    candidate = f'{base}__{video_id}.txt'
    owner = used_names.get(candidate.lower())
    if owner and owner != video_id:
        # Another video already owns this name; append a short hash for
        # disambiguation rather than overwriting.
        suffix = digest(video_id)[:6]
        candidate = f'{base}__{video_id}_{suffix}.txt'
    return candidate

def file_hash(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def seconds(value):
    h, m, s = value.replace(',', '.').split(':')
    if int(m) >= 60 or float(s) >= 60:
        raise ValueError('invalid caption time')
    return int(h) * 3600 + int(m) * 60 + float(s)

def parse_srt(raw):
    cues = []
    for block in re.split(r'\n\s*\n', raw.replace('\r\n', '\n').strip()):
        lines = block.splitlines()
        timing_index = next((i for i, line in enumerate(lines) if '-->' in line), None)
        if timing_index is None:
            if block.strip() not in ('WEBVTT', ''):
                raise ValueError('caption block has no timing')
            continue
        match = TIMING.search(lines[timing_index])
        if not match:
            raise ValueError('invalid caption timing')
        start, end = seconds(match['a']), seconds(match['b'])
        text = html.unescape(re.sub(r'<[^>]*>', '', ' '.join(lines[timing_index + 1:]))).strip()
        text = re.sub(r'\s+', ' ', text)
        if not text or end <= start or (cues and start < cues[-1]['start']):
            raise ValueError('empty or out-of-order caption')
        cues.append({'start': round(start, 3), 'end': round(end, 3), 'text': text})
    if not cues:
        raise ValueError('no caption cues')
    # Readable paragraphs retain the actual first/last cue timestamps.
    paragraphs = []
    for cue in cues:
        if not paragraphs or cue['start'] - paragraphs[-1]['start'] >= 35 or len(paragraphs[-1]['text']) > 650:
            paragraphs.append(dict(cue))
        else:
            paragraphs[-1]['text'] += ' ' + cue['text']
            paragraphs[-1]['end'] = cue['end']
    return paragraphs

def source_hash(video_id, segments):
    return digest(json.dumps({'video_id': video_id, 'segments': segments}, ensure_ascii=False, sort_keys=True).encode())

def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temp.replace(path)

def run(args):
    repo = args.repo.resolve()
    catalog = {v['id']: v for v in json.loads((repo / 'frontend/src/data/videos.json').read_text())['videos']
               if not v.get('is_live') and datetime.fromisoformat(v['publishedAt'].replace('Z', '+00:00')) <= datetime.now(timezone.utc)}
    index_path = repo / 'transcript_index.json'
    index = json.loads(index_path.read_text())
    indexed = {v['video_id']: v for v in index}
    selected, failures = {}, []
    records_root = repo / 'frontend/src/data/video-transcripts'
    for root in args.source_root:
        if not root.is_dir():
            raise FileNotFoundError(f'Source directory unavailable: {root}')
        for manifest in sorted(root.rglob('*.youtube-publish.json')):
            try:
                data = json.loads(manifest.read_text())
                video_id = data.get('video_id')
                if video_id not in catalog or video_id in selected or not VIDEO_ID.fullmatch(video_id):
                    continue
                if data.get('expected_channel_id') != CHANNEL_ID:
                    raise ValueError('channel identity mismatch')
                # An older sidecar may share a YouTube ID with its replacement.
                media = manifest.with_name(manifest.name.removesuffix('.youtube-publish.json'))
                captions = manifest.parent / 'captions.srt'
                if not captions.exists() or not media.exists():
                    raise ValueError('publishing package is missing captions or media')
                expected_hash = data.get('asset', {}).get('sha256')
                if not expected_hash:
                    raise ValueError('manifest lacks the media hash')
                caption_hash = file_hash(captions)
                if file_hash(media) != expected_hash:
                    raise ValueError('media bytes do not match the publishing manifest')
                segments = parse_srt(captions.read_text(encoding='utf-8-sig'))
                duration = float(data.get('duration_seconds') or 0)
                if duration and segments[-1]['end'] > duration + 2:
                    raise ValueError('captions exceed the final media duration')
                selected[video_id] = {
                    'schema_version': 1, 'video_id': video_id, 'language': 'en',
                    'source_hash': source_hash(video_id, segments), 'segments': segments,
                    'source': {'kind': 'local-publishing-captions', 'asset_sha256': expected_hash,
                               'caption_sha256': caption_hash, 'package': manifest.parent.name},
                }
            except (ValueError, OSError, TypeError) as exc:
                failures.append({'manifest': str(manifest), 'error': str(exc)})
    for index_file in args.backlog_index:
        entries = json.loads(index_file.read_text())
        for entry in entries:
            video_id = entry.get('video_id')
            if video_id not in catalog or video_id in selected or video_id in indexed:
                continue
            path = index_file.parent / 'transcripts' / entry['file']
            if path.resolve().parent != (index_file.parent / 'transcripts').resolve():
                raise ValueError('invalid backlog transcript path')
            text = path.read_text().strip()
            if not text:
                raise ValueError(f'Empty backlog transcript: {video_id}')
            segments = [{'text': text}]
            selected[video_id] = {'schema_version': 1, 'video_id': video_id, 'language': 'en',
                'source_hash': source_hash(video_id, segments), 'segments': segments,
                'source': {'kind': entry.get('source', 'youtube-captions'), 'caption_sha256': file_hash(path)}}
    if failures:
        result = {'selected': len(selected), 'changed': [], 'index_count': len(indexed), 'failures': failures, 'applied': False}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return result
    transcript_dir = repo / 'frontend/src/data/transcripts'
    # Build a fresh used-names map from disk so renames don't collide with
    # themselves on subsequent runs, and so we can detect the legacy
    # ``<video_id>.txt`` form for one-shot cleanup.
    used_names: dict[str, str] = {}
    legacy_bare_files: dict[str, Path] = {}
    if transcript_dir.exists():
        for existing in transcript_dir.glob('*.txt'):
            used_names.setdefault(existing.name.lower(), '')
            # A bare 11-char (YouTube-shaped) stem marks the legacy form.
            if VIDEO_ID.fullmatch(existing.stem):
                legacy_bare_files.setdefault(existing.stem, existing)
    # Wire up ownership of existing names from the index (and any files we
    # just discovered) so collisions resolve deterministically.
    for video_id, entry in indexed.items():
        name = entry.get('file')
        if name:
            used_names.setdefault(name.lower(), video_id)
    for video_id in catalog:
        if video_id not in used_names.values():
            bare = legacy_bare_files.get(video_id)
            if bare is not None:
                used_names[bare.name.lower()] = video_id
    changed: list[str] = []
    renamed: list[dict[str, str]] = []
    # Cover both freshly imported (`selected`) and previously indexed videos
    # whose on-disk file is still the legacy bare-ID form. Renames must run for
    # any catalog video with a usable source filename, regardless of whether
    # the source bytes changed.
    candidates: dict[str, dict[str, Any] | None] = {vid: None for vid in catalog}
    for video_id, record in selected.items():
        candidates[video_id] = record
    for video_id in candidates:
        record = candidates[video_id]
        path = records_root / f'{video_id}.json'
        text: str | None = '\n\n'.join(s['text'] for s in record['segments']) + '\n' if record else None
        if text is None and not path.exists():
            # No fresh import and no committed JSON record: nothing to rename.
            continue
        title = catalog[video_id].get('title') or video_id
        filename = transcript_filename(video_id, title, used_names)
        used_names.setdefault(filename.lower(), video_id)
        legacy_bare = legacy_bare_files.get(video_id)
        legacy_to_remove: Path | None = None
        if legacy_bare is not None and legacy_bare.name != filename:
            legacy_to_remove = legacy_bare
        plain_path = transcript_dir / filename
        if text is None:
            # Prefer the legacy bare file, then the existing new-name file.
            source_text_path = legacy_to_remove if legacy_to_remove is not None else plain_path
            if not source_text_path.exists():
                # No source bytes anywhere — don't synthesize text; skip.
                used_names.pop(filename.lower(), None)
                continue
            text = source_text_path.read_text(encoding='utf-8', errors='ignore')
        entry = {'file': filename, 'title': title,
            'date': catalog[video_id].get('publishedAt', '')[:10], 'video_id': video_id,
            'word_count': len(text.split()),
            'source': (record['source']['kind'] if record else indexed.get(video_id, {}).get('source', 'youtube-captions')),
            'source_hash': record['source_hash'] if record else indexed.get(video_id, {}).get('source_hash', '')}
        prior_entry = indexed.get(video_id) or {}
        prior_path = records_root / f'{video_id}.json'
        existing_record = json.loads(prior_path.read_text()) if prior_path.exists() else None
        if (prior_path.exists() and existing_record == (record or existing_record)
                and plain_path.exists() and plain_path.read_text(encoding='utf-8', errors='ignore') == text
                and prior_entry.get('file') == filename
                and not legacy_to_remove):
            continue
        changed.append(video_id)
        if legacy_to_remove is not None:
            renamed.append({'video_id': video_id, 'old_file': legacy_to_remove.name, 'new_file': filename})
        if not args.apply:
            continue
        transcript_dir.mkdir(parents=True, exist_ok=True)
        plain_path.write_text(text, encoding='utf-8')
        if legacy_to_remove is not None and legacy_to_remove.exists():
            legacy_to_remove.unlink()
        if record is not None:
            write_json(path, record)
        indexed[video_id] = entry
    if args.apply:
        merged = sorted(indexed.values(), key=lambda item: (item.get('date', ''), item['video_id']))
        write_json(index_path, merged)
        write_json(repo / 'frontend/src/data/transcript_index.json', merged)
    result = {'selected': len(selected), 'changed': changed, 'index_count': len(indexed),
              'failures': failures, 'applied': args.apply, 'renamed': renamed}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    # A mismatched old replacement is visible in the report, even if a valid
    # higher-priority final master has supplied the matching video already.
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--source-root', type=Path, action='append', default=[])
    parser.add_argument('--backlog-index', type=Path, action='append', default=[])
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if not args.source_root and not args.backlog_index:
        parser.error('provide at least one explicit source root or backlog index')
    result = run(args)
    raise SystemExit(1 if result['failures'] else 0)
