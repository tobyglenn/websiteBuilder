#!/usr/bin/env python3
"""Export English timed speech from an uploaded master using an existing cached MLX model.

No download, credentials, writing model, source-code intake or publication. Invoke
with the already installed production virtualenv, not the website's Python runtime.
"""
import argparse
import os
from pathlib import Path

from blog_capture import file_hash, write_json


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--media', required=True, type=Path)
    parser.add_argument('--model', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--asset-sha256', required=True)
    parser.add_argument('--speech-end', type=float, help='Verified production speech endpoint before a non-spoken outro')
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('Refusing to overwrite an existing caption export')
    if not args.model.is_dir() or not (args.model / 'weights.safetensors').is_file():
        raise ValueError('An existing cached speech model is required; downloads are disabled')
    if file_hash(args.media) != args.asset_sha256:
        raise ValueError('Source media does not match the verified upload receipt')
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    import mlx_whisper
    options = {'clip_timestamps': '0,' + str(args.speech_end)} if args.speech_end is not None else {}
    result = mlx_whisper.transcribe(str(args.media), path_or_hf_repo=str(args.model),
                                    language='en', word_timestamps=False, verbose=False, **options)
    if file_hash(args.media) != args.asset_sha256:
        raise ValueError('Source media changed during speech recognition')
    write_json(args.output, {'language': result['language'], 'segments': [
        {key: segment[key] for key in ('start', 'end', 'text')} for segment in result['segments']],
        'source_asset_sha256': args.asset_sha256,
        'speech_end_seconds': args.speech_end,
        'recognition': {'engine': 'existing-mlx-whisper', 'model': args.model.name,
                        'accuracy': 'Machine transcript; review against the recording'}})
    print('Captured timed speech from the verified final master')


if __name__ == '__main__':
    main()
