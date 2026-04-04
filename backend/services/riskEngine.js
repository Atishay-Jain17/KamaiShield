const db = require('../database');

// ── SEASONAL FACTOR ────────────────────────────────────────────────────────
function getSeasonalFactor(city) {
  const month = new Date().getMonth() + 1; // 1-12

  const northIndia = ['Delhi', 'Lucknow', 'Jaipur', 'Chandigarh'];
  const coastalIndia = ['Mumbai', 'Chennai', 'Kochi'];

  if (northIndia.includes(city)) {
    if (month >= 6 && month <= 9) return { factor: 1.2, label: 'Monsoon Season' };
    if (month >= 11 || month <= 1) return { factor: 1.15, label: 'Winter Smog Season' };
    if (month >= 4 && month <= 6) return { factor: 1.1, label: 'Peak Heat Season' };
    return { factor: 1.0, label: 'Normal Season' };
  }

  if (coastalIndia.includes(city)) {
    if (month >= 6 && month <= 9) return { factor: 1.25, label: 'Heavy Monsoon Season' };
    if (month >= 10 && month <= 12) return { factor: 1.1, label: 'Northeast Monsoon' };
    return { factor: 1.0, label: 'Normal Season' };
  }

  // Default (Bengaluru, Hyderabad etc.)
  if (month >= 6 && month <= 9) return { factor: 1.15, label: 'Monsoon Season' };
  return { factor: 1.0, label: 'Normal Season' };
}

// ── BASE PLAN CONFIG ───────────────────────────────────────────────────────
const PLANS = {
  basic: {
    name: 'Basic Shield',
    basePremium: 29,
    coverageCap: 500,
    coveragePct: 0.60,
    emoji: '🌧️'
  },
  standard: {
    name: 'Standard Shield',
    basePremium: 49,
    coverageCap: 1000,
    coveragePct: 0.75,
    emoji: '⚡'
  },
  pro: {
    name: 'Pro Shield',
    basePremium: 79,
    coverageCap: 1800,
    coveragePct: 0.90,
    emoji: '🛡️'
  }
};

// ── ZONE RISK SCORE ────────────────────────────────────────────────────────
function getZoneRiskScore(pincode) {
  const zone = db.prepare(`SELECT * FROM zone_risk WHERE pincode = ?`).get(pincode);
  if (!zone) return { score: 1.0, label: 'Medium Risk', zone: null };

  const score = zone.risk_score;
  let label, multiplierLabel;
  if (score >= 1.15) {
    label = 'High Risk Zone';
    multiplierLabel = `+${Math.round((score - 1) * 100)}% premium`;
  } else if (score <= 0.90) {
    label = 'Low Risk Zone';
    multiplierLabel = `-${Math.round((1 - score) * 100)}% premium discount`;
  } else {
    label = 'Medium Risk Zone';
    multiplierLabel = 'Base premium';
  }

  return { score, label, multiplierLabel, zone };
}

// ── CALCULATE PREMIUM ─────────────────────────────────────────────────────
function calculatePremium(planKey, pincode, city) {
  const plan = PLANS[planKey];
  if (!plan) throw new Error('Invalid plan');

  const { score: zoneMultiplier, label: zoneLabel, zone } = getZoneRiskScore(pincode);
  const { factor: seasonalFactor, label: seasonLabel } = getSeasonalFactor(city);

  const finalPremium = Math.round(plan.basePremium * zoneMultiplier * seasonalFactor);

  return {
    plan: planKey,
    planName: plan.name,
    emoji: plan.emoji,
    basePremium: plan.basePremium,
    zoneMultiplier,
    zoneLabel,
    seasonalFactor,
    seasonLabel,
    finalPremium,
    coverageCap: plan.coverageCap,
    coveragePct: plan.coveragePct,
    breakdown: {
      base: plan.basePremium,
      afterZone: Math.round(plan.basePremium * zoneMultiplier),
      afterSeason: finalPremium
    }
  };
}

// ── CALCULATE PAYOUT FOR A DISRUPTION ────────────────────────────────────
function calculatePayout(policy, disruption, hoursAffected) {
  const rider = db.prepare(`SELECT * FROM riders WHERE id = ?`).get(policy.rider_id);
  const avgHourly = rider.avg_hourly_earnings || 100;

  const rawPayout = avgHourly * hoursAffected * policy.coverage_pct;
  const cappedPayout = Math.min(rawPayout, policy.coverage_cap);

  return {
    hourlyEarnings: avgHourly,
    hoursAffected,
    coveragePct: policy.coverage_pct,
    rawPayout: Math.round(rawPayout),
    finalPayout: Math.round(cappedPayout),
    wasCapped: rawPayout > policy.coverage_cap
  };
}

// ── GET ALL PLAN QUOTES ────────────────────────────────────────────────────
function getAllQuotes(pincode, city) {
  return Object.keys(PLANS).map(key => calculatePremium(key, pincode, city));
}

module.exports = { calculatePremium, calculatePayout, getAllQuotes, getZoneRiskScore, getSeasonalFactor, PLANS };
