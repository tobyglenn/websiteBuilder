import { readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../src/data');
const OUTPUT_FILE = path.join(DATA_DIR, 'homepageFitnessData.json');
const FITNESS_HUB_BASE =
  process.env.FITNESS_HUB_BASE ?? 'http://192.168.1.249:8082/fitness';
const ET_TIME_ZONE = 'America/New_York';
const WHOOP_DATA_CANDIDATES = [
  process.env.WHOOP_DATA_PATH,
  path.join(DATA_DIR, 'whoop_v2_latest.json'),
  path.join(homedir(), 'clawd/data/whoop_v2_latest.json'),
  path.join(homedir(), '.openclaw/workspace/fitness-ecosystem/data/whoop_v2_latest.json'),
].filter(Boolean);

function numberFromText(value) {
  return Number(String(value).replace(/[^\d.]/g, ''));
}

function extractRequiredMatch(text, regex, label) {
  const match = text.match(regex);
  if (!match) {
    throw new Error(`Could not find ${label}`);
  }
  return match[1];
}

function extractOptionalMatch(text, regex) {
  const match = text.match(regex);
  return match ? match[1] : null;
}

function dateKeyFromDate(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ET_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function dateKeyFromValue(value) {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(value)) {
    return dateKeyFromDate(new Date(value.replace(' ', 'T')));
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return dateKeyFromDate(date);
}

function dateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function timestampFromValue(value) {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return dateFromKey(value).getTime();
  }

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(value)) {
    const date = new Date(value.replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function addDays(key, days) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKeyFromDate(date);
}

function mondayForDateKey(key) {
  const date = dateFromKey(key);
  const weekday = date.getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setUTCDate(date.getUTCDate() + diff);
  return dateKeyFromDate(date);
}

function differenceInDays(a, b) {
  return Math.round((dateFromKey(a) - dateFromKey(b)) / (24 * 60 * 60 * 1000));
}

function formatDateLabel(key) {
  return dateFromKey(key).toLocaleDateString('en-US', {
    timeZone: ET_TIME_ZONE,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function rangeTotals({ runByDate, liftByDate, bjjByDate }, start, end) {
  let runCount = 0;
  let runMiles = 0;
  let liftCount = 0;
  let liftVolume = 0;
  let bjjCount = 0;

  for (const [date, entry] of runByDate) {
    if (date >= start && date <= end) {
      runCount += entry.count;
      runMiles += entry.miles;
    }
  }

  for (const [date, entry] of liftByDate) {
    if (date >= start && date <= end) {
      liftCount += entry.count;
      liftVolume += entry.volume;
    }
  }

  for (const [date, count] of bjjByDate) {
    if (date >= start && date <= end) {
      bjjCount += count;
    }
  }

  return {
    workouts: runCount + liftCount + bjjCount,
    runs: runCount,
    volume: Math.round(liftVolume),
    miles: Number(runMiles.toFixed(1)),
    bjj: bjjCount,
    lifting: liftCount,
  };
}

function collectActivityDates({ runByDate, liftByDate, bjjByDate }) {
  const counts = new Map();

  for (const [date, entry] of runByDate) {
    const current = counts.get(date) ?? { count: 0, runs: 0, lifting: 0, bjj: 0 };
    current.count += entry.count;
    current.runs += entry.count;
    counts.set(date, current);
  }

  for (const [date, entry] of liftByDate) {
    const current = counts.get(date) ?? { count: 0, runs: 0, lifting: 0, bjj: 0 };
    current.count += entry.count;
    current.lifting += entry.count;
    counts.set(date, current);
  }

  for (const [date, count] of bjjByDate) {
    const current = counts.get(date) ?? { count: 0, runs: 0, lifting: 0, bjj: 0 };
    current.count += count;
    current.bjj += count;
    counts.set(date, current);
  }

  return counts;
}

function calculateStreaks(sortedDates, todayKey) {
  if (sortedDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  const activeDateSet = new Set(sortedDates);
  let longest = 0;
  let streak = 0;
  let previous = null;

  for (const date of sortedDates) {
    streak = previous && differenceInDays(date, previous) === 1 ? streak + 1 : 1;
    longest = Math.max(longest, streak);
    previous = date;
  }

  const yesterdayKey = addDays(todayKey, -1);
  let cursor = activeDateSet.has(todayKey)
    ? todayKey
    : activeDateSet.has(yesterdayKey)
      ? yesterdayKey
      : sortedDates[sortedDates.length - 1];

  let current = 0;
  while (cursor && activeDateSet.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, longest };
}

async function readJson(filename) {
  const raw = await readFile(path.join(DATA_DIR, filename), 'utf8');
  return JSON.parse(raw);
}

async function readFreshestWhoopData() {
  const candidates = [];

  for (const filePath of [...new Set(WHOOP_DATA_CANDIDATES)]) {
    try {
      const raw = await readFile(filePath, 'utf8');
      const data = JSON.parse(raw);
      candidates.push({
        data,
        filePath,
        lastSynced: timestampFromValue(data?.last_synced) ?? 0,
      });
    } catch {
      // Skip missing or invalid candidate files and fall back to the next source.
    }
  }

  if (candidates.length === 0) {
    throw new Error('Could not load WHOOP data from any configured source');
  }

  candidates.sort((a, b) => a.lastSynced - b.lastSynced);
  return candidates.at(-1);
}

function createLastActivityCandidate(type, value) {
  const date = dateKeyFromValue(value);
  const timestamp = timestampFromValue(value);

  if (!date || timestamp == null) {
    return null;
  }

  return { type, date, timestamp };
}

async function fetchHtml(pathname = '') {
  const url = pathname ? `${FITNESS_HUB_BASE}/${pathname}` : FITNESS_HUB_BASE;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function parseHubStats(hubHtml) {
  const legacyTodayLabel = extractOptionalMatch(hubHtml, /<div class="sub">Today:\s*([^<]+)<\/div>/);
  const sectionTodayLabel = extractOptionalMatch(
    hubHtml,
    /<p class=['"]section-label['"]>📅 Today\s+[—-]\s+([^<]+)<\/p>/
  );
  const todayLabel = legacyTodayLabel ?? sectionTodayLabel;

  if (!todayLabel) {
    throw new Error('Could not find hub date label');
  }

  const todayKey =
    extractOptionalMatch(todayLabel, /(\d{4}-\d{2}-\d{2})/) ??
    dateKeyFromValue(todayLabel);

  if (!todayKey) {
    throw new Error('Could not find hub date');
  }

  const totalLiftingVolumeText = extractOptionalMatch(
    hubHtml,
    /Total Lifting Volume<\/div><div class="value">([^<]+)/
  );
  const totalRunSessionsText = extractOptionalMatch(
    hubHtml,
    /Total Runs \(Garmin\)<\/div><div class="value">([^<]+)/
  );
  const totalRunMilesText = extractOptionalMatch(
    hubHtml,
    /Total Runs \(Garmin\)<\/div><div class="value">[^<]+<\/div><div class="label">([^<]+)/
  );
  const currentRecoveryText = extractOptionalMatch(
    hubHtml,
    /Current WHOOP Recovery<\/div><div class="value">([^<]+)/
  );
  const lastSleepScoreText = extractOptionalMatch(
    hubHtml,
    /Last Night's Sleep Score<\/div><div class="value">([^<]+)/
  );

  const totalLiftingVolume = totalLiftingVolumeText ? numberFromText(totalLiftingVolumeText) : null;
  const totalRunSessions = totalRunSessionsText ? numberFromText(totalRunSessionsText) : null;
  const totalRunMiles = totalRunMilesText ? numberFromText(totalRunMilesText) : null;
  const currentRecovery = currentRecoveryText ? numberFromText(currentRecoveryText) : null;
  const lastSleepScore = lastSleepScoreText ? numberFromText(lastSleepScoreText) : null;
  const morningReportPath = extractOptionalMatch(
    hubHtml,
    /href="([^"]*morning_report_[^"]+\.html)"/
  );

  const recentActivity = [...hubHtml.matchAll(/<tr><td>(\d{4}-\d{2}-\d{2})<\/td><td>([\s\S]*?)<\/td><\/tr>/g)]
    .map((match) => {
      const date = match[1];
      const detail = match[2];
      const runMatch = detail.match(/🏃\s+(\d+)\s+run(?:s)?,\s+([\d.]+)\s+mi/);
      const recoveryMatch = detail.match(/💜\s+rec\s+([\d.]+)/);
      const sleepMatch = detail.match(/😴\s+sleep\s+([\d.]+)/);

      return {
        date,
        runs: runMatch
          ? {
              count: Number(runMatch[1]),
              miles: Number(runMatch[2]),
            }
          : null,
        recovery: recoveryMatch ? Number(recoveryMatch[1]) : null,
        sleep: sleepMatch ? Number(sleepMatch[1]) : null,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    todayLabel,
    todayKey,
    totalLiftingVolume,
    totalRunSessions,
    totalRunMiles,
    currentRecovery,
    lastSleepScore,
    morningReportPath,
    recentActivity,
  };
}

function parseMorningReportStats(reportHtml) {
  const currentRecoveryText = extractOptionalMatch(
    reportHtml,
    /WHOOP RECOVERY(?:<br>)?<span class="value"[^>]*>([^<]+)</s
  );
  const lastSleepScoreText = extractOptionalMatch(
    reportHtml,
    /8SLEEP SCORE(?:<br>)?<span class="value"[^>]*>([^<]+)</s
  );
  const cardioDistanceByDate = new Map();
  const cardioSvgBase64 = extractOptionalMatch(
    reportHtml,
    /<h2>3\. Cardio Intensity \(Distance vs Strain\)<\/h2>[\s\S]*?<img src="data:image\/svg\+xml;base64,([^"]+)"/
  );

  if (cardioSvgBase64) {
    try {
      const cardioSvg = Buffer.from(cardioSvgBase64, 'base64').toString('utf8');
      const xLabels = [...cardioSvg.matchAll(
        /<use xlink:href="#mef29fc53ac" x="([^"]+)" y="357\.9975"[\s\S]*?<!-- (\d{2}\/\d{2}) -->/g
      )].map((match) => ({
        x: Number(match[1]),
        label: match[2],
      }));
      const yTicks = [...cardioSvg.matchAll(
        /<use xlink:href="#mf5d98c3797" x="45\.716875" y="([^"]+)"[\s\S]*?<!-- ([\d.]+) -->/g
      )].map((match) => ({
        y: Number(match[1]),
        value: Number(match[2]),
      }));
      const distancePointsPath = extractOptionalMatch(
        cardioSvg,
        /<g id="line2d_31">\s*<path d="([^"]+)"/
      );

      if (xLabels.length > 0 && yTicks.length >= 2 && distancePointsPath) {
        const [yTickA, yTickB] = yTicks;
        const milesPerSvgUnit = (yTickB.value - yTickA.value) / (yTickB.y - yTickA.y);
        const svgYToMiles = (svgY) => Math.max(0, Number(((svgY - yTickA.y) * milesPerSvgUnit + yTickA.value).toFixed(1)));
        const pointMatches = [...distancePointsPath.matchAll(/L?\s*([\d.]+)\s+([\d.]+)/g)]
          .map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));

        for (const labelEntry of xLabels) {
          const point = pointMatches.find((candidate) => Math.abs(candidate.x - labelEntry.x) < 0.001);
          if (!point) continue;

          const [month, day] = labelEntry.label.split('/').map(Number);
          const year = hubDateYearFromReport(reportHtml);
          const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          cardioDistanceByDate.set(dateKey, svgYToMiles(point.y));
        }
      }
    } catch {
      // Ignore embedded chart parsing failures and fall back to other available sources.
    }
  }

  return {
    currentRecovery: currentRecoveryText ? numberFromText(currentRecoveryText) : null,
    lastSleepScore: lastSleepScoreText ? numberFromText(lastSleepScoreText) : null,
    cardioDistanceByDate,
  };
}

