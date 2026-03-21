import React, { useState, useEffect } from 'react';
import { Activity, Dumbbell, Trophy } from 'lucide-react';
import speedianceData from '../data/speediance_dashboard_data.json';
import garminData from '../data/garmin_all_activities.json';
import whoopData from '../data/whoop_v2_latest.json';

const TrainingFocus = () => {
  const [focusData, setFocusData] = useState({
    focus: 'Running',
    runCount: 0,
    workoutCount: 0,
    bjjCount: 0,
  });

  useEffect(() => {
    // Use today as the reference date (not the last data date)
    const refDate = new Date();
    
    const sevenDaysAgo = new Date(refDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Count Speediance workouts in past 7 days
    const speedianceSessions = Object.values(speedianceData.workoutTypes).flatMap(
      (workoutType) => workoutType.sessions || []
    );
    const recentWorkouts = speedianceSessions.filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate >= sevenDaysAgo && sessionDate <= refDate;
    });

    // Count Garmin runs in past 7 days
    const recentRuns = garminData.activities.filter((activity) => {
      if (!activity.date) return false;
      const activityDate = new Date(activity.date);
      const isRunning = activity.activityType?.includes('running') || 
                        activity.activityType?.includes('treadmill');
      return activityDate >= sevenDaysAgo && activityDate <= refDate && isRunning;
    });

    // Count BJJ sessions (jiu-jitsu) from WHOOP in past 7 days
    const bjjSessions = (whoopData.workouts?.records || []).filter((record) => {
      if (record.sport_name !== 'jiu-jitsu') return false;
      const endDate = new Date(record.end);
      return endDate >= sevenDaysAgo && endDate <= refDate;
    });

    // Determine focus (most sessions)
    const counts = {
      Running: recentRuns.length,
      Lifting: recentWorkouts.length,
      BJJ: bjjSessions.length,
    };

    // Pick whatever had the most sessions; BJJ beats ties with Running
    let focus = 'Running';
    const maxCount = Math.max(counts.Running, counts.Lifting, counts.BJJ);
    if (maxCount === 0) {
      focus = 'Running'; // Default when no data
    } else if (counts.Lifting === maxCount) {
      focus = 'Lifting';
    } else if (counts.BJJ === maxCount) {
      focus = 'BJJ';
    } else {
      focus = 'Running';
    }

    setFocusData({
      focus,
      runCount: recentRuns.length,
      workoutCount: recentWorkouts.length,
      bjjCount: bjjSessions.length,
    });
  }, []);

  const getFocusIcon = () => {
    switch (focusData.focus) {
      case 'Running':
        return <Activity className="w-8 h-8 text-blue-400" />;
      case 'Lifting':
        return <Dumbbell className="w-8 h-8 text-blue-400" />;
      case 'BJJ':
        return <Trophy className="w-8 h-8 text-blue-400" />;
      default:
        return <Activity className="w-8 h-8 text-blue-400" />;
    }
  };

  return (
    <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800 shadow-2xl overflow-hidden relative">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-blue-500 font-bold uppercase tracking-widest text-sm">
            This Week's Focus
          </span>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            {getFocusIcon()}
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {focusData.focus}
            </h2>
            <p className="text-neutral-400 text-sm">
              Based on past 7 days activity
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6 text-neutral-300">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏃</span>
            <span className="font-semibold">{focusData.runCount}</span>
            <span className="text-neutral-500">runs</span>
          </div>
          <span className="text-neutral-600">•</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏋️</span>
            <span className="font-semibold">{focusData.workoutCount}</span>
            <span className="text-neutral-500">workouts</span>
          </div>
          <span className="text-neutral-600">•</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥋</span>
            <span className="font-semibold">{focusData.bjjCount}</span>
            <span className="text-neutral-500">BJJ sessions</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-blue-400 font-medium">
          <span>Running</span>
          <span className="text-neutral-600">&gt;</span>
          <span className="flex items-center gap-1">
            <Dumbbell size={16} /> Lifting
          </span>
          <span className="text-neutral-600">&gt;</span>
          <span className="flex items-center gap-1">
            <Trophy size={16} /> BJJ
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrainingFocus;
