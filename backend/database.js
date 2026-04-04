const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'kamaishield.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── SCHEMA ─────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS riders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    platform TEXT NOT NULL,
    city TEXT NOT NULL,
    pincode TEXT NOT NULL,
    zone TEXT NOT NULL,
    upi_id TEXT,
    avg_hourly_earnings REAL DEFAULT 100,
    hours_per_day REAL DEFAULT 8,
    role TEXT DEFAULT 'rider',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS zone_risk (
    pincode TEXT PRIMARY KEY,
    city TEXT NOT NULL,
    zone TEXT NOT NULL,
    risk_score REAL DEFAULT 1.0,
    flood_risk REAL DEFAULT 0.3,
    rain_risk REAL DEFAULT 0.5,
    aqi_risk REAL DEFAULT 0.3,
    heat_risk REAL DEFAULT 0.2,
    civic_risk REAL DEFAULT 0.1,
    last_updated TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS policies (
    id TEXT PRIMARY KEY,
    rider_id TEXT NOT NULL,
    plan TEXT NOT NULL,
    premium REAL NOT NULL,
    base_premium REAL NOT NULL,
    coverage_cap REAL NOT NULL,
    coverage_pct REAL NOT NULL,
    zone_risk_score REAL NOT NULL,
    seasonal_factor REAL NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (rider_id) REFERENCES riders(id)
  );

  CREATE TABLE IF NOT EXISTS disruptions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    subtype TEXT,
    city TEXT NOT NULL,
    pincode TEXT NOT NULL,
    zone TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    value REAL,
    threshold REAL,
    unit TEXT,
    source TEXT,
    triggered_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    policy_id TEXT NOT NULL,
    rider_id TEXT NOT NULL,
    disruption_id TEXT NOT NULL,
    hours_affected REAL NOT NULL,
    payout_amount REAL NOT NULL,
    bts_score REAL NOT NULL,
    fraud_tier INTEGER NOT NULL DEFAULT 1,
    status TEXT DEFAULT 'pending',
    fraud_reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT,
    FOREIGN KEY (policy_id) REFERENCES policies(id),
    FOREIGN KEY (rider_id) REFERENCES riders(id),
    FOREIGN KEY (disruption_id) REFERENCES disruptions(id)
  );

  CREATE TABLE IF NOT EXISTS fraud_signals (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    signal_name TEXT NOT NULL,
    signal_value REAL NOT NULL,
    is_suspicious INTEGER DEFAULT 0,
    detail TEXT,
    FOREIGN KEY (claim_id) REFERENCES claims(id)
  );

  CREATE TABLE IF NOT EXISTS payouts (
    id TEXT PRIMARY KEY,
    rider_id TEXT NOT NULL,
    week_start TEXT NOT NULL,
    week_end TEXT NOT NULL,
    total_claims INTEGER DEFAULT 0,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    upi_id TEXT,
    processed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (rider_id) REFERENCES riders(id)
  );

  CREATE TABLE IF NOT EXISTS disruption_alerts (
    id TEXT PRIMARY KEY,
    rider_id TEXT NOT NULL,
    disruption_id TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (rider_id) REFERENCES riders(id),
    FOREIGN KEY (disruption_id) REFERENCES disruptions(id)
  );
`);

// ── SEED ZONE RISK DATA ────────────────────────────────────────────────────

const seedZones = db.prepare(`
  INSERT OR IGNORE INTO zone_risk (pincode, city, zone, risk_score, flood_risk, rain_risk, aqi_risk, heat_risk, civic_risk)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const zones = [
  // Mumbai
  ['400001', 'Mumbai', 'Fort/CST',       1.15, 0.6, 0.8, 0.2, 0.1, 0.2],
  ['400070', 'Mumbai', 'Kurla',          1.20, 0.8, 0.9, 0.3, 0.1, 0.2],
  ['400053', 'Mumbai', 'Andheri West',   1.05, 0.4, 0.7, 0.2, 0.1, 0.1],
  ['400058', 'Mumbai', 'Borivali',       0.95, 0.3, 0.6, 0.2, 0.1, 0.1],
  // Delhi
  ['110001', 'Delhi',  'Connaught Place',1.10, 0.2, 0.4, 0.9, 0.7, 0.3],
  ['110092', 'Delhi',  'Shahdara',       1.25, 0.5, 0.5, 0.9, 0.7, 0.4],
  ['110045', 'Delhi',  'Dwarka',         0.90, 0.1, 0.3, 0.7, 0.6, 0.1],
  // Bengaluru
  ['560001', 'Bengaluru', 'MG Road',     0.85, 0.2, 0.5, 0.3, 0.2, 0.1],
  ['560034', 'Bengaluru', 'Koramangala', 0.90, 0.3, 0.6, 0.3, 0.2, 0.1],
  ['560037', 'Bengaluru', 'HSR Layout',  0.85, 0.2, 0.5, 0.2, 0.2, 0.1],
  // Chennai
  ['600001', 'Chennai', 'Parrys',        1.10, 0.5, 0.7, 0.3, 0.5, 0.2],
  ['600028', 'Chennai', 'T. Nagar',      1.00, 0.4, 0.6, 0.3, 0.5, 0.1],
  // Hyderabad
  ['500001', 'Hyderabad', 'Charminar',   1.05, 0.4, 0.6, 0.4, 0.5, 0.2],
  ['500032', 'Hyderabad', 'Gachibowli',  0.85, 0.2, 0.4, 0.3, 0.4, 0.1],
];

const insertZones = db.transaction(() => {
  for (const z of zones) seedZones.run(...z);
});
insertZones();

// ── SEED ADMIN ACCOUNT ─────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const adminExists = db.prepare(`SELECT id FROM riders WHERE phone = '0000000000'`).get();
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO riders (id, name, phone, email, password, platform, city, pincode, zone, upi_id, role)
    VALUES (?, 'KamaiShield Admin', '0000000000', 'admin@kamaishield.in', ?, 'internal', 'Mumbai', '400001', 'Fort/CST', 'admin@upi', 'admin')
  `).run(uuidv4(), hash);
}

module.exports = db;
