# Daily ARIA draft → Toby review → exact DGX release

Effective October 21, 2026. ARIA prepares a draft at **18:00 America/New_York**.
There is no automatic article publishing time. After Toby personally approves the
specific immutable version, invoke the approved release immediately. No response,
old approval, model quality approval, or general infrastructure approval is article
approval. A revision always needs a new version and a new personal approval.

## Source intake for the parent ARIA task

Use the existing Mac SSH alias; no browser, visible display, new key, or remote agent
is needed. Set `BatchMode=yes` to fail instead of waiting for interactive auth.

```sh
ssh -o BatchMode=yes -o ConnectTimeout=15 dgx \
  'python3 /home/toby/.openclaw/workspace/websiteBuilder/scripts/dgx/blog_release.py intake' > intake.json
```

The exported object contains the current source plan, complete dated public prose
snapshots, verification errors/dates, and already published slugs. Plan path:
`scripts/dgx/blog-source-plan.json`; source cache: `scripts/dgx/source-library.json`.
The source families are public original long-form YouTube passages, public project
pages, game journals, explicitly listed public repository prose, and owner-approved
narrative notes. Read complete selected sources and related existing articles; choose
a distinct useful reader question, not a rewrite. Never ingest private source code.
Owner notes support only their actual statements, not invented opinions or model
assignments. Dated cached evidence is not proof of current product behavior.

If a fresh snapshot is needed, this existing deterministic source collector uses
public endpoints only, no AI calls or publication. Inspect its errors and dates:

```sh
ssh -o BatchMode=yes dgx \
 'cd /home/toby/.openclaw/workspace/websiteBuilder && python3 scripts/dgx/blog_sources.py refresh scripts/dgx/blog-source-plan.json scripts/dgx/source-library.json'
```

Public repository intake verifies public visibility before reading listed prose.
Do not lower source standards or use private repository source code to fill a day.
ARIA authors and edits the copy itself, then includes the full evidence and final
image in the review packet. Existing MiniMax/Nemotron receipts confer no user approval.

## Package schema

A UTF-8 JSON file contains exactly these top-level fields:

```json
{
  "schema": "toft-manual-blog-v1",
  "article": {
    "slug": "distinct-reader-question",
    "title": "Final title",
    "excerpt": "Final excerpt",
    "category": "Build Logs",
    "date": "2026-10-21",
    "readTime": "3 min read",
    "thumbnail": "/images/blog/distinct-reader-question.jpg",
    "tags": ["topic", "specific subject"],
    "content": "<h2>Final heading</h2><p>Final supported prose and source citations.</p>",
    "source_url": "https://example.com/public-evidence",
    "editorial_lane": "game-development"
  },
  "sources": [
    {"id": "source-id", "kind": "public-page", "title": "Public source title", "url": "https://example.com/public-evidence", "text": "Full source text", "sha256": "SHA256_OF_UTF8_TEXT"}
  ],
  "assets": [
    {"path": "frontend/public/images/blog/distinct-reader-question.jpg", "sha256": "SHA256_OF_IMAGE_BYTES", "base64": "BASE64_IMAGE_BYTES"}
  ],
  "translations": []
}
```

Optional article fields are `id`, `featured` (false only), `source_video_id`,
`source_section`, `source_bundle`, `editorial_lane`. All article fields, sources,
embedded asset bytes/digests and translation records enter the canonical SHA-256.
Dates, images, tags and citations cannot change after approval. Supply final source
citations in `content`: the publisher does not append or rewrite them.

`translations: []` explicitly means an English-only version. If desired, ARIA may
supply all four reviewed records (`de`, `es`, `pt`, `hi`) in the same version before
review. Each follows the existing generated-record schema: `slug`, `lang`, `title`,
`excerpt`, `category`, `categoryKey`, `published_at`, `image`, `tags`, `content`,
`sourceHash`, `sourceTitle`, `translatedAt` and optional authorship metadata. The
`sourceHash` follows `computeSourceHash` in `frontend/scripts/blog-translations.mjs`.
The existing output validator verifies it during build. Partial locale sets are held.
No translations are generated or independently promoted for blogs on the DGX.
Existing published blog translations are retained. Priority-page translation jobs
remain separate and preserve their existing model configuration.

## Headless staging and review

```sh
ssh -o BatchMode=yes dgx \
 'python3 /home/toby/.openclaw/workspace/websiteBuilder/scripts/dgx/blog_release.py stage -' < package.json
```

This returns the full `sha256` and paths. Staging grants no approval. Storage:

