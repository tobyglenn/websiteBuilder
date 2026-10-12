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
  history = [],
  reference = null,
  daily = [],
  expectedDays = 7,
  startDate = null,
  endDate = null,
} = {}) => {
  const currentImpressions = numberValue(current.impressions);
  const priorImpressions = numberValue(prior.impressions);
  const currentClicks = numberValue(current.clicks);
  const priorClicks = numberValue(prior.clicks);
  const impressionRatio = ratio(currentImpressions, priorImpressions);
  const clickRatio = ratio(currentClicks, priorClicks);
  const historicalBaseline = [...history]
    .map((period) => ({
      ...period,
      clicks: numberValue(period.clicks),
      impressions: numberValue(period.impressions),
    }))
    .sort((a, b) => b.impressions - a.impressions)[0] || null;
  const historicalImpressionRatio = historicalBaseline
    ? ratio(currentImpressions, historicalBaseline.impressions)
    : null;
  const historicalClickRatio = historicalBaseline
    ? ratio(currentClicks, historicalBaseline.clicks)
    : null;
  const issues = [];
  const referenceImpressionRatio = reference ? ratio(currentImpressions, numberValue(reference.impressions)) : null;

  if (numberValue(reference?.impressions) >= 1000 && referenceImpressionRatio !== null && referenceImpressionRatio < 0.25) {
    issues.push({
      code: 'unresolved_visibility_incident',
      message: `Current impressions remain ${(referenceImpressionRatio * 100).toFixed(1)}% of the verified ${reference.start} to ${reference.end} reference (${reference.impressions}). This confirms low visibility, not an API fault or a proven cause.`,
    });
  }

  if (daily.length !== expectedDays) {
    issues.push({
      code: 'daily_coverage_unverified',
      message: `Received ${daily.length} non-empty final daily rows for a ${expectedDays}-day window. Google omits dates with no data; row count alone cannot distinguish zero activity from unavailable final data. Do not impute zeros or assert an incomplete week without verification.`,
    });
  }

  const observedDates = new Set(daily.map((row) => row.keys?.[0]).filter(Boolean));
  const unobservedDates = [];
  if (startDate && endDate) {
    for (let day = new Date(`${startDate}T00:00:00Z`); day <= new Date(`${endDate}T00:00:00Z`); day.setUTCDate(day.getUTCDate() + 1)) {
      const date = day.toISOString().slice(0, 10);
      if (!observedDates.has(date)) unobservedDates.push(date);
    }
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

  if (
    historicalBaseline?.impressions >= 1000
    && historicalImpressionRatio !== null
    && historicalImpressionRatio < 0.25
    && !issues.some((issue) => issue.code === 'abrupt_impression_discontinuity')
  ) {
    issues.push({
      code: 'rolling_impression_discontinuity',
      message:
        `Current impressions are ${(historicalImpressionRatio * 100).toFixed(1)}% `
        + `of the strongest complete week in the preceding four weeks (${historicalBaseline.impressions}).`,
    });
  }

  if (
    historicalBaseline?.clicks >= 20
    && currentClicks === 0
    && !issues.some((issue) => issue.code === 'zero_click_discontinuity')
  ) {
    issues.push({
      code: 'rolling_zero_click_discontinuity',
      message:
        `Current clicks are zero after a preceding complete week with ${historicalBaseline.clicks} clicks.`,
    });
  }

  return {
    status: issues.length ? 'degraded' : 'ready',
    comparisonSafe: issues.length === 0,
    recommendationStatus: issues.length ? 'hold_for_verification' : 'ready',
    expectedDailyRows: expectedDays,
    observedDailyRows: daily.length,
    unobservedDates,
    dailyCoverageInterpretation: 'Unobserved dates may have zero activity or unavailable final data; neither is inferred.',
    currentToPriorRatios: {
      impressions: impressionRatio,
      clicks: clickRatio,
    },
    currentToHistoricalBaselineRatios: {
      impressions: historicalImpressionRatio,
      clicks: historicalClickRatio,
    },
    historicalBaseline,
    referenceBaseline: reference,
    currentToReferenceImpressionRatio: referenceImpressionRatio,
    issues,
  };
};
