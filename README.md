# 🛡️ KamaiShield — AI-Powered Parametric Income Protection

> **Guidewire DEVTrails 2026 | University Hackathon**
> _Kamai aapki. Suraksha hamari. — Your earnings. Our protection._

---

## 🚴 The Problem

India has **10 million+ bike delivery riders** working for Zomato, Swiggy, Blinkit, Zepto, Amazon, and Flipkart — outdoors, every single day. When extreme weather hits, when AQI crosses 400, when a curfew shuts down a zone — **they lose their entire day's income with zero protection.** No employer. No safety net. Nothing.

> A Swiggy rider in Mumbai loses ₹900 on a heavy rain day. He still owes rent. He still feeds his family.

**KamaiShield is that safety net.**

---

## 💡 Solution

KamaiShield is an **AI-enabled parametric insurance platform** that monitors real-time weather, pollution, and civic disruption data for each rider's exact delivery zone. When a disruption threshold is crossed, claims are **created automatically** — no forms, no calls. Every Sunday, all verified disruptions are consolidated and paid out to the rider's UPI.

---

## 👤 Persona

**"Raju" — The Last-Mile Rider**
- Age 22–38 · Bike delivery · Earns ₹500–₹1,500/day
- Works 8–12 hrs/day, 6–7 days/week
- Weekly income: ₹3,500–₹9,000
- Has UPI · No formal insurance · No employer benefits

**Platforms covered**: Zomato · Swiggy · Blinkit · Zepto · BigBasket · Amazon · Flipkart · Meesho · Dunzo

---

## ⚡ 5 Parametric Triggers (Automated)

| # | Trigger | Source | Threshold |
|---|---------|--------|-----------|
| 1 | 🌧️ Heavy Rain | OpenWeatherMap / IMD | >15mm/hr for 20 min |
| 2 | 😷 Severe Pollution | OpenAQ / CPCB | AQI > 400 |
| 3 | 🔥 Extreme Heat | OpenWeatherMap | Feels-like > 45°C |
| 4 | 🌊 Flood / Disaster Alert | NDMA Feed | Official advisory |
| 5 | 🚫 Civic Disruption | News API + Admin | Verified curfew/strike |

All triggers are **pincode-zone specific** — a flood in Kurla does NOT trigger payouts in Andheri.

---

## 💰 Weekly Premium Model

| Plan | Weekly Premium | Coverage Cap | Income Protected |
|------|---------------|--------------|-----------------|
| 🌧️ Basic Shield | ₹29/week | ₹500/week | 60% |
| ⚡ Standard Shield | ₹49/week | ₹1,000/week | 75% |
| 🛡️ Pro Shield | ₹79/week | ₹1,800/week | 90% |

**Dynamic AI Pricing:**
```
Final Premium = Base × Zone Risk Score × Seasonal Factor

Zone Risk Multiplier : 0.85x (low) → 1.15x (high risk / flood-prone)
Seasonal Factor      : 1.2x monsoon · 1.15x smog season · 1.0x normal
```

**Payout Formula:**
```
Payout = Avg Hourly Earnings × Hours Disrupted × Coverage %
Max: capped at weekly coverage cap
```

---

## 🤖 AI / ML Architecture

### 1. Dynamic Premium Engine
- **Algorithm**: Zone Risk Score (ZRS) — weighted combination of historical flood, rain, AQI, heat, and civic disruption frequency per pincode
- **Seasonal Factor**: Monsoon, smog, and heat seasons automatically adjust pricing
- **Re-evaluation**: Weekly based on new disruption data

### 2. Fraud Detection — Behavioural Truth Score (BTS)

GPS alone is **officially obsolete**. KamaiShield uses **6 independent signals**:

| Signal | Why It Matters |
|--------|---------------|
| GPS Coordinates | Primary location check |
| Cell Tower Location | Cannot be spoofed by GPS apps |
| Device Accelerometer | Genuine riders move; spoofers lie still |
| Platform App Heartbeat | Was rider online on delivery app? |
| GPS Signal Quality | Perfect signal in heavy rain = suspicious |
| Battery & Screen Activity | Spoofing apps drain battery unusually |

**BTS Score (0–100):**
- ≥ 55 → ✅ Auto-Approve — added to Sunday payout ledger
- 30–54 → 🔍 Soft Review — 3hr background re-evaluation + ₹20 goodwill if cleared
- < 30 → 📍 Hard Flag — one-tap live location ping required

### 3. Ring Detection Engine

