import speedianceData from './speediance_dashboard_data.json';
import garminData from './garmin_all_activities.json';

const speedianceSessions =
  speedianceData.workoutTypes && Object.keys(speedianceData.workoutTypes).length > 0
    ? Object.values(speedianceData.workoutTypes).flatMap((workoutType) =>
        Array.isArray(workoutType?.sessions) ? workoutType.sessions : []
      )
    : speedianceData.allSessions || [];

const garminActivities = garminData.activities || [];

export const lifetimeStats = {
  totalLbsLifted: Math.round(
    speedianceSessions.reduce((sum, session) => sum + (Number(session.totalCapacity) || 0), 0)
  ),
  totalMilesRun: Number(
    garminActivities
      .reduce((sum, activity) => sum + (Number(activity.distance_miles) || 0), 0)
      .toFixed(1)
  ),
  totalWorkouts: speedianceSessions.length + garminActivities.length,
};

export default lifetimeStats;
