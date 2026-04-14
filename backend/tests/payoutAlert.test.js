/**
 * Unit tests for processWeeklyPayouts alert creation
 * Validates Requirement 7.5
 *
 * Strategy: mock `../database` so no native SQLite binary is needed.
 * We track every INSERT/SELECT call in-memory and assert on the results.
 */

'use strict';

// ── In-memory store shared across the mock ────────────────────────────────
const store = {
  riders: [],
  claims: [],
  payouts: [],
  disruption_alerts: [],
};

function resetStore() {
  for (const key of Object.keys(store)) store[key] = [];
}

// ── Minimal db mock ───────────────────────────────────────────────────────
function buildMockDb() {
  const mockDb = {
    pragma: jest.fn(),
    exec: jest.fn(),
    prepare: jest.fn((sql) => {
      const stmt = {
        run: jest.fn((...args) => {
          const params =
            args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])
              ? args[0]
              : args;

          if (/INSERT INTO payouts/i.test(sql)) {
            store.payouts.push({
              id: params[0],
              rider_id: params[1],
              week_start: params[2],
              week_end: params[3],
              total_claims: params[4],
              total_amount: params[5],
              upi_id: params[6],
            });
          } else if (/INSERT INTO disruption_alerts/i.test(sql)) {
            // processWeeklyPayouts uses a hardcoded 'PAYOUT' literal for disruption_id:
            //   VALUES (?, ?, 'PAYOUT', ?)  → run(id, rider_id, message)
            // Other callers pass disruption_id as a param:
            //   VALUES (?, ?, ?, ?)         → run(id, rider_id, disruption_id, message)
            const hasLiteralPayout = /VALUES\s*\(\s*\?\s*,\s*\?\s*,\s*'PAYOUT'/i.test(sql);
            if (hasLiteralPayout) {
              store.disruption_alerts.push({
                id: params[0],
                rider_id: params[1],
                disruption_id: 'PAYOUT',
                message: params[2],
              });
            } else {
              store.disruption_alerts.push({
                id: params[0],
                rider_id: params[1],
                disruption_id: params[2],
                message: params[3],
              });
            }
          }
          // UPDATE claims — no-op
          return { changes: 1 };
        }),
        all: jest.fn((...args) => {
          // SELECT DISTINCT rider_id FROM claims WHERE status = 'approved'
          if (/SELECT DISTINCT rider_id FROM claims/i.test(sql)) {
            const unique = [...new Set(store.claims.map((c) => c.rider_id))];
            return unique.map((id) => ({ rider_id: id }));
          }
          // SELECT * FROM claims WHERE rider_id = ? AND status = 'approved'
          if (/SELECT \* FROM claims[\s\S]*WHERE rider_id/i.test(sql)) {
            const riderId = args[0];
            return store.claims.filter(
              (c) => c.rider_id === riderId && c.status === 'approved'
            );
          }
          return [];
        }),
        get: jest.fn((...args) => {
          // SELECT * FROM riders WHERE id = ?
          if (/SELECT \* FROM riders WHERE id/i.test(sql)) {
            const riderId = args[0];
            return store.riders.find((r) => r.id === riderId) || null;
          }
          return null;
        }),
      };
      return stmt;
    }),
    transaction: jest.fn((fn) => (...args) => fn(...args)),
  };
  return mockDb;
}

// ── Jest module mock setup ────────────────────────────────────────────────
let mockDb;

jest.mock('../database', () => {
  return new Proxy(
    {},
    {
      get(_, prop) {
        return mockDb[prop];
      },
    }
  );
});

// Prevent node-cron from scheduling anything
jest.mock('node-cron', () => ({ schedule: jest.fn() }));

// ── Load module under test ────────────────────────────────────────────────
const { processWeeklyPayouts } = require('../services/disruptionMonitor');

// ── Helpers ───────────────────────────────────────────────────────────────
function makeRider(overrides = {}) {
  return {
    id: 'rider-1',
    name: 'Test Rider',
    upi_id: 'testrider@upi',
    avg_hourly_earnings: 100,
    ...overrides,
  };
}

