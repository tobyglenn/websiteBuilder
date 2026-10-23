# Wild Racing page review — 2026-10-23

Local-only proposal for `/projects/wild-rebellion/`. No push, commit, or deployment performed. Work executed directly on `gx10-594d` in the existing websiteBuilder checkout, starting at `10ae899bad1481e5bce3e21b6a4c8d3273123b8f`.

## Evidence and editorial boundaries

- Verified YouTube video: **I Built a Roblox World With My Daughter Using AI | Wild Racing + AI Update**, https://www.youtube.com/watch?v=ig4M6ifI070. Public YouTube watch-page player metadata and oEmbed agree on ID/title/channel. Channel ID `UCmSwMp2gPo5PGl32d4oCu-Q`. Duration 2,027 seconds (33:47).
- Live start: `2026-10-21T16:19:41+00:00`; live end `2026-10-21T16:55:15+00:00`. Replay publish timestamp `2026-10-21T22:00:30-07:00`, equivalent to **October 22, 05:00:30 UTC**. Preserve this distinction in copy and VideoObject uploadDate.
- Latest relevant match in the website catalog fetched October 23 at 11:30 UTC. The newer Short `2ynjVE2VV1w`, “The racing side project became the main game #Shorts” (October 23), explicitly points back to this livestream. Public channel-stream listing returned no usable video renderers, so “latest” is based on the current catalog and linked Short, not a complete independently parsed channel history.
- YouTube English automatic captions were advertised but returned an empty response and then HTTP 429 through the current downloader. Downloaded the full public audio instead and transcribed locally using cached faster-whisper base, English, CPU int8, beam size 5. Read the complete 294-segment transcript, with speech from 0:00 through 33:41.48 in the 33:47 media. **Machine transcription, not an official or manually corrected verbatim transcript.** The accompanying review transcript preserves this status; proper names/model names in unrelated sections contain recognition errors. No long quotations or speculative model claims enter the page.
- Pivot support: around 6:54–7:32 expanding mechanics and a complicated RPG; 9:34–10:03 considering spend/click-through, racing built on a whim, several nights of family play, moving racing to the front/core loop; 10:03–10:27 simpler name and retaining Adventure/Story; 10:27–10:40 engagement hopes and future advertising. Page paraphrases these reasons and distinguishes hopes from shipped features. It does not claim improved engagement or changed Roblox eligibility.
- Current game description verified through both the public Roblox page https://www.roblox.com/games/137414447181099/ and https://games.roblox.com/v1/games?universeIds=10767746288. Universe/root place matched; name Wild Racing, creator tobyglenn1. Lists 6 kart tracks + 3 boat courses, CPU rivals, items/BOOST, solo Time Trials, 24-racer capacity specifically for World Rim Rally and Coral Cove, garage rewards/upgrades/styles, daily coin gift, camera views, and Adventure/Story hub portals. These are attributed to the listing, not represented as independently device-playtested features.
- Recent reframe commit inspected: `13bb5e1df1ac96c6fe610fc4887ab8586621cf15` (October 21). It changed the title/intro/FAQ, but left the broad adventure-led showcase structure. This proposal replaces that English entry point while retaining the journal.

## Image provenance — pixels inspected

All three game images came from the public thumbnail API for the exact universe, not from existing filename labels:
https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=10767746288&countPerUniverse=10&defaults=true&size=768x432&format=Png&isCircular=false

- `race-your-friends.png`: asset **132450084844291**, CDN `https://tr.rbxcdn.com/180DAY-974027932187ab8459968d232aabfc0f/768/432/Image/Png/noFilter`. Wild Racing branding, pink axolotl and other kart racers.
- `take-on-the-loops.png`: asset **76300681443369**, CDN `https://tr.rbxcdn.com/180DAY-88298d516486545a201529b28c18b21e/768/432/Image/Png/noFilter`. Wild Racing branding, two karts on purple loop track.
- `make-waves.png`: asset **82939073368875**, CDN `https://tr.rbxcdn.com/180DAY-44a2f870de85a0ebba4416f66d02299c/768/432/Image/Png/noFilter`. Wild Racing branding, boats between buoys.
- `livestream-thumbnail.jpg`: `https://i.ytimg.com/vi/ig4M6ifI070/maxresdefault.jpg`, verified against current player metadata; Toby portrait and Wild Racing / AI Update text.

These are **official promotional illustrations/thumbnails, not actual gameplay screenshots**. Full logos retained, no crops or generated gameplay. No older Wild Rebellion gallery images used. No blog-image replacement or homepage-cover changes included.

## Implementation

Dedicated English WildRacingShowcase: racing hero, Play CTA, current course counts and features, three-part pivot explanation with timestamp source links, click-to-load YouTube video and chapter links, development-goal boundary, relationship to original Adventure/Story, expandable dated journal, getting-started steps and support. Existing URL and old section fragment aliases preserved. VideoGame/VideoObject JSON-LD, canonical, breadcrumbs, Pagefind markers, analytics hooks, image dimensions/alt/captions, keyboard focus, responsive layouts, light/dark themes, and reduced-motion support retained or added.

Locales `de/es/pt/hi` retain their previous translated page. Each has a visibly English, lang=en notice explaining that the racing update awaits translation review and linking directly to English. The translation transformer preserves that notice and its English destination. The release-message completeness collector explicitly holds this one updated English route rather than manufacturing unreviewed translations. Other release surfaces remain audited. Locale pages and reciprocal language links remain available. Translation review is outstanding before the new racing content replaces those older versions.

## Preservation

User-edited `siteMetrics.json` SHA-256 before work: `be6e9d6e8aeb34ecdf6461cf1cb2128fea42f2d84364ee91e7bf6c224e020f7f`.

The production pipeline is run without `build:site-metrics`, because that step overwrites the user's edits. All other production steps are run explicitly. No blog source, pending package, credentials, access, security, or deployment settings changed. The already-published article remains dated and untouched.

## Final verification

Node 24 Astro sync and production build passed (2,665 pages). Pagefind indexed 2,485 pages. Indexability: 0 broken internal links. Hreflang: 2,470 sitemap pages / 10,055 language links / 0 failures. Release locales passed with the explicit Wild Racing translation hold. Blog translations: 189 posts / 756 files valid. Game-content tests passed. Production Chrome checks passed at 1440×1000, 390×844 and 320×740; light/dark themes, images, zero horizontal overflow, section anchors, canonical, journal disclosure, click-to-load correct video, and all four locale notices checked. External analytics were blocked during browser checks. Screenshots visually inspected. siteMetrics checksum unchanged.

Library artifacts: HTML libfile_3509f930027c8191872f94d9701d99bc; desktop libfile_3a69ecae50a08191a2259d2b4f0d4ada; mobile libfile_768988c824588191a28671c68400f032.
