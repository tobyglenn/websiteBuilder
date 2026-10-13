#!/usr/bin/env python3
"""Read-only inventory for the website release follow-up. Never publishes a game."""
import argparse
import json
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def collect(game, source, pattern, covered):
    if not source.is_dir():
        return {'game': game, 'state': 'unavailable', 'source': str(source), 'candidates': []}
    found = {}
    errors = []
    for path in sorted(source.glob(pattern)):
        try:
            outer = json.loads(path.read_text())
            record = outer.get('receipt', outer)
            version = record.get('publicVersion', record.get('versionNumber'))
            if type(version) is not int or version <= covered:
                continue
            published = (record.get('publiclyReleased') is True or
                         record.get('publishedVersionNumber') == version or
                         bool(record.get('publicationEvidence')))
            if not published:
                continue
            # Inventory only. The importer separately validates destination, publication,
            # exact build hash, source commit, and editorial evidence before any write.
            found[version] = {'version': version, 'receipt': str(path),
                              'evidence_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                              'byte_match_reported': record.get('cloudDownloadMatchesBuild') is True,
                              'publication_reported': record.get('publiclyReleased') is True or bool(record.get('publishedVersionNumber') or record.get('publicationEvidence'))}
        except (OSError, ValueError, TypeError, AttributeError) as exc:
            errors.append({'file': str(path), 'error': str(exc)})
    # Wild's publication log can precede its JSON receipt. Only affirmative
    # publication headings qualify; SAVED and NOT PUBLISHED never trigger.
    status = source / 'publish/PUBLISH_STATUS.md'
    if game == 'wild-rebellion' and status.exists():
        sections = re.split(r'(?=^## )', status.read_text(), flags=re.M)
        for section in sections:
            heading = section.splitlines()[0] if section else ''
            match = re.search(r'— PUBLISHED version (\d+)\s*$', heading)
            if match and int(match[1]) > covered:
                found.setdefault(int(match[1]), {
                    'version': int(match[1]), 'publication_status': str(status),
                    'evidence_sha256': hashlib.sha256(section.encode()).hexdigest(),
                    'publication_reported': True, 'byte_match_reported': False,
                })
    # Monstrum's canonical release manifest is also an input, even when an
    # accompanying QA receipt has not yet been copied to its dated directory.
    manifest = source / 'release.json'
    if game == 'monstrum-world' and manifest.exists():
        try:
            record = json.loads(manifest.read_text())
            version = record.get('publicVersion')
            if type(version) is int and version > covered and record.get('publiclyReleased') is True:
                found.setdefault(version, {
                    'version': version, 'receipt': str(manifest),
                    'evidence_sha256': hashlib.sha256(manifest.read_bytes()).hexdigest(),
                    'publication_reported': True,
                    'byte_match_reported': record.get('cloudDownloadMatchesBuild') is True,
                })
        except (OSError, ValueError, TypeError, AttributeError) as exc:
            errors.append({'file': str(manifest), 'error': str(exc)})
    return {'game': game, 'state': 'error' if errors else ('needs_review' if found else 'unchanged'), 'covered_version': covered,
            'candidates': [found[v] for v in sorted(found)], 'errors': errors}

def inventory(site_root, wild_root, monstrum_root):
    entries = json.loads((site_root / 'frontend/src/data/games/journal.json').read_text())
    version = lambda slug: max((e['version'] for e in entries if e['game'] == slug and e['kind'] == 'release'), default=0)
    return {'games': [collect('wild-rebellion', wild_root, 'publish/public-v*.json', version('wild-rebellion')),
                      collect('monstrum-world', monstrum_root, 'qa/**/public-release-v*.json', version('monstrum-world'))]}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--wild-rebellion-root', type=Path, default=Path('/Users/tobyglennpeters/wild_rebellion/18_Roblox_Edition'))
    parser.add_argument('--monstrum-world-root', type=Path, default=Path('/Volumes/XTRMQ/Games/monstrum-world'))
    args = parser.parse_args()
    print(json.dumps(inventory(ROOT, args.wild_rebellion_root, args.monstrum_world_root), indent=2))
if __name__ == '__main__':
    main()
