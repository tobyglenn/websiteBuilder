#!/usr/bin/env python3
"""Capture existing captions for verified public Toby uploads. No writing models or publishing.

Configuration and captured evidence live outside Git in blog-drafts. The uploader's
receipt, final media and captions are read only. A failed refresh never replaces a
good capture. Each intake reports unavailable sources individually.
"""
from __future__ import annotations

import hashlib
import html
import json
import math
import os
from pathlib import Path
import re
import subprocess
import tempfile
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError

CHANNEL = 'UCmSwMp2gPo5PGl32d4oCu-Q'
VIDEO_ID = re.compile(r'^[A-Za-z0-9_-]{11}$')
SCHEMA = 'toft-public-caption-v1'


def stamp():
    return datetime.now(timezone.utc).isoformat()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def file_hash(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(dir=path.parent, prefix='.' + path.name)
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def public_video(video_id):
    """Verify public visibility and identity without credentials or a stale catalog.

    Fail closed if YouTube changes its response. Never log signed caption URLs or
    use an upload receipt's former visibility as proof of current publication.
    """
    if not VIDEO_ID.fullmatch(video_id):
        raise ValueError('Invalid YouTube ID')
    req = Request('https://www.youtube.com/watch?v=' + video_id,
                  headers={'User-Agent': 'Mozilla/5.0'})
    with urlopen(req, timeout=30) as response:
        raw = response.read(6_000_001)
    if len(raw) > 6_000_000:
        raise ValueError('YouTube metadata response exceeds limit')
    match = re.search(r'(?:var\s+)?ytInitialPlayerResponse\s*=\s*', raw.decode('utf-8'))
    if not match:
        raise ValueError('Public YouTube identity could not be verified')
    player, _ = json.JSONDecoder().raw_decode(raw.decode('utf-8')[match.end():])
    detail = player.get('videoDetails', {})
    micro = player.get('microformat', {}).get('playerMicroformatRenderer', {})
    if (player.get('playabilityStatus', {}).get('status') != 'OK'
            or detail.get('videoId') != video_id or detail.get('channelId') != CHANNEL
            or detail.get('isPrivate') is not False or micro.get('isUnlisted') is not False
            or detail.get('isLiveContent') or detail.get('isUpcoming')):
        raise ValueError('Video must be public, playable, non-live, and on Toby\'s channel')
    published = micro.get('publishDate')
    if not published:
        raise ValueError('Public publication date is missing')
    when = datetime.fromisoformat(published.replace('Z', '+00:00'))
    if when.tzinfo is None or when > datetime.now(timezone.utc):
        raise ValueError('Video is not yet published')
    duration = float(detail.get('lengthSeconds') or 0)
    if duration < 180:
        raise ValueError('Short-form sources are ineligible')
    return {'video_id': video_id, 'channel_id': CHANNEL, 'title': detail['title'],
            'url': 'https://www.youtube.com/watch?v=' + video_id,
            'published_at': published, 'duration_seconds': duration,
            'description': detail.get('shortDescription', ''),
            'visibility': 'public', 'verified_at': stamp()}


def normalized_segments(rows, duration):
    if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
        raise ValueError('Timed transcript segments must be a list of cue objects')
    segments = []
    for row in rows:
        a, b = row.get('start'), row.get('end')
        text = row.get('text')
        if (not isinstance(a, (float, int)) or isinstance(a, bool)
                or not isinstance(b, (float, int)) or isinstance(b, bool)
                or not math.isfinite(a) or not math.isfinite(b)
                or a < 0 or b <= a or b > duration + 2
                or not isinstance(text, str) or not text.strip()
                or (segments and a < segments[-1]['start'])):
            raise ValueError('Invalid, nonmonotonic or out-of-duration caption cue')
        segments.append({'start': round(a, 3), 'end': round(b, 3),
                         'text': html.unescape(re.sub(r'\s+', ' ', text)).strip()})
    if not segments:
        raise ValueError('No timed transcript cues')
    # These conservative completeness gates detect clips and truncated exports.
    # They do not certify recognition accuracy; human source review is still needed.
    if segments[0]['start'] > 30 or segments[-1]['end'] < duration - 30:
        raise ValueError('Transcript does not cover the beginning and end of the full upload')
    if any(b['start'] - a['end'] > 90 for a, b in zip(segments, segments[1:])):
        raise ValueError('Transcript has an unexplained gap exceeding 90 seconds')
    words = sum(len(x['text'].split()) for x in segments)
    if words < max(80, duration / 3):
        raise ValueError('Transcript is too sparse to represent the full spoken recording')
    return segments


def read_captions(path, duration):
    path = Path(path)
    if path.stat().st_size > 4_000_000:
        raise ValueError('Caption file exceeds limit')
    raw = path.read_text(encoding='utf-8-sig')
    if path.suffix.lower() == '.json':
        data = json.loads(raw)
        if not isinstance(data, dict) or not isinstance(data.get('segments'), list):
            raise ValueError('Caption JSON requires timed segments from the final master')
        if data.get('language') not in ('en', 'english'):
            raise ValueError('Caption JSON must identify English speech')
        rows = list(data['segments'])
        # Whisper can emit an empty, zero-length end marker. It contains no
        # speech or timing interval; retain the raw export but omit that marker.
        while rows and rows[-1].get('text') == '' and rows[-1].get('start') == rows[-1].get('end'):
            rows.pop()
        return normalized_segments(rows, duration)
    if path.suffix.lower() not in ('.srt', '.vtt'):
        raise ValueError('Only existing SRT, VTT or timed English JSON captions are allowed')
    rows = []
    for block in re.split(r'\n\s*\n', raw.replace('\r\n', '\n').strip()):
        lines = block.splitlines()
        timing = next((i for i, line in enumerate(lines) if '-->' in line), None)
        if timing is None:
            if block.startswith(('WEBVTT', 'NOTE')):
                continue
            raise ValueError('Malformed caption block')
        match = re.fullmatch(r'(?:(\d+):)?(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*'
                             r'(?:(\d+):)?(\d{2}):(\d{2})[,.](\d{3})(?:\s+.*)?', lines[timing])
        if not match:
            raise ValueError('Malformed caption timing')
        nums = [int(x or 0) for x in match.groups()]
        if any(nums[i] >= 60 for i in (1, 2, 5, 6)):
            raise ValueError('Invalid caption time')
        def sec(n):
            return nums[n] * 3600 + nums[n + 1] * 60 + nums[n + 2] + nums[n + 3] / 1000
        text = re.sub(r'<[^>]*>', '', ' '.join(lines[timing + 1:]))
        rows.append({'start': sec(0), 'end': sec(4), 'text': text})
    return normalized_segments(rows, duration)


def transcribe_final(media, asset_hash, output, settings, speech_end=None):
    """Use only the explicitly configured existing MLX environment and cached model."""
    python = Path(settings['python']).expanduser()
    model = Path(settings['model']).expanduser()
    if not python.is_file() or not model.is_dir() or not (model / 'weights.safetensors').is_file():
        raise ValueError('Configured existing speech-recognition runtime or cached model is unavailable')
    if output.exists():
        old = json.loads(output.read_text())
        if old.get('source_asset_sha256') == asset_hash and old.get('speech_end_seconds') == speech_end:
            return output
        raise ValueError('Existing final-master caption export belongs to different media; retain it for reconciliation')
    environment = dict(os.environ, HF_HUB_OFFLINE='1', TRANSFORMERS_OFFLINE='1')
    command = [str(python), str(Path(__file__).with_name('capture_final_captions.py')),
               '--media', str(media), '--model', str(model), '--output', str(output),
               '--asset-sha256', asset_hash]
    if speech_end is not None:
        command.extend(['--speech-end', str(speech_end)])
    proc = subprocess.run(command, env=environment, stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT, text=True, timeout=1200)
    if proc.returncode:
        # The recognizer receives only local files. Keep its diagnostic separate
        # from the source prose; never turn a failure into fabricated speech.
        raise RuntimeError('Final-master speech recognition failed: ' + proc.stdout[-1200:])
    return output


def capture(receipt_path, caption_path=None, verify=public_video, recognition=None, export_dir=None, speech_end=None):
    receipt_path = Path(receipt_path)
    receipt = json.loads(receipt_path.read_text())
    video_id = receipt.get('video_id', '')
    if (not VIDEO_ID.fullmatch(video_id) or receipt.get('expected_channel_id') != CHANNEL
            or receipt.get('content_kind', 'long_form') != 'long_form'):
        raise ValueError('Receipt is not a Toby long-form upload')
    metadata = verify(video_id)
    asset = receipt.get('asset', {})
    if not asset.get('path'):
        # Older adjacent receipts omit the redundant media path.
        if not receipt_path.name.endswith('.youtube-publish.json'):
            raise ValueError('Custom upload receipt requires its final media path')
        media = receipt_path.with_name(receipt_path.name.removesuffix('.youtube-publish.json'))
    else:
        media = Path(asset['path']).expanduser()
        if not media.is_absolute():
            media = receipt_path.parent / media
    if media.suffix.lower() not in ('.mp4', '.mov', '.mkv', '.m4v', '.webm'):
        raise ValueError('Receipt does not identify a video master')
    if not re.fullmatch(r'[0-9a-f]{64}', asset.get('sha256', '')):
        raise ValueError('Upload receipt lacks the final media SHA-256')
    duration = metadata['duration_seconds']
    recorded_duration = receipt.get('duration_seconds')
    if recorded_duration and abs(float(recorded_duration) - duration) > 3:
        raise ValueError('Public duration differs from the upload receipt')
    if speech_end is not None and (not isinstance(speech_end, (int, float))
            or isinstance(speech_end, bool) or not math.isfinite(speech_end)
            or not 0 <= duration - speech_end <= 30):
        raise ValueError('An explicit production speech endpoint may exclude only a final non-spoken outro of at most 30 seconds')
    captions = Path(caption_path).expanduser() if caption_path else media.parent / 'captions.srt'
    if file_hash(media) != asset['sha256']:
        raise ValueError('Final media differs from the uploaded asset hash')
    if not captions.is_file():
        if not recognition or not export_dir:
            raise ValueError('Full production captions are missing; register the final-master caption export')
        suffix = '-speech-' + str(speech_end) if speech_end is not None else ''
        captions = transcribe_final(media, asset['sha256'], Path(export_dir) / (video_id + suffix + '.json'), recognition, speech_end)
    if captions.suffix.lower() == '.json':
        binding = json.loads(captions.read_text()).get('source_asset_sha256')
        if binding != asset['sha256']:
            raise ValueError('Caption JSON must be bound to the final uploaded media SHA-256')
    segments = read_captions(captions, duration)
    text = '\n\n'.join(x['text'] for x in segments)
    return {'schema': SCHEMA, 'metadata': metadata, 'segments': segments, 'text': text,
            'text_sha256': sha(text.encode()), 'complete': True,
            'provenance': {'kind': 'local-publishing-captions', 'asset_sha256': asset['sha256'],
                           'caption_sha256': file_hash(captions), 'receipt_sha256': file_hash(receipt_path),
                           'caption_file': captions.name,
                           'recognition_accuracy': 'Requires editorial review against the recording',
                           'corrections': 'Published description is included separately and takes precedence over rough spoken estimates'}}


def receipt_paths(roots):
    for root in roots:
        root = Path(root).expanduser()
        if not root.is_dir():
            raise ValueError('Configured production source directory is unavailable: ' + str(root))
        for parent, dirs, files in os.walk(root):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in
                       {'node_modules', 'venv', 'analysis', 'shorts', 'shorts_v2', 'shorts_v3'}]
            for name in files:
                if name.endswith('.youtube-publish.json') or (Path(parent).name == 'youtube' and name == 'main_receipt.json'):
                    yield Path(parent) / name