- `/home/toby/.openclaw/workspace/blog-drafts/manual-release/packages/<sha>/package.json`
- same directory: `review.html` (self-contained image, exact copy, metadata, sources, translations)
- same directory: `review.json` (state `awaiting_user_review`)
- `manual-release/approvals/<sha>.json` (created only by explicit approval command)
- `manual-release/receipts/<sha>.json` (commit/push status, supports uncertain-push recovery)
- `manual-release/logs/<sha>[-preflight].log` (full build output with URLs redacted)

Fetch `review.html` over SSH to a local file and open that file for Toby. Present the
slug and full version hash with the article, then retain the trusted user message
reference when Toby explicitly approves it. Do not infer approval from a timer or
from the earlier request to build this infrastructure. The HTML is only a private
review file, not a deployed preview. The JSON package is the authoritative version.

To test the real build without approval, commit/push, or production article changes:

```sh
ssh -o BatchMode=yes dgx \
 'python3 /home/toby/.openclaw/workspace/websiteBuilder/scripts/dgx/blog_release.py preflight --sha256 FULL_SHA256'
```

Preflight uses an isolated temporary worktree, checks the normalized canonical
article matches the reviewed fields, verifies the full build and audits, then
rechecks package/assets/translations. It grants no approval. It uses the locally
committed infrastructure at HEAD; uncommitted code is not a release base.

Only after the explicit exact-version user approval:

```sh
ssh -o BatchMode=yes dgx \
 'python3 /home/toby/.openclaw/workspace/websiteBuilder/scripts/dgx/blog_release.py approve-and-publish --sha256 FULL_SHA256 --approval-message-ref TRUSTED_USER_MESSAGE_REFERENCE'
```

The caller is the trusted approval recorder: invoke only in direct response to Toby's
approval of this hash. This is an audit record under the existing SSH identity, not a
new identity or cryptographic signature. Draft artifacts cannot carry approval fields.
The publisher checks that internal receipt, serializes releases, builds only the
approved content in a detached worktree, and stages only package paths. It performs
no AI rewrite, model call, image generation, reserve substitution or approval inference.

Receipt status `pushed` means accepted by origin/main, **not** confirmed live on Pages.
Check the GitHub deployment and public URL before reporting live. Push failures leave
a durable `push_pending` receipt; retry the same exact version with `publish --sha256`
after inspecting the outcome. The command fetches and checks ancestry first, so an
accepted push with a lost response is reconciled without creating a second article.
A diverged/stale base holds rather than rebasing or changing an approved package.

## Migration scope and preserved pending work

The four old Hermes blog jobs (prepare, draft, AI review, timed publish) are paused.
Legacy `blog_pipeline.py` CLI entrypoints reject execution. Historic helpers and tests
remain for audit purposes; they are not part of the active model-free release path.
The shared translation worker/publisher now handles only unrelated priority pages;
it neither generates, stages nor commits blog translations. Old blog translation
mutation CLI commands also reject execution; read/validation functions remain.

The original `blog-drafts/pending.json` is preserved byte-for-byte. `import-pending`
stages its content/image/source packet for review and strips the old model approval
fields; it never grants personal approval. Migration backups live under
`/home/toby/.openclaw/backups/blog-manual-migration-20261021/`.

## Approved existing-article image correction

`blog_image_update.py` provides a separate guarded operation for the reviewed
Wild Rebellion image correction. The original new-article duplicate-slug guard
remains unchanged. Stage the replacement package normally, then use:

```sh
python3 scripts/dgx/blog_image_update.py preflight --original-sha256 ORIGINAL_HASH --sha256 REPLACEMENT_HASH
python3 scripts/dgx/blog_image_update.py approve-and-update --original-sha256 ORIGINAL_HASH --sha256 REPLACEMENT_HASH --approval-message-ref TRUSTED_USER_MESSAGE
```

The approval must explicitly cover the replacement image and scoped layout.
It binds both package hashes and layout version. Only thumbnail and embedded
asset may differ; article text, date, metadata, sources and translations cannot.
The original must have a pushed receipt. The deterministic layout allowlist
contains the homepage cover mapping/component and blog index; only this slug
gets the reviewed cover and contain/no-zoom treatment. No arbitrary patches
are accepted. The operation uses an isolated worktree, verifies the original
and replacement canonical article, builds, rechecks hashes and approval, then
pushes normally. It never changes another task's active checkout.

Approvals, logs, preflights and idempotent receipts live beneath
`manual-release/image-updates/`. An uncertain push is checked against the remote;
a non-confirmed pending commit is held for explicit reconciliation, never blindly
republished. Other existing-article revisions require a separately reviewed
workflow. This command does not change source evidence or generate translations.
