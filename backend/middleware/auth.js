require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kamaishield_secret_change_in_production';
if (JWT_SECRET === 'kamaishield_secret_change_in_production' && process.env.NODE_ENV === 'production') {
  console.error('[FATAL] JWT_SECRET not set in production!'); process.exit(1);
}

// ── INPUT VALIDATION HELPERS ──────────────────────────────────────────────
function sanitizeString(str, maxLen = 100) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[<>'"\\]/g, '');
}
function validatePhone(phone) { return /^[0-9]{10}$/.test(phone); }
function validateUPI(upi) { if (!upi) return true; return /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(upi); }

function validateRegisterBody(body) {
  const errors = [];
  const { name, phone, password, platform, city, pincode, zone, upi_id, avg_hourly_earnings, hours_per_day } = body;
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!validatePhone(phone)) errors.push('Phone must be a valid 10-digit Indian mobile number');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
  if (password && password.length > 128) errors.push('Password too long');
  if (!platform) errors.push('Platform is required');
  if (!city) errors.push('City is required');
  if (!pincode || !/^[0-9]{6}$/.test(pincode)) errors.push('Pincode must be 6 digits');
  if (!zone) errors.push('Zone is required');
  if (upi_id && !validateUPI(upi_id)) errors.push('Invalid UPI ID format');
  const earn = parseFloat(avg_hourly_earnings);
  if (isNaN(earn) || earn < 10 || earn > 10000) errors.push('Hourly earnings must be ₹10–₹10,000');
  const hours = parseFloat(hours_per_day);
  if (isNaN(hours) || hours < 1 || hours > 24) errors.push('Hours per day must be 1–24');
  return errors;
}

// ── AUTH MIDDLEWARE ───────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id || !decoded.role) return res.status(401).json({ error: 'Invalid token payload' });
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Session expired. Please log in again.' });
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ── ADMIN ONLY ────────────────────────────────────────────────────────────
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    console.warn(`[SECURITY] Unauthorized admin attempt by ${req.user?.id} (role: ${req.user?.role})`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly, JWT_SECRET, sanitizeString, validatePhone, validateRegisterBody };
