/**
 * Unit tests for saveFraudSignals and detectRing wiring
 * Validates Requirements 5.1 and 6.2
 *
 * Strategy: mock `../database` so no native SQLite binary is needed.
 * We track every INSERT/SELECT call in-memory and assert on the results.
 */

'use strict';

// ── In-memory store shared across the mock ────────────────────────────────
const store = {
  fraud_signals: [],
  ring_alerts: [],
  claims: [],
  disruptions: [],
  riders: [],
  policies: [],
  disruption_alerts: [],
};

function resetStore() {
  for (const key of Object.keys(store)) store[key] = [];
  store._historicalAvg = undefined;
}

// ── Minimal db mock ───────────────────────────────────────────────────────
// Implements prepare(sql).run(...), .all(...), .get(...) and transaction(fn)
function buildMockDb() {
  const mockDb = {
    pragma: jest.fn(),
    exec: jest.fn(),
    prepare: jest.fn((sql) => {
      const stmt = {
        run: jest.fn((...args) => {
          // Flatten named-param object if passed as single arg
          const params = args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])
            ? args[0]
            : args;

          if (/INSERT INTO fraud_signals/i.test(sql)) {
            // positional: (id, claim_id, signal_name, signal_value, is_suspicious, detail)
            store.fraud_signals.push({
              id: params[0], claim_id: params[1], signal_name: params[2],
              signal_value: params[3], is_suspicious: params[4], detail: params[5],
            });
          } else if (/INSERT INTO ring_alerts/i.test(sql)) {
            store.ring_alerts.push({
              id: params[0], disruption_id: params[1], flag_type: params[2],
              severity: params[3], detail: params[4], claim_count: params[5],
            });
          } else if (/INSERT INTO disruptions/i.test(sql)) {
            store.disruptions.push(params);
          } else if (/INSERT INTO claims/i.test(sql)) {
            // positional: (id, policy_id, rider_id, disruption_id, hours, payout, bts, tier, status)
            store.claims.push({
              id: params[0], policy_id: params[1], rider_id: params[2],
              disruption_id: params[3], platform: 'Zomato', pincode: '400001',
              created_at: new Date().toISOString(),
            });
          } else if (/INSERT INTO disruption_alerts/i.test(sql)) {
            store.disruption_alerts.push(params);
          } else if (/UPDATE claims/i.test(sql)) {
            // no-op for tests
          }
          return { changes: 1 };
        }),
        all: jest.fn((...args) => {
          // Use [\s\S]* to match across newlines in multiline SQL strings
          if (/FROM claims c[\s\S]*JOIN riders/i.test(sql)) {
            // detectRing: return claims for the given disruption_id
            const disruptionId = args[0];
            return store.claims.filter(c => c.disruption_id === disruptionId);
          }
          if (/FROM zone_risk/i.test(sql)) return [];
          if (/FROM policies/i.test(sql)) {
            // Return seeded active policies
            return store.policies;
          }
          return [];
        }),
        get: jest.fn((...args) => {
          if (/SELECT id FROM disruptions/i.test(sql)) return null; // no existing disruption
          if (/SELECT \* FROM riders/i.test(sql)) {
            const riderId = args[0];
            return store.riders.find(r => r.id === riderId) || null;
          }
          if (/AVG\(claim_count\)/i.test(sql)) {
            // historicalAvg — return low avg so BASELINE_DEVIATION fires when needed
            return { avg: store._historicalAvg || 1 };
          }
          return null;
        }),
      };
      return stmt;
    }),
    transaction: jest.fn((fn) => {
      // Return a wrapper that calls fn synchronously
      return (...args) => fn(...args);
    }),
  };
  return mockDb;
}

// ── Jest module mock setup ────────────────────────────────────────────────
// Must be called before any require of the modules under test.
let mockDb;

jest.mock('../database', () => {
  // We return a proxy that delegates to the lazily-built mockDb
  // The actual mockDb is set up in beforeEach via the module-level variable.
  // Because jest.mock is hoisted, we use a getter pattern.
  return new Proxy({}, {
    get(_, prop) {
      return mockDb[prop];
    },
  });
});

// Also mock node-cron so startDisruptionMonitor doesn't schedule anything
jest.mock('node-cron', () => ({ schedule: jest.fn() }));

// ── Load modules under test ───────────────────────────────────────────────
const { saveFraudSignals, detectRing, computeBTS } = require('../services/fraudEngine');
const { fireDisruption } = require('../services/disruptionMonitor');

// ── Helpers ───────────────────────────────────────────────────────────────
function makeRider(overrides = {}) {
  return {
    id: 'rider-1',
    name: 'Test Rider',
    platform: 'Zomato',
    pincode: '400001',
    city: 'Mumbai',
    zone: 'Fort/CST',
    avg_hourly_earnings: 100,
    upi_id: 'test@upi',
    ...overrides,
  };
}

