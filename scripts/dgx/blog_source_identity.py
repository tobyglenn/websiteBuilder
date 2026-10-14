"""Prevent a second generated article for an already-used source video.

Do not infer identity from thumbnails: old articles reused unrelated artwork.
Read published links/metadata plus transcript filenames known to the publisher.
"""
from pathlib import Path
import json
import re

ID = re.compile(r'^[A-Za-z0-9_-]{11}$')
FIELD = r'''["']?%s["']?\s*:\s*["']([^"']+)["']'''

def source_video_id(metadata):
    value = str(metadata.get('source_video_id') or metadata.get('video_id') or metadata.get('videoId') or '')
    if ID.fullmatch(value):
        return value
    for key in ('source_url', 'youtube_url'):
        match = re.search(r'(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/))([A-Za-z0-9_-]{11})',str(metadata.get(key, '')))
        if match:
            return match[1]
    return ''

def read_used_slugs(mock_js, markdown_dir=None):
    slugs = set(re.findall(FIELD % 'slug', Path(mock_js).read_text()))
    if markdown_dir:
        slugs.update(p.stem for p in Path(markdown_dir).glob('*.md'))
    return slugs

def published_video_ids(mock_js, markdown_dir, metadata, blacklisted, slug_for_filename):
    texts = [Path(mock_js).read_text()] + [p.read_text() for p in Path(markdown_dir).glob('*.md')]
    used = read_used_slugs(mock_js, markdown_dir)
    ids = set()
    for text in texts:
        # Explicit source metadata and editorial video links, never ytimg thumbnails.
        ids.update(re.findall(r'''["']?(?:source_video_id|videoId)["']?\s*:\s*["']([A-Za-z0-9_-]{11})["']''',text))
        ids.update(re.findall(r'(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/)|/video/)([A-Za-z0-9_-]{11})',text))
    for filename, entry in metadata.items():
        path = Path(filename)
        if path.stem in blacklisted or slug_for_filename(path) in used:
            video_id = source_video_id(entry)
            if video_id:
                ids.add(video_id)
    return ids

def assert_unpublished_source(draft, used_ids):
    video_id = source_video_id(draft)
    if not video_id:
        raise ValueError('New automated articles require a verified source video ID.')
    if video_id in used_ids:
        raise ValueError(f'Source video {video_id} already has blog coverage; update its existing article instead of publishing another slug.')
    return video_id
