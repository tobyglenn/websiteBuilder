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
- `search_performed`
- `search_result_click`
- `affiliate_click`
- `outbound_click`
- `calculator_completed`
- `share_click`
- `language_switch`

## Weekly Review

Every Monday compare the last 7 days with the prior 7 days:

- top entry pages and exits
- source/referrer quality
- contact/newsletter/podcast conversion
- content clicks from cards and search
- video and calculator engagement
- weak high-traffic pages that need a clearer CTA

Make one to three focused website improvements from the review.
