import os
import sqlite3
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import requests
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import time

# Try to import youtube_transcript_api
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
    YOUTUBE_TRANSCRIPT_AVAILABLE = True
except ImportError:
    YOUTUBE_TRANSCRIPT_AVAILABLE = False
    print("Warning: youtube-transcript-api not installed. Transcription features disabled.")

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:4321",
    "http://127.0.0.1:4321",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = "toby_site.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Video table
    c.execute('''
        CREATE TABLE IF NOT EXISTS videos (
            id TEXT PRIMARY KEY,
            title TEXT,
            thumbnail TEXT,
            published_at TEXT,
            is_live BOOLEAN,
            scheduled_start_time TEXT
        )
    ''')
    
    # Blog post table
    c.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT,
            status TEXT DEFAULT 'draft',
            created_at TEXT
        )
    ''')
    
    # Transcript table - Phase 3 addition
    c.execute('''
        CREATE TABLE IF NOT EXISTS transcripts (
            video_id TEXT PRIMARY KEY,
            transcript TEXT,
            source TEXT,
            confidence REAL,
            created_at TEXT,
            FOREIGN KEY (video_id) REFERENCES videos(id)
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

# Models
class Video(BaseModel):
    id: str
    title: str
    thumbnail: str
    published_at: str
    is_live: bool = False
    scheduled_start_time: Optional[str] = None

class BlogPost(BaseModel):
    title: str
    content: str
    status: str = "draft"

class BlogPostUpdate(BaseModel):
    status: str

# Transcript models - Phase 3
class TranscriptResponse(BaseModel):
    video_id: str
    transcript: str
    source: str
    confidence: float
    created_at: str

class TranscriptSegment(BaseModel):
    text: str
    start: float
    duration: float

class TranscriptWithSegments(BaseModel):
    video_id: str
    source: str
    confidence: float
    created_at: str
    segments: List[TranscriptSegment]
    full_text: str

class PendingTranscriptVideo(BaseModel):
    video_id: str
    title: str
    thumbnail: str
    published_at: str

# YouTube API Helper
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
CHANNEL_ID = "UC_PLACEHOLDER_CHANNEL_ID"

def fetch_youtube_videos():
    if not YOUTUBE_API_KEY:
        print("YouTube API Key not set.")
        return
    pass

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --- Transcript Functions - Phase 3 ---

def extract_video_id(video_id_or_url: str) -> str:
    """Extract YouTube video ID from various formats."""
    video_id = video_id_or_url.strip()
    
    # If it's already just an ID (11 chars, alphanumeric)
    if len(video_id) == 11 and video_id.replace('-', '').replace('_', '').isalnum():
        return video_id
    
    # Extract from URL patterns
    import re
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)',
        r'youtube\.com\/watch\?.*v=([^&\s]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, video_id)
        if match:
            return match.group(1)
    
    return video_id

def fetch_youtube_transcript(video_id: str) -> dict:
    """Fetch transcript from YouTube."""
    if not YOUTUBE_TRANSCRIPT_AVAILABLE:
        raise Exception("youtube-transcript-api not installed")
    
    try:
        # Extract clean video ID
        clean_id = extract_video_id(video_id)
        
        # Fetch transcript
        transcript_list = YouTubeTranscriptApi.get_transcript(clean_id)
        
        # Calculate average confidence (YouTube doesn't provide this, so we estimate)
        # Longer segments with proper punctuation suggest higher confidence
        full_text = " ".join([seg['text'] for seg in transcript_list])
        word_count = len(full_text.split())
        
        # Simple heuristic: videos with more text generally have usable transcripts
        confidence = min(0.95, 0.7 + (len(transcript_list) / 1000) * 0.25)
        
        return {
            'segments': transcript_list,
            'full_text': full_text,
            'source': 'youtube_auto',
            'confidence': round(confidence, 2),
            'word_count': word_count
        }
        
    except TranscriptsDisabled:
        raise HTTPException(status_code=400, detail="Transcripts are disabled for this video")
    except NoTranscriptFound:
        raise HTTPException(status_code=404, detail="No transcript found for this video")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transcript: {str(e)}")

def store_transcript(video_id: str, transcript_data: dict) -> bool:
    """Store transcript in database."""
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Check if video exists in videos table, if not create placeholder
        c.execute("SELECT id FROM videos WHERE id = ?", (video_id,))
        if not c.fetchone():
            # Create placeholder video entry
            c.execute('''
                INSERT INTO videos (id, title, thumbnail, published_at, is_live)
                VALUES (?, ?, ?, ?, ?)
            ''', (video_id, f"Video {video_id}", "", datetime.now().isoformat(), False))
        
        # Store transcript
        created_at = datetime.now().isoformat()
        transcript_json = json.dumps({
            'segments': transcript_data['segments'],
            'word_count': transcript_data.get('word_count', 0)
        })
        
        c.execute('''
            INSERT OR REPLACE INTO transcripts 
            (video_id, transcript, source, confidence, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            video_id,
            transcript_data['full_text'],
            transcript_data['source'],
            transcript_data['confidence'],
            created_at
        ))
        
        conn.commit()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error storing transcript: {e}")
        return False

def get_transcript_from_db(video_id: str) -> Optional[dict]:
    """Retrieve transcript from database."""
    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute("SELECT * FROM transcripts WHERE video_id = ?", (video_id,))
    row = c.fetchone()
    conn.close()
    
    if row:
        # Parse the JSON transcript data
        transcript_json = json.loads(row['transcript']) if row['transcript'].startswith('[') else {'segments': [], 'word_count': 0}
        
        return {
            'video_id': row['video_id'],
            'transcript': row['transcript'],
            'source': row['source'],
            'confidence': row['confidence'],
            'created_at': row['created_at'],
            'segments': transcript_json.get('segments', [])