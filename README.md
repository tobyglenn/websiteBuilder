# websiteBuilder — Toby Glenn Site

**Repository:** https://github.com/tobyglenn/websiteBuilder  
**Live Preview:** `http://localhost:8765` (local dev server)

---

## 🚀 Quick Start (Build & Run)

```bash
cd frontend
npm install
npm run build
npx serve dist
```

Or for dev mode with hot reload:
```bash
npm run dev
```

---

## 📁 Project Structure

```
websiteBuilder/
├── frontend/                 # Astro + React frontend
│   ├── src/
│   │   ├── components/      # React components (Header, Hero, VideoGrid, etc.)
│   │   ├── data/            # videos.json (20 videos), categories.js
│   │   ├── layouts/         # Astro layouts
│   │   └── pages/           # Astro pages (index, videos, start-here, etc.)
│   ├── dist/                # Static build output
│   └── package.json
├── brand_brief.md           # Brand messaging & tone guidelines
├── site_architecture.md     # Video categorization strategy
└── transcripts/             # 101 video transcripts (in frontend/src/data/transcripts/)
```

---

## ✅ What's Working

| Feature | Status |
|---------|--------|
| Hero with brand messaging | ✅ "Serious fitness, real results, zero hype" |
| "Start Here" page | ✅ Live with transformation story (242→188 lbs) |
| Navigation | ✅ "Start Here" highlighted with indicator |
| Category filters | ✅ Speediance, BJJ, Transformation, Tech, Methodology |
| Video grid | ✅ 20 videos, auto-categorized by title keywords |
| Transcript links | ✅ 19 videos have transcript data |
| Dark theme | ✅ neutral-950 background |
| 31 static pages | ✅ Built and ready |

---

## 📊 Data Files

- **videos.json** — 20 YouTube videos with metadata
- **transcript_index.json** — Maps video_id → transcript_file + word_count
- **categories.js** — Category definitions & keyword mapping

---

## 🛠️ Build Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

---

## 🏗️ Tech Stack

- **Framework:** Astro 5.x (static site generation)
- **UI:** React 19 + Tailwind CSS
- **Icons:** Lucide React
- **Data:** JSON files (no backend required for GitHub Pages)

---

## 📝 Notes for AVIA

- All components are in `frontend/src/components/`
- Video data comes from `frontend/src/data/videos.json`
- Categorization is keyword-based in `VideoGrid.jsx`
- "Start Here" page is `frontend/src/pages/start-here.astro`
- Brand brief is in repo root: `brand_brief.md`

---

## 🌐 Deploy to GitHub Pages

Dist folder is ready at `frontend/dist/`. Push to `gh-pages` branch or configure GitHub Pages to serve from `/ (root)` of `main` branch with `frontend/dist` as source.

---

Last updated: 2026-02-19
