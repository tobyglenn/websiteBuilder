# Wild Rebellion and Monstrum World: website release workflow

## Public surfaces

- `/projects/wild-rebellion/` and `/projects/monstrum-world/`: permanent game homes, play links, explainers, media, creation stories, and release history.
- `/games/`: game discovery, including existing Ironvane and browser games.
- `/games/journal/`: development and release articles, grouped by game.
- `/games/journal/rss.xml`: feed of published journal entries.
- Homepage project band and Articles index link into the same content.

`frontend/src/data/games/showcases.json` holds evergreen game content, `media.json` holds explicitly verified video identities, and `journal.json` holds dated stories. `src/lib/gameJournal.mjs` validates the records and drives the game pages, journal, cards, feed, and latest-release teasers. Publication order is version-based within each game, including multiple updates on the same day. Existing game URLs are preserved.

## Initial evidence and media

Initial coverage: Wild Rebellion v36 and v37; Monstrum v46, v47, and v48; one creation story per game. Article `sources` identify the private source reports for editors but are not rendered or bundled into client JavaScript. Keep secrets, account metadata, personal inventories, and raw QA output out of public content.

Wild Rebellion v37's October 10 publication is recorded in the game repository's `publish/PUBLISH_STATUS.md`; an October 13 read-back matched its recorded build hash. The sanitized receipt is `docs/game-release-evidence/wild-rebellion-v37.json`. v38 is explicitly recorded as saved only and excluded. The v37 verifier compared the archived release hash, not the newer local v38 build.

The four Wild Rebellion YouTube videos were checked against unauthenticated metadata and public channel listings on October 13. The family gameplay video's recorded game version is unspecified; it is not proof of a particular update. `tM-kRMXsBkE` remained private and was excluded. Do not infer public availability from a publishing schedule.

Monstrum's official trailer was supplied by Toby from `qa/2026-10-06/store-media/final_trailer/Monstrum_World_Official_Trailer_1080p.mp4`. The website copy is the full 64-second H.264/AAC video, remuxed with fast-start metadata without re-encoding. It is dated October 6 and does not claim to show October 12 updates. Promotional illustration and earlier development screenshots are explicitly captioned as such.

## Import a future release

1. Read the game's actual publication receipt and its associated change/QA report. A commit, local build, saved Roblox version, or public universe alone does not establish that the specific build was published.
2. Prepare a player-facing article JSON using an existing release entry as the structural example. Use an exact date and version, a stable slug, an accurate summary, sections with paragraphs/bullets, an existing image, evidence references, and only verified media IDs. Describe concrete changes and their player benefit. Label Studio/device/public verification boundaries accurately.
3. Dry-run from `frontend`:

   ```sh
   node scripts/import-game-release.mjs --game monstrum-world --receipt /path/to/public-release-vNN.json --article /path/to/reviewed-article.json
   ```

4. Add `--write` after reviewing the generated article. Importing is atomic and idempotent. A later video can be added to the same article, without changing its URL or creating a duplicate release.
5. Run `npm run test:games`, `npx astro sync`, and `npm run build` with Node 24. Inspect desktop and phone layouts, light/dark themes, local video playback, navigation, play links, canonical metadata, and all new internal links. Preserve analytics attributes.
6. Integrate with the latest `origin/main`, push, wait for both the source build and GitHub Pages deployment, then verify the live pages and exact new release. A local build or source push alone is not deployment completion.

The importer requires correct universe/place IDs, explicit publication evidence, version, source commit, build hash, date, and byte-match proof. Monstrum's native receipt is supported. For Wild Rebellion, add `publishedVersionNumber` from an actual publication result, or a `publicationEvidence` description naming the exact version and its verified publication source. Do not invent that field from a public-universe flag. The existing read-back script compares the current local build; when verifying an older release, compare against its archived build hash instead.

## Ongoing upkeep

