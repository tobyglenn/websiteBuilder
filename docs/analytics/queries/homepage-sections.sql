SELECT period, homepage_layout_version, viewport, homepage_section_position,
  homepage_section_title, homepage_section_purpose, test_id, variant,
  uniq(person_id) AS unique_viewers,
  count() AS visits,
  round(avg(visible_seconds), 1) AS average_visible_seconds_per_visit,
  round(quantile(0.5)(visible_seconds), 1) AS median_visible_seconds_per_visit,
  round(100 * uniqIf(person_id, engaged = 1) / nullIf(unique_viewers, 0), 1) AS five_second_engagement_rate,
  round(100 * uniqIf(person_id, clicked = 1) / nullIf(unique_viewers, 0), 1) AS viewer_ctr,
  round(avg(maximum_intersection_ratio), 2) AS average_maximum_visibility
FROM (
  SELECT if(timestamp >= toStartOfDay(now()) - INTERVAL 7 DAY, 'current_complete_7d', 'prior_complete_7d') AS period,
    properties.homepage_layout_version AS homepage_layout_version,
    if(toInt(properties.viewport_width) < 768, 'mobile', 'desktop') AS viewport,
    toInt(properties.homepage_section_position) AS homepage_section_position,
    properties.homepage_section_title AS homepage_section_title,
    properties.homepage_section_purpose AS homepage_section_purpose,
    properties.homepage_test_id AS test_id,
    properties.homepage_test_variant AS variant,
    person_id, properties.homepage_visit_id AS visit_id,
    argMax(toFloat(properties.visible_seconds), timestamp) AS visible_seconds,
    max(if(properties.homepage_section_engaged = true, 1, 0)) AS engaged,
    max(if(toInt(properties.homepage_section_clicks) > 0, 1, 0)) AS clicked,
    max(toFloat(properties.maximum_intersection_ratio)) AS maximum_intersection_ratio
  FROM events
  WHERE timestamp >= toStartOfDay(now()) - INTERVAL 14 DAY AND timestamp < toStartOfDay(now())
    AND event = 'homepage_section_summary'
    AND coalesce(properties.$virt_is_bot, false) = false
    AND properties.homepage_visit_id IS NOT NULL
  GROUP BY period, homepage_layout_version, viewport, homepage_section_position,
    homepage_section_title, homepage_section_purpose, test_id, variant, person_id, visit_id
)
GROUP BY period, homepage_layout_version, viewport, homepage_section_position,
  homepage_section_title, homepage_section_purpose, test_id, variant
ORDER BY period, homepage_section_position, viewport
LIMIT 200
