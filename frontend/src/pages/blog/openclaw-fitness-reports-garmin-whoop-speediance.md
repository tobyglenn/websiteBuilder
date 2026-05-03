---
layout: "../../layouts/MarkdownBlogPostLayout.astro"
title: "How to Rebuild My OpenClaw Fitness Reports with Garmin, WHOOP, Speediance, and Public GitHub Projects"
date: 2026-05-03
description: "A reproducible implementation guide for building AI-readable fitness reports with OpenClaw, Garmin, WHOOP, Speediance, Cronometer, normalized JSON snapshots, and public GitHub repos."
categories: ["Field Reports"]
tags: ["openclaw", "garmin", "whoop", "speediance", "fitness reports", "ai systems"]
---

# How to Rebuild My OpenClaw Fitness Reports with Garmin, WHOOP, Speediance, and Public GitHub Projects

If you want to build a version of Aria’s fitness reports in your own OpenClaw setup, the key is **not** copying one private script tree. The key is reproducing the architecture with public projects, stable data snapshots, and connectors that can be swapped when vendors change their APIs.

This guide is the practical version of that build.

For an AI coding system, the core instruction is simple: **treat each vendor as a connector, persist normalized JSON snapshots, and make the report generator consume only those snapshots.** That separation is what makes the system reproducible instead of a pile of private scripts.

It focuses on the actual public building blocks behind the stack:
- **Garmin** for cardio, training load, pace, heart-rate zones, and activity detail
- **WHOOP** for recovery, HRV, RHR, sleep, strain, and readiness context
- **Speediance** for strength-session history, volume, calories, templates, and exercise detail
- **Chronometer / Cronometer** for nutrition context
- **OpenClaw** as the orchestration layer that runs syncs, normalizes data, and generates reports

It also covers the exact GitHub projects and public APIs that matter, what still works, what is deprecated, and how to wire everything into a report system another person can actually reproduce.

---

## 1. The architecture to copy

Do **not** build this as “one script that calls six APIs and renders HTML live.” That is fragile.

Build it in four layers:

1. **Connector layer**  
   One sync job per platform.
2. **Normalized data layer**  
   Each sync writes stable JSON snapshots.
3. **Analysis/report layer**  
   Report code reads normalized JSON only.
4. **Presentation layer**  
   HTML, dashboards, daily briefings, Telegram posts, voice summaries.

That separation is what makes Aria-style reporting maintainable.

---

## 2. Public projects and sources used in the build

These are the public pieces that matter for a reproducible version.

Quick GitHub/API checklist:
- Garmin connector: `https://github.com/cyberjunky/python-garminconnect`
- Garmin legacy auth context: `https://github.com/matin/garth`
- WHOOP official developer API: `https://developer.whoop.com/api`
- Speediance public extraction for this build: `https://github.com/clawdassistant85-netizen/speediance-smartgym-workout-manager`
- Speediance working fork this was extracted from: `https://github.com/ANPC86/SmartGymWorkoutManager`
- Speediance upstream/original reference: `https://github.com/hbui3/UnofficialSpeedianceWorkoutManager`


### OpenClaw
- Platform/orchestrator: **OpenClaw**
- Role: schedule sync jobs, run transformations, generate reports, publish outputs

### Garmin
- Primary Python client: **cyberjunky/python-garminconnect**  
  GitHub: `https://github.com/cyberjunky/python-garminconnect`
- Legacy auth library that previously mattered: **matin/garth**  
  GitHub: `https://github.com/matin/garth`
- Status note: `garth` is deprecated; `python-garminconnect` now uses newer Garmin auth flows and is the one to build around.

### WHOOP
- Official developer API docs: `https://developer.whoop.com/api`
- Public API surface: OAuth2 + REST endpoints for recovery, cycles, sleep, workouts, profile, body measurements
- Optional community wrappers exist, but the reproducible build should anchor to the **official WHOOP developer API** wherever possible.

### Speediance
- Actual GitHub repo used for Aria’s working Speediance connection: **ANPC86/SmartGymWorkoutManager**  
  GitHub: `https://github.com/ANPC86/SmartGymWorkoutManager`
- Upstream project lineage / original public reference: **hbui3/UnofficialSpeedianceWorkoutManager**  
  GitHub: `https://github.com/hbui3/UnofficialSpeedianceWorkoutManager`
- Aria’s stack is based on the ANPC86 SmartGymWorkoutManager fork because it contains practical fixes/features around history, exports, API debugging, timezone handling, and unit handling.
- This is an **unofficial** Speediance integration and should be treated as unstable by default.

