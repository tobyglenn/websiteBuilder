# DGX Website Operations

This is the working runbook for `tobyonfitnesstech.com`: where the source lives, how to edit and deploy it, how daily content/data jobs work, and where to look when something fails.

## Source of Truth

- DGX host alias: `dgxspark`
- Repository: `/home/toby/.openclaw/workspace/websiteBuilder`
- Frontend: `/home/toby/.openclaw/workspace/websiteBuilder/frontend`
- Git remote: `git@github.com:tobyglenn/websiteBuilder.git`
- Production branch: `main`
- Live site: `https://tobyonfitnesstech.com`
- Hosting: GitHub Pages, deployed by `.github/workflows/deploy.yml`

The DGX repository is the authoritative working copy for automated fitness data, daily blog publishing, and production commits. Avoid having two machines generate and push the same content at the same time.

## Connect

```bash
ssh dgxspark
cd /home/toby/.openclaw/workspace/websiteBuilder
git status --short
```

Before editing, check for existing work. Do not discard or overwrite unrelated modified data files.

## Edit And Preview

The site is Astro 5 with React components and Tailwind CSS.

```bash
cd /home/toby/.openclaw/workspace/websiteBuilder/frontend
npm ci
npm run dev -- --host 0.0.0.0
```

Common locations:

- Pages: `frontend/src/pages/`
- Shared layouts: `frontend/src/layouts/`
- Header/footer and interactive UI: `frontend/src/components/`
- Blog markdown: `frontend/src/pages/blog/`
- Generated/dynamic blog records: `frontend/src/data/mock.js`
- Fitness data: `frontend/src/data/`
- Public images and scripts: `frontend/public/`
- Sitemap configuration: `frontend/astro.config.mjs`
- PostHog loader: `frontend/public/js/posthog-analytics.js`

## Build And Deploy

Always run the production build before committing:

```bash
cd /home/toby/.openclaw/workspace/websiteBuilder/frontend
npm run build
```

Then commit only the intended files:

```bash
cd /home/toby/.openclaw/workspace/websiteBuilder
git status --short
git add <intended-files>
git commit -m "type: concise description"
git pull --rebase origin main
git push origin main
```

A push to `main` runs `.github/workflows/deploy.yml`, builds the site, generates Pagefind search data, submits the sitemap to Bing IndexNow, and publishes `frontend/dist` to `gh-pages`.

Verify after deployment:

```bash
curl -I https://tobyonfitnesstech.com/
curl -I https://tobyonfitnesstech.com/sitemap-index.xml
curl -s https://tobyonfitnesstech.com/sitemap-index.xml | head
```

## Production Analytics

PostHog project: `498166`

Weekly growth dashboard:

`https://us.posthog.com/project/498166/dashboard/1840395`

Production build variables are stored as GitHub Actions repository variables:

- `PUBLIC_POSTHOG_KEY`
- `PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`

Do not write the PostHog key into source files. The public site loads it at build time through `PostHogAnalytics.astro`.

Current privacy configuration:

- client IP storage discarded
- session replay enabled with all text and images masked
- form values are never sent in custom events
- person profiles created only for identified visitors
- exception, Web Vitals, dead-click, and heatmap capture enabled

Google Search Console is accessed with the existing signed-in Google account in Chrome. The sitemap is:

`https://tobyonfitnesstech.com/sitemap-index.xml`

Search Console reports lag behind live fixes. Check a reported URL with `curl -I` before treating an old 404, redirect, or canonical sample as a current production failure.

## Sitemap And Redirects

Astro generates the sitemap index during the production build. Blog `lastmod` dates and sitemap exclusions are configured in `frontend/astro.config.mjs`.

Cloudflare managed redirects for legacy podcast, locale, feed, and malformed transcript URLs are defined by:

```bash
cd /home/toby/.openclaw/workspace/websiteBuilder/frontend
npm run cloudflare:redirect:podcast-transcripts
```

That command requires the Cloudflare API token and zone configuration in the DGX environment. Test representative redirects after any rule change:

