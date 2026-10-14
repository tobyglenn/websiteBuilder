#!/usr/bin/env node
// Kept as a compatibility entry point. The old broad zone rules discarded
// filters and redirected unrelated 404s to indexes. Exact bulk mappings now
// preserve queries, language and episode identity. This only exports a CSV;
// review/import it into the existing Cloudflare bulk list (see operations doc).
import './generate-seo-redirects.mjs';
