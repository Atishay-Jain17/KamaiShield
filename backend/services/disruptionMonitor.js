require('dotenv').config();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const axios = require('axios');

// ── DISRUPTION THRESHOLDS ─────────────────────────────────────────────────
const TRIGGERS = {
  HEAVY_RAIN: {
    label: 'Heavy Rainfall',
    threshold: 15,
    unit: 'mm/hr',
    source: 'WeatherAPI.com',
    icon: '🌧️',
    hoursAffected: { min: 2, max: 5 }
  },
  SEVERE_AQI: {
    label: 'Severe Air Pollution',
    threshold: 400,
    unit: 'AQI',
    source: 'OpenAQ API',
    icon: '😷',
    hoursAffected: { min: 4, max: 8 }
  },
  EXTREME_HEAT: {
    label: 'Extreme Heat Advisory',
    threshold: 45,
    unit: '°C (feels-like)',
    source: 'WeatherAPI.com',
    icon: '🔥',
    hoursAffected: { min: 3, max: 5 }
  },
  FLOOD_ALERT: {
    label: 'Flood / Disaster Alert',
    threshold: 1,
    unit: 'advisory issued',
    source: 'OpenWeatherMap',
    icon: '🌊',
    hoursAffected: { min: 6, max: 12 }
  },
  CIVIC_DISRUPTION: {
    label: 'Civic Disruption',
    threshold: 1,
    unit: 'restriction active',
    source: 'Admin Flag',
    icon: '🚫',
    hoursAffected: { min: 4, max: 10 }
  }
};

// ── CITY COORDINATES for API calls ───────────────────────────────────────
const CITY_COORDS = {
  'Mumbai':    { lat: 19.0760, lon: 72.8777, q: 'Mumbai,IN' },
  'Delhi':     { lat: 28.6139, lon: 77.2090, q: 'Delhi,IN' },
  'Bengaluru': { lat: 12.9716, lon: 77.5946, q: 'Bengaluru,IN' },
  'Chennai':   { lat: 13.0827, lon: 80.2707, q: 'Chennai,IN' },
  'Hyderabad': { lat: 17.3850, lon: 78.4867, q: 'Hyderabad,IN' },
};

// ── REAL WEATHER DATA via WeatherAPI.com ──────────────────────────────────
async function fetchWeatherData(city) {
  const key = process.env.WEATHERAPI_KEY;
  const coords = CITY_COORDS[city] || CITY_COORDS['Mumbai'];

  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${key}&q=${coords.lat},${coords.lon}&aqi=no`;
    const { data } = await axios.get(url, { timeout: 8000 });
    const c = data.current;

    // WeatherAPI gives precip_mm (last hour), feelslike_c, condition
    const rain = c.precip_mm || 0;
    const feelsLike = c.feelslike_c || c.temp_c;
    // Only flag flood if condition text explicitly says flood AND rain is very heavy
    const condText = (c.condition?.text || '').toLowerCase();
    const isFlooding = condText.includes('flood') && rain > 40;

    return {
      rain: parseFloat(rain.toFixed(1)),
      temp: parseFloat(feelsLike.toFixed(1)),
      floodAlert: isFlooding,
      source: 'WeatherAPI.com',
      condition: c.condition?.text || 'Unknown',
      humidity: c.humidity,
      windKph: c.wind_kph,
    };
  } catch (err) {
    console.warn(`[WEATHER] WeatherAPI failed for ${city}: ${err.message} — using fallback`);
    return getFallbackWeather(city);
  }
}

// ── REAL AQI DATA via OpenAQ v3 ──────────────────────────────────────────
async function fetchAQIData(city) {
  const key = process.env.OPENAQ_API_KEY;
  const coords = CITY_COORDS[city] || CITY_COORDS['Mumbai'];

  try {
    // Step 1: find nearby monitoring locations (radius max = 25000m per API spec)
    const locUrl = `https://api.openaq.org/v3/locations?coordinates=${coords.lat},${coords.lon}&radius=25000&limit=10`;
    const { data: locData } = await axios.get(locUrl, {
      timeout: 10000,
      headers: { 'X-API-Key': key }
    });

    if (!locData.results?.length) return getFallbackAQI(city);

    // Step 2: find a PM2.5 sensor from the most recently updated location
    // Sort by datetimeLast descending to get freshest data
    const sorted = locData.results
      .filter(loc => loc.datetimeLast?.utc)
      .sort((a, b) => new Date(b.datetimeLast.utc) - new Date(a.datetimeLast.utc));

    let pm25SensorId = null;
    for (const loc of sorted) {
      const pm25Sensor = (loc.sensors || []).find(s =>
        s.name?.toLowerCase().includes('pm25')
      );
      if (pm25Sensor?.id) {
        pm25SensorId = pm25Sensor.id;
        break;
      }
    }

    if (!pm25SensorId) return getFallbackAQI(city);

    // Step 3: get latest measurement for that sensor (no /hourly — that causes 422)
    const measUrl = `https://api.openaq.org/v3/sensors/${pm25SensorId}/measurements?limit=1`;
    const { data: measData } = await axios.get(measUrl, {
      timeout: 10000,
      headers: { 'X-API-Key': key }
    });

    const latest = measData.results?.[0];
    if (!latest?.value && !latest?.summary?.avg) return getFallbackAQI(city);

    const pm25 = latest.value ?? latest.summary?.avg ?? 0;
    if (pm25 <= 0) return getFallbackAQI(city);

    const aqi = Math.round(pm25ToAQI(pm25));
    console.log(`[AQI] ${city}: PM2.5=${pm25.toFixed(1)} µg/m³ → AQI=${aqi}`);
    return { aqi, source: 'OpenAQ (CPCB)' };

  } catch (err) {
    console.warn(`[AQI] OpenAQ failed for ${city}: ${err.message} — using fallback`);
    return getFallbackAQI(city);
  }
}