function hubDateYearFromReport(reportHtml) {
  const reportDate = extractOptionalMatch(
    reportHtml,
    /<title>Morning Report - ([A-Za-z]+ \d{1,2}, \d{4})<\/title>/
  );
  const date = reportDate ? new Date(reportDate) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
}

function parseStrengthSummary(strengthHtml) {
  return {
    lifetimeVolume: numberFromText(
      extractRequiredMatch(
        strengthHtml,
        /Lifetime Volume<\/div><div class="value">([^<]+)/,
        'strength lifetime volume'
      )
    ),
    totalSessions: numberFromText(
      extractRequiredMatch(
        strengthHtml,
        /Total Workouts<\/div><div class="value">([^<]+)/,
        'strength total sessions'
      )
    ),
  };
}

async function main() {
  const [garminData, processedGarminData, speedianceData, whoopSource, hubHtml, strengthHtml] = await Promise.all([
    readJson('garmin_all_activities.json'),
    readJson('garmin_processed_activities.json'),
    readJson('speediance_dashboard_data.json'),
    readFreshestWhoopData(),
    fetchHtml(),
    fetchHtml('strength/index.html'),
  ]);
  const { data: whoopData, filePath: whoopDataPath } = whoopSource;

  // Build a set of date keys present in the processed Garmin data for quick lookup.
  const processedDateSet = new Set();
  // processedGarminData is an array of entries, each with a date and a runs array.
  for (const entry of processedGarminData || []) {
    const entryDate = entry.date; // fallback date if run lacks its own timestamp
    if (Array.isArray(entry.runs)) {
      for (const run of entry.runs) {
        const key = dateKeyFromValue(run.start_time_local || entryDate);
        if (key) processedDateSet.add(key);
      }
    }
  }

  const hubStats = parseHubStats(hubHtml);
  const strengthSummary = parseStrengthSummary(strengthHtml);
  const morningReportHtml = hubStats.morningReportPath
    ? await fetchHtml(hubStats.morningReportPath.replace(/^\.\//, ''))
    : null;
  const morningReportStats = morningReportHtml
    ? parseMorningReportStats(morningReportHtml)
    : { currentRecovery: null, lastSleepScore: null };

  const runByDate = new Map();
  const liftByDate = new Map();
  const bjjByDate = new Map();
  const whoopLiftDates = new Set();
  const lastActivityCandidates = [];

  // First, process raw Garmin data, but skip any dates that are covered by processed data (to avoid duplication and prefer processed values).
  for (const activity of garminData.activities || []) {
    if (!['running', 'treadmill_running'].includes(activity.activityType)) {
      continue;
    }

    const key = dateKeyFromValue(activity.startTimeLocal || activity.date);
    if (!key) continue;

    if (processedDateSet.has(key)) {
      // Processed data will provide the authoritative entry for this date.
      continue;
    }

    const current = runByDate.get(key) ?? { count: 0, miles: 0 };
    current.count += 1;
    current.miles += Number(activity.distance_miles || activity.distance || 0);
    runByDate.set(key, current);

    const candidate = createLastActivityCandidate(
      'Running',
      activity.startTimeLocal || activity.startTimeGMT || activity.date
    );
    if (candidate) {
      lastActivityCandidates.push(candidate);
    }
  }

  // Then incorporate processed Garmin runs, which are assumed to be the most up‑to‑date.
  for (const entry of processedGarminData || []) {
    const entryDate = entry.date;
    if (!Array.isArray(entry.runs)) continue;
    for (const run of entry.runs) {
      // Expect run objects to have at least distance_miles and start_time_local.
      const key = dateKeyFromValue(run.start_time_local || entryDate);
      if (!key) continue;

      const current = runByDate.get(key) ?? { count: 0, miles: 0 };
      // Processed data may include explicit count; default to 1 per run.
      current.count = (run.count ?? 1);
      current.miles = Number(run.distance_miles || run.distance || 0);
      runByDate.set(key, current);

      const candidate = createLastActivityCandidate(
        'Running',
        run.start_time_local || entryDate
      );
      if (candidate) {
        lastActivityCandidates.push(candidate);
      }
    }
  }

  for (const entry of hubStats.recentActivity) {
    if (!entry.runs) continue;
    runByDate.set(entry.date, {
      count: entry.runs.count,
      miles: entry.runs.miles,
    });
  }

  for (const workout of whoopData.workouts?.records || []) {
    const key = dateKeyFromValue(workout.start);
    if (!key) continue;

    if (workout.sport_name === 'running' && !runByDate.has(key)) {
      runByDate.set(key, { count: 1, miles: 0 });
    }

    if (workout.sport_name === 'jiu-jitsu') {
      bjjByDate.set(key, (bjjByDate.get(key) ?? 0) + 1);
    }

    if (workout.sport_name === 'weightlifting') {
      whoopLiftDates.add(key);
    }

    const workoutType =
      workout.sport_name === 'running'
        ? 'Running'
        : workout.sport_name === 'weightlifting'
          ? 'Lifting'
          : workout.sport_name === 'jiu-jitsu'
            ? 'BJJ'
            : null;
    const candidate = workoutType
      ? createLastActivityCandidate(workoutType, workout.start)
      : null;
    if (candidate) {
      lastActivityCandidates.push(candidate);
    }
  }

  for (const [date, miles] of morningReportStats.cardioDistanceByDate || []) {
    const current = runByDate.get(date);
    if (current) {
      runByDate.set(date, {
        count: current.count,
        miles: current.miles > 0 ? current.miles : miles,
      });
      continue;
    }

    if (miles > 0) {
      runByDate.set(date, { count: 1, miles });
    }
  }

  const speedianceSessions = Object.values(speedianceData.workoutTypes || {}).flatMap(
    (workoutType) => workoutType.sessions || []
  );

  for (const session of speedianceSessions) {
    const key = dateKeyFromValue(session.date);
    if (!key) continue;

    const current = liftByDate.get(key) ?? { count: 0, volume: 0 };
    current.count += 1;
    current.volume += Number(session.totalCapacity || 0);
    liftByDate.set(key, current);

    const candidate = createLastActivityCandidate(
      'Lifting',
      session.startTime || session.start_time || session.startedAt || session.date
    );
    if (candidate) {
      lastActivityCandidates.push(candidate);
    }
  }

  const latestWhoopRecoveryRecord = [...(whoopData.recovery?.records || [])]
    .sort(
      (a, b) =>
        (timestampFromValue(a?.created_at || a?.date) ?? 0) -
        (timestampFromValue(b?.created_at || b?.date) ?? 0)
    )
    .at(-1);
  const derivedTotalRunSessions = (garminData.activities || []).filter((activity) =>
    ['running', 'treadmill_running'].includes(activity.activityType)
  ).length;
  const derivedTotalRunMiles = [...runByDate.values()].reduce((sum, entry) => sum + entry.miles, 0);
  const derivedCurrentYearLiftingVolume = Math.round(
    speedianceSessions.reduce(
    (sum, session) => sum + Number(session.totalCapacity || 0),
    0
    )
  );
  const totalLiftingVolume =
    hubStats.totalLiftingVolume ?? strengthSummary.lifetimeVolume;
  const totalRunSessions = hubStats.totalRunSessions ?? derivedTotalRunSessions;
  const totalRunMiles = hubStats.totalRunMiles ?? Number(derivedTotalRunMiles.toFixed(1));
  const currentRecovery =
    morningReportStats.currentRecovery ??
    hubStats.currentRecovery ??
    latestWhoopRecoveryRecord?.score?.recovery_score ??
    latestWhoopRecoveryRecord?.recovery_score ??
    null;
  const lastSleepScore = morningReportStats.lastSleepScore ?? hubStats.lastSleepScore ?? null;

  const consistencyLiftByDate = new Map(liftByDate);
  for (const key of whoopLiftDates) {
    if (!consistencyLiftByDate.has(key)) {
      consistencyLiftByDate.set(key, { count: 1, volume: 0 });
    }
  }

  const focusWindowStart = addDays(hubStats.todayKey, -6);
  const focusWindow = rangeTotals(
    { runByDate, liftByDate, bjjByDate },
    focusWindowStart,
    hubStats.todayKey
  );

  const maxFocusCount = Math.max(focusWindow.runs, focusWindow.lifting, focusWindow.bjj);
  let focus = 'running';
  if (maxFocusCount > 0) {
    if (focusWindow.lifting === maxFocusCount) {
      focus = 'lifting';
    } else if (focusWindow.bjj === maxFocusCount) {
      focus = 'bjj';
    }
  }

  const activityCounts = collectActivityDates({
    runByDate,
    liftByDate: consistencyLiftByDate,
    bjjByDate,
  });
  const sortedActivityDates = [...activityCounts.keys()].sort();
  const streaks = calculateStreaks(sortedActivityDates, hubStats.todayKey);

  const heatmapStart = addDays(hubStats.todayKey, -(52 * 7 - 1));
  const heatmapDays = [...activityCounts.entries()]
    .filter(([date]) => date >= heatmapStart && date <= hubStats.todayKey)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, activity]) => ({
      date,
      count: activity.count,
      runs: activity.runs,
      lifting: activity.lifting,
      bjj: activity.bjj,
    }));

  const ytdPrefix = `${hubStats.todayKey.slice(0, 4)}-`;
  const ytdRunCount = [...runByDate.entries()]
    .filter(([date]) => date.startsWith(ytdPrefix))
    .reduce((sum, [, entry]) => sum + entry.count, 0);
  const ytdRunMiles = [...runByDate.entries()]
    .filter(([date]) => date.startsWith(ytdPrefix))
    .reduce((sum, [, entry]) => sum + entry.miles, 0);
  const ytdLiftCount = [...liftByDate.entries()]
    .filter(([date]) => date.startsWith(ytdPrefix))
    .reduce((sum, [, entry]) => sum + entry.count, 0);
  const ytdBjjCount = [...bjjByDate.entries()]
    .filter(([date]) => date.startsWith(ytdPrefix))
    .reduce((sum, [, count]) => sum + count, 0);
  const allTimeBjjCount = [...bjjByDate.values()].reduce((sum, count) => sum + count, 0);
  const ytdWorkoutCount = ytdRunCount + ytdLiftCount + ytdBjjCount;

  const lastActivity =
    lastActivityCandidates.sort((a, b) => a.timestamp - b.timestamp).at(-1) ??
    [
      ...[...runByDate.keys()].map((date) => ({ date, type: 'Running' })),
      ...[...liftByDate.keys()].map((date) => ({ date, type: 'Lifting' })),
      ...[...bjjByDate.keys()].map((date) => ({ date, type: 'BJJ' })),
    ]
      .sort((a, b) => a.date.localeCompare(b.date))
      .at(-1) ??
    null;

  const calendarThisWeekStart = mondayForDateKey(hubStats.todayKey);
  const calendarThisWeekEnd = addDays(calendarThisWeekStart, 6);
  const calendarWeeklyThisWeek = rangeTotals(
    { runByDate, liftByDate, bjjByDate },
    calendarThisWeekStart,
    calendarThisWeekEnd
  );

  const weeklyAnchorDate =
    lastActivity &&
    calendarWeeklyThisWeek.workouts === 0 &&
    lastActivity.date < calendarThisWeekStart
      ? lastActivity.date
      : hubStats.todayKey;
  const weeklyMode =
    weeklyAnchorDate === hubStats.todayKey ? 'calendar_week' : 'latest_activity_week';

  const thisWeekStart = mondayForDateKey(weeklyAnchorDate);
  const thisWeekEnd = addDays(thisWeekStart, 6);
  const lastWeekStart = addDays(thisWeekStart, -7);
  const lastWeekEnd = addDays(thisWeekStart, -1);

  const weeklyThisWeek = rangeTotals(
    { runByDate, liftByDate, bjjByDate },
    thisWeekStart,
    thisWeekEnd
  );
  const weeklyLastWeek = rangeTotals(
    { runByDate, liftByDate, bjjByDate },
    lastWeekStart,
    lastWeekEnd
  );

  const thisMonthPrefix = hubStats.todayKey.slice(0, 7);
  const thisMonthMiles = [...runByDate.entries()]
    .filter(([date]) => date.startsWith(thisMonthPrefix))
    .reduce((sum, [, entry]) => sum + entry.miles, 0);

  const lifetimeWorkouts =
    strengthSummary.totalSessions + totalRunSessions + ytdLiftCount + allTimeBjjCount;

  const output = {
    generatedAt: new Date().toISOString(),
    source: {
      hubBaseUrl: FITNESS_HUB_BASE,
      hubTodayLabel: hubStats.todayLabel,
      hubTodayKey: hubStats.todayKey,
      strengthDashboard: `${FITNESS_HUB_BASE}/strength/index.html`,
      whoopDataPath,
      whoopLastSynced: whoopData?.last_synced ?? null,
    },
    lifetimeStats: {
      totalLbsLifted: totalLiftingVolume,
      totalMilesRun: totalRunMiles,
      totalWorkouts: lifetimeWorkouts,
      sourceBreakdown: {
        strengthSessions: strengthSummary.totalSessions,
        garminRuns: totalRunSessions,
        currentYearLiftingSessions: ytdLiftCount,
        allTimeBjjSessions: allTimeBjjCount,
      },
    },
    trainingFocus: {
      focus,
      runCount: focusWindow.runs,
      workoutCount: focusWindow.lifting,
      bjjCount: focusWindow.bjj,
      windowStart: focusWindowStart,
      windowEnd: hubStats.todayKey,
    },
    weeklyProgress: {
      mode: weeklyMode,
      anchorDate: weeklyAnchorDate,
      dateRange: {
        thisWeekStart,
        thisWeekEnd,
        lastWeekStart,
        lastWeekEnd,
      },
      workouts: {
        thisWeek: weeklyThisWeek.workouts,
        lastWeek: weeklyLastWeek.workouts,
      },
      runs: {
        thisWeek: weeklyThisWeek.runs,
        lastWeek: weeklyLastWeek.runs,
      },
      volume: {
        thisWeek: weeklyThisWeek.volume,
        lastWeek: weeklyLastWeek.volume,
      },
      miles: {
        thisWeek: weeklyThisWeek.miles,
        lastWeek: weeklyLastWeek.miles,
      },
      bjj: {
        thisWeek: weeklyThisWeek.bjj,
        lastWeek: weeklyLastWeek.bjj,
      },
    },
    yearlyGoals: {
      running: {
        icon: '🏃',
        current: Number(ytdRunMiles.toFixed(1)),
        target: 365,
        unit: 'miles',
      },
      lifting: {
        icon: '🏋️',
        current: derivedCurrentYearLiftingVolume,
        target: 500000,
        unit: 'lbs',
      },
      workouts: {
        icon: '💪',
        current: ytdWorkoutCount,
        target: 200,
        unit: 'workouts',
      },
      bjj: {
        icon: '🥋',
        current: ytdBjjCount,
        target: 100,
        unit: 'sessions',
        comingSoon: false,
      },
    },
    consistency: {
      totalActive: sortedActivityDates.length,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      rangeStart: heatmapStart,
      rangeEnd: hubStats.todayKey,
      days: heatmapDays,
    },
    trainingStats: {
      trainingStreak: streaks.current,
      lastWorkoutData: lastActivity
        ? {
            date: lastActivity.date,
            type: lastActivity.type,
          }
        : null,
      thisWeekVolume: weeklyThisWeek.volume,
      thisMonthMiles: Number(thisMonthMiles.toFixed(1)),
    },
    recovery: {
      currentScore: currentRecovery,
      lastSleepScore,
    },
    labels: {
      thisWeek: `${formatDateLabel(thisWeekStart)} - ${formatDateLabel(thisWeekEnd)}`,
      lastWeek: `${formatDateLabel(lastWeekStart)} - ${formatDateLabel(lastWeekEnd)}`,
    },
  };

  await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(
    `Updated homepage fitness data for ${hubStats.todayKey}: ` +
      `${totalLiftingVolume.toLocaleString()} lbs lifetime, ` +
      `${Number(ytdRunMiles.toFixed(1))} mi YTD, ` +
      `${ytdWorkoutCount} workouts YTD`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
