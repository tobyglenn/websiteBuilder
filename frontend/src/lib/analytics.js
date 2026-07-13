export function captureEvent(eventName, properties = {}) {
  if (typeof window === 'undefined') return;

  if (window.toftAnalytics) {
    window.toftAnalytics.capture(eventName, properties);
    return;
  }

  window.__TOFT_ANALYTICS_QUEUE__ ||= [];
  window.__TOFT_ANALYTICS_QUEUE__.push([eventName, properties]);
}

export function cleanAnalyticsText(value, maxLength = 120) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}
