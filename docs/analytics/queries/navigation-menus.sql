SELECT period, schema_version, surface, menu_group,
  uniqIf(person_id, opens > 0) AS unique_openers,
  countIf(opens > 0) AS opening_sessions,
  countIf(selections > 0) AS selecting_sessions,
  countIf(opens > 0 AND selections > 0 AND last_selection >= first_open) AS matched_selecting_sessions,
  countIf(opens = 0 AND selections > 0) AS selections_without_open_sessions,
  round(100 * matched_selecting_sessions / nullIf(opening_sessions, 0), 1) AS open_to_selection_rate
FROM (
  SELECT if(timestamp >= toStartOfDay(now()) - INTERVAL 7 DAY, 'current_complete_7d', 'prior_complete_7d') AS period,
    properties.navigation_schema_version AS schema_version,
    properties.navigation_surface AS surface,
    if(event = 'navigation_menu_opened', properties.menu_name, properties.navigation_group) AS menu_group,
    person_id, properties.$session_id AS session_id,
    countIf(event = 'navigation_menu_opened') AS opens,
    countIf(event = 'navigation_click' AND properties.navigation_is_current != true) AS selections,
    minIf(timestamp, event = 'navigation_menu_opened') AS first_open,
    maxIf(timestamp, event = 'navigation_click' AND properties.navigation_is_current != true) AS last_selection
  FROM events
  WHERE timestamp >= toStartOfDay(now()) - INTERVAL 14 DAY AND timestamp < toStartOfDay(now())
    AND event IN ('navigation_menu_opened', 'navigation_click')
    AND coalesce(properties.$virt_is_bot, false) = false
    AND properties.$session_id IS NOT NULL
  GROUP BY period, schema_version, surface, menu_group, person_id, session_id
)
GROUP BY period, schema_version, surface, menu_group
ORDER BY period, opening_sessions DESC
LIMIT 100
