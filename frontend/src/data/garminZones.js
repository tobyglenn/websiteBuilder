// Garmin exports store HR zones as hrTimeInZones: [{ zoneNumber, secsInZone }].
// Older exports used flat hrTimeInZone_1..5 fields; accept either (seconds).
export function zoneSecs(activity, zone) {
  const flat = activity?.[`hrTimeInZone_${zone}`];
  if (flat != null) return Number(flat) || 0;
  const entry = (activity?.hrTimeInZones || []).find((z) => z.zoneNumber === zone);
  return Number(entry?.secsInZone) || 0;
}
