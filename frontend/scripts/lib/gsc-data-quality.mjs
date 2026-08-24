const numberValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const ratio = (current, prior) => (
  prior > 0 ? current / prior : null
);

export const assessGscDataQuality = ({
  current = {},
  prior = {},
  daily = [],
  expectedDays = 7,
} = {}) => {
  const currentImpressions = numberValue(current.impressions);
  const priorImpressions = numberValue(prior.impressions);
  const currentClicks = numberValue(current.clicks);
  const priorClicks = numberValue(prior.clicks);
  const impressionRatio = ratio(currentImpressions, priorImpressions);
  const clickRatio = ratio(currentClicks, priorClicks);
  const issues = [];

  if (daily.length !== expectedDays) {
    issues.push({
      code: 'incomplete_daily_rows',
      message: `Expected ${expectedDays} final daily rows but received ${daily.length}.`,
    });
  }

  if (priorImpressions >= 1000 && impressionRatio !== null && impressionRatio < 0.25) {
    issues.push({
      code: 'abrupt_impression_discontinuity',
      message: `Current impressions are ${(impressionRatio * 100).toFixed(1)}% of the prior period.`,
    });
  }

  if (priorClicks >= 20 && currentClicks === 0) {
    issues.push({
      code: 'zero_click_discontinuity',
      message: `Current clicks are zero after ${priorClicks} clicks in the prior period.`,
    });
  }

  return {
    status: issues.length ? 'degraded' : 'ready',
    comparisonSafe: issues.length === 0,
    recommendationStatus: issues.length ? 'hold_for_verification' : 'ready',
    expectedDailyRows: expectedDays,
    observedDailyRows: daily.length,
    currentToPriorRatios: {
      impressions: impressionRatio,
      clicks: clickRatio,
    },
    issues,
  };
};
