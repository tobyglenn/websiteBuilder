#!/usr/bin/env python3
"""
YouTube Data Refresh Script
Fetches latest video data from TobyOnFitnessTech channel and updates videos.json
"""

import json
import os
import re
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import HTTPError
from urllib.parse import urlencode, quote

# Configuration
CHANNEL_ID = "UCmSwMp2gPo5PGl32d4oCu-Q"
SECRETS_PATH = "/Users/tobyglennpeters/.openclaw/workspace/secrets/api-keys.env"
VIDEOS_JSON_PATH = "/Users/tobyglennpeters/.openclaw/workspace/websiteBuilder/frontend/src/data/videos.json"
SHORT_FORM_MAX_SECONDS = 180


def load_api_key():
    """Load YouTube API key from secrets file"""
    with open(SECRETS_PATH, 'r') as f:
        for line in f:
            if line.startswith('YOUTUBE_API_KEY='):
                return line.split('=', 1)[1].strip()
    raise ValueError("YOUTUBE_API_KEY not found in secrets file")


def youtube_api_request(endpoint, params):
    """Make a YouTube Data API request"""
    api_key = load_api_key()
    base_url = f"https://www.googleapis.com/youtube/v3/{endpoint}"
    params['key'] = api_key
    
    url = f"{base_url}?{urlencode(params)}"
    req = Request(url)
    req.add_header('User-Agent', 'TobyOnFitnessTech/1.0')
    
    with urlopen(req) as response:
        return json.loads(response.read().decode())


def get_uploads_playlist_id(channel_id):
    """Get the uploads playlist ID for a channel"""
    response = youtube_api_request('channels', {
        'id': channel_id,
        'part': 'contentDetails'
    })
    
    if 'items' in response and len(response['items']) > 0:
        return response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
    raise ValueError(f"Channel {channel_id} not found")


def get_channel_stats(channel_id):
    """Fetch official channel-level stats from YouTube."""
    response = youtube_api_request('channels', {
        'id': channel_id,
        'part': 'statistics,snippet'
    })

    if 'items' not in response or not response['items']:
        raise ValueError(f"Channel stats for {channel_id} not found")

    item = response['items'][0]
    stats = item.get('statistics', {})
    snippet = item.get('snippet', {})

    return {
        'title': snippet.get('title', ''),
        'customUrl': snippet.get('customUrl', ''),
        'subscriberCount': int(stats.get('subscriberCount', 0)),
        'viewCount': int(stats.get('viewCount', 0)),
        'videoCount': int(stats.get('videoCount', 0)),
        'hiddenSubscriberCount': bool(stats.get('hiddenSubscriberCount', False))
    }


def get_all_playlist_items(playlist_id):
    """Fetch all items from a playlist (handles pagination)"""
    videos = []
    page_token = None
    
    while True:
        params = {
            'playlistId': playlist_id,
            'part': 'snippet',
            'maxResults': 50
        }
        if page_token:
            params['pageToken'] = page_token
            
        response = youtube_api_request('playlistItems', params)
        
        if 'items' in response:
            for item in response['items']:
                videos.append({
                    'id': item['snippet']['resourceId']['videoId'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'],
                    'publishedAt': item['snippet']['publishedAt'],
                    'thumbnail': item['snippet']['thumbnails'].get('high', 
                        item['snippet'].get('thumbnails', {}).get('medium', 
                        {})).get('url', '')
                })
        
        page_token = response.get('nextPageToken')
        if not page_token:
            break
    
    return videos


def get_video_details(video_ids):
    """Fetch detailed stats for videos (viewCount, duration, etc.)"""
    details = {}
    
    # Process in batches of 50 (API limit)
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i+50]
        
        response = youtube_api_request('videos', {
            'id': ','.join(batch),
            'part': 'statistics,contentDetails'
        })
        
        if 'items' in response:
            for item in response['items']:
                vid = item['id']
                stats = item.get('statistics', {})
                content = item.get('contentDetails', {})
                
                # Get best thumbnail
                thumbnails = item.get('snippet', {}).get('thumbnails', {})
                thumb_url = ''
                if 'maxres' in thumbnails:
                    thumb_url = thumbnails['maxres']['url']
                elif 'high' in thumbnails:
                    thumb_url = thumbnails['high']['url']
                elif 'medium' in thumbnails:
                    thumb_url = thumbnails['medium']['url']
                
                details[vid] = {
                    'viewCount': int(stats.get('viewCount', 0)),
                    'duration': content.get('duration', ''),  # ISO 8601 format
                    'thumbnail': thumb_url
                }
    
    return details


def parse_iso_duration(iso_duration):
    """Convert ISO 8601 duration to MM:SS or H:MM:SS format"""
    if not iso_duration:
        return "0:00"
    
    # Parse ISO 8601 duration (e.g., PT1H19M22S, PT16M13S)
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', iso_duration)
    if not match:
        return "0:00"
    
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes}:{seconds:02d}"


def duration_to_seconds(value):
    """Convert ISO 8601 or formatted durations into total seconds"""
    if not value:
        return 0

    text = str(value).strip()
    if not text or text == "0:00" or text == "P0D" or text.upper() == "LIVE":
        return 0

    iso_match = re.match(r'^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$', text)
    if iso_match:
        hours = int(iso_match.group(1) or 0)
        minutes = int(iso_match.group(2) or 0)
        seconds = int(iso_match.group(3) or 0)
        return hours * 3600 + minutes * 60 + seconds

    parts = text.split(':')
    if not all(part.isdigit() for part in parts):
        return 0

    numbers = [int(part) for part in parts]
    if len(numbers) == 3:
        return numbers[0] * 3600 + numbers[1] * 60 + numbers[2]
    if len(numbers) == 2:
        return numbers[0] * 60 + numbers[1]
    return 0