A procedural macOS LaunchAgent checks once daily at **11:55 p.m. Eastern** (the Mac's configured local timezone). The old Codex heartbeat `keep-roblox-game-showcases-current` is **PAUSED**; do not reactivate it alongside this job. LaunchAgent label: `com.toby.roblox-website-nightly`. If the Mac is asleep, launchd runs the missed calendar job when it wakes; a powered-off Mac cannot perform the check. Keep the Mac timezone set to America/New_York for this schedule.

`scripts/nightly-game-journal.py` fetches the latest website `origin/main` into a dedicated clean checkout and compares `journal.json` coverage with both games' publication receipts. It also reads Wild's affirmative `PUBLISHED version` log sections and Monstrum's `release.json`, so a new release does not depend on a dated QA receipt already existing. Saved-only versions, unrelated source changes, timestamps, and already-covered releases do not trigger a model call. Missing sources or malformed receipts produce an error, not a false no-change result.

If new publication evidence exists, one `codex exec` call prepares that day's batch for both games. The worker verifies publication/build evidence, writes player-facing articles (longer for major releases), updates supported evergreen facts, and checks available public media. A newly public video alone does not wake the LLM; media is reviewed during the next release update. The existing Monstrum trailer remains available. No game publication or video upload/scheduling occurs.

The worker has a workspace-write sandbox and may edit only game datasets, game media, and release evidence. The procedural runner checks the changed paths, runs game tests, Astro sync and a full production build using Node 24, rejects concurrent changes to main, commits/pushes the content, waits for both GitHub workflows and verifies the new public article bodies. Only then is deployment marked complete. The canonical DGX checkout is fast-forwarded only if clean. No destructive reset or forced push is used.

Durable installation on this Mac:

- Runner/scanner: `~/.local/share/roblox-website-nightly/bin/`
- Dedicated checkout: `~/.local/share/roblox-website-nightly/site/`
- Node 24 binary: `~/.local/share/roblox-website-nightly/runtime/bin/node`
- Schedule: `~/Library/LaunchAgents/com.toby.roblox-website-nightly.plist`
- Results: `last-check.json`, `state.json`, `scheduler.log`, `scheduler-errors.log`, `codex-output.log`, and `codex-errors.log` under the job directory. These are local operational records, never public assets.

The attempted evidence fingerprint is saved **before** invoking Codex. A failed or interrupted attempt does not spend tokens again on identical evidence every night. Updated evidence allows a new attempt; after fixing an operational problem, an operator may explicitly run with `--retry`. Dirty generated changes are preserved for review and must be integrated before retrying. A pending pushed deployment is checked again without invoking the LLM. If a push failed or another deployment superseded it, inspect the preserved commit/pending status before recovery. Errors are recorded in the local status/log files; this job does not start an LLM merely to report an error.

Read-only gate check (no LLM, edits to website content, or deployment):

```sh
python3 ~/.local/share/roblox-website-nightly/bin/nightly-game-journal.py \
  --job-dir ~/.local/share/roblox-website-nightly --check-only
```

After editing the runner or scanner, run `python3 scripts/tests/nightly-game-journal.test.py`, then refresh their installed copies in the job's `bin/` directory. Keep the stable LaunchAgent paths out of disposable worktrees. The nightly process uses the existing local Codex login; it does not require an additional API key. It starts Codex only on new evidence, using the CLI's supported [non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode).

Canonical website checkout: DGX `/home/toby/.openclaw/workspace/websiteBuilder`. The Mac's older dirty checkout must not be reset or used to overwrite production. Fetch current remote state before work and preserve concurrent commits. A detached external drive, unavailable DGX, or unresolved release/media evidence is a blocked update, not permission to publish guesses.

For immediate same-session updates, the game release agent can use this documented importer after verifying publication; the scheduled follow-up provides the periodic catch-up. The website does not itself publish Roblox builds or upload/schedule YouTube videos.

Channel identities remain separate. Lilly/Wild Rebellion uses `UC7ZfdS-b0zU-cE8Ie6NZVlQ`; TobyOnFitnessTech's development discussion uses `UCmSwMp2gPo5PGl32d4oCu-Q`. Honor `/Users/tobyglennpeters/Documents/video-publishing/channel_profiles.json`. No Spotify workflow is part of these game pages.
