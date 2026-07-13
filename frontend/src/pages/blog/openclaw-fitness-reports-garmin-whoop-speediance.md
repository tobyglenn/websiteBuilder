---
layout: "../../layouts/MarkdownBlogPostLayout.astro"
title: "Agent Brief: Build OpenClaw Fitness Report Connectors for Garmin, WHOOP, Speediance, and More"
date: 2026-05-03
description: "An agent-ready implementation brief for building OpenClaw fitness report connectors across Garmin, WHOOP, Speediance, Cronometer, 8Sleep, normalized JSON snapshots, and public GitHub repos."
categories: ["Field Reports"]
tags: ["openclaw", "garmin", "whoop", "speediance", "fitness reports", "ai systems"]
---

This article is meant to be handed to an AI coding agent as an implementation brief.

The goal is **not** to transplant my private machine or reverse-engineer my files. The goal is for an agent to read this page and build working connectors to the fitness systems: Garmin, WHOOP, Speediance, Cronometer, 8Sleep, and optional Open Wearables.

The core instruction is simple: **treat each vendor as a connector, persist normalized JSON snapshots, and make the report generator consume only those snapshots.** That separation turns vendor-specific API mess into an agent-buildable system.

The agent should build the same class of connections, not depend on my exact local paths:
- **Garmin** for cardio, training load, pace, heart-rate zones, and activity detail
- **WHOOP** for recovery, HRV, RHR, sleep, strain, and readiness context
- **Speediance** for strength-session history, volume, calories, templates, and exercise detail
- **Cronometer** for nutrition context
- **8Sleep** for late-arriving sleep context when available
- **OpenClaw** as the orchestration layer that runs syncs, normalizes data, and generates reports

It also covers the GitHub projects, public APIs, data contracts, failure modes, and acceptance checks an implementation agent needs to produce a working stack without seeing my private repo.

---

## 1. Agent task

Build a local-first OpenClaw fitness reporting stack that can connect to the systems, normalize their data, and generate reports without live vendor calls during rendering.

The agent should produce:

1. **Connector scripts**  
   One sync job per system: Garmin, WHOOP, Speediance, Cronometer, and 8Sleep when configured.
2. **Raw snapshots**  
   Date-stamped raw JSON or CSV-derived payloads for debugging vendor changes.
3. **Normalized contracts**  
   Stable JSON files the report generator can trust even when vendor payloads shift.
4. **Morning report**  
   A report that combines recovery, sleep, readiness, training load, nutrition, and the day’s plan.
5. **Adaptive training snapshot**  
   A dated Speediance/BJJ/run plan derived from same-day readiness and recent load.
6. **Nightly report**  
   A plan-vs-actual review comparing what was recommended against Garmin, WHOOP, and Speediance reality.
7. **Publishable output**  
   Static HTML and machine-readable JSON that can be deployed to GitHub Pages or another static host.

Do **not** build this as “one script that calls six APIs and renders HTML live.” That is fragile.

## 2. Architecture the agent should implement

Build it in four layers:

1. **Connector layer**  
   One sync job per platform.
2. **Normalized data layer**  
   Each sync writes stable JSON snapshots.
3. **Analysis/report layer**  
   Report code reads normalized JSON only.
4. **Presentation layer**  
   HTML, dashboards, daily briefings, Telegram posts, voice summaries.

That separation is what makes the system maintainable.

### AI implementation contract

Agent, build this contract before writing any dashboard UI:

- **Inputs:** environment variables and vendor credentials only; never hard-code secrets into source files.
- **Sync outputs:** one raw JSON snapshot per vendor pull, plus one normalized JSON file per vendor.
- **Report inputs:** normalized JSON only. The report builder should not call Garmin, WHOOP, Speediance, or Cronometer directly.
- **Failure mode:** if one connector fails, preserve yesterday’s last-known-good normalized file and mark that source as stale in the report.
- **Auditability:** keep enough raw payloads to debug vendor API changes without logging tokens, cookies, passwords, or private headers.
- **Send gate:** email, voice, Telegram, and adaptive workout actions should require same-day scored recovery data. A web report can still be generated in degraded mode, but the system should not send confident coaching from stale recovery.
- **Plan snapshots:** adaptive workout plans should be written as daily JSON snapshots before they are sent anywhere. The nightly report can then compare the plan against what actually happened.

Minimum environment variables for an agent-ready build:

