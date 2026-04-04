const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

// ── DISRUPTION THRESHOLDS ─────────────────────────────────────────────────
const TRIGGERS = {
  HEAVY_RAIN: {
    label: 'Heavy Rainfall',
    threshold: 15,
    unit: 'mm/hr',
    source: 'OpenWeatherMap API',
    icon: '🌧️',
    hoursAffected: { min: 2, max: 5 }
  },
  SEVERE_AQI: {
    label: 'Severe Air Pollution',
    threshold: 400,
    unit: 'AQI',
    source: 'OpenAQ / CPCB API',
    icon: '😷',
    hoursAffected: { min: 4, max: 8 }
  },
  EXTREME_HEAT: {
    label: 'Extreme Heat Advisory',
    threshold: 45,
    unit: '°C (feels-like)',
    source: 'OpenWeatherMap API',
    icon: '🔥',
    hoursAffected: { min: 3, max: 5 }
  },
  FLOOD_ALERT: {
    label: 'Flood / Disaster Alert',
    threshold: 1,
    unit: 'advisory issued',
    source: 'NDMA Alert Feed',
    icon: '🌊',
    hoursAffected: { min: 6, max: 12 }
  },
  CIVIC_DISRUPTION: {
    label: 'Civic Disruption',
    threshold: 1,
    unit: 'restriction active',
    source: 'News API + Admin Flag',
    icon: '🚫',
    hoursAffected: { min: 4, max: 10 }
  }
};

// ── MOCK WEATHER/API DATA (replaces real API calls for demo) ─────────────
// In production: replace with real OpenWeatherMap + OpenAQ + NDMA calls
function fetchMockDisruptionData(pincode, city) {
  // Simulate realistic environmental data per city
  const profiles = {
    'Delhi': {
      aqi: () => Math.random() > 0.4 ? 350 + Math.random() * 200 : 150 + Math.random() * 100,
      rain: () => Math.random() > 0.7 ? 18 + Math.random() * 30 : Math.random() * 10,
      temp: () => Math.random() > 0.5 ? 38 + Math.random() * 10 : 28 + Math.random() * 8,
    },
    'Mumbai': {
      aqi: () => 80 + Math.random() * 120,
      rain: () => Math.random() > 0.5 ? 20 + Math.random() * 40 : Math.random() * 8,
      temp: () => 28 + Math.random() * 8,
    },
    'Chennai': {
      aqi: () => 70 + Math.random() * 100,
      rain: () => Math.random() > 0.6 ? 15 + Math.random() * 35 : Math.random() * 8,
      temp: () => 32 + Math.random() * 10,
    },
    'Bengaluru': {
      aqi: () => 60 + Math.random() * 80,
      rain: () => Math.random() > 0.6 ? 12 + Math.random() * 20 : Math.random() * 6,
      temp: () => 25 + Math.random() * 8,
    },
    'Hyderabad': {
      aqi: () => 90 + Math.random() * 120,
      rain: () => Math.random() > 0.65 ? 14 + Math.random() * 25 : Math.random() * 7,
      temp: () => 30 + Math.random() * 10,
    }
  };

  const profile = profiles[city] || profiles['Mumbai'];
  return {
    aqi: Math.round(profile.aqi()),
    rain: parseFloat(profile.rain().toFixed(1)),
    temp: parseFloat(profile.temp().toFixed(1)),
    floodAlert: Math.random() > 0.92,
    civicAlert: Math.random() > 0.95
  };
}

// ── FIRE A DISRUPTION EVENT ───────────────────────────────────────────────
function fireDisruption(type, pincode, city, zone, value, threshold, unit) {
  // Check if same disruption already active in this zone
  const existing = db.prepare(`
    SELECT id FROM disruptions
    WHERE type = ? AND pincode = ? AND status = 'active'
    AND triggered_at >= datetime('now', '-2 hours')
  `).get(type, pincode);

  if (existing) return null; // Already active, skip

  const trigger = TRIGGERS[type];
  const severity = value > threshold * 1.5 ? 'CRITICAL' : value > threshold * 1.2 ? 'HIGH' : 'MODERATE';

  const disruption = {
    id: uuidv4(),
    type,
    subtype: trigger.label,
    city,
    pincode,
    zone,
    severity,
    description: `${trigger.icon} ${trigger.label} detected in ${zone}, ${city}. Value: ${value} ${unit} (threshold: ${threshold} ${unit})`,
    value,
    threshold,
    unit,
    source: trigger.source
  };

  db.prepare(`
    INSERT INTO disruptions (id, type, subtype, city, pincode, zone, severity, description, value, threshold, unit, source)
    VALUES (@id, @type, @subtype, @city, @pincode, @zone, @severity, @description, @value, @threshold, @unit, @source)
  `).run(disruption);

  // Auto-create claims for all active policyholders in this zone
  const activePolicies = db.prepare(`
    SELECT p.*, r.pincode as rider_pincode, r.city as rider_city
    FROM policies p
    JOIN riders r ON p.rider_id = r.id
    WHERE p.status = 'active'
    AND p.end_date >= date('now')
    AND r.pincode = ?
  `).all(pincode);

  let claimsCreated = 0;
  for (const policy of activePolicies) {
    const hours = parseFloat((Math.random() * (trigger.hoursAffected.max - trigger.hoursAffected.min) + trigger.hoursAffected.min).toFixed(1));
    const rider = db.prepare(`SELECT * FROM riders WHERE id = ?`).get(policy.rider_id);
    const avgHourly = rider.avg_hourly_earnings || 100;
    const rawPayout = avgHourly * hours * policy.coverage_pct;
    const finalPayout = Math.min(rawPayout, policy.coverage_cap);

    // Run fraud check
    const { computeBTS } = require('./fraudEngine');
    const { btsScore, tier, tierLabel, tierAction } = computeBTS(rider, disruption);

    let claimStatus = 'approved';
    if (tier === 2) claimStatus = 'under_review';
    if (tier === 3) claimStatus = 'flagged';

    const claimId = uuidv4();
    db.prepare(`
      INSERT INTO claims (id, policy_id, rider_id, disruption_id, hours_affected, payout_amount, bts_score, fraud_tier, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(claimId, policy.id, policy.rider_id, disruption.id, hours, Math.round(finalPayout), btsScore, tier, claimStatus);

    // Create alert for rider
    db.prepare(`
      INSERT INTO disruption_alerts (id, rider_id, disruption_id, message)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), policy.rider_id, disruption.id,
      `${trigger.icon} Disruption detected in your zone! ${trigger.label} — ₹${Math.round(finalPayout)} has been ${claimStatus === 'approved' ? 'added to your weekly payout' : 'flagged for review'}.`
    );

    claimsCreated++;
  }

  console.log(`[DISRUPTION] ${type} in ${zone}, ${city} (${pincode}) → ${claimsCreated} claims created`);
  return { disruption, claimsCreated };
}

