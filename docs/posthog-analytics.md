# PostHog Analytics

PostHog is wired for conservative, explicit analytics. The site builds and runs without a PostHog key; analytics activates when `PUBLIC_POSTHOG_KEY` is available at build time.

## Configure

Local `.env` or GitHub Actions repository variables:

```bash
PUBLIC_POSTHOG_KEY=phc_replace_with_project_key
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Use GitHub repo variables for the production deploy because GitHub Pages builds the static site in Actions.

## Goals

- `contact_intent`
- `newsletter_signup`
- `podcast_subscribe_click`
- `content_card_click`
- `video_embed_loaded`
- `video_play`
- `video_pause`
- `video_progress`
- `video_complete`
- `search_opened`
- `search_performed`
- `search_result_click`
- `search_no_results`
- `search_cleared`
- `affiliate_click`
- `outbound_click`
- `calculator_started`
- `calculator_completed`
- `filter_changed`
- `share_click`
- `language_switch`
- `qualified_engagement`
- `content_scroll_depth`
- `content_next_step_click`
- `hub_path_selected`
- `navigation_click`
- `navigation_menu_opened`
- `search_abandoned`
- `newsletter_form_started`
- `newsletter_submit_attempt`
- `newsletter_signup_error`
- `frontend_resource_error`
- `frontend_long_task`

## Weekly Review

Every Monday compare the last 7 days with the prior 7 days:

- top entry pages and exits
- source/referrer quality
- contact/newsletter/podcast conversion
- content clicks from cards and search
- video playback/progress and calculator started-to-completed engagement
- weak high-traffic pages that need a clearer CTA

Rank 5-10 possible improvements and implement the highest-confidence changes that fit the week.

PostHog project settings also enable privacy-masked session replay, exception capture, Web Vitals, dead-click detection, and heatmaps. Stored client IP data is discarded.