function makeClaim(overrides = {}) {
  return {
    id: 'claim-1',
    rider_id: 'rider-1',
    payout_amount: 500,
    status: 'approved',
    ...overrides,
  };
}

// ── Test setup ────────────────────────────────────────────────────────────
beforeEach(() => {
  mockDb = buildMockDb();
  resetStore();
  jest.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════
// processWeeklyPayouts — alert creation tests (Requirement 7.5)
// ═════════════════════════════════════════════════════════════════════════

describe('processWeeklyPayouts — disruption_alerts', () => {
  test('inserts a disruption_alerts row for a rider with approved claims', () => {
    const rider = makeRider({ id: 'rider-1', upi_id: 'testrider@upi' });
    store.riders.push(rider);
    store.claims.push(makeClaim({ id: 'claim-1', rider_id: 'rider-1', payout_amount: 750 }));

    processWeeklyPayouts();

    expect(store.disruption_alerts).toHaveLength(1);
  });

  test('alert message contains 💰, "credited", and the rider UPI ID', () => {
    const rider = makeRider({ id: 'rider-1', upi_id: 'testrider@upi' });
    store.riders.push(rider);
    store.claims.push(makeClaim({ id: 'claim-1', rider_id: 'rider-1', payout_amount: 750 }));

    processWeeklyPayouts();

    const alert = store.disruption_alerts[0];
    expect(alert.message).toContain('💰');
    expect(alert.message).toContain('credited');
    expect(alert.message).toContain('testrider@upi');
  });

  test('alert rider_id matches the seeded rider', () => {
    const rider = makeRider({ id: 'rider-1', upi_id: 'testrider@upi' });
    store.riders.push(rider);
    store.claims.push(makeClaim({ id: 'claim-1', rider_id: 'rider-1', payout_amount: 750 }));

    processWeeklyPayouts();

    const alert = store.disruption_alerts[0];
    expect(alert.rider_id).toBe('rider-1');
  });

  test('alert disruption_id is null or a payout marker (not a real disruption UUID)', () => {
    const rider = makeRider({ id: 'rider-1', upi_id: 'testrider@upi' });
    store.riders.push(rider);
    store.claims.push(makeClaim({ id: 'claim-1', rider_id: 'rider-1', payout_amount: 750 }));

    processWeeklyPayouts();

    const alert = store.disruption_alerts[0];
    // The implementation sets disruption_id to null or a sentinel like 'PAYOUT'
    const isNullOrSentinel =
      alert.disruption_id === null || alert.disruption_id === 'PAYOUT';
    expect(isNullOrSentinel).toBe(true);
  });

  test('alert message includes the correct total amount', () => {
    const rider = makeRider({ id: 'rider-1', upi_id: 'testrider@upi' });
    store.riders.push(rider);
    // Two claims totalling ₹1200
    store.claims.push(makeClaim({ id: 'claim-1', rider_id: 'rider-1', payout_amount: 700 }));
    store.claims.push(makeClaim({ id: 'claim-2', rider_id: 'rider-1', payout_amount: 500 }));

    processWeeklyPayouts();

    const alert = store.disruption_alerts[0];
    expect(alert.message).toContain('1200');
  });

  test('creates one alert per rider when multiple riders have approved claims', () => {
    store.riders.push(makeRider({ id: 'rider-A', upi_id: 'riderA@upi' }));
    store.riders.push(makeRider({ id: 'rider-B', upi_id: 'riderB@upi' }));
    store.claims.push(makeClaim({ id: 'claim-A', rider_id: 'rider-A', payout_amount: 300 }));
    store.claims.push(makeClaim({ id: 'claim-B', rider_id: 'rider-B', payout_amount: 400 }));

    processWeeklyPayouts();

    expect(store.disruption_alerts).toHaveLength(2);
    const riderIds = store.disruption_alerts.map((a) => a.rider_id);
    expect(riderIds).toContain('rider-A');
    expect(riderIds).toContain('rider-B');
  });

  test('no alert is created when there are no approved claims', () => {
    // No claims seeded — store.claims is empty
    processWeeklyPayouts();

    expect(store.disruption_alerts).toHaveLength(0);
  });
});
