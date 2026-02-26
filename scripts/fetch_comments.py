import os
import json
import requests
import time

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
VIDEOS_JSON_PATH = "/Users/tobypeters/clawd/toby-site/frontend/src/data/videos.json"

# Channel owner display name to identify your replies
YOUR_CHANNEL_NAME = "@tobyonfitness"

def fetch_comment_replies(parent_id, max_results=5):
    """Fetch replies to a specific comment."""
    if not YOUTUBE_API_KEY:
        return []
    
    url = "https://youtube.googleapis.com/youtube/v3/comments"
    params = {
        "part": "snippet",
        "parentId": parent_id,
        "maxResults": max_results,
        "key": YOUTUBE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code != 200:
            return []
        
        data = response.json()
        replies = []
        for item in data.get("items", []):
            snippet = item["snippet"]
            replies.append({
                "author": snippet.get("authorDisplayName", "User"),
                "avatar": snippet.get("authorProfileImageUrl", ""),
                "text": snippet.get("textDisplay", ""),
                "likes": snippet.get("likeCount", 0),
                "published_at": snippet.get("publishedAt", ""),
                "is_author": snippet.get("authorDisplayName") == YOUR_CHANNEL_NAME
            })
        return replies
    except Exception as e:
        print(f"Error fetching replies for {parent_id}: {e}")
        return []

def fetch_top_comments(video_id, max_results=3):
    if not YOUTUBE_API_KEY:
        print("Warning: YOUTUBE_API_KEY not set.")
        return []
    
    url = "https://youtube.googleapis.com/youtube/v3/commentThreads"
    params = {
        "part": "snippet,replies",  # Include replies in response
        "videoId": video_id,
        "maxResults": max_results,
        "order": "relevance",
        "key": YOUTUBE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code != 200:
            print(f"Skipping {video_id}: {response.status_code}")
            return []
        
        data = response.json()
        comments = []
        
        for item in data.get("items", []):
            thread_snippet = item["snippet"]
            top_comment = item["snippet"]["topLevelComment"]["snippet"]
            
            # Build comment object
            comment = {
                "author": top_comment.get("authorDisplayName", "User"),
                "avatar": top_comment.get("authorProfileImageUrl", ""),
                "text": top_comment.get("textDisplay", ""),
                "likes": top_comment.get("likeCount", 0),
                "published_at": top_comment.get("publishedAt", ""),
                "replies": []
            }
            
            # Collect all replies
            replies_list = []
            
            # Replies from the thread response (nested in the API)
            if "replies" in item:
                for reply_item in item["replies"].get("comments", []):
                    reply_snippet = reply_item["snippet"]
                    reply_id = reply_item.get("id", "")
                    replies_list.append({
                        "id": reply_id,
                        "author": reply_snippet.get("authorDisplayName", "User"),
                        "avatar": reply_snippet.get("authorProfileImageUrl", ""),
                        "text": reply_snippet.get("textDisplay", ""),
                        "likes": reply_snippet.get("likeCount", 0),
                        "published_at": reply_snippet.get("publishedAt", ""),
                        "is_author": reply_snippet.get("authorDisplayName") == YOUR_CHANNEL_NAME
                    })
            
            # If there are more replies than returned (YouTube limits in thread response),
            # fetch them separately
            total_reply_count = thread_snippet.get("totalReplyCount", 0)
            if total_reply_count > 5 and len(replies_list) < total_reply_count:
                parent_id = item["snippet"]["topLevelComment"]["id"]
                extra_replies = fetch_comment_replies(parent_id, max_results=20)
                
                # Merge, avoiding duplicates by reply ID
                existing_ids = {r.get("id", "") for r in replies_list}
                for r in extra_replies:
                    if r.get("id", "") not in existing_ids:
                        r["id"] = f"reply_{time.time()}"  # Add temporary ID if missing
                        replies_list.append(r)
            
            # Sort replies by: author replies first, then by likes
            replies_list.sort(key=lambda r: (-r.get("is_author", False), -r.get("likes", 0)))
            
            comment["replies"] = replies_list
            comments.append(comment)
        
        return comments
    except Exception as e:
        print(f"Error fetching comments for {video_id}: {e}")
        return []

def main():
    if not os.path.exists(VIDEOS_JSON_PATH):
        print(f"File not found: {VIDEOS_JSON_PATH}")
        return
    
    with open(VIDEOS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    videos = data.get("videos", [])
    print(f"Loaded {len(videos)} videos. Fetching comments...")
    
    updates = 0
    for i, video in enumerate(videos):
        vid_id = video.get("id")
        if not vid_id:
            continue
        
        # Fetch fresh comments (including replies)
        # Remove 'if' condition to force refresh, or keep to skip existing
        print(f"[{i+1}/{len(videos)}] Fetching comments for {vid_id}...")
        comments = fetch_top_comments(vid_id)
        video["comments"] = comments
        updates += 1
        time.sleep(0.3)  # Be nice to the API
    
    if updates > 0:
        with open(VIDEOS_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Successfully updated {updates} videos with comments (including your replies).")
    else:
        print("No updates needed.")

if __name__ == "__main__":
    main()
