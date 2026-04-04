require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== 'production';

// ── SECURITY: Helmet ──────────────────────────────────────────────────────
try {
  const helmet = require('helmet');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  console.log('[SECURITY] Helmet: ENABLED');
} catch { console.warn('[WARN] helmet not installed'); }

// ── SECURITY: Rate Limiting ───────────────────────────────────────────────
try {
  const rateLimit = require('express-rate-limit');
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000, max: 150,
    message: { error: 'Too many requests, please try again later.' }
  }));
  app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000, max: 10, skipSuccessfulRequests: true,
    message: { error: 'Too many login attempts. Wait 15 minutes.' }
  }));
  app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }));
  console.log('[SECURITY] Rate limiting: ENABLED');
} catch { console.warn('[WARN] express-rate-limit not installed'); }

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, cb) => (!origin || isDev || allowedOrigins.includes(origin)) ? cb(null, true) : cb(new Error('CORS blocked')),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── BODY PARSING (with size limit to prevent payload bombs) ───────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.disable('x-powered-by');

// ── REQUEST LOGGER (dev only) ─────────────────────────────────────────────
if (isDev) app.use((req, _res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`); next(); });

// ── ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api', require('./routes/api'));

// ── HEALTH ────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', platform: 'KamaiShield API v1.0', timestamp: new Date().toISOString() }));

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── GLOBAL ERROR HANDLER (never leak stack in prod) ───────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: isDev ? err.message : 'Internal server error' });
});

// ── DISRUPTION MONITOR ────────────────────────────────────────────────────
require('./services/disruptionMonitor').startDisruptionMonitor();

app.listen(PORT, () => console.log(`\n  🛡️  KamaiShield API → http://localhost:${PORT}  [${process.env.NODE_ENV || 'dev'}]\n`));
module.exports = app;
