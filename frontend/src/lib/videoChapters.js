export function parseVideoChapters(description) {
  if (!description || typeof description !== 'string') {
    return [];
  }

  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const chapters = [];

  for (const line of lines) {
    // Match:
    // - MM:SS - Title
    // - H:MM:SS - Title
    // Also supports en/em dash separators.
    const match = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*(.+)$/);
    if (!match) continue;

    const time = match[1].trim();
    const title = (match[2] || '').trim();

    // Skip missing/empty title lines
    if (!title) continue;

    const parts = time.split(':').map((part) => Number(part));
    if (parts.some((n) => Number.isNaN(n))) continue;

    let seconds = null;

    if (parts.length === 2) {
      const [mm, ss] = parts;
      if (ss < 0 || ss > 59) continue;
      if (mm < 0) continue;
      seconds = mm * 60 + ss;
    } else if (parts.length === 3) {
      const [hh, mm, ss] = parts;
      if (mm < 0 || mm > 59 || ss < 0 || ss > 59) continue;
      if (hh < 0) continue;
      seconds = hh * 3600 + mm * 60 + ss;
    }

    if (seconds === null || !Number.isFinite(seconds)) continue;

    chapters.push({ time, seconds, title });
  }

  return chapters;
}