### Nutrition
- Cronometer product site / exports / integrations: `https://cronometer.com/`
- For a public-reproducible build, treat Cronometer as a structured nutrition export source, not as a magic direct report dependency.

---

## 3. Garmin: the cardio and activity-detail layer

If WHOOP answers “how recovered am I?”, Garmin answers “what exactly did I do?”

Garmin is where the report gets:
- distance
- pace and speed
- duration
- average and max HR
- heart-rate zones
- cadence
- power
- training effect
- activity metadata
- broader cardio/training detail that WHOOP does not emphasize as richly

### Public repo to use
**Recommended:** `cyberjunky/python-garminconnect`

GitHub:
`https://github.com/cyberjunky/python-garminconnect`

Why this matters:
- it is actively positioned as the Garmin Connect Python wrapper to use
- it exposes a very large Garmin endpoint surface
- it includes examples and token handling patterns
- it replaced older auth assumptions that broke in prior Garmin changes

### Important Garmin compatibility note
Historically, many builds used `garth`.

GitHub:
`https://github.com/matin/garth`

But `garth` is now explicitly deprecated. That matters because anyone reading this to build their own stack should **not** center a new implementation on deprecated auth.

### Minimal executable Garmin example

```python
from garminconnect import Garmin
import json
from datetime import date

email = "YOUR_GARMIN_EMAIL"
password = "YOUR_GARMIN_PASSWORD"
client = Garmin(email=email, password=password)
client.login()

today = date.today().isoformat()
stats = client.get_stats(today)
activities = client.get_activities_by_date(today, today)

payload = {
    "date": today,
    "stats": stats,
    "activities": activities,
}

with open("data/garmin/latest.json", "w") as f:
    json.dump(payload, f, indent=2)
```

### What to normalize from Garmin
Do not dump raw Garmin payloads straight into your final report logic. Normalize them first into fields like:
- `calendarDate`
- `totalSteps`
- `restingHeartRate`
- `sleepingSeconds`
- `bodyBattery`
- `activityName`
- `activityType`
- `durationSeconds`
- `distanceMeters`
- `distanceMiles`
- `averageHR`
- `maxHR`
- `calories`
- `trainingEffect`
- `cadence`
- `power`

### Recommended storage pattern
- `data/garmin/raw/YYYY-MM-DD.json`
- `data/garmin/normalized/YYYY-MM-DD.json`
- `data/garmin/summary/latest.json`

That gives you both replayability and fast report access.

---

## 4. WHOOP: the recovery and readiness layer

WHOOP is what makes the reports useful as a decision engine instead of just an activity log.

It contributes:
- recovery score
- HRV
- resting heart rate
- sleep performance
- strain
- cycle context
- readiness framing for morning and nightly recommendations

### Public API to use
Use the **official WHOOP developer API**:
- Docs: `https://developer.whoop.com/api`

Relevant endpoint groups:
- `/developer/v2/cycle`
- `/developer/v2/recovery`
- `/developer/v2/activity/sleep`
- `/developer/v2/activity/workout`
- `/developer/v2/user/profile/basic`
- `/developer/v2/user/measurement/body`

### Critical limitation
One of the most important implementation findings: **journal data is not available from the WHOOP API**.

If you want journal answers or habit annotations, you cannot rely on a public WHOOP API endpoint for that. The practical options are:
- manual CSV export from WHOOP
- your own parallel journaling layer
- separate metadata you attach after sync

That limitation should be stated plainly in the article because it affects any serious build.

### Minimal executable WHOOP example

```python
import os
import json
import requests

BASE = "https://api.prod.whoop.com/developer/v2"
TOKEN = os.environ["WHOOP_ACCESS_TOKEN"]
headers = {"Authorization": f"Bearer {TOKEN}"}

recovery = requests.get(f"{BASE}/recovery", headers=headers).json()
sleep = requests.get(f"{BASE}/activity/sleep", headers=headers).json()
workouts = requests.get(f"{BASE}/activity/workout", headers=headers).json()

payload = {
    "recovery": recovery,
    "sleep": sleep,
    "workouts": workouts,
}

with open("data/whoop/latest.json", "w") as f:
    json.dump(payload, f, indent=2)
```

### What to normalize from WHOOP
Normalize into fields like:
- `recovery_score`
- `hrv_rmssd_milli`
- `resting_heart_rate`
- `spo2_percentage`
- `skin_temp_celsius`
- `sleep_performance_percentage`
- `respiratory_rate`
- `strain`
- `cycle_start`
- `cycle_end`
- `workout_sport_name`