// PM2.5 µg/m³ → AQI conversion (US EPA breakpoints)
function pm25ToAQI(pm25) {
  const breakpoints = [
    [0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500],
  ];
  for (const [cLow, cHigh, iLow, iHigh] of breakpoints) {
    if (pm25 >= cLow && pm25 <= cHigh) {
      return ((iHigh - iLow) / (cHigh - cLow)) * (pm25 - cLow) + iLow;
    }
  }
  return pm25 > 500 ? 500 : 0;
}

// ── FALLBACK DATA (when APIs are unavailable) ─────────────────────────────
function getFallbackWeather(city) {
  const profiles = {
    'Delhi':     { rain: 0, temp: 38, floodAlert: false },
    'Mumbai':    { rain: 5, temp: 30, floodAlert: false },
    'Chennai':   { rain: 2, temp: 34, floodAlert: false },
    'Bengaluru': { rain: 1, temp: 27, floodAlert: false },
    'Hyderabad': { rain: 1, temp: 33, floodAlert: false },
  };
  return { ...(profiles[city] || profiles['Mumbai']), source: 'Fallback' };
}

function getFallbackAQI(city) {
  const profiles = {
    'Delhi':     { aqi: 280 },
    'Mumbai':    { aqi: 120 },
    'Chennai':   { aqi: 90 },
    'Bengaluru': { aqi: 80 },
    'Hyderabad': { aqi: 130 },
  };
  return { ...(profiles[city] || { aqi: 100 }), source: 'Fallback' };
}

