# KamaiShield — Parametric Income Protection for India's Gig Workers

> **"Kamai aapki, suraksha humari."**
> *Your earnings, our protection.*

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](#license)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://web.dev/progressive-web-apps/)

---

## The Problem

India's 10 million+ last-mile delivery riders — Swiggy, Zomato, Blinkit, Zepto, Amazon — lose **20–30% of their monthly income** to factors completely outside their control: sudden heavy rain, severe air pollution, extreme heat, floods, and civic curfews. When it rains, they can't deliver. When they can't deliver, they don't earn. There is no safety net.

**KamaiShield is that safety net.**

---

## What KamaiShield Does

KamaiShield is an **AI-powered parametric income protection platform**. Riders pay a small weekly premium (₹29–₹79). When a real-world disruption crosses a verified threshold in their delivery zone, the platform:

1. **Automatically detects** the disruption via live weather and AQI APIs
2. **Instantly creates a claim** — no form, no button, no waiting
3. **Runs rule-based fraud validation** on every claim using a 6-signal Behavioural Truth Score
4. **Pays out** the rider's lost income every Sunday via UPI

Zero paperwork. Zero manual claims. Fully automated.

---

## Core Features

### Parametric Triggers (Real-time, API-driven)
| Trigger | Threshold | Data Source |
|---|---|---|
| 🌧️ Heavy Rainfall | > 15 mm/hr | WeatherAPI.com |
| 😷 Severe Air Pollution | AQI > 400 | OpenAQ (CPCB) |
| 🔥 Extreme Heat | Feels-like > 45°C | WeatherAPI.com |
| 🌊 Flood Alert | Official advisory | WeatherAPI.com condition |
| 🚫 Civic Disruption | Curfew / Strike | Admin flag |

All triggers are **pincode-zone specific** — a flood in Kurla does not trigger payouts in Andheri.

### Weekly Plans
| Plan | Premium | Coverage | Cap |
|---|---|---|---|
| Basic Shield | ₹29/week | 60% of lost income | ₹500/week |
| Standard Shield | ₹49/week | 75% of lost income | ₹1,000/week |
| Pro Shield | ₹79/week | 90% of lost income | ₹1,800/week |

Premiums are **adjusted** by zone risk score (0.85×–1.25×) and seasonal factor (1.0×–1.25×).

### Behavioural Truth Score (BTS) — Fraud DetectionEvery claim is scored 0–100 using 6 independent signals:

| Signal | Max Points | What it detects |
|---|---|---|
| GPS Zone Match | 20 | Rider is in the disruption zone |
| GPS Signal Quality | 15 | Perfect GPS in heavy rain = suspicious (spoofer) |
| Device Accelerometer | 15 | Genuine riders move; spoofers are stationary |
| Cell Tower Location | 20 | Cannot be spoofed by GPS apps |
| Platform App Heartbeat | 15 | Was rider online on Swiggy/Zomato during disruption? |
| Battery & Screen Activity | 15 | Spoofing apps drain battery unusually fast |

**Scoring tiers:**
- **BTS ≥ 55** → Tier 1: Auto-Approve, instant payout
- **BTS 30–54** → Tier 2: Silent 4-hour background review + ₹20 goodwill bonus
- **BTS < 30** → Tier 3: One-tap live location verification required

### Coverage Exclusions

KamaiShield covers **income loss from the 5 defined parametric triggers only**. The following are explicitly excluded:

- Health or medical expenses
- Life insurance or accidental death
- Vehicle repair or damage
- Personal accidents
- **War or armed conflict**
- **Pandemic or epidemic**
- **Terrorism or civil unrest**
- Acts of God outside the 5 defined triggers (e.g. earthquake, lightning)

---

### Ring Detection Engine
Detects coordinated fraud syndicates automatically:
- **Temporal Spike**: > 15 claims in < 10 minutes for one disruption
- **Platform Homogeneity**: All claims from a single delivery platform
- **Baseline Deviation**: Claims > 5× historical average for that zone

### AI Pricing & Explanations (Gemini 2.0 Flash)
- Plain-language explanation of why your premium is what it is
- BTS score explanation per claim in simple Hindi/English
- Zone risk and seasonal factor breakdowns

### Honest Worker Guarantee
If a genuine claim is wrongly rejected, the rider receives **2× the original payout amount**.

### Weekly Payout Processing
Every Sunday at 11:30 PM IST, all approved claims are consolidated into a single UPI transfer per rider.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React PWA)                  │
│  Vite · Tailwind CSS · Recharts · Lucide Icons          │
│  Mobile-first · Glassmorphism UI · Apple-style design   │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (JWT Auth)
┌──────────────────────▼──────────────────────────────────┐
│                  Backend (Node.js + Express)             │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │ Disruption      │  │ Fraud Engine (BTS)           │  │
│  │ Monitor         │  │ · 6-signal scoring           │  │
│  │ · WeatherAPI    │  │ · Ring detection             │  │
│  │ · OpenAQ        │  │ · Live location verify       │  │
│  │ · Every 5 min   │  └──────────────────────────────┘  │
│  └─────────────────┘                                     │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │ Risk Engine     │  │ Analytics Engine             │  │
│  │ · Zone pricing  │  │ · Predictive risk (7-day)    │  │
│  │ · Seasonal adj  │  │ · Weekly trends              │  │
│  │ · Payout calc   │  │ · Fraud insights             │  │
│  └─────────────────┘  └──────────────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ SQLite (better-sqlite3) · JWT · bcrypt · Helmet │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  External APIs                           │
│  WeatherAPI.com · OpenAQ (CPCB) · Google Gemini 2.0    │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Lucide React |
| Backend | Node.js 22, Express.js, better-sqlite3 |
| Auth | JWT (jsonwebtoken), bcrypt (cost factor 12) |
| Database | SQLite (WAL mode, foreign keys enforced) |
| Weather | WeatherAPI.com (real-time rain, temp, conditions) |
| AQI | OpenAQ v3 API (CPCB government monitoring stations) |
| AI | Google Gemini 2.0 Flash (pricing & claim explanations) |
| Security | Helmet, express-rate-limit, input sanitization |
| PWA | Web App Manifest, service worker ready |

