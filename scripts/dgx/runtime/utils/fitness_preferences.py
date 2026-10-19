"""Owner-selected fitness automation mode; completed workout ingestion is independent."""
import json
import os
from pathlib import Path


def automatic_workouts_enabled():
    path=Path(os.environ.get('FITNESS_PREFERENCES_FILE',Path.home()/'clawd/data/fitness_preferences.json'))
    try:
        value=json.loads(path.read_text())
        return value.get('automatic_workouts_enabled') is True
    except (OSError,ValueError,TypeError):
        return False


class AutomaticWorkoutDisabled(RuntimeError):pass


def require_automatic_workouts():
    if not automatic_workouts_enabled():
        raise AutomaticWorkoutDisabled('Automatic workout creation is disabled; training is self-directed')


if __name__=='__main__':
    raise SystemExit(0 if automatic_workouts_enabled() else 1)
