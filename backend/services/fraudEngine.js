const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// ── BEHAVIOURAL TRUTH SCORE (BTS) ─────────────────────────────────────────
// Score 0-100. Higher = more genuine. Below 55 = flag. Below 30 = reject.

function computeBTS(rider, disruption, claimData = {}) {
  const signals = [];
  let totalScore = 0;
  let maxScore = 0;

  // ── Signal 1: GPS Coordinates Match (20 pts) ──────────────────────────
  const gpsMatch = rider.pincode === disruption.pincode;
  const gpsScore = gpsMatch ? 20 : 0;
  signals.push({
    name: 'gps_coordinates',
    label: 'GPS Zone Match',
    score: gpsScore,
    max: 20,
    isSuspicious: !gpsMatch,
    detail: gpsMatch
      ? `Rider pincode ${rider.pincode} matches disruption zone`
      : `Rider pincode ${rider.pincode} doesn't match disruption zone ${disruption.pincode}`
  });
  totalScore += gpsScore; maxScore += 20;

  // ── Signal 2: GPS Signal Quality (15 pts) ────────────────────────────
  // In bad weather, GPS quality drops. Perfect GPS in heavy rain = suspicious.
  const gpsQuality = claimData.gpsQuality || (Math.random() * 40 + 60); // simulate 60-100
  const isRainEvent = ['HEAVY_RAIN', 'FLOOD'].includes(disruption.type);
  let gpsQualityScore;
  let gpsQualitySuspicious = false;

  if (isRainEvent && gpsQuality > 95) {
    // Perfect GPS signal during heavy rain = suspicious (spoofer)
    gpsQualityScore = 5;
    gpsQualitySuspicious = true;
  } else if (isRainEvent && gpsQuality < 85) {
    // Degraded GPS in rain = genuine
    gpsQualityScore = 15;
  } else {
    gpsQualityScore = 10;
  }

  signals.push({
    name: 'gps_signal_quality',
    label: 'GPS Signal Quality',
    score: gpsQualityScore,
    max: 15,
    isSuspicious: gpsQualitySuspicious,
    detail: `Signal strength: ${gpsQuality.toFixed(1)}% — ${gpsQualitySuspicious ? 'Suspiciously perfect during weather event' : 'Normal for conditions'}`
  });
  totalScore += gpsQualityScore; maxScore += 15;

  // ── Signal 3: Device Accelerometer (15 pts) ───────────────────────────
  // Genuine rider: some movement (sheltering, shifting). Spoofer: perfectly still.
  const movement = claimData.accelerometerMovement || (Math.random() * 0.8 + 0.1); // 0-1
  const isStill = movement < 0.05;
  const accelScore = isStill ? 3 : 15;

  signals.push({
    name: 'accelerometer',
    label: 'Device Movement',
    score: accelScore,
    max: 15,
    isSuspicious: isStill,
    detail: `Movement index: ${(movement * 100).toFixed(0)}% — ${isStill ? 'Completely stationary (possible home/spoofing)' : 'Natural movement detected'}`
  });
  totalScore += accelScore; maxScore += 15;

  // ── Signal 4: Cell Tower Location (20 pts) ────────────────────────────
  // Cell towers can't be spoofed via GPS apps. Most reliable signal.
  const cellTowerMatch = claimData.cellTowerMatch ?? (Math.random() > 0.15); // 85% genuine
  const cellScore = cellTowerMatch ? 20 : 0;

  signals.push({
    name: 'cell_tower',
    label: 'Cell Tower Location',
    score: cellScore,
    max: 20,
    isSuspicious: !cellTowerMatch,
    detail: cellTowerMatch
      ? `Cell tower confirms rider is in ${disruption.zone}`
      : `Cell tower places rider OUTSIDE disruption zone — possible GPS spoof`
  });
  totalScore += cellScore; maxScore += 20;

  // ── Signal 5: Platform App Heartbeat (15 pts) ─────────────────────────
  // Genuine rider: marked Online/Waiting on delivery platform. Spoofer: offline.
  const platformOnline = claimData.platformOnline ?? (Math.random() > 0.1);
  const heartbeatScore = platformOnline ? 15 : 2;

  signals.push({
    name: 'platform_heartbeat',
    label: 'Platform App Status',
    score: heartbeatScore,
    max: 15,
    isSuspicious: !platformOnline,
    detail: platformOnline
      ? `Rider marked Online/Waiting on ${rider.platform} during disruption`
      : `Rider was OFFLINE on ${rider.platform} during the disruption period`
  });
  totalScore += heartbeatScore; maxScore += 15;

  // ── Signal 6: Battery & Screen Activity (15 pts) ──────────────────────
  // Spoofer actively running spoofing app = unusually high screen-on time & battery drain
  const screenOnTime = claimData.screenOnTime || (Math.random() * 0.7 + 0.1); // 0-1
  const isSuspiciousScreen = screenOnTime > 0.85; // Very high screen on time
  const screenScore = isSuspiciousScreen ? 3 : 15;

  signals.push({
    name: 'battery_screen',
    label: 'Battery & Screen Activity',
    score: screenScore,
    max: 15,
    isSuspicious: isSuspiciousScreen,
    detail: `Screen-on: ${(screenOnTime * 100).toFixed(0)}% — ${isSuspiciousScreen ? 'Unusually high (possible spoofing app active)' : 'Normal usage pattern'}`
  });
  totalScore += screenScore; maxScore += 15;

  // ── FINAL BTS SCORE ───────────────────────────────────────────────────
  const btsScore = Math.round((totalScore / maxScore) * 100);

  let tier, tierLabel, tierAction;
  if (btsScore >= 55) {
    tier = 1;
    tierLabel = 'Auto-Approve';
    tierAction = 'Claim approved. Added to weekly payout ledger.';
  } else if (btsScore >= 30) {
    tier = 2;
    tierLabel = 'Soft Review';
    tierAction = 'Silent 3-hour background review. ₹20 goodwill bonus if cleared.';
  } else {
    tier = 3;
    tierLabel = 'Hard Flag';
    tierAction = 'One-tap live location ping required from rider.';
  }

  return { btsScore, tier, tierLabel, tierAction, signals, totalScore, maxScore };
}

