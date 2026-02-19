#!/usr/bin/env python3
import json
import os
import subprocess
import sys

def main():
    transcripts_dir = "/Users/tobypeters/clawd/toby-site/frontend/src/data/transcripts"
    os.makedirs(transcripts_dir, exist_ok=True)
    os.chdir(transcripts_dir)
    
    with open('/Users/tobypeters/clawd/toby-site/transcript_index.json') as f:
        data = json.load(f)
    
    print(f"Found {len(data)} videos with transcripts")
    downloaded = 0
    failed = 0
    
    for i, item in enumerate(data[:101]):
        video_id = item.get('video_id')
        filename = item.get('file', '')
        if not video_id or not filename:
            continue
            
        url = f"http://192.168.1.236:8085/outgoing/transcripts/{filename}"
        print(f"[{i+1}/101] {filename}...", end=" ")
        
        try:
            result = subprocess.run(
                ['curl', '-s', '--connect-timeout', '30', '-o', filename, url],
                capture_output=True, timeout=60
            )
            if result.returncode == 0 and os.path.exists(filename):
                size = os.path.getsize(filename)
                if size > 0:
                    print(f"✓ {size} bytes")
                    downloaded += 1
                else:
                    print("✗ empty")
                    failed += 1
            else:
                print("✗ failed")
                failed += 1
        except Exception as e:
            print(f"✗ error: {e}")
            failed += 1
    
    print(f"\nDone: {downloaded} downloaded, {failed} failed")

if __name__ == "__main__":
    main()
