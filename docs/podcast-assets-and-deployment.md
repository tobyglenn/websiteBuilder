# Podcast artwork and production deployment

`main` is the only production source branch. `.github/workflows/deploy.yml` builds
and uploads a GitHub Pages artifact, then deploys it with the `github-pages`
environment. Pages Source is **GitHub Actions**. No generated output branch is
needed. The weekly refresh and manual workflow trigger remain available.
`retain-deploy-assets.mjs --live` preserves recent immutable browser bundles from
the live site's retention manifest for 30 days, including their original usage
dates. It does not copy old pages or source maps.

Full-size podcast artwork stays at existing public GitHub release/archive URLs.
`frontend/src/data/podcast-assets.json` records the exact source URL, SHA256,
original dimensions, and 320/640px WebP previews. A small number of historical
images have no identical podcast-repository original and point to the preserved
website commit. Git history must remain intact for those URLs. Removing duplicate
originals from the source tree and deploy output does not erase Git history.

Old `/images/podcast/*.png` and JPG URLs are covered by the existing Cloudflare
account's `toft_podcast_originals_20261104` Bulk Redirect list (642 exact paths).
They redirect to the verified public originals. WebP preview URLs remain on the
website. Social metadata and structured data use the same-origin 640px WebP,
so crawlers receive image content rather than GitHub download attachment headers.
No Cloudflare Pages, object storage or paid service is used.

AgentStack Daily uploads approved source artwork to its existing public media
releases first. Its DGX writer then invokes:

```sh
node frontend/scripts/sync-podcast-assets.mjs --episode 127 \
  --staging-dir /tmp/staged --cover episode_127_cover.png
```

The importer verifies the published bytes against the staged source, writes only
small WebPs and updates the catalog. The DGX helper holds the repository writer
lock, requires `main` to fast-forward cleanly, and commits only returned asset
paths. Unrelated staged and unstaged changes are preserved. Approval gates for
episode publication remain in the podcast orchestrator. The old standalone shell
publisher is retired.

Always publish website source from the canonical DGX checkout. Do not restore
original PNG/JPG copies to websiteBuilder; the ignore rules and build audit reject
them. Responsive Astro images must merge attributes in one spread, for example
`{...{ src, ...imageVariants(src, sizes) }}`, to avoid duplicate `src` attributes.