// ── RING DETECTION ────────────────────────────────────────────────────────
function detectRing(disruptionId, newClaimRiderId) {
  const recentClaims = db.prepare(`
    SELECT c.*, r.platform, r.pincode
    FROM claims c
    JOIN riders r ON c.rider_id = r.id
    WHERE c.disruption_id = ?
    AND c.created_at >= datetime('now', '-10 minutes')
  `).all(disruptionId);

  const flags = [];

  // Check 1: Temporal spike (50+ claims in 4 min window)
  if (recentClaims.length > 15) {
    flags.push({
      type: 'TEMPORAL_SPIKE',
      severity: 'HIGH',
      detail: `${recentClaims.length} claims in <10 minutes for this disruption. Possible coordinated fraud ring.`
    });
  }

  // Check 2: Platform homogeneity (all same platform = suspicious)
  const platforms = recentClaims.map(c => c.platform);
  const uniquePlatforms = [...new Set(platforms)];
  if (recentClaims.length > 5 && uniquePlatforms.length === 1) {
    flags.push({
      type: 'PLATFORM_HOMOGENEITY',
      severity: 'MEDIUM',
      detail: `All ${recentClaims.length} claims are from ${uniquePlatforms[0]} riders only. Genuine events show multi-platform distribution.`
    });
  }

  // Check 3: Historical baseline deviation
  const historicalAvg = db.prepare(`
    SELECT AVG(claim_count) as avg FROM (
      SELECT COUNT(*) as claim_count
      FROM claims c2
      JOIN disruptions d ON c2.disruption_id = d.id
      WHERE d.pincode = (SELECT pincode FROM disruptions WHERE id = ?)
      AND c2.created_at < datetime('now', '-7 days')
      GROUP BY c2.disruption_id
    )
  `).get(disruptionId);

  const avgClaims = historicalAvg?.avg || 5;
  if (recentClaims.length > avgClaims * 5) {
    flags.push({
      type: 'BASELINE_DEVIATION',
      severity: 'HIGH',
      detail: `${recentClaims.length} claims vs historical avg of ${Math.round(avgClaims)}. ${Math.round(recentClaims.length / avgClaims)}x above baseline.`
    });
  }

  return {
    isRingAlert: flags.length > 0,
    flags,
    claimsInWindow: recentClaims.length
  };
}

// ── SAVE FRAUD SIGNALS TO DB ──────────────────────────────────────────────
function saveFraudSignals(claimId, signals) {
  const insert = db.prepare(`
    INSERT INTO fraud_signals (id, claim_id, signal_name, signal_value, is_suspicious, detail)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((sigs) => {
    for (const s of sigs) {
      insert.run(uuidv4(), claimId, s.name, s.score, s.isSuspicious ? 1 : 0, s.detail);
    }
  });

  insertMany(signals);
}

module.exports = { computeBTS, detectRing, saveFraudSignals };