```text
GARMIN_EMAIL=
GARMIN_PASSWORD=
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
WHOOP_ACCESS_TOKEN=
WHOOP_REFRESH_TOKEN=
SPEEDIANCE_USER_ID=
SPEEDIANCE_TOKEN=
SPEEDIANCE_REGION=Global
CRONOMETER_EXPORT_PATH=
EIGHTSLEEP_EMAIL=
EIGHTSLEEP_PASSWORD=
```

---

## 3. Definition of done

An implementation agent is done only when these artifacts exist and can be regenerated:

- `data/garmin/summary/latest.json`
- `data/whoop/normalized/latest.json`
- `data/speediance/normalized/history.json`
- `data/speediance/normalized/by_exercise.json`
- `data/nutrition/latest.json`
- `data/eightsleep/normalized/latest.json`, if 8Sleep is configured
- `data/training_plans/YYYY-MM-DD_morning.json`
- `reports/morning/latest.html`
- `reports/nightly/latest.html`
- a send gate that withholds email, voice, Telegram, and adaptive workout sends when same-day scored WHOOP recovery is missing
- stale-source warnings when a connector fails but yesterday’s last-known-good normalized data is available
- a no-secrets check proving tokens, cookies, passwords, and private headers were not committed

If the agent cannot authenticate to a vendor during development, it should still implement the connector interface, `.env.example`, fake fixtures, normalizer, stale-source handling, and report integration.

---

## 4. Public projects and source references

These are the public pieces an agent should use as implementation references.

Quick GitHub/API checklist:
- Garmin connector: `https://github.com/cyberjunky/python-garminconnect`
- Garmin legacy auth context: `https://github.com/matin/garth`
- WHOOP official developer API: `https://developer.whoop.com/api`
- Speediance public extraction for this build: `https://github.com/clawdassistant85-netizen/speediance-smartgym-workout-manager`
- Speediance working fork this was extracted from: `https://github.com/ANPC86/SmartGymWorkoutManager`
- Speediance upstream/original reference: `https://github.com/hbui3/UnofficialSpeedianceWorkoutManager`
- Report generator/template reference: `https://github.com/tobyglenn/scriptsJinja`
- Cronometer exports/integrations: `https://cronometer.com/`


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
- Optional community wrappers exist, but an agent-built connector should anchor to the **official WHOOP developer API** wherever possible.

### Speediance
- Practical public Speediance implementation reference: **ANPC86/SmartGymWorkoutManager**  
  GitHub: `https://github.com/ANPC86/SmartGymWorkoutManager`
- Upstream project lineage / original public reference: **hbui3/UnofficialSpeedianceWorkoutManager**  
  GitHub: `https://github.com/hbui3/UnofficialSpeedianceWorkoutManager`
- Use the ANPC86 SmartGymWorkoutManager fork as the practical connection reference because it contains useful work around history, exports, API debugging, timezone handling, and unit handling.
- This is an **unofficial** Speediance integration and should be treated as unstable by default.

### Nutrition
- Cronometer product site / exports / integrations: `https://cronometer.com/`
- Treat Cronometer as a structured nutrition export source, not as a magic direct report dependency.

---

## 5. Production updates the agent should preserve

The current version of this stack has a few important behaviors the agent should preserve.

### Single owner machine

The fitness pipeline should have one authoritative always-on machine. Do not let two different computers generate and deploy reports against the same output repo. The active machine owns vendor sync jobs, report generation, adaptive workout generation, deploys to GitHub Pages, and watchdog checks.

Other machines can view the reports or host local dashboards, but they should not regenerate the fitness reports.

### Sequential pipeline instead of staggered cron guesses

The morning and nightly pipelines should run as ordered phases:

1. sync vendor data
2. verify required same-day data
3. generate reports
4. deploy
5. send notifications
6. generate voice summaries, if used
7. run watchdog validation

The old mistake is scheduling those steps at fixed wall-clock offsets and hoping each previous phase finished. The better pattern is one orchestrator that runs each phase only after the previous one exits cleanly.

### Same-day WHOOP recovery gate

For this stack, same-day WHOOP recovery is a hard gate for coaching. If today's recovery is missing, the system can still publish a web report with stale-source warnings, but it should withhold email, voice, Telegram coaching, and adaptive workout sends.

That one rule prevents the worst failure mode: a plausible recommendation built from yesterday's recovery.

### 8Sleep late-data handling

8Sleep can update after the first morning run. A rerun should force-refresh today and yesterday before regenerating instead of trusting an existing local JSON file just because it exists.

