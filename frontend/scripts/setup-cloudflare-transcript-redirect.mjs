#!/usr/bin/env node

const API_BASE = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = process.env.CLOUDFLARE_ZONE_NAME || 'tobyonfitnesstech.com';
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
const RULE_REF = 'podcast_transcript_query_to_hash';
const RULE_DESCRIPTION = 'Canonicalize podcast transcript tab query URLs';

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

const expression = [
  `(http.host eq "${ZONE_NAME}")`,
  `(http.request.uri.query contains "tab=transcript")`,
  `(${podcastPrefixes.map((prefix) => `starts_with(http.request.uri.path, "${prefix}")`).join(' or ')})`,
].join(' and ');

const transcriptRedirectRule = {
  ref: RULE_REF,
  description: RULE_DESCRIPTION,
  expression,
  action: 'redirect',
  action_parameters: {
    from_value: {
      target_url: {
        expression: `concat("https://${ZONE_NAME}", http.request.uri.path, "#transcript")`,
      },
      status_code: 301,
      preserve_query_string: false,
    },
  },
  enabled: true,
};

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
    rules: [transcriptRedirectRule],
  }),
});

const updateRedirectRuleset = async (zoneId, ruleset) => {
  const existingRules = Array.isArray(ruleset.rules) ? ruleset.rules : [];
  const nextRules = existingRules.filter((rule) => (
    rule.ref !== RULE_REF && rule.description !== RULE_DESCRIPTION
  ));

  nextRules.push(transcriptRedirectRule);

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
console.log(`Rule ref: ${RULE_REF}`);
console.log(`Expression: ${expression}`);