Catches **coordinated fraud syndicates** (e.g., 500 riders using Telegram + GPS spoofer apps):

- **Temporal Clustering**: Spike of 50+ claims in <4 minutes = fraud ring signal
- **Device Fingerprint Network**: Multiple accounts from same device hash
- **Social Graph Analysis**: All claimants from same referral link = high-risk cohort
- **Historical Baseline Deviation**: 200 claims vs historical avg of 3 → automatic alert
- **Network Homogeneity**: Genuine events show multi-telco, multi-platform distribution; rings do not

### 4. Predictive Analytics Engine

- Forecasts next-week disruption probability per zone using seasonal factors + historical patterns
- Estimates expected claims and payout reserves per zone
- Displayed as Radar charts per zone in the Admin Analytics dashboard

---

## 🏗️ Application Workflow

```
Rider Onboarding (3-step)
    ↓
AI Risk Profiling (Zone Risk Score)
    ↓
Weekly Policy Purchase (UPI payment)
    ↓
Real-Time Disruption Monitoring (5 triggers, every 5 min)
    ↓
Parametric Trigger Fires (zone-specific)
    ↓
Auto Claim Created → BTS Fraud Check → Ring Detection
    ↓
Tier 1: Auto-Approve | Tier 2: 3hr Review | Tier 3: Live Ping
    ↓
Sunday 11:30 PM → All verified claims consolidated → UPI payout
    ↓
Rider Dashboard + Admin Dashboard
```

---

## 🛡️ Adversarial Defense & Anti-Spoofing Strategy

> **Market Crash Scenario**: A 500-rider syndicate organized via Telegram used GPS-spoofing apps to fake locations inside a severe weather zone, draining a platform's liquidity pool. Simple GPS verification is dead.

### How KamaiShield responds:

**1. Multi-Signal BTS** — 6 independent signals. A spoofer can fake GPS. They cannot fake all six simultaneously.

**2. Ring Detection** — Population-level analysis. Genuine disruptions cause gradual claim waves. Coordinated fraud causes synchronized spikes at the exact moment the Telegram group says "trigger now."

**3. 3-Tier UX Balance** — Honest riders experiencing genuine network drops in bad weather are NOT punished:
- Tier 2: Silent background review with ₹20 goodwill bonus if they waited
- Tier 3: One single tap — share a live location for 10 seconds. A genuine stranded rider does this in seconds. A spoofer at home cannot.

**4. The Honest Worker Guarantee** — Fewer than 2% of genuine claims ever reach Tier 3. If wrongly rejected, the rider receives **2× payout** as a trust restoration gesture.

---

## 🖥️ Platform: Progressive Web App (PWA)

- Works in browser, installable on home screen — no app store required
- Mobile-first, touch-optimized
- Offline-capable shell
- Works on any Android or iOS browser

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| ML / Analytics | Custom Zone Risk Score + BTS Engine (Python-ready) |
| Security | Helmet · express-rate-limit · bcryptjs (cost 12) · JWT |
| Weather API | OpenWeatherMap (free tier / mock) |
| AQI API | OpenAQ / CPCB (free / mock) |
| Alerts | NDMA Feed (mock) |
| Payments | Razorpay Test Mode (UPI simulation) |
| Charts | Recharts (Radar, Bar, Line, Pie) |
| Cron | node-cron (disruption monitor + Sunday payouts) |
| PWA | manifest.json + meta tags |

---

## 🔒 Security Implementation

| Concern | Implementation |
|---------|---------------|
| HTTP Headers | `helmet` middleware — CSP, X-Frame-Options, HSTS, etc. |
| Brute Force | `express-rate-limit` — 10 auth attempts per 15 min |
| API Abuse | General rate limit — 150 req per 15 min |
| Passwords | `bcryptjs` with cost factor **12** |
| JWT | Signed with env secret · 7-day expiry · validated on every request |
| Input Validation | Full validation + sanitization on all inputs (phone regex, UPI format, numeric bounds, string length caps) |
| Username Enumeration | Login returns identical error for "not found" and "wrong password" |
| Stack Trace Leak | Global error handler returns generic message in production |
| Secrets | All config in `.env` · server exits if JWT_SECRET missing in production |
| Payload Bomb | Body parser limited to `10kb` |
| CORS | Strict origin whitelist from env |

---

## 📁 Project Structure

