import { useState, useEffect } from 'react';

const translations = {
  en: {
    title: 'Latest Activity',
    defaultWorkout: 'Workout',
    sourceGarmin: 'Garmin',
    sourceSpeediance: 'Speediance',
    defaultError: 'No recent activity data available',
    viewLabel: 'View',
    loadingLine1: 'Latest Activity',
    dateAt: 'at',
    atLabel: 'at',
  },
  es: {
    title: 'Actividad reciente',
    defaultWorkout: 'Entrenamiento',
    sourceGarmin: 'Garmin',
    sourceSpeediance: 'Speediance',
    defaultError: 'No hay datos de actividad recientes',
    viewLabel: 'Ver',
    loadingLine1: 'Actividad reciente',
    dateAt: 'a',
    atLabel: 'a las',
  },
  de: {
    title: 'Aktuelle Aktivität',
    defaultWorkout: 'Training',
    sourceGarmin: 'Garmin',
    sourceSpeediance: 'Speediance',
    defaultError: 'Keine aktuellen Aktivitätsdaten verfügbar',
    viewLabel: 'Ansehen',
    loadingLine1: 'Aktuelle Aktivität',
    dateAt: 'um',
    atLabel: 'um',
  },
  pt: {
    title: 'Atividade recente',
    defaultWorkout: 'Treino',
    sourceGarmin: 'Garmin',
    sourceSpeediance: 'Speediance',
    defaultError: 'Nenhum dado de atividade recente disponível',
    viewLabel: 'Ver',
    loadingLine1: 'Atividade recente',
    dateAt: 'às',
    atLabel: 'às',
  },
  hi: {
    title: 'हालिया गतिविधि',
    defaultWorkout: 'वर्कआउट',
    sourceGarmin: 'Garmin',
    sourceSpeediance: 'Speediance',
    defaultError: 'हाल की कोई गतिविधि डेटा उपलब्ध नहीं',
    viewLabel: 'देखें',
    loadingLine1: 'हालिया गतिविधि',
    dateAt: 'को',
    atLabel: 'को',
  },
};

const localeMap = {
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  pt: 'pt-BR',
  hi: 'hi-IN',
};

// Activity type icons
const activityIcons = {
  running: '🏃',
  treadmill_running: '🏃',
  cycling: '🚴',
  open_water_swimming: '🏊',
  default: '💪',
};

// Format duration from seconds to readable format
function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

// Format pace (min/mile)
function formatPace(distanceMiles, durationSeconds) {
  if (!distanceMiles || distanceMiles === 0) return null;
  const paceMinPerMile = (durationSeconds / 60) / distanceMiles;
  const mins = Math.floor(paceMinPerMile);
  const secs = Math.round((paceMinPerMile - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}/mi`;
}

// Format date
function formatDate(dateStr, timeStr, locale, atLabel) {
  const date = new Date(dateStr);
  const formattedDate = date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (timeStr) {
    // Extract time from "2026-02-19 12:40:54" format
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const [_, hours, minutes] = timeMatch;
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${formattedDate} ${atLabel} ${displayHour}:${minutes} ${ampm}`;
    }
  }
  return formattedDate;
}

