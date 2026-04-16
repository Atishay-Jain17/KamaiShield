const db = require('../database');
const { computeMLRiskScore } = require('./mlRiskModel');

// ── SEASONAL FACTOR ────────────────────────────────────────────────────────
function getSeasonalFactor(city) {
  const month = new Date().getMonth() + 1;
  const northIndia   = ['Delhi', 'Lucknow', 'Jaipur', 'Chandigarh'];
  const coastalIndia = ['Mumbai', 'Chennai', 'Kochi'];

  if (northIndia.includes(city)) {
    if (month >= 6 && month <= 9)       return { factor: 1.2,  label: 'Monsoon Season' };
    if (month >= 11 || month <= 1)      return { factor: 1.15, label: 'Winter Smog Season' };
    if (month >= 4  && month <= 6)      return { factor: 1.1,  label: 'Peak Heat Season' };
    return { factor: 1.0, label: 'Normal Season' };
  }
  if (coastalIndia.includes(city)) {
    if (month >= 6  && month <= 9)      return { factor: 1.25, label: 'Heavy Monsoon Season' };
    if (month >= 10 && month <= 12)     return { factor: 1.1,  label: 'Northeast Monsoon' };
    return { factor: 1.0, label: 'Normal Season' };
  }
  if (month >= 6 && month <= 9)         return { factor: 1.15, label: 'Monsoon Season' };
  return { factor: 1.0, label: 'Normal Season' };
}

// ── PLAN CONFIG ────────────────────────────────────────────────────────────
const PLANS = {
  basic:    { name: 'Basic Shield',    basePremium: 29, coverageCap: 500,  coveragePct: 0.60, emoji: '🌧️' },
  standard: { name: 'Standard Shield', basePremium: 49, coverageCap: 1000, coveragePct: 0.75, emoji: '⚡' },
  pro:      { name: 'Pro Shield',      basePremium: 79, coverageCap: 1800, coveragePct: 0.90, emoji: '🛡️' },
};

// ── STANDARD INSURANCE EXCLUSIONS ─────────────────────────────────────────
// These are mandatory exclusions per standard insurance practice.
// KamaiShield ONLY covers income loss from the 5 parametric triggers.
const EXCLUSIONS = [
  'Health, medical, or hospitalisation expenses',
  'Life insurance or accidental death benefit',
  'Vehicle repair, damage, or theft',
  'Personal accident or bodily injury',
  'War, armed conflict, or military operations',
  'Pandemic, epidemic, or government-declared health emergency',
  'Terrorism or civil unrest (unless declared curfew via civic trigger)',
  'Nuclear, chemical, or biological events',
  'Intentional self-inflicted disruption',
  'Pre-existing conditions or chronic illness',
  'Loss of income due to personal reasons (illness, leave, resignation)',
  'Platform-side issues (app downtime, order cancellations)',
];

// ── ML-POWERED ZONE RISK SCORE ─────────────────────────────────────────────
// Uses the ML Weighted Regression model instead of static DB values
function getZoneRiskScore(pincode, city) {
  // Use ML model for dynamic scoring
  const mlResult = computeMLRiskScore(pincode, city);

  return {
    score:          mlResult.score,
    label:          mlResult.label,
    multiplierLabel: mlResult.score >= 1.15
      ? `+${Math.round((mlResult.score - 1) * 100)}% premium (ML)`
      : mlResult.score <= 0.90
        ? `-${Math.round((1 - mlResult.score) * 100)}% discount (ML)`
        : 'Base premium (ML)',
    mlConfidence:   mlResult.confidence,
    mlFeatures:     mlResult.features,
    mlMethod:       mlResult.method,
    zone:           db.prepare('SELECT * FROM zone_risk WHERE pincode = ?').get(pincode),
  };
}

// ── CALCULATE PREMIUM ─────────────────────────────────────────────────────
function calculatePremium(planKey, pincode, city) {
  const plan = PLANS[planKey];
  if (!plan) throw new Error('Invalid plan');

  const zoneData = getZoneRiskScore(pincode, city);
  const { factor: seasonalFactor, label: seasonLabel } = getSeasonalFactor(city);

  const finalPremium = Math.round(plan.basePremium * zoneData.score * seasonalFactor);

  return {
    plan:           planKey,
    planName:       plan.name,
    emoji:          plan.emoji,
    basePremium:    plan.basePremium,
    zoneMultiplier: zoneData.score,
    zoneLabel:      zoneData.label,
    seasonalFactor,
    seasonLabel,
    finalPremium,
    coverageCap:    plan.coverageCap,
    coveragePct:    plan.coveragePct,
    mlConfidence:   zoneData.mlConfidence,
    mlFeatures:     zoneData.mlFeatures,
    breakdown: {
      base:        plan.basePremium,
      afterZone:   Math.round(plan.basePremium * zoneData.score),
      afterSeason: finalPremium,
    },
  };
}

// ── CALCULATE PAYOUT ──────────────────────────────────────────────────────
function calculatePayout(policy, disruption, hoursAffected) {
  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(policy.rider_id);
  const avgHourly = rider.avg_hourly_earnings || 100;
  const rawPayout = avgHourly * hoursAffected * policy.coverage_pct;
  const cappedPayout = Math.min(rawPayout, policy.coverage_cap);
  return {
    hourlyEarnings: avgHourly,
    hoursAffected,
    coveragePct:    policy.coverage_pct,
    rawPayout:      Math.round(rawPayout),
    finalPayout:    Math.round(cappedPayout),
    wasCapped:      rawPayout > policy.coverage_cap,
  };
}

// ── GET ALL PLAN QUOTES ────────────────────────────────────────────────────
function getAllQuotes(pincode, city) {
  return Object.keys(PLANS).map(key => calculatePremium(key, pincode, city));
}

module.exports = {
  calculatePremium, calculatePayout, getAllQuotes,
  getZoneRiskScore, getSeasonalFactor, PLANS, EXCLUSIONS,
};
