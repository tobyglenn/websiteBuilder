# TobyOnFitnessTech.com - Full Implementation Plan

## Project: Complete Website Replacement
**Goal:** Replace IONOS MyWebsite builder with custom Astro/FastAPI stack
**Channel:** @tobyonfitnesstech
**Status:** Phase 1 Complete (Scaffold), Phases 2-6 in Progress

---

## PHASE BREAKDOWN

### PHASE 1: ✅ COMPLETE
**Core Infrastructure**
- [x] Astro frontend scaffold
- [x] FastAPI backend
- [x] SQLite database
- [x] Basic components (LiveStatus, VideoGrid)
- [x] Dark mode styling

### PHASE 2: YouTube Integration (TONIGHT)
**Subagent:** `youtube-integrator`
**Tasks:**
- Get channel ID from @tobyonfitnesstech
- Implement YouTube Data API v3 client
- Fetch all videos with pagination
- Store video metadata in SQLite
- Cache thumbnails locally
- Detect scheduled livestreams
- Real-time "LIVE NOW" detection
- Cron: Check every 15 minutes

**Output:**
- Working video gallery with real data
- Auto-refresh on new uploads
- Livestream status widget

### PHASE 3: Transcription Pipeline (TONIGHT)
**Subagent:** `transcription-engineer`
**Tasks:**
- YouTube auto-captions download (if available)
- Whisper API fallback for custom transcripts
- Store transcripts linked to video_id
- Chunk long videos for processing
- Queue management system
- Quality scoring per transcript

**Output:**
- Transcript database table
- API endpoints: GET /transcript/:video_id
- Admin: Transcript quality review UI

### PHASE 4: AI Content Generation (TONIGHT)
**Subagent:** `content-generator`
**Tasks:**
- Feed transcripts to LLM (Gemini/Claude)
- Generate:
  - Blog post drafts (800-1200 words)
  - Video summaries (150 words)
  - SEO titles and descriptions
  - Key takeaways bullet list
  - Timestamp highlights
- Store drafts with status: pending_review
- Admin approval workflow
- One-click publish from draft

**Output:**
- AI-written blog posts
- Summary cards on video pages
- Queue: 5 drafts ready for review

### PHASE 5: Full UI/UX (TONIGHT)
**Subagent:** `ui-polisher`
**Tasks:**
- Navigation: Header + Footer + Mobile menu
- Video pages: Individual /video/:id
  - Video embed (iframe)
  - Transcript viewer (toggleable)
  - AI-generated summary
  - Related videos
  - Social share buttons
- Blog listing page: /blog
- Individual blog post: /blog/:slug
- Search functionality
- Pagination
- Loading states
- Error boundaries
- 404 page
- SEO meta tags (dynamic)
- Open Graph images (auto-generated)

**Output:**
- Pixel-perfect, responsive site
- All page types complete
- Professional polish

### PHASE 6: DevOps & Deployment (TONIGHT)
**Subagent:** `deployment-engineer`
**Tasks:**
- Environment configuration (.env templates)
- Docker Compose (backend + frontend)
- systemd service files
- nginx reverse proxy config
- SSL certificates (Let's Encrypt)
- Health check endpoints
- Backup strategy (SQLite dumps)
- Deploy script

**Output:**
- One-command deploy: `./deploy.sh`
- Production-ready setup

### PHASE 7: Testing & QA (MORNING)
**Subagent:** `qa-tester`
**Tasks:**
- End-to-end tests
- YouTube API mock tests
- Performance benchmarks
- Mobile/responsive testing
- Cross-browser check
- Accessibility audit

---

## IMPEDIMENT TRACKING

| Impediment | Priority | Owner | Status |
|------------|----------|-------|--------|
| YouTube API Key needed | HIGH | User | BLOCKING Phase 2 |
| Whisper API key (optional) | LOW | User | Can skip for MVP |
| Google Cloud billing setup | MED | User | Auto-approved for fetches |
| Domain DNS migration | MED | User | Manual final step |

---

## CRON MONITORING

Job: `hourly-toby-site-progress`
Time: Every hour, :00
Actions:
1. Check subagent task status
2. Report completed phases
3. Identify blockers
4. Text user if intervention needed
5. Spawn next phase subagent if ready

---

## SUCCESS CRITERIA

- [ ] All 8 most recent videos displayed
- [ ] Live status accurate within 15 min
- [ ] 5+ AI blog drafts generated
- [ ] Transcripts available for all videos
- [ ] Site deployed and accessible
- [ ] Mobile-responsive
- [ ] Load time < 2 seconds

---

## NOTION OF DONE

Each phase is done when:
1. Code committed
2. Tested locally
3. API documented
4. Screenshots attached
5. User sign-off

---

## RISKS & MITIGATIONS

| Risk | Mitigation |
|------|------------|
| YouTube API rate limits | Estimate: 100 videos = 5 API calls. Plenty of headroom. |
| Transcription costs | Start with YouTube auto-captions (free). Whisper only if gaps. |
| Build complexity overnight | Parallel subagents + hourly check-ins. Fallback: tomorrow. |
| User unavailable for API key | Proceed with mocked data, swap in key when available. |

---

## ESTIMATED TIMELINE

| Phase | Duration | Subagent |
|-------|----------|----------|
| 2. YouTube | 2h | youtube-integrator |
| 3. Transcripts | 3h | transcription-engineer |
| 4. AI Content | 3h | content-generator |
| 5. UI/UX | 4h | ui-polisher |
| 6. Deployment | 2h | deployment-engineer |

**Total: ~14 hours of subagent work**
**Parallel execution: 5-6 hours wall time**

---

## WHAT I NEED FROM YOU (TONIGHT)

1. **YouTube API Key** — Google Cloud Console → YouTube Data API v3 → Create credentials → API Key
2. **Test approval** — Quick thumbs-up on Phase 2 mock data before I proceed

---

## TONIGHT'S EXECUTION PLAN

### Step 1: Parallel Kickoff (NOW)
Spawn 3 subagents simultaneously:
- youtube-integrator (Phase 2)
- transcription-engineer (Phase 3 - may block on Phase 2)
- ui-polisher (Phase 5 - independent)

### Step 2: Hourly Check (10PM, 11PM, 12AM...)
- Review subagent outputs
- Resolve blockers
- Spawn next wave

### Step 3: Morning Review
- Full site walkthrough
- DNS flip decision

---

## PROGRESS TRACKING FILE

`/Users/tobypeters/clawd/toby-site/PROGRESS.json`
Updated by cron every hour with:
- Complete phases
- Active subagents
- Blockers
- Completion %

---

## START HERE

Run this to begin:
```bash
./scripts/start-build.sh
```

Or I'll spawn the first wave now.
