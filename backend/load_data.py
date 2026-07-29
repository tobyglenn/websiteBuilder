import sys
import os
import json
import sqlite3
import uuid
from pathlib import Path
from datetime import datetime, date, timedelta, timezone

BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from workout_hub.security import CredentialVault
from workout_hub.service import WorkoutHubService
from workout_hub.speediance_gateway import SpeedianceGateway

def parse_int_field(val, default=10):
    if not val:
        return default
    val_str = str(val).split(',')[0].strip()
    try:
        return int(float(val_str))
    except ValueError:
        return default

def parse_float_field(val, default=0.0):
    if not val:
        return default
    val_str = str(val).split(',')[0].strip()
    try:
        return float(val_str)
    except ValueError:
        return default

def main():
    key_file = BASE_DIR / '.workout-hub-key'
    key = key_file.read_text(encoding='ascii').strip()
    vault = CredentialVault(key)
    
    with open('/home/toby/.openclaw/workspace/speediance_manager/config.json') as f:
        sp_config = json.load(f)
        
    auth = {
        'app_user_id': sp_config['user_id'],
        'token': sp_config['token'],
        'region': sp_config.get('region', 'Global'),
        'device_type': sp_config.get('device_type', 1),
        'unit': sp_config.get('unit', 0)
    }
    
    gateway = SpeedianceGateway(auth)
    
    db_path = BASE_DIR / 'workout_hub.db'
    conn = sqlite3.connect(db_path)
    conn.execute("UPDATE users SET display_name = 'Toby' WHERE id = 'd559036d-8225-47a7-9795-634598e74aff'")
    conn.commit()
    
    user_id = 'd559036d-8225-47a7-9795-634598e74aff'
    
    # Store real speediance connection details in the database
    conn.execute("DELETE FROM speediance_connections")
    encrypted_auth = vault.encrypt_json(auth)
    provider_hash = vault.blind_index(str(auth['app_user_id']))
    conn.execute(
        """INSERT INTO speediance_connections (user_id, provider_user_hash, region, device_type, encrypted_auth, connected_at, updated_at, unit)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            user_id,
            provider_hash,
            auth['region'],
            auth['device_type'],
            encrypted_auth,
            datetime.now(timezone.utc).isoformat(),
            datetime.now(timezone.utc).isoformat(),
            auth['unit']
        )
    )
    conn.commit()
    
    target_workout_codes = [
        ('Warrior 2', '68ca84868f086c639f98d40f'),
        ('Warrior 1', '68b6d5cc8f08c917c22418db'),
        ('Chest handles', '6908f1348f085f13ae4b7769'),
        ('Arms Barbell', '69063cb28f085f13ae4b3b02'),
        ('Back Barbell', '691fadec8f081ab0e81190d7')
    ]
    
    conn.execute("DELETE FROM completions")
    conn.execute("DELETE FROM workout_installs")
    conn.execute("DELETE FROM workouts")
    conn.commit()
    
    service = WorkoutHubService(str(db_path), vault, lambda x: SpeedianceGateway(x))
    
    for name, code in target_workout_codes:
        print(f"Fetching template details for {name}...")
        res = gateway._request('GET', f'/api/app/v3/customTrainingTemplate/detailByCode?code={code}')
        data = res.get('data', {})
        if not data:
            print(f"Could not fetch template for {name}")
            continue
            
        actionLibraryList = data.get('actionLibraryList', [])
        
        exercises = []
        current_exercise = None
        for item in actionLibraryList:
            group_id = int(item['groupId'])
            title = item['title']
            preset = parse_int_field(item.get('templatePresetId', item.get('presetId', -1)), -1)
            reps = parse_int_field(item.get('setsAndReps', 10), 10)
            weight = parse_float_field(item.get('counterweight2', item.get('weight', 0.0)), 0.0)
            mode = parse_int_field(item.get('sportMode', 1), 1)
            rest = parse_int_field(item.get('breakTime2', 60), 60)
            
            set_data = {
                "reps": reps,
                "weight": weight,
                "mode": mode,
                "rest": rest
            }
            
            if current_exercise and current_exercise["id"] == group_id:
                current_exercise["sets"].append(set_data)
            else:
                current_exercise = {
                    "id": group_id,
                    "title": title,
                    "preset": preset,
                    "isUnilateralExpanded": False,
                    "sets": [set_data]
                }
                exercises.append(current_exercise)
                
        workout_payload = {
            "name": name,
            "description": data.get('bottomComments', '') or f"Custom workout: {name}",
            "weight_unit": auth['unit'],
            "exercises": exercises
        }
        
        published = service.publish_workout(user_id, workout_payload)
        workout_id = published['id']
        print(f"Published workout {name} as {workout_id}")
        
        conn.execute(
            """INSERT INTO workout_installs (id, user_id, workout_id, provider_template_id, provider_template_code, status, installed_at)
               VALUES (?, ?, ?, ?, ?, 'installed', ?)
            """,
            (str(uuid.uuid4()), user_id, workout_id, str(data['id']), code, datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
        
    start_date = date(2025, 9, 1)
    today_date = date.today()
    
    current_start = start_date
    while current_start < today_date:
        current_end = min(current_start + timedelta(days=89), today_date)
        print(f"Syncing completions from {current_start} to {current_end}...")
        try:
            res = service.sync_completions(user_id, current_start.isoformat(), current_end.isoformat())
            print(f"Synced: {res}")
        except Exception as e:
            print(f"Sync error: {e}")
        current_start = current_end + timedelta(days=1)
        
    conn.close()
    print("Data loading complete!")

if __name__ == '__main__':
    main()
