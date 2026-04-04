const db = require('../database');

// ── PREDICTIVE ANALYTICS ENGINE ───────────────────────────────────────────
// Uses historical disruption patterns to forecast next week's risk per zone

function getPredictiveRisk() {
  const zones = db.prepare(`SELECT * FROM zone_risk`).all();
  const month = new Date().getMonth() + 1;
  const dayOfWeek = new Date().getDay();

  const predictions = zones.map(zone => {
    // Historical claims for this zone
    const historicalClaims = db.prepare(`
      SELECT d.type, COUNT(c.id) as count, AVG(c.payout_amount) as avg_payout
      FROM disruptions d
      LEFT JOIN claims c ON d.id = c.disruption_id
      WHERE d.pincode = ?
      GROUP BY d.type
    `).all(zone.pincode);

    // Calculate base risk score for next 7 days
    const monsoon = (month >= 6 && month <= 9);
    const smogSeason = (month >= 11 || month <= 1);
    const heatSeason = (month >= 4 && month <= 6);

    const rainProb    = monsoon ? zone.rain_risk * 1.4 : zone.rain_risk * 0.7;
    const aqiProb     = smogSeason ? zone.aqi_risk * 1.5 : zone.aqi_risk * 0.6;
    const heatProb    = heatSeason ? zone.heat_risk * 1.4 : zone.heat_risk * 0.5;
    const floodProb   = monsoon ? zone.flood_risk * 1.3 : zone.flood_risk * 0.4;
    const civicProb   = zone.civic_risk;

    const overallRisk = Math.min(1, (rainProb + aqiProb + heatProb + floodProb + civicProb) / 3);

    // Estimate next week payout
    const activePolicies = db.prepare(`
      SELECT COUNT(*) as c FROM policies p
      JOIN riders r ON p.rider_id = r.id
      WHERE p.status = 'active' AND p.end_date >= date('now') AND r.pincode = ?
    `).get(zone.pincode);

    const avgPayoutPerClaim = historicalClaims.reduce((s, h) => s + (h.avg_payout || 300), 0) / Math.max(historicalClaims.length, 1);
    const estimatedClaims = Math.round(activePolicies.c * overallRisk * 2.5);
    const estimatedPayout = Math.round(estimatedClaims * avgPayoutPerClaim);

    return {
      pincode: zone.pincode,
      city: zone.city,
      zone: zone.zone,
      riskScore: zone.risk_score,
      activePolicies: activePolicies.c,
      nextWeekForecast: {
        overallRiskPct: Math.round(overallRisk * 100),
        riskLevel: overallRisk > 0.6 ? 'HIGH' : overallRisk > 0.35 ? 'MEDIUM' : 'LOW',
        probabilities: {
          heavyRain:       Math.round(Math.min(rainProb, 1) * 100),
          severePollution: Math.round(Math.min(aqiProb, 1) * 100),
          extremeHeat:     Math.round(Math.min(heatProb, 1) * 100),
          flood:           Math.round(Math.min(floodProb, 1) * 100),
          civic:           Math.round(Math.min(civicProb, 1) * 100),
        },
        estimatedClaims,
        estimatedPayout,
        recommendation: overallRisk > 0.6
          ? 'HIGH ALERT — Increase reserve pool for this zone'
          : overallRisk > 0.35
          ? 'MODERATE — Monitor closely this week'
          : 'LOW — Normal operations',
      },
      historicalActivity: historicalClaims
    };
  });

  return predictions.sort((a, b) => b.nextWeekForecast.overallRiskPct - a.nextWeekForecast.overallRiskPct);
}

// ── WEEKLY SUMMARY ────────────────────────────────────────────────────────
function getWeeklySummary() {
  const weeks = [];
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekEnd   = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const data = db.prepare(`
      SELECT COUNT(*) as claims, SUM(payout_amount) as payouts, AVG(bts_score) as avg_bts
      FROM claims WHERE created_at >= ? AND created_at < ?
    `).get(weekStart, weekEnd);

    weeks.unshift({
      week: weekStart,
      claims: data.claims || 0,
      payouts: Math.round(data.payouts || 0),
      avgBts: Math.round(data.avg_bts || 0)
    });
  }
  return weeks;
}

// ── FRAUD RING ACTIVITY ───────────────────────────────────────────────────
function getFraudInsights() {
  const tier3Claims = db.prepare(`
    SELECT c.*, r.name as rider_name, r.platform, d.city, d.zone, d.type
    FROM claims c
    JOIN riders r ON c.rider_id = r.id
    JOIN disruptions d ON c.disruption_id = d.id
    WHERE c.fraud_tier = 3
    ORDER BY c.created_at DESC LIMIT 20
  `).all();

  const avgBTSByTier = db.prepare(`
    SELECT fraud_tier, AVG(bts_score) as avg_bts, COUNT(*) as count,
           SUM(payout_amount) as potential_fraud_amount
    FROM claims GROUP BY fraud_tier
  `).all();

  const claimsPerDisruption = db.prepare(`
    SELECT d.id, d.type, d.city, d.zone, d.triggered_at,
           COUNT(c.id) as claim_count,
           MIN(c.created_at) as first_claim,
           MAX(c.created_at) as last_claim,
           AVG(c.bts_score) as avg_bts,
           COUNT(CASE WHEN c.fraud_tier = 3 THEN 1 END) as flagged_count
    FROM disruptions d
    LEFT JOIN claims c ON d.id = c.disruption_id
    GROUP BY d.id
    HAVING claim_count > 0
    ORDER BY d.triggered_at DESC LIMIT 10
  `).all();

  return { tier3Claims, avgBTSByTier, claimsPerDisruption };
}

module.exports = { getPredictiveRisk, getWeeklySummary, getFraudInsights };
