-- Project 498166. Complete UTC weeks; descriptive captured identities, not verified humans.
-- Approved catalog lookup returned no website-specific matching metric.
SELECT
  if(timestamp >= toDateTime('2026-10-26'), 'current', 'prior') AS period,
  event,
  count() AS events,
  uniq(person_id) AS people,
  uniq(properties.$session_id) AS sessions
FROM events
WHERE timestamp >= toDateTime('2026-10-19') AND timestamp < toDateTime('2026-11-02')
GROUP BY period, event
ORDER BY event, period;

-- Native session entrances, not pageviews attached to an initial-page group.
SELECT
  if($start_timestamp >= toDateTime('2026-10-26'), 'current', 'prior') AS period,
  $entry_pathname AS entry_path,
  count() AS entrances
FROM sessions
WHERE $start_timestamp >= toDateTime('2026-10-19') AND $start_timestamp < toDateTime('2026-11-02')
GROUP BY period, entry_path
ORDER BY entrances DESC
LIMIT 25;

-- Original exception retained; select only privacy-safe structural diagnostic context.
SELECT timestamp, properties.$pathname, properties.$browser, properties.$os,
  properties.site_release, properties.exception_navigation_phase,
  properties.exception_page_age_ms, properties.exception_pending_island_count,
  properties.exception_island_count, properties.exception_context_version,
  properties.exception_ui_context_version, properties.exception_browser_event_type,
  properties.exception_browser_event_class, properties.exception_reason_type,
  properties.exception_source_frames, properties.exception_visibility
FROM events
WHERE event = '$exception'
  AND timestamp >= toDateTime('2026-10-26') AND timestamp < toDateTime('2026-11-02')
LIMIT 10;

-- Outcome arrival is not proof a dead-click event was a failed selection.
SELECT properties.outcome, properties.reason, properties.selector_mode,
  count(), uniq(person_id), uniq(properties.$session_id)
FROM events
WHERE event = 'comparison_selection_outcome'
  AND timestamp >= toDateTime('2026-10-26') AND timestamp < toDateTime('2026-11-02')
GROUP BY 1, 2, 3;

-- Page concentration of desktop LCP. Sparse rows are investigation leads, not winners.
SELECT properties.$pathname AS path, count() AS samples,
  uniq(person_id) AS people,
  quantile(0.75)(toFloat(properties.$web_vitals_LCP_value)) AS lcp_p75
FROM events
WHERE event = '$web_vitals'
  AND timestamp >= toDateTime('2026-10-26') AND timestamp < toDateTime('2026-11-02')
  AND properties.$device_type = 'Desktop'
  AND properties.$web_vitals_LCP_value IS NOT NULL
GROUP BY path
ORDER BY samples DESC
LIMIT 12;
