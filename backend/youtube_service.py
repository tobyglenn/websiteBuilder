"""YouTube API Service for fetching channel videos and livestream status."""
import os
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
import requests

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
CHANNEL_HANDLE = "@tobyonfitnesstech"
DB_PATH = "toby_site.db"

CHANNEL_ID_CACHE = None

def get_channel_id() -> Optional[str]:
    """Get channel ID from channel handle using YouTube Search API."""
    global CHANNEL_ID_CACHE
    
    if CHANNEL_ID_CACHE:
        return CHANNEL_ID_CACHE
    
    if not YOUTUBE_API_KEY:
        print("YouTube API Key not configured")
        return None
    
    # For handle-based lookup, we need to use the search endpoint
    # Channel handle is @tobyonfitnesstech
    url = "https://youtube.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": CHANNEL_HANDLE,
        "type": "channel",
        "key": YOUTUBE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if data.get('items') and len(data['items']) > 0:
            channel_id = data['items'][0]['snippet']['channelId']
            CHANNEL_ID_CACHE = channel_id
            print(f"Found channel ID: {channel_id}")
            return channel_id
        else:
            print(f"No channel found for handle: {CHANNEL_HANDLE}")
            return None
    except Exception as e:
        print(f"Error fetching channel ID: {e}")
        return None


