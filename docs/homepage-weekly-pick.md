# Homepage weekly pick

The hero promotes one existing published article instead of permanently promoting the WHOOP comparison. It also links directly to the latest published full-length video.

`frontend/src/lib/weeklyFeature.mjs` selects from the six newest canonical articles with a valid publication date, title, excerpt, image, and content. The calendar week starts Monday in America/New_York. With an unchanged catalog, the selection stays consistent during the week and cycles through six different articles over six weeks. New publications enter the pool when the site rebuilds; the feature is an archive recommendation, not a promise of newly written weekly content.

`homepageFeature.ts` resolves the same selected slug for every homepage language. It uses a published translation when available, otherwise links to the English original with its English title and summary. The latest-video shortcut excludes Shorts, live streams, and future publication dates.

The deploy workflow runs Monday at 10:17 UTC (6:17 AM Eastern during daylight saving time, 5:17 AM in winter), as well as on main pushes and manual dispatch. GitHub scheduling and deployment can delay the visible change. No browser clock, random selection, or client hydration is needed for the hero.

Both the weekly article and latest-video link retain `content_card_click` telemetry with separate `homepage_weekly_pick` and `homepage_latest_video` positions. This preserves measurement without claiming that past small samples established a permanent homepage winner.

Validation: `node --test frontend/scripts/tests/weekly-feature.test.mjs`, the production build and indexability audit, and desktop/mobile inspection of rendered homepage cards across all five languages.
