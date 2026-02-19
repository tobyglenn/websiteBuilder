# TobyOnFitnessTech.com - Site Replacement

This directory contains the complete source code for the new website.

## Structure

- `frontend/`: Astro project (Static Site Generator + React components)
- `backend/`: FastAPI project (Python API + SQLite Database)

## Prerequisites

- Node.js (v18+)
- Python (v3.10+)

## Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```
The API will run at `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal tab:

```bash
cd frontend
npm install
npm run dev
```
The site will run at `http://localhost:4321`.

## Deployment

### 1. Backend
Run the backend using `uvicorn` in production mode (e.g., managed by systemd or Docker).

### 2. Frontend
Build the static assets:
```bash
npm run build
```
Serve the `dist/` folder using Nginx, Caddy, or even the Python backend itself if traffic is low.

## Features Implemented
- **Homepage**: Live status widget (mocked), Video Grid (mocked), Blog preview.
- **Admin**: Basic dashboard layout for approving drafts.
- **API**: Endpoints for Videos and Posts. SQLite integration.

## Next Steps
1. **YouTube API**: Get a real API Key from Google Cloud Console. Update `backend/main.py` with the key and implement the `fetch_youtube_videos` logic.
2. **Blog**: Connect the Admin frontend "Publish" buttons to the `/posts` API endpoints.
3. **DNS**: When ready, point `tobyonfitnesstech.com` to this machine's public IP (ensure port forwarding/firewall allows 80/443).
