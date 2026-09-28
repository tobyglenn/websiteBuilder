#!/usr/bin/env python3
"""Local production-to-website pipeline. Requires explicit caption roots and MiniMax credentials."""
import argparse
from pathlib import Path
import subprocess
import sys

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--source-root', type=Path, action='append', required=True)
p.add_argument('--backlog-index', type=Path, action='append', default=[])
p.add_argument('--latest', type=int, default=9)
p.add_argument('--workers', type=int, default=2)
p.add_argument('--locales', nargs='+', choices=['de', 'es', 'pt', 'hi'], default=['de', 'es', 'pt', 'hi'])
args = p.parse_args()
repo = Path(__file__).resolve().parents[1]
command = [sys.executable, str(repo / 'scripts/sync_video_transcripts.py'), '--apply']
for root in args.source_root:
    command.extend(['--source-root', str(root.resolve())])
for index in args.backlog_index:
    command.extend(['--backlog-index', str(index.resolve())])
subprocess.run(command, cwd=repo, check=True)
subprocess.run(['node', 'scripts/generate_videos_data.mjs'], cwd=repo, check=True)
subprocess.run([sys.executable, 'scripts/translate_video_transcripts.py', '--latest', str(args.latest), '--workers', str(args.workers), '--locales', *args.locales], cwd=repo, check=True)
print('Transcripts imported, catalog refreshed, and translations validated. Run the production build before publishing.')