def collect(repo, state, config_path=None, verify=public_video):
    """Run on intake, with no cron, remote mutation, or changes to website data."""
    repo, state = Path(repo), Path(state)
    config_path = Path(config_path) if config_path else state.parent / 'caption-intake.json'
    result = {'configured': config_path.exists(), 'checked_at': stamp(), 'captured': [],
              'held_video_ids': [], 'errors': [], 'documents': []}
    if not config_path.exists():
        return result
    config = json.loads(config_path.read_text())
    if config.get('schema') != 'toft-caption-intake-v1':
        raise ValueError('Unsupported caption intake configuration')
    # Explicit registrations override discovered defaults, including custom receipt layouts.
    candidates = {}
    for root in config.get('source_roots', []):
        try:
            candidates.update({str(p.resolve()): {} for p in receipt_paths([root])})
        except (ValueError, OSError) as exc:
            result['errors'].append({'source_root': str(root), 'error': str(exc)})
    for package in config.get('packages', []):
        p = Path(package['receipt']).expanduser().resolve()
        candidates[str(p)] = package
    seen = set()
    limit = config.get('max_videos', 12)
    if not isinstance(limit, int) or not 1 <= limit <= 50:
        raise ValueError('max_videos must be between 1 and 50')
    for path in sorted(candidates, key=lambda p: Path(p).stat().st_mtime if Path(p).exists() else 0, reverse=True):
        video_id = None
        try:
            receipt = json.loads(Path(path).read_text())
            if receipt.get('expected_channel_id') != CHANNEL or receipt.get('content_kind', 'long_form') != 'long_form':
                continue
            video_id = receipt.get('video_id')
            if video_id in seen:
                continue
            if len(seen) >= limit:
                break
            seen.add(video_id)
            options = candidates[path]
            record = capture(path, options.get('captions'), verify=verify,
                             recognition=config.get('speech_recognition'),
                             export_dir=state / 'caption-exports', speech_end=options.get('speech_end_seconds'))
            write_json(state / 'captures' / (video_id + '.json'), record)
            result['captured'].append(video_id)
            result['documents'].extend(documents(record))
        except Exception as exc:
            # Keep prior capture bytes for recovery/audit, but do not present stale
            # evidence as freshly public if visibility or integrity checking failed.
            result['errors'].append({'video_id': video_id, 'receipt': str(path),
                                     'error': type(exc).__name__ + ': ' + str(exc)})
            # DNS/transport failure does not erase already captured public speech.
            # A failed visibility/integrity check holds that video's saved evidence.
            if type(exc) is not URLError and not isinstance(exc, TimeoutError):
                result['held_video_ids'].append(video_id)
    write_json(state / 'caption-intake-latest.json', {k: v for k, v in result.items() if k != 'documents'})
    return result


