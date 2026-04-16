const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { triggerManualDisruption, processWeeklyPayouts, TRIGGERS } = require('../services/disruptionMonitor');
const { computeBTS, detectRing } = require('../services/fraudEngine');

// ════════════════════════════════════════════════════════════════
// CLAIMS ROUTES
// ════════════════════════════════════════════════════════════════

// Get my claims
router.get('/claims/my', authMiddleware, (req, res) => {
  const claims = db.prepare(`
    SELECT c.*, d.type, d.subtype, d.description, d.triggered_at, d.severity, d.city, d.zone
    FROM claims c
    JOIN disruptions d ON c.disruption_id = d.id
    WHERE c.rider_id = ?
    ORDER BY c.created_at DESC
    LIMIT 20
  `).all(req.user.id);
  res.json(claims);
});

// Get claim fraud signals
router.get('/claims/:id/signals', authMiddleware, (req, res) => {
  const signals = db.prepare(`SELECT * FROM fraud_signals WHERE claim_id = ?`).all(req.params.id);
  res.json(signals);
});

// Live location ping (Tier 3 resolution)
router.post('/claims/:id/verify', authMiddleware, (req, res) => {
  const claim = db.prepare(`SELECT * FROM claims WHERE id = ? AND rider_id = ?`).get(req.params.id, req.user.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });

  // Simulate location verification
  const verified = Math.random() > 0.1; // 90% pass
  if (verified) {
    db.prepare(`UPDATE claims SET status = 'approved', resolved_at = datetime('now') WHERE id = ?`).run(req.params.id);
    // Add ₹20 goodwill bonus
    db.prepare(`UPDATE claims SET payout_amount = payout_amount + 20 WHERE id = ?`).run(req.params.id);
    res.json({ success: true, message: '✅ Location verified! Claim approved + ₹20 goodwill bonus added.' });
  } else {
    res.json({ success: false, message: '❌ Location could not be verified. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════════
// DISRUPTIONS ROUTES
// ════════════════════════════════════════════════════════════════

// Get active disruptions for rider's zone
router.get('/disruptions/my-zone', authMiddleware, (req, res) => {
  const rider = db.prepare(`SELECT * FROM riders WHERE id = ?`).get(req.user.id);
  const disruptions = db.prepare(`
    SELECT * FROM disruptions
    WHERE pincode = ? AND status = 'active'
    ORDER BY triggered_at DESC LIMIT 10
  `).all(rider.pincode);
  res.json(disruptions);
});

// Get all recent disruptions
router.get('/disruptions/recent', authMiddleware, (req, res) => {
  const disruptions = db.prepare(`
    SELECT * FROM disruptions
    ORDER BY triggered_at DESC LIMIT 30
  `).all();
  res.json(disruptions);
});

// Get rider alerts (handles NULL disruption_id for payout alerts)
router.get('/alerts/my', authMiddleware, (req, res) => {
  const alerts = db.prepare(`
    SELECT a.*, d.type, d.severity
    FROM disruption_alerts a
    LEFT JOIN disruptions d ON a.disruption_id = d.id
    WHERE a.rider_id = ?
    ORDER BY a.created_at DESC LIMIT 20
  `).all(req.user.id);
  db.prepare(`UPDATE disruption_alerts SET read = 1 WHERE rider_id = ?`).run(req.user.id);
  res.json(alerts);
});

// ════════════════════════════════════════════════════════════════
// PAYOUTS ROUTES
// ════════════════════════════════════════════════════════════════

// Get my payouts
router.get('/payouts/my', authMiddleware, (req, res) => {
  const payouts = db.prepare(`
    SELECT * FROM payouts WHERE rider_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(req.user.id);

  // Get pending payout this week
  const pendingClaims = db.prepare(`
    SELECT COUNT(*) as count, SUM(payout_amount) as total
    FROM claims WHERE rider_id = ? AND status = 'approved'
    AND created_at >= date('now', '-7 days')
  `).get(req.user.id);

  res.json({ payouts, pendingThisWeek: pendingClaims });
});

// ════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════════════════════════

// Admin: trigger a disruption manually
router.post('/admin/trigger-disruption', authMiddleware, adminOnly, (req, res) => {
  const { type, pincode, city, zone } = req.body;
  if (!TRIGGERS[type]) return res.status(400).json({ error: 'Invalid disruption type', validTypes: Object.keys(TRIGGERS) });
  const result = triggerManualDisruption(type, pincode, city, zone);
  if (!result) return res.json({ success: false, message: 'Disruption already active in this zone (within last 2 hours)' });
  res.json({ success: true, ...result });
});

// Admin: process weekly payouts now
router.post('/admin/process-payouts', authMiddleware, adminOnly, (req, res) => {
  processWeeklyPayouts();
  res.json({ success: true, message: 'Weekly payout processing triggered' });
});

// Admin: full dashboard stats
router.get('/admin/stats', authMiddleware, adminOnly, (req, res) => {
  const totalRiders = db.prepare(`SELECT COUNT(*) as c FROM riders WHERE role = 'rider'`).get().c;
  const activePolicies = db.prepare(`SELECT COUNT(*) as c FROM policies WHERE status = 'active' AND end_date >= date('now')`).get().c;
  const totalClaims = db.prepare(`SELECT COUNT(*) as c FROM claims`).get().c;
  const approvedClaims = db.prepare(`SELECT COUNT(*) as c FROM claims WHERE status IN ('approved','paid')`).get().c;
  const flaggedClaims = db.prepare(`SELECT COUNT(*) as c FROM claims WHERE status = 'flagged'`).get().c;
  const totalPayouts = db.prepare(`SELECT SUM(total_amount) as s FROM payouts WHERE status = 'processed'`).get().s || 0;
  const totalPremiums = db.prepare(`SELECT SUM(premium) as s FROM policies`).get().s || 0;
  const activeDisruptions = db.prepare(`SELECT COUNT(*) as c FROM disruptions WHERE status = 'active'`).get().c;

  const recentDisruptions = db.prepare(`
    SELECT d.*, COUNT(c.id) as claim_count, SUM(c.payout_amount) as total_payout
    FROM disruptions d
    LEFT JOIN claims c ON d.id = c.disruption_id
    GROUP BY d.id
    ORDER BY d.triggered_at DESC LIMIT 15
  `).all();

  const fraudStats = db.prepare(`
    SELECT fraud_tier, COUNT(*) as count, AVG(bts_score) as avg_bts
    FROM claims GROUP BY fraud_tier
  `).all();

  const cityStats = db.prepare(`
    SELECT d.city, COUNT(c.id) as claims, SUM(c.payout_amount) as payouts
    FROM claims c JOIN disruptions d ON c.disruption_id = d.id
    GROUP BY d.city ORDER BY claims DESC
  `).all();

  const typeStats = db.prepare(`
    SELECT d.type, COUNT(c.id) as claims, SUM(c.payout_amount) as payouts
    FROM claims c JOIN disruptions d ON c.disruption_id = d.id
    GROUP BY d.type ORDER BY claims DESC
  `).all();

  res.json({
    overview: { totalRiders, activePolicies, totalClaims, approvedClaims, flaggedClaims, totalPayouts, totalPremiums, activeDisruptions },
    lossRatio: totalPremiums > 0 ? ((totalPayouts / totalPremiums) * 100).toFixed(1) : 0,
    recentDisruptions,
    fraudStats,
    cityStats,
    typeStats
  });
});

// Admin: all riders
router.get('/admin/riders', authMiddleware, adminOnly, (req, res) => {
  const riders = db.prepare(`
    SELECT r.id, r.name, r.phone, r.platform, r.city, r.zone, r.created_at,
           COUNT(DISTINCT p.id) as total_policies,
           COUNT(DISTINCT c.id) as total_claims,
           SUM(c.payout_amount) as total_payout_received
    FROM riders r
    LEFT JOIN policies p ON r.id = p.rider_id
    LEFT JOIN claims c ON r.id = c.rider_id AND c.status IN ('approved','paid')
    WHERE r.role = 'rider'
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `).all();
  res.json(riders);
});

// Admin: all claims with fraud info
router.get('/admin/claims', authMiddleware, adminOnly, (req, res) => {
  const claims = db.prepare(`
    SELECT c.*, r.name as rider_name, r.phone, r.platform, r.city,
           d.type as disruption_type, d.description as disruption_desc, d.severity
    FROM claims c
    JOIN riders r ON c.rider_id = r.id
    JOIN disruptions d ON c.disruption_id = d.id
    ORDER BY c.created_at DESC LIMIT 50
  `).all();
  res.json(claims);
});

// Admin: clear stale/fake disruptions older than 6 hours
router.post('/admin/clear-stale', authMiddleware, adminOnly, (req, res) => {
  // Mark disruptions older than 6 hours as resolved
  const result = db.prepare(`
    UPDATE disruptions SET status = 'resolved', resolved_at = datetime('now')
    WHERE status = 'active' AND triggered_at < datetime('now', '-6 hours')
  `).run();
  // Also clear disruptions that have no matching real weather threshold
  // (i.e. fake ones created by old mock monitor)
  const result2 = db.prepare(`
    UPDATE disruptions SET status = 'resolved', resolved_at = datetime('now')
    WHERE status = 'active'
    AND source IN ('OpenWeatherMap API', 'OpenAQ / CPCB API', 'NDMA Alert Feed', 'News API + Admin Flag')
  `).run();
  res.json({ success: true, message: `Cleared ${result.changes + result2.changes} stale disruptions` });
});
router.get('/admin/live-conditions', authMiddleware, adminOnly, async (req, res) => {
  const { fetchWeatherData, fetchAQIData } = require('../services/disruptionMonitor');
  const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad'];
  try {
    const results = await Promise.allSettled(
      cities.map(async city => {
        const [weather, aqi] = await Promise.all([fetchWeatherData(city), fetchAQIData(city)]);
        return { city, weather, aqi };
      })
    );
    res.json(results.map((r, i) => r.status === 'fulfilled' ? r.value : { city: cities[i], error: r.reason?.message }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: zone risk map
router.get('/admin/zone-risk', authMiddleware, adminOnly, (req, res) => {
  const zones = db.prepare(`
    SELECT 
      z.pincode, z.zone, z.city, z.risk_score,
      COUNT(DISTINCT CASE WHEN p.status = 'active' AND p.end_date >= date('now') THEN p.id END) as activePolicies,
      COUNT(DISTINCT CASE WHEN c.status IN ('approved','under_review') THEN c.id END) as activeClaims,
      COALESCE(SUM(CASE WHEN c.status IN ('approved','paid') THEN c.payout_amount ELSE 0 END), 0) as totalPayouts,
      COALESCE(SUM(CASE WHEN p2.status != 'cancelled' THEN p2.premium ELSE 0 END), 0) as totalPremiums
    FROM zone_risk z
    LEFT JOIN riders r ON r.pincode = z.pincode AND r.role = 'rider'
    LEFT JOIN policies p ON p.rider_id = r.id
    LEFT JOIN policies p2 ON p2.rider_id = r.id
    LEFT JOIN claims c ON c.rider_id = r.id AND c.created_at >= date('now', '-7 days')
    GROUP BY z.pincode
    ORDER BY z.risk_score DESC
  `).all();

  const result = zones.map(z => ({
    ...z,
    lossRatio: z.totalPremiums > 0 ? ((z.totalPayouts / z.totalPremiums) * 100).toFixed(1) : '0.0'
  }));

  res.json(result);
});

// Admin: ring detection alerts
router.get('/admin/ring-alerts', authMiddleware, adminOnly, (req, res) => {
  const alerts = db.prepare(`
    SELECT ra.*, d.type as disruption_type, d.city, d.zone, d.triggered_at as disruption_time
    FROM ring_alerts ra
    JOIN disruptions d ON ra.disruption_id = d.id
    ORDER BY ra.created_at DESC
    LIMIT 20
  `).all();
  res.json(alerts);
});

// AI: Generate pricing explanation using Gemini
router.post('/ai/explain-pricing', authMiddleware, async (req, res) => {
  const { plan, finalPremium, basePremium, zoneLabel, zoneMultiplier, seasonLabel, seasonalFactor, city, zone } = req.body;
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are KamaiShield's AI pricing assistant for Indian gig delivery workers.
Explain in 2-3 short sentences (plain English + 1 Hindi phrase) why this rider's premium is ₹${finalPremium}/week.
Facts: Base ₹${basePremium}, Zone: ${zone} ${city} (${zoneLabel}, ${zoneMultiplier}× multiplier), Season: ${seasonLabel} (${seasonalFactor}× factor), Plan: ${plan}.
Be warm, honest, and specific. End with a reassuring Hindi phrase like "Aap surakshit hain ✅".`;

    const result = await model.generateContent(prompt);
    res.json({ explanation: result.response.text() });
  } catch (err) {
    console.error('[AI] Gemini error:', err.message);
    // Fallback explanation
    const diff = finalPremium - basePremium;
    res.json({
      explanation: `Your ₹${finalPremium}/week premium is based on your zone's ${zoneLabel} risk profile${diff > 0 ? ` (+₹${diff} adjustment)` : ''}. ${seasonLabel !== 'Normal' ? `The ${seasonLabel} season adds a small adjustment for higher disruption probability. ` : ''}Your coverage activates automatically when disruptions hit your zone. Aap surakshit hain ✅`
    });
  }
});

// AI: Explain claim BTS score
router.post('/ai/explain-claim', authMiddleware, async (req, res) => {
  const { btsScore, tier, signals, disruptionType } = req.body;
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const suspiciousSignals = (signals || []).filter(s => s.is_suspicious).map(s => s.signal_name).join(', ');
    const prompt = `You are KamaiShield's fraud detection AI explaining a claim result to a delivery rider.
BTS Score: ${btsScore}/100, Tier: ${tier} (${tier === 1 ? 'Auto-Approved' : tier === 2 ? 'Under Review' : 'Flagged'}), Disruption: ${disruptionType}.
${suspiciousSignals ? `Suspicious signals: ${suspiciousSignals}.` : 'All signals look genuine.'}
Explain in 2 sentences what this means for the rider in simple, non-technical language. Be empathetic. If flagged, explain what they can do.`;

    const result = await model.generateContent(prompt);
    res.json({ explanation: result.response.text() });
  } catch (err) {
    res.json({ explanation: tier === 1 ? 'Your claim looks genuine — all fraud checks passed. Your payout will be included in Sunday\'s transfer.' : tier === 2 ? 'Your claim is under a quick background review. No action needed — this usually resolves within 4 hours.' : 'Your claim needs location verification. Tap "Share Live Location" to resolve this quickly.' });
  }
});

// ── UNIT ECONOMICS ────────────────────────────────────────────────────────
router.get('/admin/unit-economics', authMiddleware, adminOnly, (req, res) => {
  try {
    // Core premium / payout aggregates
    const premiumData = db.prepare(`
      SELECT
        AVG(premium) as avg_prem,
        COUNT(*) as total_policies,
        COUNT(DISTINCT rider_id) as unique_riders,
        SUM(premium) as total_premiums
      FROM policies
    `).get();

    const payoutData = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total_payouts
      FROM payouts WHERE status = 'processed'
    `).get();

    const activePolicies = db.prepare(`
      SELECT COUNT(*) as c FROM policies
      WHERE status = 'active' AND end_date >= date('now')
    `).get().c;

    const claimData = db.prepare(`
      SELECT
        COUNT(*) as total_claims,
        COALESCE(SUM(payout_amount), 0) as total_claim_payouts
      FROM claims WHERE status IN ('approved', 'paid')
    `).get();

    // Retention rate: riders with more than 1 policy / total riders
    const retentionData = db.prepare(`
      SELECT
        COUNT(*) as total_riders,
        SUM(CASE WHEN policy_count > 1 THEN 1 ELSE 0 END) as returning_riders
      FROM (
        SELECT rider_id, COUNT(*) as policy_count FROM policies GROUP BY rider_id
      )
    `).get();

    const avgPremium    = parseFloat((premiumData.avg_prem || 52).toFixed(2));
    const totalPremiums = parseFloat((premiumData.total_premiums || 0).toFixed(2));
    const totalPayouts  = parseFloat((payoutData.total_payouts || 0).toFixed(2));
    const totalClaims   = claimData.total_claims || 0;
    const totalPolicies = premiumData.total_policies || 0;
    const uniqueRiders  = premiumData.unique_riders || 1;

    // Retention rate
    const retentionRate = retentionData.total_riders > 0
      ? parseFloat((retentionData.returning_riders / retentionData.total_riders).toFixed(3))
      : 0.68;

    // Average policy weeks (assume each policy = 1 week; count policies per rider)
    const avgPolicyWeeks = uniqueRiders > 0
      ? parseFloat((totalPolicies / uniqueRiders).toFixed(2))
      : 4.7;

    // LTV = avg_premium × avg_policy_weeks × retention_rate
    const ltv = parseFloat((avgPremium * avgPolicyWeeks * retentionRate).toFixed(2));

    // Loss ratio
    const lossRatio = totalPremiums > 0
      ? parseFloat(((totalPayouts / totalPremiums) * 100).toFixed(1))
      : 0;

    const expenseRatio   = 15; // assumed 15%
    const combinedRatio  = parseFloat((lossRatio + expenseRatio).toFixed(1));
    const breakEvenLossRatio = 85;

    // MRR = active_policies × avg_premium × 4.33 (weeks/month)
    const mrr = parseFloat((activePolicies * avgPremium * 4.33).toFixed(2));
    const arr = parseFloat((mrr * 12).toFixed(2));

    // Reserve adequacy: current reserve / estimated next week payout
    // Estimate next week payout from predictive engine (simplified: avg weekly payout)
    const weeklyPayoutData = db.prepare(`
      SELECT COALESCE(AVG(weekly_total), 0) as avg_weekly
      FROM (
        SELECT strftime('%W-%Y', created_at) as wk, SUM(payout_amount) as weekly_total
        FROM claims WHERE status IN ('approved','paid')
        GROUP BY wk
      )
    `).get();
    const estimatedNextWeekPayout = parseFloat((weeklyPayoutData.avg_weekly || 1).toFixed(2));
    const currentReserve = parseFloat((totalPremiums - totalPayouts).toFixed(2));
    const reserveAdequacy = estimatedNextWeekPayout > 0
      ? parseFloat((currentReserve / estimatedNextWeekPayout).toFixed(2))
      : 0;

    // Claims frequency
    const claimsFrequency = totalPolicies > 0
      ? parseFloat(((totalClaims / totalPolicies) * 100).toFixed(1))
      : 0;

    // Average claim size
    const avgClaimSize = totalClaims > 0
      ? parseFloat((claimData.total_claim_payouts / totalClaims).toFixed(2))
      : 0;

    // Solvency margin
    const solvencyMargin = parseFloat((totalPremiums - totalPayouts).toFixed(2));

    res.json({
      ltv,
      avgPremium,
      avgPolicyWeeks,
      retentionRate,
      lossRatio,
      combinedRatio,
      breakEvenLossRatio,
      mrr,
      arr,
      reserveAdequacy,
      claimsFrequency,
      avgClaimSize,
      solvencyMargin,
      totalPremiumsCollected: totalPremiums,
      totalPayoutsMade: totalPayouts,
      activePolicies,
      expenseRatio,
    });
  } catch (err) {
    console.error('[unit-economics]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// ── PREDICTIVE ANALYTICS ──────────────────────────────────────────────────
const { getPredictiveRisk, getWeeklySummary, getFraudInsights } = require('../services/analyticsEngine');

router.get('/admin/analytics/predictive', authMiddleware, adminOnly, (req, res) => {
  res.json(getPredictiveRisk());
});

router.get('/admin/analytics/weekly', authMiddleware, adminOnly, (req, res) => {
  res.json(getWeeklySummary());
});

router.get('/admin/analytics/fraud', authMiddleware, adminOnly, (req, res) => {
  res.json(getFraudInsights());
});

// ── RIDER: Update profile ──────────────────────────────────────────────────
const { sanitizeString } = require('../middleware/auth');

// Get policy exclusions
router.get('/policies/exclusions', (req, res) => {
  const { EXCLUSIONS } = require('../services/riskEngine');
  res.json({ exclusions: EXCLUSIONS });
});

router.patch('/rider/profile', authMiddleware, (req, res) => {
  const { upi_id, avg_hourly_earnings, hours_per_day } = req.body;
  const updates = {};

  if (upi_id) {
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(upi_id)) {
      return res.status(400).json({ error: 'Invalid UPI ID format' });
    }
    updates.upi_id = sanitizeString(upi_id, 80);
  }

  if (avg_hourly_earnings !== undefined) {
    const earn = parseFloat(avg_hourly_earnings);
    if (isNaN(earn) || earn < 10 || earn > 10000) return res.status(400).json({ error: 'Earnings must be ₹10–₹10,000' });
    updates.avg_hourly_earnings = earn;
  }

  if (hours_per_day !== undefined) {
    const h = parseFloat(hours_per_day);
    if (isNaN(h) || h < 1 || h > 24) return res.status(400).json({ error: 'Hours must be 1–24' });
    updates.hours_per_day = h;
  }

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE riders SET ${setClause} WHERE id = ?`).run(...Object.values(updates), req.user.id);

  res.json({ success: true, message: 'Profile updated' });
});
