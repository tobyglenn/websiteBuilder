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
from pathlib import Path

CHANNEL_ID = 'UCmSwMp2gPo5PGl32d4oCu-Q'
VIDEO_ID = re.compile(r'^[A-Za-z0-9_-]{11}$')
TIMING = re.compile(r'(?P<a>\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(?P<b>\d{2}:\d{2}:\d{2}[,.]\d{3})')

def digest(data):
    return hashlib.sha256(data).hexdigest()

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
    changed = []
    for video_id, record in selected.items():
        path = records_root / f'{video_id}.json'
        text = '\n\n'.join(s['text'] for s in record['segments']) + '\n'
        filename = f'{video_id}.txt'
        transcript_dir = repo / 'frontend/src/data/transcripts'
        plain_path = transcript_dir / filename
        entry = {'file': filename, 'title': catalog[video_id]['title'],
            'date': catalog[video_id].get('publishedAt', '')[:10], 'video_id': video_id,
            'word_count': len(text.split()), 'source': record['source']['kind'],
            'source_hash': record['source_hash']}
        if path.exists() and json.loads(path.read_text()) == record and plain_path.exists() and plain_path.read_text() == text and indexed.get(video_id) == entry:
            continue
        changed.append(video_id)
        if not args.apply:
            continue
        transcript_dir.mkdir(parents=True, exist_ok=True)
        plain_path.write_text(text)
        write_json(path, record)
        indexed[video_id] = entry
    if args.apply:
        merged = sorted(indexed.values(), key=lambda item: (item.get('date', ''), item['video_id']))
        write_json(index_path, merged)
        write_json(repo / 'frontend/src/data/transcript_index.json', merged)
    result = {'selected': len(selected), 'changed': changed, 'index_count': len(indexed), 'failures': failures, 'applied': args.apply}
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