### Recommended storage pattern
- `data/whoop/raw/recovery.json`
- `data/whoop/raw/sleep.json`
- `data/whoop/raw/workouts.json`
- `data/whoop/normalized/latest.json`

---

## 5. Speediance: the strength-training layer

Speediance is the most unusual connector in the whole stack.

Unlike Garmin and WHOOP, this is not a clean official public developer platform. The working connection pattern in Aria’s build is based on this public GitHub repo:

**Public Aria extraction:** `https://github.com/clawdassistant85-netizen/speediance-smartgym-workout-manager`

**ANPC86/SmartGymWorkoutManager**  
GitHub: `https://github.com/ANPC86/SmartGymWorkoutManager`

That repo is itself a personal fork / continuation of the original public Speediance project:

**hbui3/UnofficialSpeedianceWorkoutManager**  
GitHub: `https://github.com/hbui3/UnofficialSpeedianceWorkoutManager`

These repos are the important starting point because they show how to:
- authenticate against Speediance endpoints
- inspect workout data and API responses
- browse/export training history
- manage templates/workouts in a desktop-friendly way
- handle practical issues like timezone display and imperial/metric weight handling

### Why these repos matter
Aria’s build uses the ANPC86 SmartGymWorkoutManager fork as the practical basis for the Speediance integration pattern, while preserving the hbui3 upstream reference for provenance. Together, they are the clearest public references for working with Speediance data outside the official app.

### Stability warning
The original project notes that Speediance has been implementing security upgrades. That means:
- this integration can break
- headers and auth behavior can change
- endpoints can move
- you should isolate this connector behind a normalization step so your reports survive vendor-side churn

### Minimal executable pattern for Speediance
If you use `ANPC86/SmartGymWorkoutManager` as your starting point, while checking the `hbui3/UnofficialSpeedianceWorkoutManager` upstream for original context, the clean approach is:
1. Run its app or client layer locally
2. Authenticate with your Speediance account
3. Pull workout history from the API methods it exposes
4. Export normalized JSON into your own data directory

Pseudo-example using that client pattern:

```python
from speediance_manager.api_client import SpeedianceClient
import json
from datetime import date

client = SpeedianceClient()
success, msg, debug = client.login("YOUR_EMAIL", "YOUR_PASSWORD")
if not success:
    raise RuntimeError(msg)

start_date = "2026-01-01"
end_date = date.today().isoformat()
records = client.get_training_data(start_date, end_date)

with open("data/speediance/history.json", "w") as f:
    json.dump(records, f, indent=2)
```

### What to normalize from Speediance
Normalize into fields like:
- `training_id`
- `date`
- `title`
- `duration_seconds`
- `calories`
- `total_volume`
- `exercise_count`
- `template_name`
- `planned_duration`
- `actual_duration`
- `exercise_breakdown`
- `estimated_1rm`

### Best-practice data model
For a serious report system, keep two indexes:

1. **bySession**
- one record per completed workout

2. **byExercise**
- one record stream per movement name
- includes weight, reps, side, session id, timestamp

That structure makes progression charts and PR detection trivial later.

### Recommended storage pattern
- `data/speediance/raw/monthly/YYYY-MM.json`
- `data/speediance/normalized/history.json`
- `data/speediance/normalized/by_exercise.json`
- `data/speediance/dashboard/latest.json`

---

## 6. Chronometer / Cronometer: the nutrition context layer

Whatever exact nutrition app you use, the role is the same: give the report context for energy intake.

This matters because training load without nutrition context leads to bad conclusions.

The report should be able to ask:
- Was recovery low because training load was high?
- Or because sleep was poor **and** calorie intake was low?
- Was the athlete under-fueled relative to output?

### Practical build advice
For a reproducible version, do not depend on a live nutrition API at render time.
Use one of:
- CSV export
- webhook ingestion
- scheduled sync into normalized JSON

Normalize into fields like:
- `calories_consumed`
- `protein_g`
- `carbs_g`
- `fat_g`
- `fiber_g`
- `target_calories`
- `estimated_deficit`

---

## 7. What OpenClaw actually does in this stack

OpenClaw is not the data source. It is the **orchestration and reasoning layer**.

Its job is to:
- run sync jobs on schedule
- store stable outputs
- compare sources
- generate report HTML
- publish links
- produce human-friendly summaries from the normalized data

That means the reporting code should read from files like:
- `data/garmin/summary/latest.json`
- `data/whoop/normalized/latest.json`
- `data/speediance/normalized/history.json`
- `data/nutrition/latest.json`