### Real Garmin HR zones only

Do not invent heart-rate zone distributions from average heart rate. If Garmin activity detail includes time-in-zone data, use it. If it does not, hide that chart or mark it unavailable.

### Plan execution review

The nightly report now works better when it compares the day's plan against the day's actual data:

- planned BJJ vs WHOOP BJJ workout
- planned Speediance session vs Speediance sessions completed
- planned run vs Garmin run distance
- planned steps vs Garmin steps

That turns the nightly report into a feedback loop instead of just a summary.

### Open Wearables shadow mode

Open Wearables is useful as a future abstraction layer, but I would not switch a working personal report system over all at once. The safer migration is shadow mode:

1. keep the existing file-based pipeline authoritative
2. import or mirror Garmin/WHOOP data into Open Wearables
3. export Open Wearables data back into shadow JSON files
4. compare shadow files against production files
5. promote only after counts, dates, and same-day records match

The shadow files should never overwrite production inputs during the pilot.

---

## 6. Garmin: the cardio and activity-detail layer

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

But `garth` is now explicitly deprecated. That matters because an agent should **not** center a new implementation on deprecated auth.

### Minimal executable Garmin example

```python
from garminconnect import Garmin
from datetime import date
from pathlib import Path
import json
import os

email = os.environ["GARMIN_EMAIL"]
password = os.environ["GARMIN_PASSWORD"]

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

out = Path("data/garmin/raw")
out.mkdir(parents=True, exist_ok=True)
(out / f"{today}.json").write_text(json.dumps(payload, indent=2))
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

## 7. WHOOP: the recovery and readiness layer

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
from pathlib import Path
import json
import os
import requests

BASE = "https://api.prod.whoop.com/developer/v2"
TOKEN = os.environ["WHOOP_ACCESS_TOKEN"]
headers = {"Authorization": f"Bearer {TOKEN}"}

def get(path):
    response = requests.get(f"{BASE}{path}", headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()

payload = {
    "recovery": get("/recovery"),
    "sleep": get("/activity/sleep"),
    "workouts": get("/activity/workout"),
}

out = Path("data/whoop/raw")
out.mkdir(parents=True, exist_ok=True)
(out / "latest.json").write_text(json.dumps(payload, indent=2))
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

## 8. Speediance: the strength-training layer

Speediance is the most unusual connector in the whole stack.

Unlike Garmin and WHOOP, this is not a clean official public developer platform. The agent should use these public repos as connection references:

**Public extraction/reference:** `https://github.com/clawdassistant85-netizen/speediance-smartgym-workout-manager`

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
Use the ANPC86 SmartGymWorkoutManager fork as the practical basis for the Speediance integration pattern, while preserving the hbui3 upstream reference for provenance. Together, they are the clearest public references for working with Speediance data outside the official app.

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
# Shape this around the api_client.py in:
# https://github.com/clawdassistant85-netizen/speediance-smartgym-workout-manager
from api_client import SpeedianceClient
from datetime import date
from pathlib import Path
import json
import os

client = SpeedianceClient()
success, msg, debug = client.login(
    os.environ["SPEEDIANCE_USER_ID"],
    os.environ["SPEEDIANCE_TOKEN"],
)
if not success:
    raise RuntimeError(msg)

start_date = os.environ.get("SPEEDIANCE_START_DATE", "2026-01-01")
end_date = date.today().isoformat()
records = client.get_training_data(start_date, end_date)

out = Path("data/speediance/raw")
out.mkdir(parents=True, exist_ok=True)
(out / "history.json").write_text(json.dumps(records, indent=2))
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

### Adaptive Speediance workout snapshots

The more advanced version of this build does not only read completed Speediance workouts. It also creates planned workouts from live readiness data.

The useful pattern is:

1. Load same-day WHOOP recovery, current strain, BJJ strain, Garmin body battery, resting HR, recent running load, weather, and recent Speediance plan history.
2. Classify the day into a bucket such as `build`, `maintain`, `recover`, `protect`, or `post_bjj_brutal`.
3. Select one Speediance implement for the whole workout, usually handles, barbell, or rope.
4. Pick on-device exercises only for the core Speediance workout.
5. Add zero to two off-Speediance accessories only when recovery supports it.
6. Write the plan to `data/training_plans/YYYY-MM-DD_context.json`.
7. Use the snapshot for both the morning recommendation and the nightly plan-execution review.