def get_uploads_playlist_id(channel_id: str) -> Optional[str]:
    """Get the uploads playlist ID for a channel."""
    if not YOUTUBE_API_KEY or not channel_id:
        return None
    
    url = "https://youtube.googleapis.com/youtube/v3/channels"
    params = {
        "part": "contentDetails",
        "id": channel_id,
        "key": YOUTUBE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if data.get('items') and len(data['items']) > 0:
            uploads_id = data['items'][0]['contentDetails']['relatedPlaylists']['uploads']
            return uploads_id
        return None
    except Exception as e:
        print(f"Error fetching playlist ID: {e}")
        return None


def fetch_playlist_videos(playlist_id: str, max_results: int = 20) -> List[Dict]:
    """Fetch videos from a playlist."""
    if not YOUTUBE_API_KEY or not playlist_id:
        return []
    
    videos = []
    next_page_token = None
    
    while len(videos) < max_results:
        url = "https://youtube.googleapis.com/youtube/v3/playlistItems"
        params = {
            "part": "snippet,contentDetails",
            "playlistId": playlist_id,
            "maxResults": min(50, max_results - len(videos)),
            "key": YOUTUBE_API_KEY
        }
        
        if next_page_token:
            params['pageToken'] = next_page_token
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            for item in data.get('items', []):
                snippet = item.get('snippet', {})
                content = item.get('contentDetails', {})
                
                video = {
                    'id': content.get('videoId', ''),
                    'title': snippet.get('title', ''),
                    'description': snippet.get('description', ''),
                    'thumbnail_url': snippet.get('thumbnails', {}).get('high', {}).get('url', 
                        snippet.get('thumbnails', {}).get('medium', {}).get('url', 
                        snippet.get('thumbnails', {}).get('default', {}).get('url', ''))),
                    'published_at': snippet.get('publishedAt', ''),
                    'view_count': 0,  # Will be updated from videos API
                    'is_live_now': False,
                    'scheduled_start_time': None,
                    'actual_start_time': None
                }
                videos.append(video)
            
            next_page_token = data.get('nextPageToken')
            if not next_page_token:
                break
                
        except Exception as e:
            print(f"Error fetching playlist videos: {e}")
            break
    
    # Now fetch video statistics
    video_ids = [v['id'] for v in videos if v['id']]
    if video_ids:
        video_stats = fetch_video_statistics(video_ids)
        for video in videos:
            if video['id'] in video_stats:
                video['view_count'] = video_stats[video['id']].get('view_count', 0)
                video['is_live_now'] = video_stats[video['id']].get('is_live_now', False)
                video['scheduled_start_time'] = video_stats[video['id']].get('scheduled_start_time')
                video['actual_start_time'] = video_stats[video['id']].get('actual_start_time')
    
    return videos[:max_results]


def fetch_video_statistics(video_ids: List[str]) -> Dict[str, Dict]:
    """Fetch statistics for videos."""
    if not YOUTUBE_API_KEY or not video_ids:
        return {}
    
    stats = {}
    
    # API supports up to 50 IDs per request
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i+50]
        
        url = "https://youtube.googleapis.com/youtube/v3/videos"
        params = {
            "part": "statistics,liveStreamingDetails",
            "id": ",".join(batch),
            "key": YOUTUBE_API_KEY
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            for item in data.get('items', []):
                video_id = item['id']
                stats[video_id] = {
                    'view_count': int(item.get('statistics', {}).get('viewCount', 0)),
                    'is_live_now': item.get('snippet', {}).get('liveBroadcastContent') == 'live',
                    'scheduled_start_time': item.get('liveStreamingDetails', {}).get('scheduledStartTime'),
                    'actual_start_time': item.get('liveStreamingDetails', {}).get('actualStartTime')
                }
            
        except Exception as e:
            print(f"Error fetching video statistics: {e}")
    
    return stats


def check_upcoming_livestreams(channel_id: str) -> List[Dict]:
    """Check for upcoming scheduled livestreams."""
    if not YOUTUBE_API_KEY or not channel_id:
        return []
    
    url = "https://youtube.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "channelId": channel_id,
        "eventType": "upcoming",
        "type": "video",
        "maxResults": 5,
        "key": YOUTUBE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        livestreams = []
        for item in data.get('items', []):
            snippet = item.get('snippet', {})
            livestreams.append({
                'id': item.get('id', {}).get('videoId', ''),
                'title': snippet.get('title', ''),
                'description': snippet.get('description', ''),
                'thumbnail_url': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                'published_at': snippet.get('publishedAt', ''),
                'is_live_now': False,
                'scheduled_start_time': None  # Need to fetch details
            })
        
        # Get scheduled start times
        if livestreams:
            video_ids = [ls['id'] for ls in livestreams]
            video_stats = fetch_video_statistics(video_ids)
            for ls in livestreams:
                if ls['id'] in video_stats:
                    ls['scheduled_start_time'] = video_stats[ls['id']].get('scheduled_start_time')
        
        return livestreams
    except Exception as e:
        print(f"Error checking upcoming livestreams: {e}")
        return []


def check_current_live(channel_id: str) -> Optional[Dict]:
    """Check if the channel is currently live."""
    if not YOUTUBE_API_KEY or not channel_id:
        return None
    
    url = "https://youtube.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "channelId": channel_id,
        "eventType": "live",
        "type": "video",
        "maxResults": 1,
        "key": YOUTUBE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if data.get('items') and len(data['items']) > 0:
            item = data['items'][0]
            snippet = item.get('snippet', {})
            return {
                'id': item.get('id', {}).get('videoId', ''),
                'title': snippet.get('title', ''),
                'description': snippet.get('description', ''),
                'thumbnail_url': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                'published_at': snippet.get('publishedAt', ''),
                'is_live_now': True,
                'scheduled_start_time': None,
                'actual_start_time': None
            }
        return None
    except Exception as e:
        print(f"Error checking current live: {e}")
        return None


def get_live_status(channel_id: str) -> Dict:
    """Get complete live status including current and upcoming streams."""
    current = check_current_live(channel_id)
    upcoming = check_upcoming_livestreams(channel_id)
    
    return {
        'is_live': current is not None,
        'current': current,
        'upcoming': upcoming
    }


def sync_videos_to_db(videos: List[Dict]):
    """Sync videos to the database."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Update the table schema if needed
    c.execute('''CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        thumbnail_url TEXT,
        published_at TEXT,
        view_count INTEGER DEFAULT 0,
        is_live_now BOOLEAN DEFAULT 0,
        scheduled_start_time TEXT,
        actual_start_time TEXT
    )''')
    
    for video in videos:
        c.execute('''INSERT OR REPLACE INTO videos 
            (id, title, description, thumbnail_url, published_at, view_count, is_live_now, scheduled_start_time, actual_start_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''', (
            video['id'],
            video['title'],
            video.get('description', ''),
            video.get('thumbnail_url', ''),
            video.get('published_at', ''),
            video.get('view_count', 0),
            1 if video.get('is_live_now', False) else 0,
            video.get('scheduled_start_time'),
            video.get('actual_start_time')
        ))
    
    conn.commit()
    conn.close()


def get_videos_from_db() -> List[Dict]:
    """Get all videos from the database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('''SELECT id, title, description, thumbnail_url, published_at, view_count, 
                  is_live_now, scheduled_start_time, actual_start_time 
                  FROM videos ORDER BY published_at DESC''')
    
    rows = c.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_live_status_from_db() -> Dict:
    """Get live status from database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Check for currently live video
    c.execute('''SELECT id, title, description, thumbnail_url, published_at, view_count, 
                  is_live_now, scheduled_start_time, actual_start_time 
                  FROM videos WHERE is_live_now = 1 LIMIT 1''')
    current = c.fetchone()
    
    # Check for upcoming scheduled streams
    now_iso = datetime.now().isoformat()
    c.execute('''SELECT id, title, description, thumbnail_url, published_at, view_count, 
                  is_live_now, scheduled_start_time, actual_start_time 
                  FROM videos WHERE scheduled_start_time > ? 
                  ORDER BY scheduled_start_time ASC LIMIT 1''', (now_iso,))
    next_scheduled = c.fetchone()
    
    conn.close()
    
    return {
        'is_live': current is not None,
        'current': dict(current) if current else None,
        'next_scheduled': dict(next_scheduled) if next_scheduled else None
    }


def refresh_all_videos():
    """Full refresh: fetch from YouTube and sync to database."""
    print("Starting video refresh...")
    
    if not YOUTUBE_API_KEY:
        print("YouTube API Key not set. Cannot refresh videos.")
        return {'error': 'YouTube API Key not configured'}
    
    # Get channel ID
    channel_id = get_channel_id()
    if not channel_id:
        return {'error': 'Could not find channel'}
    
    # Get uploads playlist
    playlist_id = get_uploads_playlist_id(channel_id)
    if not playlist_id:
        return {'error': 'Could not find uploads playlist'}
    
    # Fetch videos (up to 20 most recent)
    videos = fetch_playlist_videos(playlist_id, max_results=20)
    print(f"Fetched {len(videos)} videos from playlist")
    
    # Check live status
    live_status = get_live_status(channel_id)
    print(f"Live status: {live_status['is_live']}, {len(live_status['upcoming'])} upcoming")
    
    # Merge live information into videos
    all_videos_by_id = {v['id']: v for v in videos}
    
    if live_status['current']:
        live_vid = live_status['current']
        if live_vid['id'] in all_videos_by_id:
            all_videos_by_id[live_vid['id']]['is_live_now'] = True
        else:
            all_videos_by_id[live_vid['id']] = live_vid
    
    for upcoming in live_status['upcoming']:
        if upcoming['id'] in all_videos_by_id:
            all_videos_by_id[upcoming['id']]['scheduled_start_time'] = upcoming['scheduled_start_time']
        else:
            all_videos_by_id[upcoming['id']] = upcoming
    
    # Sync to database
    sync_videos_to_db(list(all_videos_by_id.values()))
    
    return {
        'videos_synced': len(all_videos_by_id),
        'is_live': live_status['is_live'],
        'upcoming_count': len(live_status['upcoming'])
    }