# websiteBuilder — Agent & System Architecture Guide

Welcome to the **Toby On Fitness Tech** codebase (`websiteBuilder`). This repository contains the source code, automation scripts, database schemas, and CI/CD pipelines for [tobyonfitnesstech.com](https://tobyonfitnesstech.com).

For detailed frontend specifications, component patterns, and styling guidelines, consult:
👉 **[`frontend/AGENTS.md`](file:///Users/tobyglennpeters/.openclaw/workspace/websiteBuilder/frontend/AGENTS.md)**

---

## 1. Repository Structure

```
websiteBuilder/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated GitHub Actions CI/CD to GitHub Pages
├── .nvmrc                      # Node 24 runtime specification
├── .prettierrc                 # Code formatting rules
├── frontend/                   # Astro 7 + Tailwind v4 + React application
│   ├── .nvmrc
│   ├── .prettierrc
│   ├── AGENTS.md               # Frontend-specific architecture and guidelines
│   ├── astro.config.mjs        # Astro configuration (@tailwindcss/vite, remotePatterns, sitemap)
│   ├── eslint.config.mjs       # Modern ESLint flat configuration
│   ├── package.json
│   ├── public/                 # Static assets, images, analytics loaders
│   └── src/
│       ├── content.config.ts   # Astro Content Layer (videos collection)
│       ├── components/         # React islands & Astro layout components
│       ├── data/               # Canonical datasets (videos.json, projects.ts, gearItems.ts)
│       ├── layouts/            # Global HTML layouts (Layout.astro)
│       ├── lib/                # Client libraries (analytics, hubClient, videoMeta)
│       ├── pages/              # Astro routes (/videos, /video/[id], /workout-hub, /start-here, etc.)
│       └── styles/             # Global CSS and theme custom properties
├── scripts/                    # Automation and pipeline scripts
│   ├── generate_videos_data.mjs # Combines yt_videos_full.json + transcript_index.json -> videos.json
│   ├── nightly_pipeline.sh     # Nightly WHOOP and metrics refresh
│   └── ...
└── supabase/                   # Supabase configuration, migrations & edge functions
    ├── config.toml
    ├── migrations/             # SQL migrations (workout_hub)
    └── functions/              # Deno Edge Functions (hub-connect, sync-completions)
```

---

## 2. Key Systems & Features

1. **Video Catalog & SEO**:
   - 494 YouTube videos indexed with 101 full transcripts, key takeaways, and jump-to-timestamp chapters.
   - Built on Astro Content Collections (`src/content.config.ts`) with VideoObject schema and `speakable` definitions for Google search indexing.
   - Shareable and crawlable category filter state via `?cat=<category>` URLs.
2. **Speediance Workout Hub**:
   - Localized entry page (`/workout-hub/`) linking to the shared routine catalog, training approach, and transformation timeline.
   - Links to the existing 53-routine Speediance library and its client-side JSON export.
3. **Lead Generation & Conversion Funnel**:
   - Guide links on `/start-here` connecting hardware reviews to the published transformation timeline.
   - Kit newsletter signup with verified HTTP success, retryable errors, and no form values in analytics. The email_leads migration is an undeployed draft.
4. **Interactive Projects & Roblox Games**:
   - Showcase on `/projects/` featuring *Ironvane Chronicle*, *Monstrum World*, and *Wild Rebellion*, alongside fitness tools.
5. **Theme Engine**:
   - Persistent light and dark mode toggles; dark remains the default.

---

## 3. Essential Commands

```bash
# Install dependencies
cd frontend && npm install

# Regenerate videos.json from raw transcripts and YouTube metadata
node scripts/generate_videos_data.mjs

# Run frontend tests
cd frontend && npm run test:workout-hub

# Build production bundle (includes feed snapshot, Astro build, Pagefind indexing, indexability audit)
cd frontend && npm run build

# Preview production build locally
cd frontend && npm run preview
```

---

## 4. Deployment & CI/CD

- **Production URL**: [https://tobyonfitnesstech.com](https://tobyonfitnesstech.com)
- **GitHub Actions Pipeline**: Configured in `.github/workflows/deploy.yml`.
  - Automatically runs on pushes to `main` branch.
  - Installs dependencies using Node 24.
  - Generates video data and builds the static site into `frontend/dist/`.
  - Deploys directly to GitHub Pages with zero downtime.

---

## 5. Working Rules for AI Agents

1. **Keep Data Valid**: Always ensure TypeScript exports in `src/data/` (such as `gearItems.ts` and `projects.ts`) have complete string literals and conform to required types.
2. **Run Sync & Build**: After altering video or project data schemas, run `npx astro sync` and `npm run build` in `frontend/` to confirm that all 2,300+ pages and localized routes build cleanly without errors.
3. **Preserve Analytics Integrity**: When modifying interactive components, retain `data-analytics-event` attributes and `captureEvent()` telemetry calls.

## Daily blog source and recovery policy

Publish one useful, independently reviewed article daily. Draw from the public YouTube archive (including distinct supported questions within older recordings), Lilly production, public/open-source project prose, Wild Rebellion and other game journals, and owner-approved narrative descriptions of current work. The versioned source plan is `scripts/dgx/blog-source-plan.json`.

Never ingest or publish private repository source code. Public repository intake must verify public visibility and read only explicitly listed prose documents. Private-project narratives require explicit owner approval. Discuss model use and opinions only when supported by the owner's actual statements; do not invent model assignments, benchmarks or experiences.

Keep an approved reserve pool, replenish source angles, and recover a failed draft or review by trying another evidence packet. Reuse of a source requires a distinct reader question and new reader value, not rewritten prior prose. Do not report routine content scarcity or silently skip the daily publication. Report real technical failures after recovery attempts fail. Preserve existing approvals and schedules, including the 19:00 America/New_York publish slot. DGX is canonical; never deploy from a stale Mac checkout.
