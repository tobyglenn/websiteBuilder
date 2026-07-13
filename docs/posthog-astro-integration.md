# PostHog Astro Integration

The production integration is active for PostHog project `498166`.

## Runtime Files

- `frontend/src/components/PostHogAnalytics.astro` exposes the public project configuration and loads the versioned analytics bundle.
- `frontend/public/js/posthog-analytics.js` initializes PostHog and owns site-wide event collection.
- `frontend/src/layouts/Layout.astro` renders the analytics component once for every page.
- Component-specific interactions call `window.toftAnalytics.capture(name, properties)`.

The live build needs these public environment values:

```bash
PUBLIC_POSTHOG_KEY=phc_replace_with_project_key
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Never put a PostHog personal API key in the frontend. The project key is intentionally public and is restricted to ingestion.

## Current Configuration

The browser client currently uses:

- explicit pageviews plus page-leave capture
- autocapture for general interaction discovery
- automatic exception and performance capture
- session replay with all text and element attributes masked
- identified-only person profiles
- resource-error and long-task signals
- scroll-depth and qualified-engagement events

Project settings also enable Web Vitals, dead clicks, heatmaps, exception autocapture, console logs, and client-IP discarding.

## Event Contract

Every explicit event includes `page_path`, `page_title`, and `language`. The full goal and event map lives in `docs/posthog-analytics-goals.md`.

Use this pattern inside client components:

```js
window.toftAnalytics?.capture('content_card_click', {
  destination_path: '/wearables/',
  content_type: 'hub',
});
```

Keep event names stable and add properties when more detail is needed. Renaming an event breaks week-over-week dashboard continuity.

## Verification

After deployment:

1. Open the live site in an incognito or clean browser session.
2. Confirm `$pageview` and the expected explicit event in PostHog Live events.
3. Check that replay text is masked before relying on recordings.
4. Confirm the event appears on the `Website Growth Weekly Review` dashboard.
