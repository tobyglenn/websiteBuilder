# Website source writer contract

GitHub `main` is the production source of truth. A machine connection alone does
not make a stale checkout safe to publish. Never force-push, silently discard
local work, or push another writer's unrelated changes.

## Podcast artwork

The versioned helper is `scripts/dgx/runtime/publish_podcast_website_update.py`.
The deployed DGX entry point remains
`~/.openclaw/workspace/scripts/publish_podcast_website_update.py`.
It verifies staged images against existing public release assets, prepares only
requested catalog entries and WebP variants in a temporary remote-main worktree,
and performs a non-force push. A competing remote update causes a bounded
re-import against the new catalog. A change to the same requested cover stops
for review. Receipts reconcile uncertain pushes and make identical retries
idempotent. Pending commits remain reachable through a local recovery ref.
The caller must retain staging on failure and check publication state before
retrying. Existing episode approval remains required; this helper grants none.

## Homepage generated data

The homepage runtime holds the same common-Git-directory writer lock. It stages
only documented generated data, including site metrics and body composition.
It reconciles only recognized generated-data commits and stops on unrelated
work or conflicts. Preexisting outputs are checkpointed without consuming user
edits. A checkpoint or prior pending refresh is pushed even if regeneration has
no additional diff. Other producers must avoid concurrent writes to these
files; final dirty-state checks detect but cannot prevent uncooperative writers.

## Runtime installation and validation

Run `bash scripts/dgx/install-website-writers.sh` from a reviewed checkout.
`WEBSITE_RUNTIME_DIR` can select the existing runtime scripts directory.
Installation creates rollback copies and changes neither schedules nor releases.
Do not install from an old checkout. Tests are offline and push only to disposable
local repositories:

- `python3 scripts/tests/homepage-writer.test.py`
- `python3 scripts/tests/podcast-publisher.test.py`
- `node --test frontend/scripts/tests/podcast-assets.test.mjs frontend/scripts/tests/fitness-metrics.test.mjs`

A successful push is not proof that Pages deployed. Verify the exact commit's
GitHub Actions run and the public page before reporting live.
