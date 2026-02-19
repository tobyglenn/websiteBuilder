// Category definitions for video filtering
export const CATEGORIES = [
 { id: 'all', name: 'All Videos', color: 'bg-neutral-800 text-white' },
 { id: 'speediance', name: 'Speediance', color: 'bg-blue-600 text-white' },
 { id: 'bjj', name: 'BJJ & Grappling', color: 'bg-purple-600 text-white' },
 { id: 'transformation', name: 'Transformation', color: 'bg-green-600 text-white' },
 { id: 'tech', name: 'Tech & Wearables', color: 'bg-cyan-600 text-white' },
 { id: 'methodology', name: 'Training Method', color: 'bg-orange-600 text-white' }
];

// Simple keyword-based categorization
export function categorizeVideo(title) {
 if (!title) return ['all'];
 const lower = title.toLowerCase();
 const categories = [];
 
 if (lower.match(/speediance|tonal|home gym|resistance|eccentric|progressive|overload|barbell|lat pulldown|deadlift/)) {
 categories.push('speediance');
 }
 if (lower.match(/bjj|jiu.?jitsu|grappling|black belt|blue belt|guard|submission|wrestle|israetel|jocko|gordon ryan|nicky ryan|doucette/)) {
 categories.push('bjj');
 }
 if (lower.match(/weight loss|transformation|262|188|obese|dropped|nutrition|prescription/)) {
 categories.push('transformation');
 }
 if (lower.match(/whoop|garmin|tracker|wearable|smartwatch|tec|metrics/)) {
 categories.push('tech');
 }
 if (lower.match(/training split|workout strategy|method|ppl|full body|cardio|warmup|sets|reps/)) {
 categories.push('methodology');
 }
 
 return categories.length > 0 ? categories : ['all'];
}

export function getCategoryColor(categoryId) {
 const cat = CATEGORIES.find(c => c.id === categoryId);
 return cat?.color || 'bg-neutral-800 text-white';
}
