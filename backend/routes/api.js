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

// Get rider alerts
router.get('/alerts/my', authMiddleware, (req, res) => {
  const alerts = db.prepare(`
    SELECT a.*, d.type, d.severity
    FROM disruption_alerts a
    JOIN disruptions d ON a.disruption_id = d.id
    WHERE a.rider_id = ?
    ORDER BY a.created_at DESC LIMIT 10
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
  if (!result) return res.json({ success: false, message: 'Disruption already active in this zone' });
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

// Admin: seed demo data
router.post('/admin/seed-demo', authMiddleware, adminOnly, (req, res) => {
  const bcrypt = require('bcryptjs');
  const demoRiders = [
    { name: 'Raju Verma', phone: '9111111111', platform: 'Swiggy', city: 'Mumbai', pincode: '400070', zone: 'Kurla', upi: 'raju@upi', earn: 110 },
    { name: 'Priya Sharma', phone: '9222222222', platform: 'Blinkit', city: 'Delhi', pincode: '110092', zone: 'Shahdara', upi: 'priya@upi', earn: 95 },
    { name: 'Arjun Nair', phone: '9333333333', platform: 'Zomato', city: 'Bengaluru', pincode: '560034', zone: 'Koramangala', upi: 'arjun@upi', earn: 120 },
    { name: 'Fatima Khan', phone: '9444444444', platform: 'Amazon', city: 'Hyderabad', pincode: '500032', zone: 'Gachibowli', upi: 'fatima@upi', earn: 90 },
    { name: 'Suresh Babu', phone: '9555555555', platform: 'Zepto', city: 'Chennai', pincode: '600028', zone: 'T. Nagar', upi: 'suresh@upi', earn: 100 },
  ];

  const hash = bcrypt.hashSync('demo123', 10);
  const { calculatePremium } = require('../services/riskEngine');

  const insertRider = db.transaction(() => {
    for (const r of demoRiders) {
      const existing = db.prepare(`SELECT id FROM riders WHERE phone = ?`).get(r.phone);
      if (existing) continue;

      const riderId = uuidv4();
      db.prepare(`INSERT INTO riders (id, name, phone, password, platform, city, pincode, zone, upi_id, avg_hourly_earnings) VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .run(riderId, r.name, r.phone, hash, r.platform, r.city, r.pincode, r.zone, r.upi, r.earn);

      // Give them a standard policy
      const pricing = calculatePremium('standard', r.pincode, r.city);
      const policyId = uuidv4();
      const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      db.prepare(`INSERT INTO policies (id, rider_id, plan, premium, base_premium, coverage_cap, coverage_pct, zone_risk_score, seasonal_factor, start_date, end_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
        .run(policyId, riderId, 'standard', pricing.finalPremium, pricing.basePremium, pricing.coverageCap, pricing.coveragePct, pricing.zoneMultiplier, pricing.seasonalFactor, startDate, endDate);
    }
  });

  insertRider();

  // Trigger a couple of disruptions
  triggerManualDisruption('HEAVY_RAIN', '400070', 'Mumbai', 'Kurla');
  triggerManualDisruption('SEVERE_AQI', '110092', 'Delhi', 'Shahdara');

  res.json({ success: true, message: '5 demo riders + policies + disruptions seeded!' });
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
