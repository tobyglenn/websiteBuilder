import { goals2026 } from '../data/2026Goals.js';

const translations = {
  en: {
    sectionKicker: '2026 Goals',
    heading: "This Year's Progress",
    subtext: 'Tracking my journey through 2026 one rep at a time.',
    running: 'Running',
    lifting: 'Lifting',
    workouts: 'Workouts',
    bjj: 'BJJ',
    comingSoon: 'Coming Soon',
  },
  es: {
    sectionKicker: 'Metas 2026',
    heading: 'Progreso de este año',
    subtext: 'Rastreando mi progreso durante 2026 una repetición a la vez.',
    running: 'Correr',
    lifting: 'Levantamiento',
    workouts: 'Entrenamientos',
    bjj: 'BJJ',
    comingSoon: 'Próximamente',
  },
  de: {
    sectionKicker: '2026 Ziele',
    heading: 'Fortschritt dieses Jahres',
    subtext: 'Ich verfolge meinen Weg durch 2026, einen Satz nach dem anderen.',
    running: 'Laufen',
    lifting: 'Krafttraining',
    workouts: 'Workouts',
    bjj: 'BJJ',
    comingSoon: 'Demnächst',
  },
  pt: {
    sectionKicker: 'Metas de 2026',
    heading: 'Progresso deste ano',
    subtext: 'Acompanhando minha jornada em 2026, uma repetição de cada vez.',
    running: 'Corrida',
    lifting: 'Levantamento',
    workouts: 'Treinos',
    bjj: 'BJJ',
    comingSoon: 'Em breve',
  },
  hi: {
    sectionKicker: '2026 लक्ष्य',
    heading: 'इस वर्ष की प्रगति',
    subtext: 'एक-एक रिप के साथ 2026 की मेरी यात्रा को ट्रैक करना।',
    running: 'दौड़',
    lifting: 'लिफ्टिंग',
    workouts: 'वर्कआउट',
    bjj: 'BJJ',
    comingSoon: 'जल्द आ रहा है',
  },
};

function GoalCard({ goal, title, comingSoonText }) {
  const percentage = Math.round((goal.current / goal.target) * 100);
  const progressWidth = Math.min(percentage, 100);

  return (
    <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{goal.icon}</span>
          <span className="text-lg font-semibold text-white">{title}</span>
        </div>
      </div>

      {goal.comingSoon ? (
        <div className="text-center py-4">
          <span className="text-neutral-500 text-sm">{comingSoonText}</span>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold text-white">{goal.current.toLocaleString()}</span>
            <span className="text-neutral-500">/ {goal.target.toLocaleString()} {goal.unit}</span>
          </div>

          <div className="w-full bg-neutral-800 rounded-full h-3 mb-2">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressWidth}%` }}
            />
          </div>

          <div className="text-right">
            <span className="text-blue-400 font-semibold">{percentage}%</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function YearlyGoals({ lang = 'en' }) {
  const t = translations[lang] || translations.en;
  const headingId = 'yearly-progress-heading';

  return (
    <section
      id="yearly-progress"
      aria-labelledby={headingId}
      data-section-title={t.heading}
      className="py-16 bg-neutral-900 border-y border-neutral-800"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-2 block">{t.sectionKicker}</span>
          <h2 id={headingId} className="text-3xl md:text-4xl font-bold text-white">{t.heading}</h2>
          <p className="text-neutral-500 mt-3 max-w-xl mx-auto">{t.subtext}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
          <GoalCard goal={goals2026.running} title={t.running} comingSoonText={t.comingSoon} />
          <GoalCard goal={goals2026.lifting} title={t.lifting} comingSoonText={t.comingSoon} />
          <GoalCard goal={goals2026.workouts} title={t.workouts} comingSoonText={t.comingSoon} />
          <GoalCard goal={goals2026.bjj} title={t.bjj} comingSoonText={t.comingSoon} />
        </div>
      </div>
    </section>
  );
}
