#!/usr/bin/env python3
"""Read-only inventory for the website release follow-up. Never publishes a game."""
import argparse
import json
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
            if not isinstance(version, int) or version <= covered:
                continue
            # Inventory only. The importer separately validates destination, publication,
            # exact build hash, source commit, and editorial evidence before any write.
            found[version] = {'version': version, 'receipt': str(path),
                              'byte_match_reported': record.get('cloudDownloadMatchesBuild') is True,
                              'publication_reported': record.get('publiclyReleased') is True or bool(record.get('publishedVersionNumber') or record.get('publicationEvidence'))}
        except (OSError, ValueError, TypeError, AttributeError) as exc:
            errors.append({'file': str(path), 'error': str(exc)})
    return {'game': game, 'state': 'needs_review' if found else 'unchanged', 'covered_version': covered,
            'candidates': [found[v] for v in sorted(found)], 'errors': errors}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--wild-rebellion-root', type=Path, default=Path('/Users/tobyglennpeters/wild_rebellion/18_Roblox_Edition'))
    parser.add_argument('--monstrum-world-root', type=Path, default=Path('/Volumes/XTRMQ/Games/monstrum-world'))
    args = parser.parse_args()
    entries = json.loads((ROOT / 'frontend/src/data/games/journal.json').read_text())
    version = lambda slug: max((e['version'] for e in entries if e['game'] == slug and e['kind'] == 'release'), default=0)
    print(json.dumps({'games': [collect('wild-rebellion', args.wild_rebellion_root, 'publish/public-v*.json', version('wild-rebellion')),
                               collect('monstrum-world', args.monstrum_world_root, 'qa/**/public-release-v*.json', version('monstrum-world'))],
                      'note': 'Candidates require publication and editorial review. Also inspect the source release/status documents for published versions not yet represented by receipts.'}, indent=2))
if __name__ == '__main__':
    main()
