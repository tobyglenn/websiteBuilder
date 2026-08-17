#!/usr/bin/env bash

set -Eeuo pipefail

WEBSITE_ROOT="${WEBSITE_ROOT:-/home/toby/.openclaw/workspace/websiteBuilder}"
PIPELINE_ROOT="${PIPELINE_ROOT:-/home/toby/.openclaw/workspace/scripts}"

case "$(basename "$0")" in
  ttoft-blog-draft.sh)
    exec "$PIPELINE_ROOT/blog_draft_stage1.sh"
    ;;
  ttoft-blog-review.sh)
    exec "$PIPELINE_ROOT/blog_review_stage2.sh"
    ;;
  ttoft-blog-publish.sh)
    exec "$PIPELINE_ROOT/blog_publish_stage3.sh"
    ;;
  ttoft-gsc-weekly.sh)
    exec "$WEBSITE_ROOT/frontend/scripts/run-gsc-weekly-report.sh"
    ;;
  ttoft-translation-worker.sh)
    exec "$WEBSITE_ROOT/frontend/scripts/run-blog-translation-worker.sh"
    ;;
  ttoft-translation-publish.sh)
    exec "$WEBSITE_ROOT/frontend/scripts/run-blog-translation-publish.sh"
    ;;
  ttoft-sitemap-submit.sh)
    exec "$WEBSITE_ROOT/frontend/scripts/run-gsc-sitemap-submit.sh"
    ;;
  *)
    printf 'Unknown Hermes website job wrapper: %s\n' "$(basename "$0")" >&2
    exit 64
    ;;
esac
