import asyncio
import json
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "src" / "data" / "onePeterKjv.json"
OUT_DIR = ROOT / "public" / "audio" / "one-peter-memory"

VOICE_PROFILES = [
    {
        "id": "ironvane-narrator",
        "label": "IronVane Narrator",
        "voice": "en-GB-RyanNeural",
        "rate": "-12%",
        "pitch": "-8Hz",
    },
    {
        "id": "liminal-narrator",
        "label": "Liminal Narrator",
        "voice": "en-GB-SoniaNeural",
        "rate": "+2%",
        "pitch": "-2Hz",
    },
    {
        "id": "aldric-command",
        "label": "Aldric Command",
        "voice": "en-US-BrianNeural",
        "rate": "-4%",
        "pitch": "-5Hz",
    },
]

PREVIEW_TEXT = "Blessed be the God and Father of our Lord Jesus Christ."


def verse_filename(verse_id):
    return verse_id.replace(":", "-") + ".mp3"


async def synthesize(text, output_path, profile):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.exists() and output_path.stat().st_size > 1024:
        return "skipped"

    communicate = edge_tts.Communicate(
        text,
        profile["voice"],
        rate=profile["rate"],
        pitch=profile["pitch"],
    )
    await communicate.save(str(output_path))
    return "created"


async def main():
    data = json.loads(DATA_PATH.read_text())
    verses_by_id = {verse["id"]: verse for verse in data["verses"]}
    semaphore = asyncio.Semaphore(6)
    counters = {"created": 0, "skipped": 0}

    async def run_job(text, output_path, profile):
        async with semaphore:
            result = await synthesize(text, output_path, profile)
            counters[result] += 1
            if result == "created":
                print(f'created {profile["id"]}/{output_path.name}', flush=True)

    tasks = []
    for profile in VOICE_PROFILES:
        profile_dir = OUT_DIR / profile["id"]
        jobs = [(PREVIEW_TEXT, profile_dir / "preview.mp3")]

        for unit in data["units"]:
            unit_text = " ".join(
                f'{verses_by_id[verse_id]["reference"]}. {verses_by_id[verse_id]["text"]}'
                for verse_id in unit["verseIds"]
            )
            jobs.append((unit_text, profile_dir / "units" / f'{unit["id"]}.mp3'))

        for text, output_path in jobs:
            tasks.append(run_job(text, output_path, profile))

    await asyncio.gather(*tasks)
    print(f'done: {counters["created"]} created, {counters["skipped"]} skipped', flush=True)


if __name__ == "__main__":
    asyncio.run(main())
