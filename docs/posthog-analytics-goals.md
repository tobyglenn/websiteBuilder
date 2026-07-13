# PostHog Analytics Goals

This is the starting measurement plan for improving the website week by week.

## Primary Outcomes

Track these as the main signals that the website is doing its job:

- `contact_intent`: visitor clicks or submits a contact, booking, or email CTA.
- `newsletter_signup`: visitor submits a newsletter signup form.
- `video_play`: visitor starts an embedded video.
- `podcast_subscribe_click`: visitor clicks through to a podcast platform.
- `affiliate_click`: visitor clicks an affiliate, product, gear, or partner link.
- `search_performed`: visitor searches the site.
- `search_result_click`: visitor clicks a result after searching.
- `qualified_engagement`: visitor spends at least 30 active seconds and reaches at least 50% scroll depth.

## Supporting Signals

Use these to diagnose where improvements should happen:

- `cta_click`: any important non-form CTA click.
- `content_card_click`: click from a card/listing into an article, video, podcast, or calculator.
- `calculator_started`: visitor begins using a calculator/tool.
- `calculator_completed`: visitor reaches a meaningful calculator result.
- `language_switch`: visitor changes language.
- `share_click`: visitor clicks a share button.
- `outbound_click`: visitor leaves through a non-affiliate external link.
- `content_next_step_click`: visitor follows a topic-specific next step from an article or video.
- `hub_path_selected`: visitor selects a decision path on a topic hub.
- `content_scroll_depth`: visitor reaches 25%, 50%, 75%, or 90% of a page.
- `search_abandoned`: visitor searches but closes without selecting a result.
- `newsletter_form_started`: visitor focuses the newsletter email field.
- `newsletter_submit_attempt`: visitor submits the newsletter form.
- `newsletter_signup_error`: newsletter submission fails without collecting the address.
- `frontend_resource_error`: a script, stylesheet, or image fails to load.
- `frontend_long_task`: a browser main-thread task lasts at least 100ms.

## Recommended Properties

Keep properties useful and privacy-light:

- `page_path`
- `page_title`
- `cta_label`
- `content_type`
- `content_slug`
- `destination`
- `language`
- `position`
- `referrer_path`

Avoid collecting form field values, names, emails, free-text messages, or anything health-sensitive.

## PostHog Configuration

Current production configuration:

```js
posthog.init(import.meta.env.PUBLIC_POSTHOG_KEY, {
  api_host: import.meta.env.PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  autocapture: true,
  capture_pageview: false,
  capture_pageleave: true,
  capture_exceptions: true,
  capture_performance: true,
  disable_session_recording: false,
  person_profiles: "identified_only",
  mask_all_text: true,
  mask_all_element_attributes: true,
  loaded: (posthog) => {
    posthog.register({
      site: "tobyonfitnesstech",
    });
  },
});
```

The PostHog project also discards stored client IPs and uses total-privacy session replay masking. Custom events never include email addresses, form values, free-text messages, or health-sensitive values.

## Weekly Review Questions

Every Monday review the last 7 days against the previous 7 days:

- Which pages grew or declined the most?
- Which traffic sources produced engaged visitors?
- Which CTAs got clicks, and which high-traffic pages had weak CTA engagement?
- Which search terms produced no result click?
- Which videos, podcast pages, and calculators created the deepest engagement?
- Which pages had high exits, low scroll/interaction, or technical issues?
- Which 5-10 changes should be ranked for this week, and which can be implemented immediately?

## First Dashboard

Create a PostHog dashboard with:

- Visitors, sessions, pageviews, and top referrers.
- Top pages by visitors.
- Top entry pages and top exit pages.
- CTA clicks by page.
- Newsletter/contact funnel.
- Video/podcast engagement.
- Search performed to search result click funnel.
- Affiliate/partner outbound clicks.
