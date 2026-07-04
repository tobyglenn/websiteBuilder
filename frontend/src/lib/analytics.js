export function captureEvent(eventName, properties = {}) {
  if (typeof window === 'undefined' || !window.toftAnalytics) return;
  window.toftAnalytics.capture(eventName, properties);
}

export function cleanAnalyticsText(value, maxLength = 120) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}
