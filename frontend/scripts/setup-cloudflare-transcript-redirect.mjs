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
  'podcasts_openclaw_aliases_to_agentstack',
  'podcasts_es_openclaw_alias_to_agentstack',
  'podcasts_pt_openclaw_alias_to_agentstack',
  'podcasts_hi_openclaw_alias_to_agentstack',
  'podcasts_de_openclaw_alias_to_agentstack',
  'podcasts_reversed_language_dirs_to_index',
  'podcasts_malformed_detail_paths_to_index',
  'podcasts_localized_toft_aliases_to_fitness_tech',
  'blog_legacy_slug_aliases_to_canonical',
  'legacy_feed_paths_to_rss',
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

const startsWithAnyPathExpression = (paths) => (
  `(http.host eq "${ZONE_NAME}") and (${paths.map((path) => `starts_with(http.request.uri.path, "${path}")`).join(' or ')})`
);

const startsWithAnyExtraPathExpression = (paths) => (
  `(http.host eq "${ZONE_NAME}") and (${paths.map((path) => `(starts_with(http.request.uri.path, "${path}") and http.request.uri.path ne "${path}")`).join(' or ')})`
);

const legacyBlogSlugRedirects = [
  {
    from: '/blog/speediance-broke-partner-mode-lost-free-lift-feature',
    to: '/blog/speediance-broke-partner-mode-lost-freelift-feature-demo-daughter/',
  },
  {
    from: '/blog/speediance-2s-260-lb-lat-pulldown',
    to: '/blog/speediance-2s-max-lat-pulldown-260lbs/',
  },
  {
    from: '/blog/2025-09-09-discover-the-truth-behind-workout-tech-transparency',
    to: '/blog/2026-04-08-discover-the-truth-behind-workout-tech-transparency/',
  },
  {
    from: '/blog/why-running-might-have-saved-my-life',
    to: '/blog/running-might-have-saved-my-life/',
  },
  {
    from: '/blog/the-submission-that-could-have-ended-everything',
    to: '/blog/submission-that-could-have-ended-everything/',
  },
];

const legacyBlogSlugPaths = legacyBlogSlugRedirects.flatMap(({ from }) => [from, `${from}/`]);

const legacyBlogSlugTargetPathExpression = legacyBlogSlugRedirects.reduce(
  (expression, { from, to }) => `regex_replace(${expression}, r"^${from}/?$", r"${to}")`,
  'http.request.uri.path'
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
    ref: 'podcasts_openclaw_aliases_to_agentstack',
    description: 'Redirect legacy OpenClaw podcast aliases to AgentStack Daily',
    expression: exactPathExpression([
      '/podcasts/openclaw',
      '/podcasts/openclaw/',
      '/es/podcasts/openclaw',
      '/es/podcasts/openclaw/',
      '/pt/podcasts/openclaw',
      '/pt/podcasts/openclaw/',
      '/hi/podcasts/openclaw',
      '/hi/podcasts/openclaw/',
      '/de/podcasts/openclaw',
      '/de/podcasts/openclaw/',
    ]),
    targetUrl: `https://${ZONE_NAME}/podcasts/agentstack/`,
  }),
  redirectRule({
    ref: 'podcasts_reversed_language_dirs_to_index',
    description: 'Redirect reversed podcast language directories to podcast index',
    expression: exactPathExpression([
      '/podcasts/es',
      '/podcasts/es/',
      '/podcasts/pt',
      '/podcasts/pt/',
      '/podcasts/hi',
      '/podcasts/hi/',
      '/podcasts/de',
      '/podcasts/de/',
    ]),
    targetUrl: `https://${ZONE_NAME}/podcasts/`,
  }),
  redirectRule({
    ref: 'podcasts_malformed_detail_paths_to_index',
    description: 'Redirect malformed podcast detail paths to podcast index',
    expression: [
      startsWithAnyExtraPathExpression([
        '/podcasts/episode-12/',
        '/es/podcasts/episode-72/',
        '/hi/podcasts/episode-28/',
        '/de/podcasts/episode-59/',
        '/de/podcasts/episode-58/',
        '/de/podcasts/episode-32/',
      ]),
      startsWithAnyPathExpression([
        '/podcasts/pt/episodio-',
        '/podcasts/exo-cluster',
      ]),
    ].join(' or '),
    targetUrl: `https://${ZONE_NAME}/podcasts/`,
  }),
  redirectRule({
    ref: 'podcasts_localized_toft_aliases_to_fitness_tech',
    description: 'Redirect localized fitness-tech podcast episode aliases to show index',
    expression: startsWithAnyPathExpression([
      '/es/podcasts/toft-',
      '/pt/podcasts/toft-',
      '/hi/podcasts/toft-',
      '/de/podcasts/toft-',
    ]),
    targetUrl: `https://${ZONE_NAME}/podcasts/fitness-tech/`,
  }),
  redirectRule({
    ref: 'blog_legacy_slug_aliases_to_canonical',
    description: 'Redirect legacy blog slug aliases to canonical articles',
    expression: exactPathExpression(legacyBlogSlugPaths),
    targetExpression: `concat("https://${ZONE_NAME}", ${legacyBlogSlugTargetPathExpression})`,
  }),
  redirectRule({
    ref: 'legacy_feed_paths_to_rss',
    description: 'Redirect legacy WordPress-style feed paths to RSS',
    expression: exactPathExpression([
      '/feed',
      '/feed/',
      '/comments/feed',
      '/comments/feed/',
      '/blog/rss.xml',
    ]),
    targetUrl: `https://${ZONE_NAME}/rss.xml`,
  }),
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
