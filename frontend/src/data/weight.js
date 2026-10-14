import milestoneWeightData from './weightMilestones.json';
import { summarizeWeights } from '../lib/fitnessMetrics.mjs';
import bodyCompositionData from './bodyCompositionData.json';

// Weight journey data - Toby: 242→188 transformation, then a generated rebuild phase.


const generatedWeightData = (bodyCompositionData.weights || [])
  .filter(entry => entry?.date && Number(entry.weight) > 0)
  .map(entry => ({
    date: entry.date,
    weight: Number(entry.weight),
    note: `${entry.source || 'Body composition'} measurement`,
  }));

export const weightData = Array.from(
  [...milestoneWeightData, ...generatedWeightData]
    .reduce((byDate, entry) => byDate.set(entry.date, entry), new Map())
    .values()
).sort((a, b) => a.date.localeCompare(b.date));

export const latestBodyComposition = bodyCompositionData.latest || weightData[weightData.length - 1];

export function formatWeight(weight) {
  const value = Number(weight);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function getStats() {
  return summarizeWeights(weightData);
}