def is_short_form_video(title='', description='', duration_iso='', duration_formatted=''):
    """Treat Shorts and other short-form uploads as short videos."""
    text = f"{title or ''} {description or ''}"
    if re.search(r'(?:^|[\s#/])shorts?\b', text, re.IGNORECASE):
        return True

    duration_seconds = duration_to_seconds(duration_iso or duration_formatted)
    return 0 < duration_seconds <= SHORT_FORM_MAX_SECONDS


def load_existing_videos():
    """Load existing videos from JSON file"""
    if os.path.exists(VIDEOS_JSON_PATH):
        with open(VIDEOS_JSON_PATH, 'r') as f:
            return json.load(f)
    return {"videos": [], "fetchedAt": None}


def save_videos(data):
    """Save videos to JSON file"""
    with open(VIDEOS_JSON_PATH, 'w') as f:
        json.dump(data, f, indent=2)


def main():
    print("=" * 50)
    print("YouTube Data Refresh Script")
    print("=" * 50)
    
    # Step 1: Get uploads playlist ID and channel stats
    print("\n[1/5] Getting channel uploads playlist...")
    uploads_playlist_id = get_uploads_playlist_id(CHANNEL_ID)
    print(f"      Found uploads playlist: {uploads_playlist_id}")
    channel_stats = get_channel_stats(CHANNEL_ID)
    print(
        "      Channel stats:"
        f" {channel_stats['subscriberCount']} subscribers,"
        f" {channel_stats['viewCount']} views,"
        f" {channel_stats['videoCount']} videos"
    )
    
    # Step 2: Get all video IDs from playlist
    print("\n[2/5] Fetching all videos from playlist...")
    playlist_videos = get_all_playlist_items(uploads_playlist_id)
    print(f"      Found {len(playlist_videos)} videos on channel")
    
    # Step 3: Get detailed stats for all videos
    print("\n[3/5] Fetching video details (views, duration)...")
    video_ids = [v['id'] for v in playlist_videos]
    video_details = get_video_details(video_ids)
    print(f"      Got details for {len(video_details)} videos")
    
    # Step 4: Load existing data and merge
    print("\n[4/5] Merging with existing data...")
    existing_data = load_existing_videos()
    existing_videos = existing_data.get('videos', [])
    
    # Create lookup for existing videos by ID
    existing_by_id = {v['id']: v for v in existing_videos}
    
    updated_count = 0
    new_count = 0
    merged_videos = []
    
    for video in playlist_videos:
        vid = video['id']
        
        if vid in existing_by_id:
            # Update existing video with fresh stats, keep custom fields
            existing = existing_by_id[vid]
            details = video_details.get(vid, {})
            
            # Fields to update from API
            existing['title'] = video['title']
            existing['description'] = video['description']
            existing['publishedAt'] = video['publishedAt']
            existing['viewCount'] = details.get('viewCount', existing.get('viewCount', 0))
            existing['duration_iso'] = details.get('duration', existing.get('duration_iso', ''))
            
            # Update thumbnail if we have a better one
            if details.get('thumbnail'):
                existing['thumbnail'] = details['thumbnail']
            
            # Update duration formatted if we have ISO duration
            if details.get('duration'):
                existing['duration'] = parse_iso_duration(details['duration'])
                existing['duration_formatted'] = existing['duration']
            existing['is_short'] = is_short_form_video(
                existing.get('title', ''),
                existing.get('description', ''),
                existing.get('duration_iso', ''),
                existing.get('duration_formatted', existing.get('duration', ''))
            )
            
            merged_videos.append(existing)
            updated_count += 1
        else:
            # New video - create entry
            details = video_details.get(vid, {})
            iso_duration = details.get('duration', '')
            formatted_duration = parse_iso_duration(iso_duration)
            
            new_video = {
                'id': vid,
                'title': video['title'],
                'description': video['description'],
                'thumbnail': details.get('thumbnail') or video.get('thumbnail', ''),
                'publishedAt': video['publishedAt'],
                'videoOwnerChannelTitle': 'Toby Glenn',
                'is_live': False,
                'is_short': is_short_form_video(
                    video['title'],
                    video['description'],
                    iso_duration,
                    formatted_duration
                ),
                'duration_formatted': formatted_duration,
                'viewCount': details.get('viewCount', 0),
                'duration': formatted_duration,
                'duration_iso': iso_duration,
                'comments': []
            }
            
            merged_videos.append(new_video)
            new_count += 1
    
    # Sort by publish date (newest first)
    merged_videos.sort(key=lambda v: v.get('publishedAt', ''), reverse=True)
    
    # Update fetchedAt timestamp
    result_data = {
        "videos": merged_videos,
        "channelStats": channel_stats,
        "fetchedAt": datetime.now(timezone.utc).isoformat()
    }
    
    # Step 5: Save and report
    print("\n[5/5] Saving to videos.json...")
    save_videos(result_data)
    
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"  Videos updated: {updated_count}")
    print(f"  New videos added: {new_count}")
    print(f"  Total videos: {len(merged_videos)}")
    print(f"  Saved to: {VIDEOS_JSON_PATH}")
    print("=" * 50)
    print("\nDone!")


if __name__ == "__main__":
    main()