```
kamaishield/
├── backend/
│   ├── server.js                  # Express + security middleware
│   ├── database.js                # SQLite schema + zone seed data
│   ├── .env.example               # Config template
│   ├── middleware/
│   │   └── auth.js                # JWT auth + input validation + admin guard
│   ├── routes/
│   │   ├── auth.js                # Register / Login / Profile
│   │   ├── policies.js            # Quotes / Buy / Active policy
│   │   └── api.js                 # Claims / Disruptions / Payouts / Admin
│   └── services/
│       ├── riskEngine.js          # Zone Risk Score + Dynamic Premium
│       ├── fraudEngine.js         # BTS Scorer + Ring Detection
│       ├── disruptionMonitor.js   # 5 Triggers + Cron + Auto Claims
│       └── analyticsEngine.js     # Predictive Risk + Weekly Trends + Fraud Insights
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Landing.jsx         # Public landing page
        │   ├── Login.jsx           # Login with demo accounts
        │   ├── Register.jsx        # 3-step onboarding
        │   ├── Dashboard.jsx       # Rider home
        │   ├── Policy.jsx          # AI quote breakdown + purchase
        │   ├── Claims.jsx          # Claims + BTS meter + 6-signal breakdown
        │   ├── PayoutsAlerts.jsx   # Sunday payout tracker + zone alerts
        │   ├── Profile.jsx         # UPI update + earnings settings
        │   ├── AdminDashboard.jsx  # Full analytics + disruption trigger panel
        │   ├── AdminAnalytics.jsx  # Predictive radar charts + fraud insights
        │   └── AdminPages.jsx      # Riders / Claims / Disruptions tables
        ├── components/
        │   └── UI.jsx              # Navbar, cards, badges, loading states
        ├── context/
        │   └── AuthContext.jsx     # JWT auth state
        └── api.js                  # Axios instance with interceptors
```

---

## 🚀 Running Locally

```bash
# 1. Clone and setup
git clone <your-repo-url>
cd kamaishield

# 2. Backend
cd backend
cp .env.example .env          # Edit JWT_SECRET at minimum
npm install
npm run dev                   # Starts on http://localhost:5000

# 3. Frontend (new terminal)
cd ../frontend
npm install
npm run dev                   # Starts on http://localhost:3000

# 4. Open browser
open http://localhost:3000
```

### Demo Accounts

| Role | Phone | Password |
|------|-------|----------|
| 🔧 Admin | `0000000000` | `admin123` |
| 👤 Demo Rider | `9111111111` | `demo123` (after seeding) |

### Demo Flow

1. Log in as **Admin** → click **Seed Demo Data** (creates 5 riders + policies)
2. Click **🚨 Fire Disruption** — pick HEAVY_RAIN in Kurla, Mumbai
3. Watch claims auto-created with BTS fraud scores
4. Go to **Admin → Analytics** to see predictive radar charts
5. Log in as demo rider → see claims, BTS breakdown, payout ledger
6. Go to **Claims** → expand a claim → see 6-signal fraud analysis

---

## 📋 Deliverables Checklist

### Phase 1 ✅
- [x] Idea document (this README)
- [x] Persona-based scenarios and workflow
- [x] Weekly premium model explanation
- [x] Parametric triggers defined
- [x] AI/ML integration plan
- [x] Tech stack and development plan
- [x] Adversarial Defense & Anti-Spoofing Strategy

### Phase 2 ✅
- [x] Rider registration and onboarding (3-step)
- [x] Insurance policy management
- [x] Dynamic premium calculation (Zone Risk Score + Seasonal Factor)
- [x] Claims management with fraud scoring
- [x] 5 automated parametric triggers

### Phase 3 ✅
- [x] Advanced fraud detection (BTS + Ring Detection)
- [x] Weekly payout simulation (Razorpay test mode logic)
- [x] Rider dashboard (coverage, claims, payouts, alerts)
- [x] Admin insurer dashboard (loss ratios, analytics, fraud flags)
- [x] Predictive analytics (next-week zone risk forecasts)

---

## ⚠️ What KamaiShield Does NOT Cover

- ❌ Health / medical expenses
- ❌ Life insurance / accidental death
- ❌ Vehicle repair or damage
- ❌ Personal accidents
- ✅ **ONLY**: Lost income caused by external, uncontrollable disruptions

---

## 👥 Team

> *(Add team member names here)*

## 📎 Links

- 🎥 Demo Video: *(Add link)*
- 📂 Repository: *(This repo)*
- 🌐 Live Demo: *(Add deployed link for Phase 2/3)*

---

*Built for Guidewire DEVTrails 2026 — Seed. Scale. Soar. 🚀*
#   K a m a i S h i e l d  
 