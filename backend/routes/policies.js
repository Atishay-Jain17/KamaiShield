const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { calculatePremium, getAllQuotes } = require('../services/riskEngine');

// ── GET QUOTES ─────────────────────────────────────────────────────────────
router.get('/quotes', authMiddleware, (req, res) => {
  const rider = db.prepare(`SELECT * FROM riders WHERE id = ?`).get(req.user.id);
  const quotes = getAllQuotes(rider.pincode, rider.city);
  const zoneInfo = db.prepare(`SELECT * FROM zone_risk WHERE pincode = ?`).get(rider.pincode);
  res.json({ quotes, zoneInfo, rider: { city: rider.city, pincode: rider.pincode, zone: rider.zone } });
});

// ── BUY POLICY ─────────────────────────────────────────────────────────────
router.post('/buy', authMiddleware, (req, res) => {
  const { plan } = req.body;
  if (!['basic', 'standard', 'pro'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });

  const rider = db.prepare(`SELECT * FROM riders WHERE id = ?`).get(req.user.id);

  // Cancel existing active policy
  db.prepare(`UPDATE policies SET status = 'cancelled' WHERE rider_id = ? AND status = 'active'`).run(req.user.id);

  const pricing = calculatePremium(plan, rider.pincode, rider.city);

  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const id = uuidv4();
  db.prepare(`
    INSERT INTO policies (id, rider_id, plan, premium, base_premium, coverage_cap, coverage_pct, zone_risk_score, seasonal_factor, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, plan, pricing.finalPremium, pricing.basePremium, pricing.coverageCap, pricing.coveragePct, pricing.zoneMultiplier, pricing.seasonalFactor, startDate, endDate);

  res.json({
    success: true,
    policy: { id, plan, ...pricing, startDate, endDate, status: 'active' },
    message: `${pricing.emoji} ${pricing.planName} activated! Coverage: ₹${pricing.coverageCap}/week at ₹${pricing.finalPremium}/week`
  });
});

// ── GET MY POLICIES ────────────────────────────────────────────────────────
router.get('/my', authMiddleware, (req, res) => {
  const policies = db.prepare(`
    SELECT * FROM policies WHERE rider_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(req.user.id);
  res.json(policies);
});

// ── GET ACTIVE POLICY ──────────────────────────────────────────────────────
router.get('/active', authMiddleware, (req, res) => {
  const policy = db.prepare(`
    SELECT * FROM policies WHERE rider_id = ? AND status = 'active' AND end_date >= date('now')
    ORDER BY created_at DESC LIMIT 1
  `).get(req.user.id);

  if (!policy) return res.json({ active: false });

  const claimsThisWeek = db.prepare(`
    SELECT COUNT(*) as count, SUM(payout_amount) as total
    FROM claims WHERE policy_id = ? AND status IN ('approved', 'paid', 'under_review')
  `).get(policy.id);

  res.json({ active: true, policy, claimsThisWeek });
});

module.exports = router;