function makeDisruption(overrides = {}) {
  return {
    id: 'disruption-1',
    type: 'HEAVY_RAIN',
    subtype: 'Heavy Rainfall',
    city: 'Mumbai',
    pincode: '400001',
    zone: 'Fort/CST',
    severity: 'HIGH',
    description: 'Test disruption',
    value: 20,
    threshold: 15,
    unit: 'mm/hr',
    source: 'Test',
    ...overrides,
  };
}

function makeSampleSignals() {
  return [
    { name: 'gps_coordinates', score: 20, isSuspicious: false, detail: 'Match' },
    { name: 'gps_signal_quality', score: 10, isSuspicious: false, detail: 'Normal' },
    { name: 'accelerometer', score: 15, isSuspicious: false, detail: 'Moving' },
    { name: 'cell_tower', score: 20, isSuspicious: false, detail: 'Match' },
    { name: 'platform_heartbeat', score: 15, isSuspicious: false, detail: 'Online' },
    { name: 'battery_screen', score: 15, isSuspicious: false, detail: 'Normal' },
  ];
}

// ── Test setup ────────────────────────────────────────────────────────────
beforeEach(() => {
  mockDb = buildMockDb();
  resetStore();
  jest.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════
// 1. saveFraudSignals — unit tests
// ═════════════════════════════════════════════════════════════════════════

describe('saveFraudSignals', () => {
  test('persists one row per signal for the given claimId', () => {
    const signals = makeSampleSignals();
    saveFraudSignals('claim-abc', signals);

    expect(store.fraud_signals).toHaveLength(6);
    store.fraud_signals.forEach((row, i) => {
      expect(row.claim_id).toBe('claim-abc');
      expect(row.signal_name).toBe(signals[i].name);
      expect(row.signal_value).toBe(signals[i].score);
      expect(row.is_suspicious).toBe(signals[i].isSuspicious ? 1 : 0);
      expect(row.detail).toBe(signals[i].detail);
    });
  });

  test('marks suspicious signals with is_suspicious = 1', () => {
    const signals = [
      { name: 'gps_coordinates', score: 0, isSuspicious: true, detail: 'No match' },
      { name: 'cell_tower', score: 20, isSuspicious: false, detail: 'Match' },
    ];
    saveFraudSignals('claim-xyz', signals);

    const suspicious = store.fraud_signals.find(r => r.signal_name === 'gps_coordinates');
    const clean = store.fraud_signals.find(r => r.signal_name === 'cell_tower');

    expect(suspicious.is_suspicious).toBe(1);
    expect(clean.is_suspicious).toBe(0);
  });

  test('handles empty signals array without error', () => {
    expect(() => saveFraudSignals('claim-empty', [])).not.toThrow();
    expect(store.fraud_signals).toHaveLength(0);
  });

  test('persists signals for multiple claims independently', () => {
    saveFraudSignals('claim-1', makeSampleSignals());
    saveFraudSignals('claim-2', makeSampleSignals());

    const claim1Rows = store.fraud_signals.filter(r => r.claim_id === 'claim-1');
    const claim2Rows = store.fraud_signals.filter(r => r.claim_id === 'claim-2');

    expect(claim1Rows).toHaveLength(6);
    expect(claim2Rows).toHaveLength(6);
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 2. detectRing — unit tests (Requirement 6.2)
// ═════════════════════════════════════════════════════════════════════════

describe('detectRing', () => {
  test('returns isRingAlert=false when fewer than 16 claims exist', () => {
    // Seed 10 claims for disruption-1 with mixed platforms (avoids PLATFORM_HOMOGENEITY)
    // and high historicalAvg (avoids BASELINE_DEVIATION)
    store._historicalAvg = 100;
    const platforms = ['Zomato', 'Swiggy', 'Blinkit', 'Zepto', 'Amazon'];
    for (let i = 0; i < 10; i++) {
      store.claims.push({
        id: `c-${i}`, disruption_id: 'disruption-1',
        platform: platforms[i % platforms.length], pincode: '400001',
        created_at: new Date().toISOString(),
      });
    }

    const result = detectRing('disruption-1', null);
    expect(result.isRingAlert).toBe(false);
    expect(result.flags).toHaveLength(0);
  });

  test('raises TEMPORAL_SPIKE flag when more than 15 claims exist (Requirement 6.2)', () => {
    // Seed 16 claims — exceeds the >15 threshold
    for (let i = 0; i < 16; i++) {
      store.claims.push({
        id: `c-${i}`, disruption_id: 'disruption-1',
        platform: 'Zomato', pincode: '400001',
        created_at: new Date().toISOString(),
      });
    }

    const result = detectRing('disruption-1', null);
    expect(result.isRingAlert).toBe(true);

    const spike = result.flags.find(f => f.type === 'TEMPORAL_SPIKE');
    expect(spike).toBeDefined();
    expect(spike.severity).toBe('HIGH');
  });

  test('raises PLATFORM_HOMOGENEITY flag when >5 claims all from same platform', () => {
    for (let i = 0; i < 6; i++) {
      store.claims.push({
        id: `c-${i}`, disruption_id: 'disruption-2',
        platform: 'Swiggy', pincode: '400001',
        created_at: new Date().toISOString(),
      });
    }

    const result = detectRing('disruption-2', null);
    const homogeneity = result.flags.find(f => f.type === 'PLATFORM_HOMOGENEITY');
    expect(homogeneity).toBeDefined();
    expect(homogeneity.severity).toBe('MEDIUM');
  });

  test('raises BASELINE_DEVIATION flag when claims exceed 5× historical average', () => {
    // historicalAvg = 1, so 6 claims = 6× baseline → triggers BASELINE_DEVIATION
    store._historicalAvg = 1;
    for (let i = 0; i < 6; i++) {
      store.claims.push({
        id: `c-${i}`, disruption_id: 'disruption-3',
        platform: 'Zomato', pincode: '400001',
        created_at: new Date().toISOString(),
      });
    }

    const result = detectRing('disruption-3', null);
    const deviation = result.flags.find(f => f.type === 'BASELINE_DEVIATION');
    expect(deviation).toBeDefined();
    expect(deviation.severity).toBe('HIGH');
  });

  test('claimsInWindow reflects the actual count returned', () => {
    for (let i = 0; i < 5; i++) {
      store.claims.push({
        id: `c-${i}`, disruption_id: 'disruption-4',
        platform: 'Zomato', pincode: '400001',
        created_at: new Date().toISOString(),
      });
    }

    const result = detectRing('disruption-4', null);
    expect(result.claimsInWindow).toBe(5);
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 3. fireDisruption wiring tests
// ═════════════════════════════════════════════════════════════════════════

describe('fireDisruption wiring', () => {
  function seedPolicy(riderId, pincode = '400001') {
    const rider = makeRider({ id: riderId, pincode });
    store.riders.push(rider);
    store.policies.push({
      id: `policy-${riderId}`,
      rider_id: riderId,
      plan: 'Standard Shield',
      premium: 49,
      base_premium: 49,
      coverage_cap: 1000,
      coverage_pct: 0.75,
      zone_risk_score: 1.0,
      seasonal_factor: 1.0,
      start_date: '2024-01-01',
      end_date: '2099-12-31',
      status: 'active',
    });
  }

  test('fraud_signals rows are created for each claim after fireDisruption', () => {
    seedPolicy('rider-A');
    seedPolicy('rider-B');

    fireDisruption('HEAVY_RAIN', '400001', 'Mumbai', 'Fort/CST', 20, 15, 'mm/hr');

    // 2 policies → 2 claims → each claim gets 6 signals
    expect(store.fraud_signals.length).toBe(12);
    // All signals belong to claims that were inserted
    const claimIds = store.claims.map(c => c.id);
    store.fraud_signals.forEach(sig => {
      expect(claimIds).toContain(sig.claim_id);
    });
  });

  test('ring_alerts rows are stored when claim count exceeds threshold', () => {
    // Seed 16 policies so 16 claims are created, triggering TEMPORAL_SPIKE
    for (let i = 0; i < 16; i++) {
      seedPolicy(`rider-ring-${i}`);
    }
    // Set low historical avg so BASELINE_DEVIATION also fires
    store._historicalAvg = 1;

    fireDisruption('HEAVY_RAIN', '400001', 'Mumbai', 'Fort/CST', 20, 15, 'mm/hr');

    // TEMPORAL_SPIKE should be raised (16 > 15)
    const spikeAlert = store.ring_alerts.find(a => a.flag_type === 'TEMPORAL_SPIKE');
    expect(spikeAlert).toBeDefined();
    expect(spikeAlert.disruption_id).toBeDefined();
    expect(spikeAlert.severity).toBe('HIGH');
    expect(spikeAlert.claim_count).toBeGreaterThan(15);
  });

  test('no ring_alerts when claim count is below threshold', () => {
    // Set high historicalAvg so BASELINE_DEVIATION doesn't fire for a single claim
    store._historicalAvg = 100;
    seedPolicy('rider-solo');

    fireDisruption('HEAVY_RAIN', '400001', 'Mumbai', 'Fort/CST', 20, 15, 'mm/hr');

    expect(store.ring_alerts).toHaveLength(0);
  });

  test('each claim gets exactly 6 fraud signal rows (one per BTS signal)', () => {
    seedPolicy('rider-C');

    fireDisruption('HEAVY_RAIN', '400001', 'Mumbai', 'Fort/CST', 20, 15, 'mm/hr');

    expect(store.claims).toHaveLength(1);
    const claimId = store.claims[0].id;
    const signalsForClaim = store.fraud_signals.filter(s => s.claim_id === claimId);
    expect(signalsForClaim).toHaveLength(6);
  });
});