def documents(record):
    meta = record['metadata']
    common = {'url': meta['url'], 'video_id': meta['video_id'], 'verified_at': meta['verified_at'],
              'published_at': meta['published_at'], 'publication_approved': True,
              'disclosure': 'published-recording-only-no-private-code'}
    text = record['text']
    # Match source-library's existing JSON-string digest convention. Package sources
    # must still be hashed over raw UTF-8 text by the exact-version release validator.
    digest = lambda text: sha(json.dumps(text, sort_keys=True, ensure_ascii=False).encode())
    return [{**common, 'id': 'youtube-' + meta['video_id'] + '-production-full',
             'kind': 'public-video-transcript', 'title': meta['title'], 'text': text,
             'sha256': digest(text), 'segments': record['segments'], 'complete': True,
             'provenance': record['provenance']},
            {**common, 'id': 'youtube-' + meta['video_id'] + '-published-notes',
             'kind': 'public-video-description', 'title': meta['title'] + ' — published corrections and notes',
             'text': meta['description'], 'sha256': digest(meta['description'])}]


def saved_documents(state, errors=None):
    """Read dated public captures offline; never relabel their verification date."""
    result = []
    status = Path(state) / 'caption-intake-latest.json'
    try:
        saved_status = json.loads(status.read_text()) if status.exists() else {}
        if not isinstance(saved_status, dict):
            raise ValueError('Invalid saved caption status')
        held = set(saved_status.get('held_video_ids', []))
    except (ValueError, TypeError, OSError) as exc:
        if errors is None:
            raise
        errors.append({'capture_status': status.name, 'error': str(exc)})
        return result
    for path in sorted((Path(state) / 'captures').glob('*.json')):
        if path.stem in held:
            continue
        try:
            result.extend(saved_document(path))
        except (ValueError, KeyError, TypeError, OSError) as exc:
            if errors is None:
                raise
            errors.append({'capture': path.name, 'error': str(exc)})
    return result


def saved_document(path):
    result = []
    record = json.loads(path.read_text())
    if not isinstance(record, dict):
        raise ValueError('Invalid saved public caption object: ' + path.name)
    meta = record.get('metadata', {})
    if not isinstance(meta, dict):
        raise ValueError('Invalid saved public caption metadata: ' + path.name)
    if (record.get('schema') != SCHEMA or record.get('complete') is not True
            or meta.get('channel_id') != CHANNEL or meta.get('visibility') != 'public'
            or not VIDEO_ID.fullmatch(meta.get('video_id', '')) or not meta.get('verified_at')):
        raise ValueError('Invalid saved public caption record: ' + path.name)
    segments = normalized_segments(record['segments'], meta['duration_seconds'])
    text = '\n\n'.join(x['text'] for x in segments)
    if text != record['text'] or sha(text.encode()) != record.get('text_sha256'):
        raise ValueError('Saved public caption hash mismatch: ' + path.name)
    for doc in documents(record):
        doc['freshness'] = 'Saved public capture; observe the original verified_at and publication date'
        result.append(doc)
    return result