export default function LatestActivity({ lang = 'en' }) {
  const t = translations[lang] || translations.en;
  const locale = localeMap[lang] || localeMap.en;

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch both data sources in parallel
        const [garminRes, speedianceRes] = await Promise.all([
          fetch('/data/garmin_all_activities.json').catch(() => null),
          fetch('/data/speediance_dashboard_data.json').catch(() => null),
        ]);

        let garminData = null;
        let speedianceData = null;

        if (garminRes?.ok) {
          garminData = await garminRes.json();
        }
        if (speedianceRes?.ok) {
          speedianceData = await speedianceRes.json();
        }

        // Find most recent Garmin activity
        let mostRecentGarmin = null;
        if (garminData?.activities && garminData.activities.length > 0) {
          const sortedGarmin = [...garminData.activities].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );
          mostRecentGarmin = sortedGarmin[0];
        }

        // Find most recent Speediance workout
        let mostRecentSpeediance = null;
        if (speedianceData?.allSessions && speedianceData.allSessions.length > 0) {
          const sortedSpeediance = [...speedianceData.allSessions].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );
          mostRecentSpeediance = sortedSpeediance[0];
        }

        // Compare and pick the most recent
        let latest = null;
        if (mostRecentGarmin && mostRecentSpeediance) {
          const garminDate = new Date(mostRecentGarmin.date);
          const speedianceDate = new Date(mostRecentSpeediance.date);
          latest =
            garminDate >= speedianceDate ? mostRecentGarmin : mostRecentSpeediance;
        } else if (mostRecentGarmin) {
          latest = mostRecentGarmin;
        } else if (mostRecentSpeediance) {
          latest = mostRecentSpeediance;
        }

        // Determine source and format accordingly
        if (latest) {
          const isGarmin =
            mostRecentGarmin &&
            (latest.activityName || latest.activityId) &&
            !latest.title;

          const isSpeediance =
            mostRecentSpeediance &&
            latest.title;

          if (isGarmin || (!isSpeediance && latest.activityName)) {
            // Garmin format
            const isRunning =
              latest.activityType === 'running' ||
              latest.activityType === 'treadmill_running';

            setActivity({
              source: t.sourceGarmin,
              type: isRunning ? 'run' : 'workout',
              icon: activityIcons[latest.activityType] || activityIcons.default,
              name: latest.activityName || t.defaultWorkout,
              date: latest.date,
              time: latest.startTimeLocal,
              stats: isRunning
                ? {
                    distance: `${latest.distance_miles?.toFixed(2) || '0'} mi`,
                    pace: formatPace(latest.distance_miles, latest.duration),
                    duration: formatDuration(latest.duration),
                  }
                : {
                    duration: formatDuration(latest.duration),
                    calories: latest.calories
                      ? `${Math.round(latest.calories)} cal`
                      : null,
                  },
              link: '/running',
            });
          } else {
            // Speediance format
            setActivity({
              source: t.sourceSpeediance,
              type: 'workout',
              icon: '🏋️',
              name: latest.title || t.defaultWorkout,
              date: latest.date,
              stats: {
                volume: latest.totalCapacity
                  ? `${Math.round(latest.totalCapacity).toLocaleString()} lbs`
                  : null,
                duration: latest.durationMinute
                  ? `${latest.durationMinute} min`
                  : null,
                calories: latest.calorie ? `${latest.calorie} cal` : null,
              },
              link: '/speediance',
            });
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading activity data:', err);
        setError(t.defaultError);
        setLoading(false);
      }
    }

    fetchData();
  }, [t]);

  if (loading) {
    return (
      <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 animate-pulse">
        <div className="h-4 bg-neutral-800 rounded w-32 mb-4"></div>
        <div className="h-6 bg-neutral-800 rounded w-48 mb-2"></div>
        <div className="h-4 bg-neutral-800 rounded w-24"></div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
        <div className="text-neutral-500 text-sm">{error || t.defaultError}</div>
      </div>
    );
  }

  // Filter out null stats
  const validStats = Object.entries(activity.stats)
    .filter(([_, value]) => value)
    .map(([key, value]) => ({ key, value }));

  return (
    <a
      href={activity.link}
      className="block bg-neutral-900 rounded-xl p-5 border border-neutral-800 hover:border-blue-500/50 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              {t.title}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {activity.source}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl" aria-hidden="true">
              {activity.icon}
            </span>
            <h3 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">
              {activity.name}
            </h3>
          </div>

          <p className="text-neutral-400 text-sm mb-3">
            {formatDate(activity.date, activity.time, locale, t.atLabel)}
          </p>

          {validStats.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {validStats.map(({ key, value }) => (
                <span
                  key={key}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-sm"
                >
                  {value}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm font-medium">{t.viewLabel}</span>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </a>
  );
}