// ── FIRE A DISRUPTION EVENT ───────────────────────────────────────────────
function fireDisruption(type, pincode, city, zone, value, threshold, unit) {
  const existing = db.prepare(`
    SELECT id FROM disruptions
    WHERE type = ? AND pincode = ? AND status = 'active'
    AND triggered_at >= datetime('now', '-2 hours')
  `).get(type, pincode);

  if (existing) return null;

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

  const activePolicies = db.prepare(`
    SELECT p.*, r.pincode as rider_pincode, r.city as rider_city
    FROM policies p
    JOIN riders r ON p.rider_id = r.id
    WHERE p.status = 'active' AND p.end_date >= date('now') AND r.pincode = ?
  `).all(pincode);

  const { computeBTS, saveFraudSignals, detectRing } = require('./fraudEngine');

  let claimsCreated = 0;
  for (const policy of activePolicies) {
    const hours = parseFloat((Math.random() * (trigger.hoursAffected.max - trigger.hoursAffected.min) + trigger.hoursAffected.min).toFixed(1));
    const rider = db.prepare(`SELECT * FROM riders WHERE id = ?`).get(policy.rider_id);
    const avgHourly = rider.avg_hourly_earnings || 100;
    const rawPayout = avgHourly * hours * policy.coverage_pct;
    const finalPayout = Math.min(rawPayout, policy.coverage_cap);

    const { btsScore, tier, signals } = computeBTS(rider, disruption);
    let claimStatus = tier === 3 ? 'flagged' : tier === 2 ? 'under_review' : 'approved';

    const claimId = uuidv4();
    db.prepare(`
      INSERT INTO claims (id, policy_id, rider_id, disruption_id, hours_affected, payout_amount, bts_score, fraud_tier, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(claimId, policy.id, policy.rider_id, disruption.id, hours, Math.round(finalPayout), btsScore, tier, claimStatus);

    saveFraudSignals(claimId, signals);

    db.prepare(`
      INSERT INTO disruption_alerts (id, rider_id, disruption_id, message)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), policy.rider_id, disruption.id,
      `${trigger.icon} ${trigger.label} in ${zone}, ${city} — ₹${Math.round(finalPayout)} ${claimStatus === 'approved' ? 'added to Sunday payout' : 'pending review'}.`
    );

    claimsCreated++;
  }

  const { isRingAlert, flags, claimsInWindow } = detectRing(disruption.id, null);
  if (isRingAlert) {
    const insertRingAlert = db.prepare(`
      INSERT INTO ring_alerts (id, disruption_id, flag_type, severity, detail, claim_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const flag of flags) {
      insertRingAlert.run(uuidv4(), disruption.id, flag.type, flag.severity, flag.detail, claimsInWindow);
    }
    console.log(`[RING ALERT] ${flags.length} ring flag(s) for disruption ${disruption.id}`);
  }

  console.log(`[DISRUPTION] ${type} in ${zone}, ${city} (${pincode}) → ${claimsCreated} claims created`);
  return { disruption, claimsCreated };
}

// ── MANUALLY TRIGGER A DISRUPTION ────────────────────────────────────────
function triggerManualDisruption(type, pincode, city, zone) {
  const trigger = TRIGGERS[type];
  const overValue = trigger.threshold * (1.2 + Math.random() * 0.5);
  return fireDisruption(type, pincode, city, zone, Math.round(overValue * 10) / 10, trigger.threshold, trigger.unit);
}

// ── CRON: CHECK REAL DISRUPTIONS EVERY 5 MINUTES ─────────────────────────
function startDisruptionMonitor() {
  console.log('[MONITOR] Disruption monitor started — checking real weather/AQI every 5 minutes');

  cron.schedule('*/5 * * * *', async () => {
    const zones = db.prepare(`SELECT DISTINCT pincode, city, zone FROM zone_risk`).all();

    // Group zones by city to avoid redundant API calls
    const cityMap = {};
    for (const z of zones) {
      if (!cityMap[z.city]) cityMap[z.city] = [];
      cityMap[z.city].push(z);
    }

    for (const [city, cityZones] of Object.entries(cityMap)) {
      try {
        const [weather, aqiData] = await Promise.all([
          fetchWeatherData(city),
          fetchAQIData(city)
        ]);

        for (const z of cityZones) {
          if (weather.rain >= TRIGGERS.HEAVY_RAIN.threshold) {
            fireDisruption('HEAVY_RAIN', z.pincode, z.city, z.zone, weather.rain, TRIGGERS.HEAVY_RAIN.threshold, TRIGGERS.HEAVY_RAIN.unit);
          }
          if (aqiData.aqi >= TRIGGERS.SEVERE_AQI.threshold) {
            fireDisruption('SEVERE_AQI', z.pincode, z.city, z.zone, aqiData.aqi, TRIGGERS.SEVERE_AQI.threshold, TRIGGERS.SEVERE_AQI.unit);
          }
          if (weather.temp >= TRIGGERS.EXTREME_HEAT.threshold) {
            fireDisruption('EXTREME_HEAT', z.pincode, z.city, z.zone, weather.temp, TRIGGERS.EXTREME_HEAT.threshold, TRIGGERS.EXTREME_HEAT.unit);
          }
          if (weather.floodAlert) {
            fireDisruption('FLOOD_ALERT', z.pincode, z.city, z.zone, 1, 1, TRIGGERS.FLOOD_ALERT.unit);
          }
        }
      } catch (err) {
        console.error(`[MONITOR] Error checking ${city}:`, err.message);
      }
    }
  });

  // Sunday 11:30 PM payout
  cron.schedule('30 23 * * 0', () => {
    processWeeklyPayouts();
  });
}

// ── WEEKLY PAYOUT PROCESSING ──────────────────────────────────────────────
function processWeeklyPayouts() {
  console.log('[PAYOUT] Processing weekly payouts...');

  const riders = db.prepare(`
    SELECT DISTINCT rider_id FROM claims
    WHERE status = 'approved' AND created_at >= date('now', '-7 days')
  `).all();

  for (const { rider_id } of riders) {
    const rider = db.prepare(`SELECT * FROM riders WHERE id = ?`).get(rider_id);
    const approvedClaims = db.prepare(`
      SELECT * FROM claims
      WHERE rider_id = ? AND status = 'approved' AND created_at >= date('now', '-7 days')
    `).all(rider_id);

    if (!approvedClaims.length) continue;

    const totalAmount = approvedClaims.reduce((sum, c) => sum + c.payout_amount, 0);
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekEnd = new Date().toISOString().split('T')[0];

    const payoutId = uuidv4();
    db.prepare(`
      INSERT INTO payouts (id, rider_id, week_start, week_end, total_claims, total_amount, status, upi_id, processed_at)
      VALUES (?, ?, ?, ?, ?, ?, 'processed', ?, datetime('now'))
    `).run(payoutId, rider_id, weekStart, weekEnd, approvedClaims.length, Math.round(totalAmount), rider.upi_id);

    db.prepare(`
      INSERT INTO disruption_alerts (id, rider_id, disruption_id, message)
      VALUES (?, ?, NULL, ?)
    `).run(uuidv4(), rider_id, `💰 ₹${Math.round(totalAmount)} credited to ${rider.upi_id} — KamaiShield weekly payout processed`);

    db.prepare(`
      UPDATE claims SET status = 'paid'
      WHERE rider_id = ? AND status = 'approved' AND created_at >= date('now', '-7 days')
    `).run(rider_id);

    console.log(`[PAYOUT] ₹${Math.round(totalAmount)} → ${rider.upi_id} (${approvedClaims.length} claims)`);
  }
}

module.exports = { startDisruptionMonitor, triggerManualDisruption, fireDisruption, processWeeklyPayouts, TRIGGERS, fetchWeatherData, fetchAQIData };
