import React, { useState } from 'react';

const activityLevels = [
  { value: '1.2', label: 'Sedentary (little or no exercise)' },
  { value: '1.375', label: 'Lightly Active (1-3 days/week)' },
  { value: '1.55', label: 'Moderately Active (3-5 days/week)' },
  { value: '1.725', label: 'Very Active (6-7 days/week)' },
  { value: '1.9', label: 'Extra Active (physical job + exercise)' },
];

const goals = [
  { value: '-500', label: 'Cut (Lose Fat)', calories: -500 },
  { value: '-250', label: 'Slow Cut (Slow Fat Loss)', calories: -250 },
  { value: '0', label: 'Maintain', calories: 0 },
  { value: '250', label: 'Lean Bulk (Slow Muscle Gain)', calories: 250 },
  { value: '500', label: 'Bulk (Muscle Gain)', calories: 500 },
];

export default function TDEECalculator() {
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('35');
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('10');
  const [weight, setWeight] = useState('175');
  const [activityLevel, setActivityLevel] = useState('1.55');
  const [goal, setGoal] = useState('0');
  const [results, setResults] = useState(null);

  const calculate = () => {
    const heightCm = ((parseInt(heightFt) * 12) + parseInt(heightIn)) * 2.54;
    const weightKg = parseFloat(weight) * 0.453592;
    const ageNum = parseInt(age);

    // Mifflin-St Jeor Formula
    let bmr;
    if (gender === 'male') {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) + 5;
    } else {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) - 161;
    }

    const tdee = bmr * parseFloat(activityLevel);
    const goalAdjustment = parseInt(goal);
    const targetCalories = Math.round(tdee + goalAdjustment);

    // Macro calculations (40/30/30 split for fat loss/maintenance, adjusted for bulking)
    let proteinRatio, carbRatio, fatRatio;
    if (goalAdjustment <= 0) {
      proteinRatio = 0.35;
      carbRatio = 0.30;
      fatRatio = 0.35;
    } else {
      proteinRatio = 0.30;
      carbRatio = 0.40;
      fatRatio = 0.30;
    }

    const protein = Math.round((targetCalories * proteinRatio) / 4);
    const carbs = Math.round((targetCalories * carbRatio) / 4);
    const fat = Math.round((targetCalories * fatRatio) / 9);

    const maxCalories = 2500;
    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories,
      macros: { protein, carbs, fat },
      maxCalories,
    });
  };

  const getBarWidth = (value, max) => Math.min((value / max) * 100, 100);

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 md:p-8">
      <form onSubmit={(e) => { e.preventDefault(); calculate(); }} className="space-y-6">
        {/* Gender Toggle */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Gender</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                gender === 'male'
                  ? 'bg-blue-500 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                gender === 'female'
                  ? 'bg-blue-500 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              Female
            </button>
          </div>
        </div>

        {/* Age */}
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-neutral-300 mb-2">Age</label>
          <input
            type="number"
            id="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="15"
            max="100"
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Height</label>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="heightFt" className="block text-xs text-neutral-400 mb-1">Feet</label>
              <input
                type="number"
                id="heightFt"
                value={heightFt}
                onChange={(e) => setHeightFt(e.target.value)}
                min="3"
                max="8"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="heightIn" className="block text-xs text-neutral-400 mb-1">Inches</label>
              <input
                type="number"
                id="heightIn"
                value={heightIn}
                onChange={(e) => setHeightIn(e.target.value)}
                min="0"
                max="11"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-neutral-300 mb-2">Weight (lbs)</label>
          <input
            type="number"
            id="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            min="50"
            max="500"
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Activity Level */}
        <div>
          <label htmlFor="activityLevel" className="block text-sm font-medium text-neutral-300 mb-2">Activity Level</label>
          <select
            id="activityLevel"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {activityLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Goal */}
        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-neutral-300 mb-2">Goal</label>
          <select
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {goals.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Calculate Button */}
        <button
          type="submit"
          className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
        >
          Calculate My Macros
        </button>
      </form>

      {/* Results */}
      {results && (
        <div className="mt-8 pt-8 border-t border-neutral-800">
          <h3 className="text-xl font-bold text-white mb-6 text-center">Your Results</h3>
          
          {/* Calories */}
          <div className="text-center mb-8">
            <p className="text-neutral-400 text-sm mb-1">Daily Target</p>
            <p className="text-5xl font-bold text-blue-400">{results.targetCalories}</p>
            <p className="text-neutral-500 text-sm mt-2">
              BMR: {results.bmr} | TDEE: {results.tdee}
            </p>
          </div>

          {/* Macro Bars */}
          <div className="space-y-4">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-300">Protein</span>
                <span className="text-white font-medium">{results.macros.protein}g</span>
              </div>
              <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${getBarWidth(results.macros.protein, 200)}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-300">Carbs</span>
                <span className="text-white font-medium">{results.macros.carbs}g</span>
              </div>
              <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${getBarWidth(results.macros.carbs, 300)}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-300">Fat</span>
                <span className="text-white font-medium">{results.macros.fat}g</span>
              </div>
              <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${getBarWidth(results.macros.fat, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-neutral-500 text-xs mt-6 text-center">
            Based on Mifflin-St Jeor equation. Consult a professional for personalized advice.
          </p>
        </div>
      )}
    </div>
  );
}
