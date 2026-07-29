#!/usr/bin/env python3
"""Resolve every shared Speediance program code into full workout JSON.

Reads the seed list (index/date/note/code/link) and calls the Speediance
`customTrainingTemplate/detailByCode` endpoint for each code, then writes a
normalised, display-ready file the Astro frontend imports at build time.

Usage:
    python3 backend/scripts/fetch_sam_workouts.py [--out PATH] [--seed PATH]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time

MANAGER_DIR = "/home/toby/.openclaw/workspace/speediance_manager"
sys.path.insert(0, MANAGER_DIR)

from api_client import SpeedianceClient  # noqa: E402

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_SEED = os.path.join(REPO, "backend", "scripts", "sam_workout_seed.json")
DEFAULT_OUT = os.path.join(REPO, "frontend", "src", "data", "samWorkouts.json")


def split_field(raw, count):
    """Speediance packs per-set values into comma separated strings."""
    parts = [part.strip() for part in str(raw or "").split(",") if part.strip() != ""]
    if not parts:
        return [None] * count
    if len(parts) < count:
        parts += [parts[-1]] * (count - len(parts))
    return parts[:count]


def as_number(value, fallback=0):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    return int(number) if number.is_integer() else round(number, 2)


KG_TO_LB = 2.2046226218


def to_lb(kg):
    """Speediance returns loads in kg; the site presents lb alongside."""
    return as_number(round(float(kg) * KG_TO_LB, 1))


def normalise_exercise(action):
    reps = split_field(action.get("setsAndReps"), 0)
    set_count = len([item for item in str(action.get("setsAndReps") or "").split(",") if item.strip()])
    if set_count == 0:
        return None

    reps = split_field(action.get("setsAndReps"), set_count)
    weights = split_field(action.get("weights"), set_count)
    counters = split_field(action.get("counterweight2"), set_count)
    rests = split_field(action.get("breakTime2"), set_count)
    modes = split_field(action.get("sportMode"), set_count)

    preset = int(action.get("templatePresetId") if action.get("templatePresetId") is not None else -1)
    time_based = str(action.get("countType") or "") == "2" and str(action.get("completionMethod") or "") == "2"

    sets = []
    volume = 0.0
    for index in range(set_count):
        rep_value = as_number(reps[index])
        weight_value = as_number(weights[index])
        entry = {
            "reps": rep_value,
            "weight": weight_value,
            "weight_lb": to_lb(weight_value),
            "mode": as_number(modes[index], 1),
            "rest": as_number(rests[index], 60),
            "unit": "sec" if time_based else "reps",
        }
        if preset != -1 and counters[index] is not None:
            # Preset (RM) exercises carry the RM target in counterweight2 and the
            # machine-resolved load in weights.
            entry["counter"] = as_number(counters[index])
        sets.append(entry)
        volume += rep_value * weight_value

    return {
        "id": as_number(action.get("actionLibraryId")),
        "group_id": as_number(action.get("groupId")),
        "title": action.get("title") or "Exercise",
        "preset": preset,
        "muscle": action.get("mainMuscleGroupName") or "",
        "image": action.get("img") or "",
        "is_barbell": bool(action.get("isBarbell")),
        "is_unilateral": bool(action.get("isLeftRight")),
        "accessories": action.get("accessories") or "",
        "sets": sets,
        "volume_kg": round(volume, 1),
        "volume_lb": to_lb(volume),
    }


def base_entry(seed):
    return {
        "id": f"sam-{seed['index']}",
        "index": seed["index"],
        "creator_name": "Sam",
        "batch": seed.get("note") or "General Programs",
        "date": seed.get("date"),
        "code": seed["code"],
        "link": seed["link"],
        "provider_template_code": seed["code"],
        "is_sam": True,
    }


def unavailable_workout(seed, reason):
    """Sam removed the template upstream: keep the entry, state why it is empty."""
    entry = base_entry(seed)
    entry.update({
        "name": f"Program #{seed['index']} (no longer shared)",
        "description": (
            f"Sam removed this {entry['batch']} program from Speediance, so its structure "
            f"can no longer be retrieved. The program code is kept here for reference."
        ),
        "unavailable": True,
        "unavailable_reason": reason,
        "exercises": [],
        "total_volume_kg": 0,
        "total_volume_lb": 0,
        "athlete_count": 0,
    })
    return entry


def normalise_workout(seed, detail):
    actions = sorted(
        detail.get("actionLibraryList") or [],
        key=lambda action: as_number(action.get("sort"), 0),
    )
    exercises = [item for item in (normalise_exercise(action) for action in actions) if item]
    name = (detail.get("name") or "").strip() or f"Program #{seed['index']}"
    total_kg = as_number(detail.get("totalCapacity"))

    entry = base_entry(seed)
    entry.update({
        "name": name,
        "description": (
            f"{name} — from Sam's {entry['batch']} program set, shared {seed.get('date')}. "
            f"{len(exercises)} exercises, {as_number(detail.get('durationMinute'))} min, "
            f"{as_number(detail.get('estimatedCalorie'))} kcal estimated."
        ),
        "unavailable": False,
        "device_type": as_number(detail.get("deviceType"), 1),
        "duration_minutes": as_number(detail.get("durationMinute")),
        "estimated_calories": as_number(detail.get("estimatedCalorie")),
        "total_volume_kg": total_kg,
        "total_volume_lb": to_lb(total_kg),
        "exercises": exercises,
        "athlete_count": as_number(detail.get("trainingCount")),
    })
    return entry


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", default=DEFAULT_SEED)
    parser.add_argument("--out", default=DEFAULT_OUT)
    parser.add_argument("--delay", type=float, default=0.4)
    args = parser.parse_args()

    with open(args.seed) as handle:
        seeds = json.load(handle)

    client = SpeedianceClient()
    workouts = []
    failures = []
    max_free_weight = 0.0

    for seed in seeds:
        code = seed["code"]
        detail = None
        reason = ""
        try:
            detail = client.get_workout_detail(code)
        except Exception as exc:  # noqa: BLE001 - record and keep the entry
            reason = str(exc)
        if not detail:
            reason = reason or "empty response"
            failures.append((seed["index"], code, reason))
            workouts.append(unavailable_workout(seed, reason))
            print(f"  #{seed['index']:>2} {code}  UNAVAILABLE: {reason}")
            time.sleep(args.delay)
            continue

        workout = normalise_workout(seed, detail)
        workouts.append(workout)
        for exercise in workout["exercises"]:
            if exercise["preset"] == -1 and not exercise["is_barbell"]:
                for item in exercise["sets"]:
                    max_free_weight = max(max_free_weight, float(item["weight"]))
        print(
            f"  #{seed['index']:>2} {code}  {workout['name'][:44]:<44} "
            f"{len(workout['exercises'])} ex  {workout['total_volume_lb']} lb"
        )
        time.sleep(args.delay)

    workouts.sort(key=lambda item: item["index"])
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w") as handle:
        json.dump(workouts, handle, indent=1)
        handle.write("\n")

    resolved = len([item for item in workouts if not item["unavailable"]])
    print(f"\nwrote {len(workouts)} workouts ({resolved} resolved) -> {args.out}")
    print(f"max non-barbell custom-weight value seen: {max_free_weight} kg")
    if failures:
        print(f"\n{len(failures)} unavailable upstream:")
        for index, code, message in failures:
            print(f"  #{index} {code}: {message}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
