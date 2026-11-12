#!/usr/bin/env python3
"""Publish approved podcast covers in a transaction based on current GitHub main.

The source checkout is never reset, rebased, staged, or committed. A common-dir
lock serializes local writers; ordinary non-force pushes detect remote writers.
"""
from __future__ import annotations
import argparse
import fcntl
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


def run(cmd, cwd=None, check=True):
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and result.returncode:
        raise RuntimeError(f"Command failed: {' '.join(map(str, cmd))}\n{result.stdout}\n{result.stderr}")
    return result


def save(path, value):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n')
    temporary.replace(path)


def publish(repo, staging, episode, covers, message, empty_message):
    repo, staging = Path(repo).resolve(), Path(staging).resolve()
    if episode < 0 or not covers or len(set(covers)) != len(covers):
        raise ValueError('An episode and unique cover filenames are required')
    hashes = {}
    for name in covers:
        match = re.fullmatch(r'episode_(\d{3,})_cover(?:_(de|es|hi|pt))?\.png', name)
        if not match or int(match[1]) != episode:
            raise ValueError(f'Invalid cover for episode {episode}: {name}')
        hashes[name] = hashlib.sha256((staging / name).read_bytes()).hexdigest()
    common = Path(run(['git', 'rev-parse', '--git-common-dir'], repo).stdout.strip())
    if not common.is_absolute():
        common = repo / common
    common = common.resolve()
    key = hashlib.sha256(json.dumps([episode, hashes, message, empty_message], sort_keys=True).encode()).hexdigest()
    with (common / 'website-podcast-publish.lock').open('a') as writer:
        fcntl.flock(writer, fcntl.LOCK_EX)
        receipt_dir = common / 'website-podcast-receipts'
        receipt_dir.mkdir(exist_ok=True)
        receipt_path = receipt_dir / (key + '.json')
        previous = json.loads(receipt_path.read_text()) if receipt_path.exists() else {}
        run(['git', 'fetch', 'origin', 'main'], repo)
        old_commit = previous.get('commit')
        if old_commit and run(['git', 'merge-base', '--is-ancestor', old_commit, 'origin/main'], repo, False).returncode == 0:
            previous['status'] = 'pushed'
            save(receipt_path, previous)
            return f"websiteBuilder already pushed: {old_commit[:12]}"
        allowed = ['frontend/src/data/podcast-assets.json']
        for name in covers:
            allowed.extend(f'frontend/public/images/podcast/{Path(name).stem}-{width}.webp' for width in (320, 640))
        for attempt in range(3):
            base = run(['git', 'rev-parse', 'origin/main'], repo).stdout.strip()
            directory = Path(tempfile.mkdtemp(prefix=f'website-podcast-ep{episode}-'))
            tree = directory / 'checkout'
            try:
                run(['git', 'worktree', 'add', '--detach', str(tree), base], repo)
                sync = tree / 'frontend/scripts/sync-podcast-assets.mjs'
                if not sync.is_file():
                    raise RuntimeError('Remote main lacks the podcast image importer')
                # Use the checkout's existing dependencies; never install or upgrade silently.
                dependencies = repo / 'frontend/node_modules'
                if dependencies.is_dir():
                    (tree / 'frontend/node_modules').symlink_to(dependencies, target_is_directory=True)
                snapshot = directory / 'sources'
                snapshot.mkdir()
                for name in covers:
                    data = (staging / name).read_bytes()
                    if hashlib.sha256(data).hexdigest() != hashes[name]:
                        raise RuntimeError(f'Staged cover changed during publication: {name}')
                    (snapshot / name).write_bytes(data)
                command = [os.environ.get('WEBSITE_NODE', 'node'), str(sync), '--episode', str(episode), '--staging-dir', str(snapshot)]
                for name in covers:
                    command.extend(['--cover', name])
                imported = json.loads(run(command, tree).stdout)
                paths = imported.get('paths', [])
                if not paths or not set(paths).issubset(allowed):
                    raise RuntimeError('Image importer returned unexpected paths')
                run(['git', 'add', '--', *paths], tree)
                staged = set(run(['git', 'diff', '--cached', '--name-only'], tree).stdout.splitlines())
                if not staged.issubset(allowed):
                    raise RuntimeError('Unexpected staged publication content')
                if staged:
                    run(['git', 'commit', '--only', '-m', message, '--', *paths], tree)
                    action = 'committed'
                else:
                    run(['git', 'commit', '--allow-empty', '--only', '-m', empty_message], tree)
                    action = 'empty-deploy'
                commit = run(['git', 'rev-parse', 'HEAD'], tree).stdout.strip()
                # Persist an object reference before the uncertain external push.
                pending_ref = 'refs/website-podcast-pending/' + key
                run(['git', 'update-ref', pending_ref, commit], repo)
                receipt = {'status': 'push_pending', 'episode': episode, 'covers': hashes, 'commit': commit, 'base': base}
                save(receipt_path, receipt)
                pushed = run(['git', 'push', 'origin', commit + ':refs/heads/main'], tree, False)
                # Even an exit-zero push must be independently reconciled.
                run(['git', 'fetch', 'origin', 'main'], repo)
                if run(['git', 'merge-base', '--is-ancestor', commit, 'origin/main'], repo, False).returncode == 0:
                    receipt['status'] = 'pushed'
                    save(receipt_path, receipt)
                    run(['git', 'update-ref', '-d', pending_ref], repo)
                    return f'websiteBuilder {action} and pushed: {commit[:12]}'
                current = run(['git', 'rev-parse', 'origin/main'], repo).stdout.strip()
                if current == base:
                    raise RuntimeError(f'Push not confirmed; receipt retained. {pushed.stderr.strip()}')
                # Never overwrite a concurrent edit to this exact episode artwork.
                def entries(revision):
                    result = run(['git', 'show', revision + ':frontend/src/data/podcast-assets.json'], repo, False)
                    catalog = json.loads(result.stdout) if result.returncode == 0 else {}
                    images = catalog.get('images', catalog)
                    return {name: images.get('/images/podcast/' + name) for name in covers}
                if entries(base) != entries(current):
                    raise RuntimeError('The requested cover changed on remote main during publication; review required')
                # Another writer advanced main. Re-import approved bytes against the
                # new catalog rather than rebasing a stale generated catalog blindly.
            finally:
                if tree.exists():
                    run(['git', 'worktree', 'remove', '--force', str(tree)], repo, False)
                shutil.rmtree(directory, ignore_errors=True)
        raise RuntimeError('Remote main changed during all three attempts; receipt retained, no force push performed')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--episode', required=True, type=int)
    parser.add_argument('--message', required=True)
    parser.add_argument('--empty-message', required=True)
    parser.add_argument('--staging-dir', required=True)
    parser.add_argument('--cover', action='append', default=[])
    args = parser.parse_args()
    repo = Path(os.environ.get('WEBSITEBUILDER_DIR', '~/.openclaw/workspace/websiteBuilder')).expanduser()
    print(publish(repo, args.staging_dir, args.episode, args.cover, args.message, args.empty_message))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
