const AGENTSTACK_BRAND_RE = /openclaw|agentstack|agent stack/;
const SPEEDIANCE_RE = /speediance|tonal|gym monster|smart gym|voltra|aeke/;
const WEARABLES_RE = /whoop|oura|garmin|wearable|recovery|sleep|hrv/;
const BJJ_RE = /bjj|jiu.?jitsu|grappling|black belt/;
const GENERIC_AI_RE = /claude|anthropic|local ai|\bai\b/;

export const classifyContentTopic = (context = '') => {
  const haystack = String(context).toLowerCase();

  if (AGENTSTACK_BRAND_RE.test(haystack)) return 'agentstack';
  if (SPEEDIANCE_RE.test(haystack)) return 'speediance';
  if (WEARABLES_RE.test(haystack)) return 'wearables';
  if (BJJ_RE.test(haystack)) return 'bjj';
  if (GENERIC_AI_RE.test(haystack)) return 'agentstack';
  return 'training';
};
