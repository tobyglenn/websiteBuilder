import React from 'react';
import { Activity, Dumbbell, Trophy } from 'lucide-react';
import homepageFitnessData from '../data/homepageFitnessData.json';

const translations = {
  en: {
    sectionHeading: "This Week's Focus",
    subheading: 'Based on past 7 days activity',
    runs: 'runs',
    workouts: 'workouts',
    bjjSessions: 'BJJ sessions',
    focusOrder: ['Running', 'Lifting', 'BJJ'],
    focusValues: {
      running: 'Running',
      lifting: 'Lifting',
      bjj: 'BJJ',
    },
  },
  es: {
    sectionHeading: 'Enfoque de esta semana',
    subheading: 'Basado en la actividad de los últimos 7 días',
    runs: 'carreras',
    workouts: 'entrenamientos',
    bjjSessions: 'sesiones de BJJ',
    focusOrder: ['Correr', 'Levantamiento', 'BJJ'],
    focusValues: {
      running: 'Correr',
      lifting: 'Levantamiento',
      bjj: 'BJJ',
    },
  },
  de: {
    sectionHeading: 'Fokus dieser Woche',
    subheading: 'Basierend auf Aktivität der letzten 7 Tage',
    runs: 'Läufe',
    workouts: 'Workouts',
    bjjSessions: 'BJJ-Sessions',
    focusOrder: ['Laufen', 'Krafttraining', 'BJJ'],
    focusValues: {
      running: 'Laufen',
      lifting: 'Krafttraining',
      bjj: 'BJJ',
    },
  },
  pt: {
    sectionHeading: 'Foco da semana',
    subheading: 'Com base na atividade dos últimos 7 dias',
    runs: 'corridas',
    workouts: 'treinos',
    bjjSessions: 'treinos de BJJ',
    focusOrder: ['Corrida', 'Levantamento', 'BJJ'],
    focusValues: {
      running: 'Corrida',
      lifting: 'Levantamento',
      bjj: 'BJJ',
    },
  },
  hi: {
    sectionHeading: 'इस सप्ताह का फोकस',
    subheading: 'पिछले 7 दिनों की गतिविधि के आधार पर',
    runs: 'रन',
    workouts: 'वर्कआउट',
    bjjSessions: 'BJJ सेशन',
    focusOrder: ['दौड़ना', 'लिफ्टिंग', 'BJJ'],
    focusValues: {
      running: 'दौड़ना',
      lifting: 'लिफ्टिंग',
      bjj: 'BJJ',
    },
  },
};

const fallbackFocusData = {
  focus: 'running',
  runCount: 0,
  workoutCount: 0,
  bjjCount: 0,
};

const TrainingFocus = ({ lang = 'en' }) => {
  const t = translations[lang] || translations.en;
  const focusData = homepageFitnessData.trainingFocus || fallbackFocusData;

  const getFocusIcon = () => {
    switch (focusData.focus) {
      case 'running':
        return <Activity className="w-8 h-8 text-blue-400" />;
      case 'lifting':
        return <Dumbbell className="w-8 h-8 text-blue-400" />;
      case 'bjj':
        return <Trophy className="w-8 h-8 text-blue-400" />;
      default:
        return <Activity className="w-8 h-8 text-blue-400" />;
    }
  };

  return (
    <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-blue-500 font-bold uppercase tracking-widest text-sm">
            {t.sectionHeading}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-500/20 rounded-xl">{getFocusIcon()}</div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {t.focusValues[focusData.focus]}
            </h2>
            <p className="text-neutral-400 text-sm">{t.subheading}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6 text-neutral-300">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏃</span>
            <span className="font-semibold">{focusData.runCount}</span>
            <span className="text-neutral-500">{t.runs}</span>
          </div>
          <span className="text-neutral-600">•</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏋️</span>
            <span className="font-semibold">{focusData.workoutCount}</span>
            <span className="text-neutral-500">{t.workouts}</span>
          </div>
          <span className="text-neutral-600">•</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥋</span>
            <span className="font-semibold">{focusData.bjjCount}</span>
            <span className="text-neutral-500">{t.bjjSessions}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-blue-400 font-medium">
          <span>{t.focusOrder[0]}</span>
          <span className="text-neutral-600">&gt;</span>
          <span className="flex items-center gap-1">
            <Dumbbell size={16} /> {t.focusOrder[1]}
          </span>
          <span className="text-neutral-600">&gt;</span>
          <span className="flex items-center gap-1">
            <Trophy size={16} /> {t.focusOrder[2]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrainingFocus;
