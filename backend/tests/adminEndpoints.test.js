/**
 * Unit tests for admin endpoints:
 *   GET /api/admin/zone-risk
 *   GET /api/admin/ring-alerts
 *
 * Validates Requirements 9.4 and 9.5
 *
 * Strategy: mock `../database` so no native SQLite binary is needed.
 * Use supertest to make HTTP requests against the Express app.
 */

'use strict';

const jwt = require('jsonwebtoken');
const request = require('supertest');

// ── JWT helpers ───────────────────────────────────────────────────────────
const JWT_SECRET = 'kamaishield_secret_change_in_production';

function makeToken(role = 'admin') {
  return jwt.sign({ id: 'user-1', role }, JWT_SECRET, { expiresIn: '1h' });
}

// ── In-memory store ───────────────────────────────────────────────────────
const store = {
  zone_risk: [],
  ring_alerts: [],
  disruptions: [],
};

function resetStore() {
  store.zone_risk = [];
  store.ring_alerts = [];
  store.disruptions = [];
}

// ── Mock db ───────────────────────────────────────────────────────────────
let mockDb;

function buildMockDb() {
  return {
    pragma: jest.fn(),
    exec: jest.fn(),
    prepare: jest.fn((sql) => ({
      run: jest.fn(() => ({ changes: 1 })),
      all: jest.fn((..._args) => {
        // zone-risk query
        if (/FROM zone_risk z/i.test(sql)) {
          return store.zone_risk.map(z => ({
            ...z,
            activePolicies: 0,
            activeClaims: 0,
            totalPayouts: 0,
            totalPremiums: 0,
          }));
        }
        // ring-alerts query
        if (/FROM ring_alerts ra/i.test(sql)) {
          return store.ring_alerts.map(ra => {
            const d = store.disruptions.find(d => d.id === ra.disruption_id) || {};
            return {
              ...ra,
              disruption_type: d.type || null,
              city: d.city || null,
              zone: d.zone || null,
              disruption_time: d.triggered_at || null,
            };
          });
        }
        return [];
      }),
      get: jest.fn((..._args) => {
        // admin stats scalar queries
        if (/COUNT\(\*\)/i.test(sql)) return { c: 0 };
        if (/SUM\(/i.test(sql)) return { s: 0 };
        return null;
      }),
    })),
    transaction: jest.fn((fn) => (...args) => fn(...args)),
  };
}

// ── Jest module mocks (hoisted) ───────────────────────────────────────────
jest.mock('../database', () =>
  new Proxy({}, { get(_, prop) { return mockDb[prop]; } })
);

jest.mock('node-cron', () => ({ schedule: jest.fn() }));

// ── Load app after mocks ──────────────────────────────────────────────────
let app;
let server;

beforeAll((done) => {
  mockDb = buildMockDb();
  // server.js calls app.listen internally; capture the server instance to close it
  app = require('../server');
  // server.js exports the express app; the http.Server is stored on app.listen result
  // We use supertest's agent which manages connections, but we still need to close
  // the underlying server to avoid open handle warnings.
  server = app.listen(0, done);
});

afterAll((done) => {
  if (server) server.close(done);
  else done();
});

beforeEach(() => {
  mockDb = buildMockDb();
  resetStore();
  jest.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════
// GET /api/admin/zone-risk
// Validates Requirement 9.4
// ═════════════════════════════════════════════════════════════════════════

describe('GET /api/admin/zone-risk', () => {
  test('returns 401 when no auth token is provided', async () => {
    const res = await request(app).get('/api/admin/zone-risk');
    expect(res.status).toBe(401);
  });

  test('returns 403 when authenticated as a non-admin rider', async () => {
    const token = makeToken('rider');
    const res = await request(app)
      .get('/api/admin/zone-risk')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('returns empty array when no zone data exists', async () => {
    const token = makeToken('admin');
    const res = await request(app)
      .get('/api/admin/zone-risk')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns correct shape for each zone entry', async () => {
    store.zone_risk.push({
      pincode: '400001',
      zone: 'Fort/CST',
      city: 'Mumbai',
      risk_score: 1.15,
    });

    const token = makeToken('admin');
    const res = await request(app)
      .get('/api/admin/zone-risk')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);

    const entry = res.body[0];
    expect(entry).toHaveProperty('pincode', '400001');
    expect(entry).toHaveProperty('zone', 'Fort/CST');
    expect(entry).toHaveProperty('city', 'Mumbai');
    expect(entry).toHaveProperty('risk_score', 1.15);
    expect(entry).toHaveProperty('activePolicies');
    expect(entry).toHaveProperty('activeClaims');
    expect(entry).toHaveProperty('lossRatio');
  });

  test('returns multiple zones ordered by risk_score DESC', async () => {
    store.zone_risk.push(
      { pincode: '400058', zone: 'Borivali', city: 'Mumbai', risk_score: 0.95 },
      { pincode: '400070', zone: 'Kurla',    city: 'Mumbai', risk_score: 1.20 },
      { pincode: '400001', zone: 'Fort/CST', city: 'Mumbai', risk_score: 1.15 },
    );

    const token = makeToken('admin');
    const res = await request(app)
      .get('/api/admin/zone-risk')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    // All required fields present on every entry
    res.body.forEach(entry => {
      expect(entry).toHaveProperty('pincode');
      expect(entry).toHaveProperty('zone');
      expect(entry).toHaveProperty('city');
      expect(entry).toHaveProperty('risk_score');
      expect(entry).toHaveProperty('activePolicies');
      expect(entry).toHaveProperty('activeClaims');
      expect(entry).toHaveProperty('lossRatio');
    });
  });

  test('lossRatio is "0.0" when no premiums have been collected', async () => {
    store.zone_risk.push({
      pincode: '560001',
      zone: 'MG Road',
      city: 'Bengaluru',
      risk_score: 0.85,
    });

    const token = makeToken('admin');
    const res = await request(app)
      .get('/api/admin/zone-risk')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].lossRatio).toBe('0.0');
  });
});

// ═════════════════════════════════════════════════════════════════════════
// GET /api/admin/ring-alerts
// Validates Requirement 9.5
// ═════════════════════════════════════════════════════════════════════════

describe('GET /api/admin/ring-alerts', () => {
  test('returns 401 when no auth token is provided', async () => {
    const res = await request(app).get('/api/admin/ring-alerts');
    expect(res.status).toBe(401);
  });

  test('returns 403 when authenticated as a non-admin rider', async () => {
    const token = makeToken('rider');
    const res = await request(app)
      .get('/api/admin/ring-alerts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('returns empty array when no ring alerts exist', async () => {
    const token = makeToken('admin');
    const res = await request(app)
      .get('/api/admin/ring-alerts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns correct shape for each ring alert entry', async () => {
    store.disruptions.push({
      id: 'disruption-1',
      type: 'HEAVY_RAIN',
      city: 'Mumbai',
      zone: 'Kurla',
      triggered_at: '2024-06-01T10:00:00.000Z',
    });
    store.ring_alerts.push({
      id: 'alert-1',
      disruption_id: 'disruption-1',
      flag_type: 'TEMPORAL_SPIKE',
      severity: 'HIGH',
      detail: '16 claims in 10 min window',
      claim_count: 16,
      created_at: '2024-06-01T10:05:00.000Z',
    });

    const token = makeToken('admin');
    const res = await request(app)
      .get('/api/admin/ring-alerts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);

    const alert = res.body[0];
    expect(alert).toHaveProperty('id', 'alert-1');
    expect(alert).toHaveProperty('disruption_id', 'disruption-1');
    expect(alert).toHaveProperty('flag_type', 'TEMPORAL_SPIKE');
    expect(alert).toHaveProperty('severity', 'HIGH');
    expect(alert).toHaveProperty('claim_count', 16);
    expect(alert).toHaveProperty('disruption_type', 'HEAVY_RAIN');
    expect(alert).toHaveProperty('city', 'Mumbai');
    expect(alert).toHaveProperty('zone', 'Kurla');
    expect(alert).toHaveProperty('disruption_time');
  });

  test('returns multiple alert types with correct fields', async () => {
    store.disruptions.push({
      id: 'disruption-2',
      type: 'SEVERE_AQI',
      city: 'Delhi',
      zone: 'Shahdara',
      triggered_at: '2024-06-02T08:00:00.000Z',
    });
    store.ring_alerts.push(
      {
        id: 'alert-2',
        disruption_id: 'disruption-2',
        flag_type: 'PLATFORM_HOMOGENEITY',
        severity: 'MEDIUM',
        detail: '6 claims all from Swiggy',
        claim_count: 6,
        created_at: '2024-06-02T08:10:00.000Z',
      },
      {
        id: 'alert-3',
        disruption_id: 'disruption-2',
        flag_type: 'BASELINE_DEVIATION',
        severity: 'HIGH',
        detail: '6× historical average',
        claim_count: 6,
        created_at: '2024-06-02T08:10:00.000Z',
      }
    );

    const token = makeToken('admin');
    const res = await request(app)
      .get('/api/admin/ring-alerts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    res.body.forEach(alert => {
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('disruption_id');
      expect(alert).toHaveProperty('flag_type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('claim_count');
      expect(alert).toHaveProperty('disruption_type');
      expect(alert).toHaveProperty('city');
      expect(alert).toHaveProperty('zone');
    });
  });
});
