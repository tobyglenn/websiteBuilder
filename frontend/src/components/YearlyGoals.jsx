import { goals2026 } from '../data/2026Goals.js';

function GoalCard({ goal, title }) {
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
          <span className="text-neutral-500 text-sm">Coming Soon</span>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold text-white">
              {goal.current.toLocaleString()}
            </span>
            <span className="text-neutral-500">
              / {goal.target.toLocaleString()} {goal.unit}
            </span>
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

export default function YearlyGoals() {
  return (
    <section className="py-16 bg-neutral-900 border-y border-neutral-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-2 block">2026 Goals</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">This Year's Progress</h2>
          <p className="text-neutral-500 mt-3 max-w-xl mx-auto">Tracking my journey through 2026 one rep at a time.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
          <GoalCard goal={goals2026.running} title="Running" />
          <GoalCard goal={goals2026.lifting} title="Lifting" />
          <GoalCard goal={goals2026.workouts} title="Workouts" />
          <GoalCard goal={goals2026.bjj} title="BJJ" />
        </div>
      </div>
    </section>
  );
}