For repeat control, compare the new workout signature against recent plan snapshots. The production version uses a rolling uniqueness window that grows up to 30 days, and it always stamps the workout title with today's date so a resurfaced workout is still fresh and searchable.

---

## 9. Cronometer: the nutrition context layer

Whatever exact nutrition app you use, the role is the same: give the report context for energy intake.

This matters because training load without nutrition context leads to bad conclusions.

The report should be able to ask:
- Was recovery low because training load was high?
- Or because sleep was poor **and** calorie intake was low?
- Was the athlete under-fueled relative to output?

### Practical build advice
Do not depend on a live nutrition API at render time.
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

### Recommended storage pattern
- `data/nutrition/raw/YYYY-MM-DD.csv`
- `data/nutrition/normalized/YYYY-MM-DD.json`
- `data/nutrition/latest.json`

---

## 10. 8Sleep: the late-arriving sleep context layer

8Sleep is optional, but if it is configured the agent should treat it like every other connector: sync first, normalize second, render from files last.

The important behavior is late-data handling. Sleep data can change after the first morning run, so a manual rerun or scheduled retry should force-refresh both today and yesterday before regenerating the report.

Normalize fields such as:
- `sleep_score`
- `sleep_start`
- `sleep_end`
- `time_in_bed_seconds`
- `time_asleep_seconds`
- `hrv`
- `resting_heart_rate`
- `temperature_adjustments`
- `away_mode`

Recommended storage pattern:
- `data/eightsleep/raw/YYYY-MM-DD.json`
- `data/eightsleep/normalized/YYYY-MM-DD.json`
- `data/eightsleep/normalized/latest.json`

---

## 11. What OpenClaw actually does in this stack

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
- `data/eightsleep/normalized/latest.json`

The report generator should never need to know how Garmin auth works or how Speediance headers changed this week.

---

## 12. Agent-buildable directory structure

Here is a structure an agent can create before any real vendor auth succeeds:

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
      raw/
      normalized/
    eightsleep/
      raw/
      normalized/
    training_plans/
  scripts/
    sync_garmin.py
    sync_whoop.py
    sync_speediance.py
    sync_nutrition.py
    sync_eightsleep.py
    gate_same_day_recovery.py
    build_adaptive_plan.py
    build_report.py
  reports/
    morning/
      latest.html
    nightly/
      latest.html
  frontend/
    data/
```

The file structure is part of the interface. Make it plain enough that a future agent can inspect the system, find each connector, rerun a single sync, and compare raw payloads to normalized outputs.

---

## 13. Example report builder pattern

Once each connector writes normalized JSON, the actual report code becomes simple.

```python
import json
from pathlib import Path

base = Path("data")

garmin = json.loads((base / "garmin/summary/latest.json").read_text())
whoop = json.loads((base / "whoop/normalized/latest.json").read_text())
speediance = json.loads((base / "speediance/normalized/history.json").read_text())
nutrition = json.loads((base / "nutrition/latest.json").read_text())
eightsleep_path = base / "eightsleep/normalized/latest.json"
eightsleep = json.loads(eightsleep_path.read_text()) if eightsleep_path.exists() else {}