// ── MANUALLY TRIGGER A DISRUPTION (for demo/admin use) ───────────────────
function triggerManualDisruption(type, pincode, city, zone) {
  const trigger = TRIGGERS[type];
  const overValue = trigger.threshold * (1.2 + Math.random() * 0.5);
  return fireDisruption(type, pincode, city, zone, Math.round(overValue * 10) / 10, trigger.threshold, trigger.unit);
}

// ── CRON: CHECK DISRUPTIONS EVERY 5 MINUTES ──────────────────────────────
function startDisruptionMonitor() {
  console.log('[MONITOR] Disruption monitor started — checking every 5 minutes');

  cron.schedule('*/5 * * * *', () => {
    const zones = db.prepare(`SELECT DISTINCT pincode, city, zone FROM zone_risk`).all();

    for (const z of zones) {
      const data = fetchMockDisruptionData(z.pincode, z.city);

      if (data.rain >= TRIGGERS.HEAVY_RAIN.threshold) {
        fireDisruption('HEAVY_RAIN', z.pincode, z.city, z.zone, data.rain, TRIGGERS.HEAVY_RAIN.threshold, TRIGGERS.HEAVY_RAIN.unit);
      }
      if (data.aqi >= TRIGGERS.SEVERE_AQI.threshold) {
        fireDisruption('SEVERE_AQI', z.pincode, z.city, z.zone, data.aqi, TRIGGERS.SEVERE_AQI.threshold, TRIGGERS.SEVERE_AQI.unit);
      }
      if (data.temp >= TRIGGERS.EXTREME_HEAT.threshold) {
        fireDisruption('EXTREME_HEAT', z.pincode, z.city, z.zone, data.temp, TRIGGERS.EXTREME_HEAT.threshold, TRIGGERS.EXTREME_HEAT.unit);
      }
      if (data.floodAlert) {
        fireDisruption('FLOOD_ALERT', z.pincode, z.city, z.zone, 1, 1, TRIGGERS.FLOOD_ALERT.unit);
      }
      if (data.civicAlert) {
        fireDisruption('CIVIC_DISRUPTION', z.pincode, z.city, z.zone, 1, 1, TRIGGERS.CIVIC_DISRUPTION.unit);
      }
    }
  });

  // SUNDAY PAYOUT PROCESSING (every Sunday at 11:30 PM)
  cron.schedule('30 23 * * 0', () => {
    processWeeklyPayouts();
  });
}

// ── WEEKLY PAYOUT PROCESSING ──────────────────────────────────────────────
function processWeeklyPayouts() {
  console.log('[PAYOUT] Processing weekly payouts...');

  const riders = db.prepare(`SELECT DISTINCT rider_id FROM claims WHERE status = 'approved' AND created_at >= date('now', '-7 days')`).all();

  for (const { rider_id } of riders) {
    const rider = db.prepare(`SELECT * FROM riders WHERE id = ?`).get(rider_id);
    const approvedClaims = db.prepare(`
      SELECT * FROM claims
      WHERE rider_id = ? AND status = 'approved'
      AND created_at >= date('now', '-7 days')
    `).all(rider_id);

    if (!approvedClaims.length) continue;

    const totalAmount = approvedClaims.reduce((sum, c) => sum + c.payout_amount, 0);
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekEnd = new Date().toISOString().split('T')[0];

    // Simulate Razorpay payout
    const payoutId = uuidv4();
    db.prepare(`
      INSERT INTO payouts (id, rider_id, week_start, week_end, total_claims, total_amount, status, upi_id, processed_at)
      VALUES (?, ?, ?, ?, ?, ?, 'processed', ?, datetime('now'))
    `).run(payoutId, rider_id, weekStart, weekEnd, approvedClaims.length, Math.round(totalAmount), rider.upi_id);

    // Mark claims as paid
    db.prepare(`UPDATE claims SET status = 'paid' WHERE rider_id = ? AND status = 'approved' AND created_at >= date('now', '-7 days')`).run(rider_id);

    console.log(`[PAYOUT] ₹${Math.round(totalAmount)} → ${rider.upi_id} (${approvedClaims.length} claims)`);
  }
}

module.exports = { startDisruptionMonitor, triggerManualDisruption, processWeeklyPayouts, TRIGGERS, fetchMockDisruptionData };