The report generator should never need to know how Garmin auth works or how Speediance headers changed this week.

---

## 8. A reproducible directory structure

Here is a public, cloneable structure someone else can actually use:

```text
project/
  data/
    garmin/
      raw/
      normalized/
      summary/
    whoop/
      raw/
      normalized/
    speediance/
      raw/
      normalized/
      dashboard/
    nutrition/
  scripts/
    sync_garmin.py
    sync_whoop.py
    sync_speediance.py
    sync_nutrition.py
    build_report.py
  reports/
    latest.html
  frontend/
    data/
```

This is the main lesson from the Aria build: **make the file structure intelligible enough that anyone can debug it at 6 AM.**

---

## 9. Example report builder pattern

Once each connector writes normalized JSON, the actual report code becomes simple.

```python
import json
from pathlib import Path

base = Path("data")

garmin = json.loads((base / "garmin/summary/latest.json").read_text())
whoop = json.loads((base / "whoop/normalized/latest.json").read_text())
speediance = json.loads((base / "speediance/normalized/history.json").read_text())
nutrition = json.loads((base / "nutrition/latest.json").read_text())

summary = {
    "recovery": whoop.get("recovery_score"),
    "hrv": whoop.get("hrv_rmssd_milli"),
    "rhr": whoop.get("resting_heart_rate"),
    "steps": garmin.get("totalSteps"),
    "body_battery": garmin.get("bodyBattery"),
    "lifting_volume": speediance.get("today", {}).get("total_volume"),
    "calories_in": nutrition.get("calories_consumed"),
}

html = f"""
<html>
  <body>
    <h1>Daily Fitness Report</h1>
    <ul>
      <li>Recovery: {summary['recovery']}</li>
      <li>HRV: {summary['hrv']}</li>
      <li>RHR: {summary['rhr']}</li>
      <li>Steps: {summary['steps']}</li>
      <li>Body Battery: {summary['body_battery']}</li>
      <li>Lifting Volume: {summary['lifting_volume']}</li>
      <li>Calories In: {summary['calories_in']}</li>
    </ul>
  </body>
</html>
"""

Path("reports/latest.html").write_text(html)
```

This is where the whole design pays off: once the sync layer is sane, the report layer gets boring in the best possible way.

---

## 10. What each connector is actually for

This is the simplest mental model:

### WHOOP
Use for:
- recovery
- HRV
- RHR
- sleep performance
- strain
- readiness framing

### Garmin
Use for:
- running and cardio detail
- pace, power, cadence
- HR zones
- training effect
- detailed activity history

### Speediance
Use for:
- strength workout history
- total volume
- exercise detail
- planned vs actual session execution
- movement-level progression if you build by-exercise indexing

### Nutrition app
Use for:
- calorie intake
- macro context
- under-fueling detection

OpenClaw then combines all of them into one report and recommendation surface.

---

## 11. The real implementation rules

If someone wants to reproduce this successfully, these rules matter more than any single code snippet:

1. **Normalize every vendor into your own schema**  
   Never let a report depend on vendor payload shape.

2. **Keep raw snapshots**  
   When a sync breaks, raw payloads save you.

3. **Never render from live APIs if the report is time-sensitive**  
   Sync first, render second.

4. **Treat unofficial integrations as disposable adapters**  
   Especially Speediance.

5. **Make Garmin and WHOOP complement each other, not compete**  
   WHOOP = readiness. Garmin = execution detail.

6. **Model strength data at both session and exercise level**  
   Otherwise progression reporting stays shallow.

---

## 12. Implementation reference list

These are the public references an AI coding agent should be handed first when recreating this system:

- OpenClaw as the orchestration layer
- Garmin connector: `https://github.com/cyberjunky/python-garminconnect`
- Garmin historical auth context: `https://github.com/matin/garth` *(deprecated; use as context, not as the center of a new build)*
- WHOOP official developer API: `https://developer.whoop.com/api`
- Speediance public extraction for this build: `https://github.com/clawdassistant85-netizen/speediance-smartgym-workout-manager`
- Speediance upstream/original reference: `https://github.com/hbui3/UnofficialSpeedianceWorkoutManager`
- Cronometer nutrition exports: `https://cronometer.com/`

If you are handing this article to Claude Code, Codex, OpenClaw, or another implementation agent, the correct instruction is: build the connectors first, write normalized JSON snapshots second, then build the report renderer last. Do not start by designing the final HTML report.

---