summary = {
    "recovery": whoop.get("recovery_score"),
    "hrv": whoop.get("hrv_rmssd_milli"),
    "rhr": whoop.get("resting_heart_rate"),
    "steps": garmin.get("totalSteps"),
    "body_battery": garmin.get("bodyBattery"),
    "lifting_volume": speediance.get("today", {}).get("total_volume"),
    "calories_in": nutrition.get("calories_consumed"),
    "sleep_score": eightsleep.get("sleep_score"),
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
      <li>8Sleep Score: {summary['sleep_score']}</li>
    </ul>
  </body>
</html>
"""

out = Path("reports/morning")
out.mkdir(parents=True, exist_ok=True)
(out / "latest.html").write_text(html)
```

This is where the whole design pays off: once the sync layer is sane, the report layer gets boring in the best possible way.

---

## 14. What each connector is actually for

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

### 8Sleep
Use for:
- late-arriving sleep detail
- bed-specific sleep duration and score
- sleep-context cross-checks against WHOOP and Garmin

OpenClaw then combines all of them into one report and recommendation surface.

---

## 15. Connection deliverables by system

This is the checklist the implementation agent should satisfy before polishing the report UI.

### Garmin connection points
- Library: `garminconnect` from `cyberjunky/python-garminconnect`
- Auth: Garmin Connect email/password with the library’s token/session handling
- Pull cadence: daily morning sync plus optional post-workout sync
- Minimum pulls:
  - daily stats for steps, resting HR, sleep seconds, body battery, calories
  - activities by date for runs/rides/cardio sessions
  - activity detail when available for HR zones, pace, cadence, power, training effect
- Normalized output: `data/garmin/summary/latest.json`

### WHOOP connection points
- API docs: `https://developer.whoop.com/api`
- Auth: OAuth2 access token + refresh token flow
- Base URL: `https://api.prod.whoop.com/developer/v2`
- Minimum endpoint groups:
  - `/cycle` for strain/cycle context
  - `/recovery` for recovery score, HRV, resting HR
  - `/activity/sleep` for sleep performance and sleep timing
  - `/activity/workout` for workouts and WHOOP strain data
  - `/user/profile/basic` and `/user/measurement/body` for profile/body context when needed
- Normalized output: `data/whoop/normalized/latest.json`

### Speediance connection points
- Public extraction for this build: `https://github.com/clawdassistant85-netizen/speediance-smartgym-workout-manager`
- Upstream reference: `https://github.com/hbui3/UnofficialSpeedianceWorkoutManager`
- Auth: unofficial token/user-id based flow exposed by the SmartGym client layer
- Minimum pulls:
  - workout history
  - exercise/session detail
  - custom workout/template metadata if you want planned-vs-actual reporting
  - raw API/debug response capture without secrets
- Normalized outputs:
  - `data/speediance/normalized/history.json`
  - `data/speediance/normalized/by_exercise.json`

### Cronometer connection points
- Public source: `https://cronometer.com/` exports/integrations
- Recommended implementation approach: CSV export or scheduled file drop, not a live render-time API dependency
- Minimum fields: date, calories, protein, carbs, fat, fiber, and any micronutrients you want in recovery analysis
- Normalized output: `data/nutrition/latest.json`

### 8Sleep connection points
- Auth: environment-backed login/session flow, with no credentials in source
- Pull cadence: morning sync plus rerun/refresh support for today and yesterday
- Minimum pulls:
  - sleep score
  - sleep timing
  - time asleep and time in bed
  - HRV and resting HR when available
  - temperature and away-mode context when available
- Normalized output: `data/eightsleep/normalized/latest.json`

### Report-generation connection point
The report builder should read only stable normalized files and plan snapshots. A practical shape is:

```text
data/garmin/summary/latest.json
data/whoop/normalized/latest.json
data/speediance/normalized/history.json
data/speediance/normalized/by_exercise.json
data/nutrition/latest.json
data/eightsleep/normalized/latest.json
data/training_plans/YYYY-MM-DD_morning.json
data/training_plans/YYYY-MM-DD_post_bjj.json
```

That is the actual connection surface. Everything upstream can break and be fixed independently.

---

## 16. The real implementation rules

If an agent is going to build this successfully, these rules matter more than any single code snippet:

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

7. **Gate coaching on today's readiness, not yesterday's**  
   Missing same-day recovery should degrade the system to web-only reporting.

8. **Save the plan before judging the day**  
   A nightly adherence score only works if the morning or post-BJJ plan was stored as data.

9. **Pilot new backends in shadow mode**  
   Open Wearables or any other abstraction layer should prove it can match current production files before it becomes the source of truth.

---

## Final implementation reference list

These are the public references an AI coding agent should be handed first when implementing this system:

- OpenClaw as the orchestration layer
- Garmin connector: `https://github.com/cyberjunky/python-garminconnect`
- Garmin historical auth context: `https://github.com/matin/garth` *(deprecated; use as context, not as the center of a new build)*
- WHOOP official developer API: `https://developer.whoop.com/api`
- Speediance public extraction for this build: `https://github.com/clawdassistant85-netizen/speediance-smartgym-workout-manager`
- Speediance upstream/original reference: `https://github.com/hbui3/UnofficialSpeedianceWorkoutManager`
- Report generator/template reference: `https://github.com/tobyglenn/scriptsJinja`
- Cronometer nutrition exports: `https://cronometer.com/`
- 8Sleep connector contract: environment-backed sync that writes `data/eightsleep/normalized/latest.json`

If you are handing this article to Claude Code, Codex, OpenClaw, or another implementation agent, the correct instruction is: build the connectors first, write normalized JSON snapshots second, enforce the same-day recovery gate third, then build the report renderer last. Do not start by designing the final HTML report.

---
