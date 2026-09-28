# Toby On Fitness Tech (`websiteBuilder`)

Official codebase for **[tobyonfitnesstech.com](https://tobyonfitnesstech.com)** — dedicated to real-world fitness technology reviews, data-driven strength training, Speediance home gym programming, and athletic longevity.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v24 (managed via `.nvmrc` and `frontend/.nvmrc`)
- **Package Manager**: `npm`

### Setup & Development

```bash
# Clone the repository
git clone https://github.com/tobyglenn/websiteBuilder.git
cd websiteBuilder

# Switch to frontend and install dependencies
cd frontend
npm install

# Generate / update the 494-video catalog from YouTube & transcripts
node ../scripts/generate_videos_data.mjs

# Start local Astro development server
npm run dev
```

### Production Build & Preview

```bash
# In frontend directory:
npm run test:workout-hub    # Run test suite
npm run build               # Builds Astro site, generates Pagefind index & audits indexability
npm run preview             # Preview static build locally
```

---

## 🌟 Key Features

1. **Complete Video & Transcript Library (494 Videos / 101 Transcripts)**:
   - Full catalog generated from `yt_videos_full.json` and `transcript_index.json`.
   - Dedicated `/video/[id]/` pages with interactive YouTube player, click-to-jump chapters, key takeaways, and full transcript.
   - Comprehensive `VideoObject` Schema.org JSON-LD with Google `speakable` markup for enhanced search visibility.
2. **Data-Driven Categorization & URL State**:
   - Explicit categories (`speediance`, `bjj`, `wearables`, `transformation`, `training`, `coding`, `shorts`) and tags in data files.
   - URL synchronization (`/videos?cat=bjj`) with browser history support for shareable and crawlable filter views.
3. **Speediance Workout Hub (`/workout-hub/`)**:
   - Localized guide directory linking to the existing 53 shared routines, training approach, and transformation timeline.
   - One-click client-side JSON export compatible with Speediance Manager.
4. **Lead Generation & Conversion Funnels**:
   - Measured guide links on `/start-here` leading to the published Speediance and transformation guides.
   - Kit newsletter capture with retryable failure feedback and success events only after an accepted response.
5. **Interactive Projects & Games**:
   - Showcase on `/projects/` featuring Roblox titles (*Ironvane Chronicle*, *Monstrum World*, *Wild Rebellion*) and web tools.
6. **Modern Design & Theming**:
   - Opt-in Light and Dark themes with zero flash of unstyled content (anti-FOUC).
   - High-contrast toggle in header with keyboard navigation and mobile drawer support.

---

## 🏗️ Architecture & Tech Stack

- **Framework**: [Astro 7](https://astro.build/) (`astro@^7.1.6`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Islands**: [React 19](https://react.dev/) (`react@^19.2.8`)
- **Data Collections**: Astro Content Layer API (`frontend/src/content.config.ts`)
- **Search**: [Pagefind](https://pagefind.app/) static search engine
- **Analytics**: [PostHog](https://posthog.com/) with YouTube milestone telemetry, card clicks, and conversion tracking
- **Database / Backend**: [Supabase](https://supabase.com/) for optional workout hub sessions and leaderboards

---

## 📁 Repository Layout

```
websiteBuilder/
├── .github/workflows/deploy.yml # Automated GitHub Actions deployment to GitHub Pages
├── .nvmrc                      # Node 24 version specification
├── .prettierrc                 # Code formatting standards
├── AGENTS.md                   # System architecture notes for AI agents
├── scripts/
│   └── generate_videos_data.mjs# Generates frontend/src/data/videos.json
├── supabase/
│   ├── migrations/             # Postgres schemas (workout hub, email leads)
│   └── functions/              # Edge functions (hub-connect, sync-completions)
└── frontend/
    ├── AGENTS.md               # Frontend developer and AI agent guide
    ├── astro.config.mjs        # Astro configuration & Vite plugins
    ├── eslint.config.mjs       # Modern ESLint flat configuration
    ├── package.json
    └── src/
        ├── content.config.ts   # Astro Content Layer (videos collection)
        ├── components/         # React islands and UI components
        ├── data/               # Canonical datasets (videos, projects, gear)
        ├── layouts/            # Global layouts (Layout.astro)
        ├── pages/              # Site routes (/videos, /video/[id], /workout-hub, etc.)
        └── styles/             # Global CSS and theme tokens
```

---

## 🚀 Automated Deployment (CI/CD)

The site deploys automatically to **GitHub Pages** via GitHub Actions upon any push to `main`:

- **Workflow**: `.github/workflows/deploy.yml`
- **Trigger**: Push to `main` branch or manual `workflow_dispatch`
- **Build Steps**:
  1. Checks out repository and sets up Node 24.
  2. Runs `npm ci` in `frontend/`.
  3. Generates canonical video data via `node scripts/generate_videos_data.mjs`.
  4. Builds static assets using `npm run build` (including podcast snapshots, Astro build, Pagefind indexing, and indexability audits).
  5. Submits sitemaps to Bing IndexNow.
  6. Deploys static build artifact `frontend/dist/` to the `gh-pages` branch.
