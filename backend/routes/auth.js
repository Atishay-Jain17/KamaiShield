require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authMiddleware, JWT_SECRET, sanitizeString, validatePhone, validateRegisterBody } = require('../middleware/auth');

// ── REGISTER ──────────────────────────────────────────────────────────────
router.post('/register', (req, res) => {
  // Validate input
  const errors = validateRegisterBody(req.body);
  if (errors.length > 0) return res.status(400).json({ error: errors[0], errors });

  const {
    name, phone, password, email, platform, city, pincode, zone,
    upi_id, avg_hourly_earnings, hours_per_day
  } = req.body;

  // Sanitize all string inputs
  const safeName     = sanitizeString(name, 60);
  const safePhone    = phone.trim();
  const safeEmail    = email ? sanitizeString(email, 120) : null;
  const safePlatform = sanitizeString(platform, 40);
  const safeCity     = sanitizeString(city, 40);
  const safePincode  = pincode.trim();
  const safeZone     = sanitizeString(zone, 60);
  const safeUPI      = upi_id ? sanitizeString(upi_id, 80) : `${safePhone}@upi`;
  const safeEarn     = Math.min(Math.max(parseFloat(avg_hourly_earnings) || 100, 10), 10000);
  const safeHours    = Math.min(Math.max(parseFloat(hours_per_day) || 8, 1), 24);

  // Check duplicate phone
  const existing = db.prepare(`SELECT id FROM riders WHERE phone = ?`).get(safePhone);
  if (existing) return res.status(409).json({ error: 'This phone number is already registered' });

  // Hash password with high cost factor
  const hashedPassword = bcrypt.hashSync(password, 12);
  const id = uuidv4();

  db.prepare(`
    INSERT INTO riders (id, name, phone, email, password, platform, city, pincode, zone, upi_id, avg_hourly_earnings, hours_per_day)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, safeName, safePhone, safeEmail, hashedPassword, safePlatform, safeCity, safePincode, safeZone, safeUPI, safeEarn, safeHours);

  const token = jwt.sign({ id, phone: safePhone, role: 'rider', name: safeName }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    success: true,
    token,
    rider: { id, name: safeName, phone: safePhone, email: safeEmail, platform: safePlatform, city: safeCity, pincode: safePincode, zone: safeZone, role: 'rider' }
  });
});

// ── LOGIN ─────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) return res.status(400).json({ error: 'Phone and password required' });
  if (!validatePhone(phone.trim())) return res.status(400).json({ error: 'Invalid phone number format' });
  if (typeof password !== 'string' || password.length > 128) return res.status(400).json({ error: 'Invalid password' });

  const rider = db.prepare(`SELECT * FROM riders WHERE phone = ?`).get(phone.trim());

  // Use same error message for both "not found" and "wrong password"
  // This prevents username enumeration attacks
  const invalidMsg = 'Invalid phone number or password';
  if (!rider) return res.status(401).json({ error: invalidMsg });

  const valid = bcrypt.compareSync(password, rider.password);
  if (!valid) return res.status(401).json({ error: invalidMsg });

  const token = jwt.sign(
    { id: rider.id, phone: rider.phone, role: rider.role, name: rider.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...riderData } = rider;
  res.json({ success: true, token, rider: riderData });
});

// ── GET PROFILE ───────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  const rider = db.prepare(`SELECT * FROM riders WHERE id = ?`).get(req.user.id);
  if (!rider) return res.status(404).json({ error: 'Rider not found' });
  const { password: _, ...riderData } = rider;
  res.json(riderData);
});

module.exports = router;
