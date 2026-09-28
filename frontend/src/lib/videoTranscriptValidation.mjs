/** Stale or incomplete machine translations must never become public routes. */
export function isCurrentTranslation(source, translation, title) {
  return Boolean(source && translation &&
    translation.schema_version === 1 &&
    translation.video_id === source.video_id &&
    translation.source_hash === source.source_hash &&
    translation.source_title === title &&
    translation.translation_type === 'machine' &&
    typeof translation.title === 'string' && translation.title.trim() &&
    Array.isArray(translation.segments) &&
    translation.segments.length === source.segments.length &&
    translation.segments.every((segment, index) =>
      typeof segment.text === 'string' && segment.text.trim() &&
      !/__TOFT_KEEP_|<think>|```/.test(segment.text) &&
      segment.start === source.segments[index].start &&
      segment.end === source.segments[index].end));
}
