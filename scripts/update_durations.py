import json
import requests
import isodate

API_KEY = "YOUTUBE_API_KEY_REMOVED"
VIDEOS_FILE = "/Users/tobypeters/clawd/toby-site/frontend/src/data/videos.json"

def get_video_durations(video_ids):
    url = f"https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id={','.join(video_ids)}&key={API_KEY}"
    response = requests.get(url)
    data = response.json()
    durations = {}
    for item in data.get("items", []):
        iso_duration = item["contentDetails"]["duration"]
        durations[item["id"]] = iso_duration
    return durations

def format_duration(iso_duration):
    dur = isodate.parse_duration(iso_duration)
    total_seconds = int(dur.total_seconds())
    minutes, seconds = divmod(total_seconds, 60)
    hours, minutes = divmod(minutes, 60)
    if hours > 0:
        return f"{hours}:{minutes:02}:{seconds:02}"
    else:
        return f"{minutes}:{seconds:02}"

def main():
    with open(VIDEOS_FILE, "r") as f:
        data = json.load(f)

    video_ids = [v["id"] for v in data["videos"]]
    # Chunk into 50 (API limit)
    chunks = [video_ids[i:i + 50] for i in range(0, len(video_ids), 50)]
    
    all_durations = {}
    for chunk in chunks:
        all_durations.update(get_video_durations(chunk))

    for video in data["videos"]:
        vid = video["id"]
        if vid in all_durations:
            iso = all_durations[vid]
            formatted = format_duration(iso)
            video["duration_iso"] = iso
            video["duration_formatted"] = formatted
            
            # Determine if short (< 60s)
            dur = isodate.parse_duration(iso)
            if dur.total_seconds() < 60:
                video["is_short"] = True
            else:
                video["is_short"] = False

    with open(VIDEOS_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Updated {len(data['videos'])} videos with durations.")

if __name__ == "__main__":
    main()
