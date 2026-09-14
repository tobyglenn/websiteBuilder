SELECT period, schema_version, surface, navigation_group, item_position, item_label,
  destination_url,
  uniqIf(person_id, views > 0) AS unique_viewers,
  countIf(views > 0) AS viewing_sessions,
  countIf(clicks > 0) AS clicking_sessions,
  countIf(views > 0 AND next_clicks > 0 AND first_next_click >= first_view) AS matched_clicking_sessions,
  sum(current_clicks) AS current_page_clicks,
  countIf(clicks > 0 AND views = 0) AS clicks_without_exposure_sessions,
  round(100 * matched_clicking_sessions / nullIf(viewing_sessions, 0), 1) AS session_ctr,
  round(100 * uniqIf(person_id, views > 0 AND next_clicks > 0 AND first_next_click >= first_view) / nullIf(unique_viewers, 0), 1) AS viewer_ctr
FROM (
  SELECT if(timestamp >= toStartOfDay(now()) - INTERVAL 7 DAY, 'current_complete_7d', 'prior_complete_7d') AS period,
    properties.navigation_schema_version AS schema_version,
    properties.navigation_surface AS surface,
    properties.navigation_group AS navigation_group,
    toInt(properties.navigation_item_position) AS item_position,
    properties.navigation_item_label AS item_label,
    properties.destination_url AS destination_url,
    person_id, properties.$session_id AS session_id,
    countIf(event = 'navigation_item_viewed') AS views,
    countIf(event = 'navigation_click') AS clicks,
    countIf(event = 'navigation_click' AND properties.navigation_is_current = true) AS current_clicks,
    countIf(event = 'navigation_click' AND properties.navigation_is_current != true) AS next_clicks,
    minIf(timestamp, event = 'navigation_item_viewed') AS first_view,
    maxIf(timestamp, event = 'navigation_click' AND properties.navigation_is_current != true) AS first_next_click
  FROM events
  WHERE timestamp >= toStartOfDay(now()) - INTERVAL 14 DAY AND timestamp < toStartOfDay(now())
    AND event IN ('navigation_item_viewed', 'navigation_click')
    AND coalesce(properties.$virt_is_bot, false) = false
    AND properties.$session_id IS NOT NULL
  GROUP BY period, schema_version, surface, navigation_group, item_position, item_label, destination_url, person_id, session_id
)
GROUP BY period, schema_version, surface, navigation_group, item_position, item_label, destination_url
ORDER BY period, viewing_sessions DESC
LIMIT 250
