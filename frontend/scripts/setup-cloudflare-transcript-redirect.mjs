#!/usr/bin/env node

const API_BASE = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = process.env.CLOUDFLARE_ZONE_NAME || 'tobyonfitnesstech.com';
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
const MANAGED_RULE_REFS = new Set([
  'podcast_transcript_query_to_hash',
  'videos_category_query_to_clean_path',
  'blog_category_query_to_hash',
  'podcasts_openclaw_alias_to_agentstack',
  'podcasts_es_openclaw_alias_to_agentstack',
  'podcasts_pt_openclaw_alias_to_agentstack',
  'podcasts_hi_openclaw_alias_to_agentstack',
  'podcasts_de_openclaw_alias_to_agentstack',
  'videos_category_all_query_to_clean_path',
  'videos_category_speediance_query_to_hash',
  'videos_category_bjj_query_to_hash',
  'videos_category_wearables_query_to_hash',
  'videos_category_openclaw_query_to_hash',
  'videos_category_training_query_to_hash',
  'videos_category_shorts_query_to_hash',
]);

const RECLAIMED_RULE_DESCRIPTIONS = new Set([
  'Redirect /gridbound-realms to GitHub Pages',
]);

const podcastPrefixes = [
  '/podcasts/episode-',
  '/podcasts/toft-',
  '/es/podcasts/episode-',
  '/es/podcasts/toft-',
  '/pt/podcasts/episode-',
  '/pt/podcasts/toft-',
  '/hi/podcasts/episode-',
  '/hi/podcasts/toft-',
  '/de/podcasts/episode-',
  '/de/podcasts/toft-',
];

const transcriptExpression = [
  `(http.host eq "${ZONE_NAME}")`,
  `(http.request.uri.query contains "tab=transcript")`,
  `(${podcastPrefixes.map((prefix) => `starts_with(http.request.uri.path, "${prefix}")`).join(' or ')})`,
].join(' and ');

const redirectRule = ({ ref, description, expression, targetUrl, targetExpression }) => ({
  ref,
  description,
  expression,
  action: 'redirect',
  action_parameters: {
    from_value: {
      target_url: targetExpression
        ? { expression: targetExpression }
        : { value: targetUrl },
      status_code: 301,
      preserve_query_string: false,
    },
  },
  enabled: true,
});

const exactPathExpression = (paths) => (
  `(http.host eq "${ZONE_NAME}") and (${paths.map((path) => `http.request.uri.path eq "${path}"`).join(' or ')})`
);

const queryPathExpression = (paths, queryFragments) => (
  `(http.host eq "${ZONE_NAME}") and (${paths.map((path) => `http.request.uri.path eq "${path}"`).join(' or ')}) and (${queryFragments.map((queryFragment) => `http.request.uri.query contains "${queryFragment}"`).join(' or ')})`
);

const managedRules = [
  redirectRule({
    ref: 'podcast_transcript_query_to_hash',
    description: 'Canonicalize podcast transcript tab query URLs',
    expression: transcriptExpression,
    targetExpression: `concat("https://${ZONE_NAME}", http.request.uri.path, "#transcript")`,
  }),
  redirectRule({
    ref: 'videos_category_query_to_clean_path',
    description: 'Canonicalize videos category query URLs',
    expression: queryPathExpression(['/videos', '/videos/'], ['category=']),
    targetUrl: `https://${ZONE_NAME}/videos/`,
  }),
  redirectRule({
    ref: 'podcasts_openclaw_alias_to_agentstack',
    description: 'Redirect legacy OpenClaw podcast alias to AgentStack Daily',
    expression: exactPathExpression(['/podcasts/openclaw', '/podcasts/openclaw/']),
    targetUrl: `https://${ZONE_NAME}/podcasts/agentstack/`,
  }),
  ...['es', 'pt', 'hi', 'de'].map((lang) => redirectRule({
    ref: `podcasts_${lang}_openclaw_alias_to_agentstack`,
    description: `Redirect legacy ${lang} OpenClaw podcast alias to AgentStack Daily`,
    expression: exactPathExpression([`/${lang}/podcasts/openclaw`, `/${lang}/podcasts/openclaw/`]),
    targetUrl: `https://${ZONE_NAME}/${lang}/podcasts/agentstack/`,
  })),
];

if (!API_TOKEN) {
  console.error('Missing CLOUDFLARE_API_TOKEN. Create a Cloudflare API token with zone redirect-rule write access, then rerun this command.');
  process.exit(1);
}

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const errorText = body.errors?.map((error) => `${error.code}: ${error.message}`).join('; ') || response.statusText;
    const error = new Error(errorText);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body.result;
};

const getZoneId = async () => {
  if (ZONE_ID) return ZONE_ID;

  const zones = await request(`/zones?name=${encodeURIComponent(ZONE_NAME)}`);
  if (!Array.isArray(zones) || zones.length === 0) {
    throw new Error(`No Cloudflare zone found for ${ZONE_NAME}.`);
  }

  return zones[0].id;
};

const getRedirectRuleset = async (zoneId) => {
  try {
    return await request(`/zones/${zoneId}/rulesets/phases/http_request_dynamic_redirect/entrypoint`);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
};

const createRedirectRuleset = async (zoneId) => request(`/zones/${zoneId}/rulesets`, {
  method: 'POST',
  body: JSON.stringify({
    name: 'Redirect rules',
    description: 'Zone-level URL redirects',
    kind: 'zone',
    phase: 'http_request_dynamic_redirect',
    rules: managedRules,
  }),
});

const updateRedirectRuleset = async (zoneId, ruleset) => {
  const existingRules = Array.isArray(ruleset.rules) ? ruleset.rules : [];
  const nextRules = existingRules.filter((rule) => (
    !MANAGED_RULE_REFS.has(rule.ref)
    && !RECLAIMED_RULE_DESCRIPTIONS.has(rule.description)
  ));

  nextRules.push(...managedRules);

  return request(`/zones/${zoneId}/rulesets/${ruleset.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: ruleset.name || 'Redirect rules',
      description: ruleset.description || 'Zone-level URL redirects',
      kind: 'zone',
      phase: 'http_request_dynamic_redirect',
      rules: nextRules,
    }),
  });
};

const zoneId = await getZoneId();
const existingRuleset = await getRedirectRuleset(zoneId);
const updatedRuleset = existingRuleset
  ? await updateRedirectRuleset(zoneId, existingRuleset)
  : await createRedirectRuleset(zoneId);

const action = existingRuleset ? 'updated' : 'created';
console.log(`Cloudflare redirect ruleset ${action} for ${ZONE_NAME}.`);
console.log(`Ruleset: ${updatedRuleset.id}`);
console.log(`Managed rules: ${managedRules.map((rule) => rule.ref).join(', ')}`);