```bash
curl -I https://tobyonfitnesstech.com/podcasts/hi/
curl -I https://tobyonfitnesstech.com/blog/rss.xml
```

## Daily Blog Publishing

DGX cron owns the daily three-stage pipeline:

- 6:00 PM: `/home/toby/.openclaw/workspace/scripts/blog_draft_stage1.sh`
- 6:15 PM: `/home/toby/.openclaw/workspace/scripts/blog_review_stage2.sh`
- 7:00 PM: `/home/toby/.openclaw/workspace/scripts/blog_publish_stage3.sh`

All three call `/home/toby/.openclaw/workspace/scripts/blog_pipeline.py`.

Logs:

```bash
tail -100 /home/toby/.openclaw/logs/pipeline/blog_draft_stage1.cron.log
tail -100 /home/toby/.openclaw/logs/pipeline/blog_review_stage2.cron.log
tail -100 /home/toby/.openclaw/logs/pipeline/blog_publish_stage3.cron.log
```

The publish stage builds the frontend, commits the article, rebases against current `origin/main`, pushes, and reports the result. A pending draft can intentionally block the next draft until it is reviewed or cleared.

## Fitness Data Refresh

The main data jobs run from the DGX crontab. Inspect the active schedule with:

```bash
crontab -l
```

Relevant jobs include:

- 3:00 AM dashboard generation: `scripts/wrappers/generate_dashboard_pages.sh`
- 7:30 AM morning pipeline: `scripts/wrappers/morning_pipeline.sh`
- 7:50 PM nightly pipeline: `scripts/wrappers/nightly_pipeline.sh`
- daily homepage refresh is called from the fitness pipeline wrappers

Pipeline logs live under `/home/toby/.openclaw/logs/pipeline/`. Use file modification times and the final success marker to confirm a job actually ran for the current day.

## Failure Handling

Expected behavior for a failed blog stage:

1. Exit nonzero.
2. Write the full error to its cron log.
3. Post a concise error through `scripts/utils/post_build_log.py`, which routes failures to `#build-log-errors`.
4. Send a Hermes notification to the configured Telegram target.

If a failure appears silent, check:

```bash
command -v hermes
python3 /home/toby/.openclaw/workspace/scripts/utils/post_build_log.py --help
tail -100 /home/toby/.openclaw/logs/pipeline/blog_publish_stage3.cron.log
```

Do not treat “no pending draft” as a failure. Treat provider errors, malformed draft output, build failures, Git conflicts, and push failures as actionable errors.

## Weekly Growth Review

Every Monday compare the most recent seven complete days with the previous seven complete days.

Use:

- PostHog dashboard `1840395`
- PostHog event/property queries
- Google Search Console performance and indexing reports
- live sitemap and redirect checks
- current repository changes and publishing cadence
- live page and mobile QA

Produce 5-10 ranked improvements. Each recommendation should include evidence, the page or workflow affected, expected reader/discovery impact, effort, and the exact measurement used the following week. Implement the highest-confidence changes that fit the week rather than producing a report only.

### Search Console API readiness

Chrome remains the authenticated fallback for Search Console until API credentials are installed. The frontend also includes an API-ready weekly report command:

```bash
cd /home/toby/.openclaw/workspace/websiteBuilder/frontend
GSC_ACCESS_TOKEN="$(gcloud auth application-default print-access-token)" npm run report:gsc
```

The command compares the latest complete seven-day window with the prior seven days and returns top pages and queries as JSON. It accepts `GSC_SITE_URL` when a property other than `sc-domain:tobyonfitnesstech.com` is needed. The Google account or service account supplying the token must have Search Console access and the Search Console API enabled.

### Indexability build gate

Every production build runs `npm run audit:indexability` after Astro and Pagefind. The gate checks sitemap URLs for generated HTML, one matching canonical, one H1, and a meta description; it also fails on broken same-site links or junk sitemap paths. Fix the source rather than bypassing the gate when it catches a new publishing or navigation error.
