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

A recurring Codex follow-up checks both game repositories every six hours. It only acts on a new verified public release or newly public relevant media. It reads the associated report, writes a concise player-facing story (substantial for major releases), runs the importer and validation, deploys from a fresh branch based on current website `origin/main`, and checks production. It stays quiet when nothing has changed. Automation ID: `keep-roblox-game-showcases-current` (ACTIVE at setup).

Canonical website checkout: DGX `/home/toby/.openclaw/workspace/websiteBuilder`. The Mac's older dirty checkout must not be reset or used to overwrite production. Fetch current remote state before work and preserve concurrent commits. A detached external drive, unavailable DGX, or unresolved release/media evidence is a blocked update, not permission to publish guesses.

For immediate same-session updates, the game release agent can use this documented importer after verifying publication; the scheduled follow-up provides the periodic catch-up. The website does not itself publish Roblox builds or upload/schedule YouTube videos.

Channel identities remain separate. Lilly/Wild Rebellion uses `UC7ZfdS-b0zU-cE8Ie6NZVlQ`; TobyOnFitnessTech's development discussion uses `UCmSwMp2gPo5PGl32d4oCu-Q`. Honor `/Users/tobyglennpeters/Documents/video-publishing/channel_profiles.json`. No Spotify workflow is part of these game pages.