---

## Security

- All passwords hashed with **bcrypt cost factor 12**
- **JWT authentication** on all protected routes
- **Rate limiting**: 10 login attempts / 15 min, 5 registrations / hour / IP
- **Helmet** security headers on all responses
- **Input sanitization** on all user-supplied fields
- **10 KB request body limit** to prevent payload bombs
- Admin routes protected by role-based middleware
- Identical error messages for "user not found" and "wrong password" (prevents enumeration)

---

## Prerequisites

- Node.js 22+
- npm 10+
- API keys (see `.env.example`)

---

## Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd KamaiShield

# 2. Backend setup
cd backend
cp .env.example .env
# Fill in your API keys in .env
npm install
node server.js

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

The backend runs on `http://localhost:5000`
The frontend runs on `http://localhost:3000`

### Environment Variables

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_here

# Real API keys required
WEATHERAPI_KEY=your_weatherapi_key
OPENAQ_API_KEY=your_openaq_key
GEMINI_API_KEY=your_gemini_key
```

---

## Test Credentials

| Role | Phone | Password |
|---|---|---|
| Admin | `0000000000` | `Admin@123` |
| Rider (Raju Verma, Swiggy Mumbai) | `9111111111` | `Rider@123` |

> **Admin flow**: Login → Admin Dashboard → Trigger a disruption → Watch claims auto-create → Process Payouts
>
> **Rider flow**: Login → Dashboard → Policy → Buy a plan → Wait for disruption → Claims auto-appear

---

## Covered Cities & Zones

| City | Zones |
|---|---|
| Mumbai | Fort/CST, Kurla, Andheri West, Borivali |
| Delhi | Connaught Place, Shahdara, Dwarka |
| Bengaluru | MG Road, Koramangala, HSR Layout |
| Chennai | Parrys, T. Nagar |
| Hyderabad | Charminar, Gachibowli |

---

## What's Real vs Simulated

| Component | Status |
|---|---|
| Weather data (rain, temp) | ✅ Real — WeatherAPI.com |
| AQI data | ✅ Real — OpenAQ (CPCB stations) |
| AI explanations | ✅ Real — Gemini 2.0 Flash |
| BTS fraud algorithm | ✅ Real algorithm, simulated device signals |
| Ring detection | ✅ Real — SQL-based pattern detection |
| UPI payouts | ⚙️ Simulated — real Razorpay integration ready |
| Platform heartbeat | ⚙️ Simulated — requires delivery platform API access |
| Cell tower data | ⚙️ Simulated — requires telecom API |

---

## Project Structure

```
KamaiShield/
├── backend/
│   ├── database.js          # SQLite schema + seeding
│   ├── server.js            # Express app entry point
│   ├── middleware/
│   │   └── auth.js          # JWT + rate limiting + validation
│   ├── routes/
│   │   ├── auth.js          # Register, login, profile
│   │   ├── policies.js      # Quotes, purchase, history
│   │   └── api.js           # Claims, disruptions, admin, AI
│   └── services/
│       ├── disruptionMonitor.js  # Real-time weather/AQI + cron
│       ├── fraudEngine.js        # BTS scoring + ring detection
│       ├── riskEngine.js         # Premium calculation
│       └── analyticsEngine.js   # Predictive risk + trends
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── UI.jsx       # Design system (Navbar, StatCard, etc.)
    │   │   └── Logo.jsx     # KamaiShield brand logo
    │   └── pages/
    │       ├── Landing.jsx
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── Dashboard.jsx
    │       ├── Policy.jsx
    │       ├── Claims.jsx
    │       ├── PayoutsAlerts.jsx
    │       ├── Profile.jsx
    │       ├── AdminDashboard.jsx
    │       ├── AdminAnalytics.jsx
    │       └── AdminPages.jsx
    └── public/
        ├── logo.svg
        └── manifest.json
```

---

## License

**Copyright © 2026 KamaiShield. All Rights Reserved.**

This software and its source code are the exclusive intellectual property of KamaiShield. **No part of this codebase may be copied, modified, distributed, sublicensed, sold, or used in any commercial or non-commercial product without explicit written permission from the copyright holder.**

This is **not open-source software**. Viewing this code does not grant any rights to use, reproduce, or distribute it.

For licensing inquiries, contact: legal@kamaishield.in

---

## Disclaimer

KamaiShield covers **income loss only**. Health, life, accident, and vehicle damage are explicitly excluded. Payouts are simulated UPI transfers for demonstration purposes. This platform is a proof-of-concept and is not a licensed insurance product.

---

*Built with ❤️ for India's delivery workers — the essential workers who keep our cities running.*
