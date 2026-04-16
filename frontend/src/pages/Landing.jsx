import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheck, Zap, CheckCircle2, ArrowRight, Star, CloudRain, Wind, Flame, Waves, Ban,
  MapPin, RefreshCw, Activity, Scale, Users, TrendingUp, Clock, IndianRupee, Smartphone,
  Wifi, Lock, Award, Globe, ChevronRight, AlertTriangle, BarChart3, Fingerprint, Radio,
  Battery, Eye, Phone, Building2, Quote
} from "lucide-react";
import Logo from "../components/Logo";

function SectionLabel({ children }) {
  return (
    <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#6366f1] mb-3">
      <span className="w-4 h-px bg-[#6366f1] inline-block" />
      {children}
      <span className="w-4 h-px bg-[#6366f1] inline-block" />
    </p>
  );
}

function FeatureRow({ ok, text }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {ok
        ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" color="#059669" strokeWidth={2.5} />
        : <span className="w-[15px] h-[15px] shrink-0 mt-0.5 rounded-full border-2 border-[#d1d1d6] inline-block" />}
      <span className={`text-sm leading-snug ${ok ? "text-[#1c1c1e]" : "text-[#aeaeb2] line-through"}`}>{text}</span>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f2f2f7]">

      {/* ═══════════════════════════════════════════════════════════════
          1. HERO SECTION — dark gradient, dramatic
      ═══════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,#0f0f1a 0%,#1a1a2e 50%,#0f172a 100%)" }}
      >
        {/* ambient glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle,#6366f1 0%,transparent 70%)" }} />
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle,#2e7d32 0%,transparent 70%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse,#1565c0 0%,transparent 70%)" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-28">
          {/* pill badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-white/10"
              style={{ background: "rgba(99,102,241,0.15)", backdropFilter: "blur(12px)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
              <span className="text-[#a5b4fc] text-xs font-semibold tracking-wide">India&apos;s First Parametric Gig Insurance</span>
            </div>
          </div>

          {/* logo */}
          <div className="flex justify-center mb-6">
            <Logo height={52} />
          </div>

          {/* headline */}
          <h1 className="text-center text-[38px] sm:text-[52px] md:text-[64px] font-extrabold leading-[1.08] tracking-tight mb-6 animate-fade-up">
            <span className="text-white">Your income stops.</span>
            <br />
            <span style={{ background: "linear-gradient(135deg,#6ee7b7 0%,#6366f1 50%,#60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Your payout doesn&apos;t.
            </span>
          </h1>

          {/* sub */}
          <p className="text-center text-[#94a3b8] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: "60ms" }}>
            KamaiShield monitors rain, pollution, heat, floods, and curfews in real-time.
            When a disruption hits your pincode, we automatically create a claim and pay you every Sunday — zero action required.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12 animate-fade-up" style={{ animationDelay: "120ms" }}>
            {user ? (
              <Link to={user.role === "admin" ? "/admin" : "/dashboard"}
                className="btn-primary inline-flex items-center justify-center gap-2 text-base py-4 px-10">
                Go to Dashboard <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
            ) : (
              <>
                <Link to="/register"
                  className="btn-primary inline-flex items-center justify-center gap-2 text-base py-4 px-10">
                  Get Protected — ₹29/week <ArrowRight size={16} strokeWidth={2.5} />
                </Link>
                <Link to="/login"
                  className="inline-flex items-center justify-center gap-2 text-base py-4 px-8 rounded-xl font-semibold border border-white/20 text-white transition-all duration-200 hover:bg-white/10"
                  style={{ backdropFilter: "blur(12px)" }}>
                  Sign In <ChevronRight size={15} strokeWidth={2.5} />
                </Link>
              </>
            )}
          </div>

          {/* floating stat badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-up" style={{ animationDelay: "180ms" }}>
            {[
              { icon: Users, val: "10M+", label: "Riders at risk" },
              { icon: IndianRupee, val: "₹29", label: "Starting/week" },
              { icon: Zap, val: "5 min", label: "Check interval" },
              { icon: Clock, val: "Sunday", label: "Payout day" },
              { icon: ShieldCheck, val: "100%", label: "Automated" },
            ].map(({ icon: Icon, val, label }) => (
              <div key={label}
                className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 border border-white/10"
                style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(16px)" }}>
                <Icon size={14} color="#a5b4fc" strokeWidth={2} />
                <span className="text-white font-bold text-sm">{val}</span>
                <span className="text-[#64748b] text-xs">{label}</span>
              </div>
            ))}
          </div>

          {/* trust row */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 animate-fade-up" style={{ animationDelay: "240ms" }}>
            {[
              { icon: Lock, text: "256-bit SSL" },
              { icon: ShieldCheck, text: "IRDAI Sandbox" },
              { icon: Wifi, text: "Live API data" },
              { icon: Smartphone, text: "PWA Ready" },
              { icon: Award, text: "Zero-claim payout" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-[#64748b] text-xs">
                <Icon size={12} strokeWidth={2} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          2. PROBLEM SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#0f0f1a]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <SectionLabel>The Problem</SectionLabel>
            <h2 className="text-[32px] md:text-[44px] font-extrabold text-white leading-tight tracking-tight">
              The <span style={{ color: "#f43f5e" }}>₹18,000 crore</span> problem<br />nobody is solving
            </h2>
            <p className="text-[#64748b] text-lg mt-4 max-w-xl mx-auto">
              10 million gig riders lose income every week to disruptions beyond their control. No safety net exists.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: TrendingUp,
                stat: "20–30%",
                label: "Monthly income lost",
                desc: "A single heavy-rain week wipes out nearly a third of a rider's monthly earnings. There is no recovery mechanism.",
                color: "#f43f5e",
                bg: "rgba(244,63,94,0.08)",
                border: "rgba(244,63,94,0.2)",
              },
              {
                icon: Users,
                stat: "10M+",
                label: "Riders unprotected",
                desc: "Swiggy, Zomato, Blinkit, Porter, Dunzo — every platform rider is exposed. Not one has income insurance.",
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.08)",
                border: "rgba(245,158,11,0.2)",
              },
              {
                icon: IndianRupee,
                stat: "₹0",
                label: "Safety net exists",
                desc: "Traditional insurers ignore gig workers. Banks won't lend. Government schemes don't cover parametric disruptions.",
                color: "#f43f5e",
                bg: "rgba(244,63,94,0.08)",
                border: "rgba(244,63,94,0.2)",
              },
            ].map(({ icon: Icon, stat, label, desc, color, bg, border }, i) => (
              <div key={label}
                className="rounded-2xl p-6 border animate-fade-up"
                style={{ background: bg, borderColor: border, animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}22` }}>
                    <Icon size={20} color={color} strokeWidth={2} />
                  </div>
                  <span className="text-[42px] font-extrabold leading-none" style={{ color }}>{stat}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{label}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl p-6 border border-white/5 text-center"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-[#94a3b8] text-sm">
              <AlertTriangle size={14} className="inline mr-1.5 text-[#f59e0b]" strokeWidth={2} />
              India&apos;s gig economy is projected to reach <strong className="text-white">₹4.5 lakh crore</strong> by 2030 — yet zero income-protection products exist for its workers.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. SOLUTION INTRO
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#f2f2f7]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* left */}
            <div>
              <SectionLabel>The Solution</SectionLabel>
              <h2 className="text-[32px] md:text-[42px] font-extrabold text-[#1c1c1e] leading-tight tracking-tight mb-6">
                KamaiShield changes<br />
                <span style={{ background: "linear-gradient(135deg,#4f46e5,#2e7d32)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  everything.
                </span>
              </h2>
              <p className="text-[#636366] text-lg leading-relaxed mb-8">
                We built the world&apos;s first parametric income-protection product for Indian gig workers.
                No forms. No adjusters. No disputes. Just automatic payouts when disruptions hit your zone.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Zap, color: "#4f46e5", bg: "#eef2ff", title: "Parametric triggers", desc: "Objective thresholds — rain, AQI, temperature — fire automatically. No subjectivity." },
                  { icon: MapPin, color: "#0284c7", bg: "#e0f2fe", title: "Pincode precision", desc: "Your zone, your payout. Disruptions 10km away don't affect your claim." },
                  { icon: RefreshCw, color: "#059669", bg: "#d1fae5", title: "Weekly cycle", desc: "Premiums and payouts align with how gig workers actually earn — weekly." },
                ].map(({ icon: Icon, color, bg, title, desc }) => (
                  <div key={title} className="flex gap-4 items-start">
                    <div className="icon-wrap w-10 h-10 shrink-0" style={{ background: bg }}>
                      <Icon size={18} color={color} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1c1c1e] text-sm mb-0.5">{title}</h4>
                      <p className="text-[#8e8e93] text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* right — mock phone dashboard */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm">
                {/* phone frame */}
                <div className="rounded-[2.5rem] p-3 shadow-2xl border border-white/60"
                  style={{ background: "linear-gradient(160deg,#1a1a2e,#0f172a)" }}>
                  <div className="rounded-[2rem] overflow-hidden"
                    style={{ background: "linear-gradient(160deg,#0f0f1a,#1a1a2e)" }}>
                    {/* status bar */}
                    <div className="flex justify-between items-center px-5 pt-4 pb-2">
                      <span className="text-white text-xs font-semibold">9:41</span>
                      <div className="flex gap-1 items-center">
                        <Wifi size={12} color="white" />
                        <Battery size={12} color="white" />
                      </div>
                    </div>
                    {/* app header */}
                    <div className="px-5 pb-4 border-b border-white/5">
                      <Logo height={22} />
                      <p className="text-[#64748b] text-[10px] mt-0.5">Mumbai · Kurla (400070)</p>
                    </div>
                    {/* alert card */}
                    <div className="mx-3 mt-4 rounded-2xl p-4 border border-[#f43f5e]/30"
                      style={{ background: "rgba(244,63,94,0.1)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <CloudRain size={16} color="#f43f5e" strokeWidth={2} />
                        <span className="text-[#f43f5e] text-xs font-bold uppercase tracking-wide">Trigger Detected</span>
                      </div>
                      <p className="text-white text-sm font-semibold">Heavy Rain — 18.4mm/hr</p>
                      <p className="text-[#64748b] text-xs mt-0.5">Threshold: &gt;15mm/hr · Kurla zone</p>
                    </div>
                    {/* claim auto-created */}
                    <div className="mx-3 mt-3 rounded-2xl p-4 border border-[#059669]/30"
                      style={{ background: "rgba(5,150,105,0.1)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={16} color="#059669" strokeWidth={2} />
                        <span className="text-[#059669] text-xs font-bold uppercase tracking-wide">Claim Auto-Created</span>
                      </div>
                      <p className="text-white text-sm font-semibold">₹750 queued for Sunday</p>
                      <p className="text-[#64748b] text-xs mt-0.5">No action needed · UPI payout</p>
                    </div>
                    {/* payout row */}
                    <div className="mx-3 mt-3 mb-4 rounded-2xl p-4 border border-white/5"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      <p className="text-[#64748b] text-[10px] uppercase tracking-wide mb-2">This Week</p>
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">Total payout</span>
                        <span className="text-[#6ee7b7] font-bold text-lg">₹1,250</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[#64748b] text-xs">Arrives Sunday</span>
                        <span className="text-[#64748b] text-xs">2 claims</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          4. HOW IT WORKS — 4 steps with connector
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 border-y border-[#e5e5ea]" style={{ background: "rgba(255,255,255,0.7)" }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="text-[32px] md:text-[42px] font-extrabold text-[#1c1c1e] tracking-tight">
              Four steps to income protection
            </h2>
            <p className="text-[#8e8e93] text-lg mt-3 max-w-lg mx-auto">
              From sign-up to Sunday payout — fully automated, zero paperwork.
            </p>
          </div>

          <div className="relative">
            {/* connector line desktop */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px"
              style={{ background: "linear-gradient(90deg,transparent,#6366f1 20%,#6366f1 80%,transparent)" }} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  Icon: Smartphone,
                  color: "#4f46e5",
                  bg: "#eef2ff",
                  title: "Sign Up",
                  desc: "Register with your phone number, delivery platform, and pincode. Takes under 2 minutes.",
                  detail: "Supports Swiggy, Zomato, Blinkit, Porter, Dunzo",
                },
                {
                  step: "02",
                  Icon: ShieldCheck,
                  color: "#059669",
                  bg: "#d1fae5",
                  title: "Choose a Plan",
                  desc: "Pick Basic (₹29), Standard (₹49), or Pro (₹79) per week. Active immediately after payment.",
                  detail: "Cancel anytime · No annual lock-in",
                },
                {
                  step: "03",
                  Icon: Radio,
                  color: "#0284c7",
                  bg: "#e0f2fe",
                  title: "We Monitor",
                  desc: "Our engine checks WeatherAPI, OpenAQ, and civic alerts for your exact pincode every 5 minutes.",
                  detail: "24/7 automated monitoring",
                },
                {
                  step: "04",
                  Icon: IndianRupee,
                  color: "#7c3aed",
                  bg: "#ede9fe",
                  title: "Get Paid",
                  desc: "Disruption detected → claim auto-created → payout consolidated and sent to your UPI every Sunday.",
                  detail: "Zero rider action required",
                },
              ].map(({ step, Icon, color, bg, title, desc, detail }, i) => (
                <div key={step}
                  className="card-glass hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1 animate-fade-up text-center"
                  style={{ animationDelay: `${i * 80}ms` }}>
                  {/* step number + icon */}
                  <div className="relative flex justify-center mb-4">
                    <div className="icon-wrap w-14 h-14" style={{ background: bg }}>
                      <Icon size={24} color={color} strokeWidth={1.8} />
                    </div>
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center"
                      style={{ background: color }}>
                      {step}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-[#1c1c1e] text-base mb-2">{title}</h3>
                  <p className="text-[#636366] text-sm leading-relaxed mb-3">{desc}</p>
                  <p className="text-[10px] font-semibold px-2 py-1 rounded-full inline-block"
                    style={{ background: bg, color }}>{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5. LIVE TRIGGERS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#f2f2f7]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <SectionLabel>Parametric Triggers</SectionLabel>
            <h2 className="text-[32px] md:text-[42px] font-extrabold text-[#1c1c1e] tracking-tight">
              5 disruption types. All automated.
            </h2>
            <p className="text-[#8e8e93] text-lg mt-3 max-w-xl mx-auto">
              Objective thresholds sourced from live APIs. No adjuster. No dispute. Threshold crossed = payout triggered.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                Icon: CloudRain,
                color: "#0284c7",
                bg: "linear-gradient(135deg,#e0f2fe,#bae6fd)",
                border: "#7dd3fc",
                type: "Heavy Rain",
                threshold: "> 15 mm/hr",
                source: "WeatherAPI",
                sourceColor: "#0284c7",
                desc: "Rainfall intensity measured at your pincode. Sustained heavy rain makes delivery impossible and dangerous.",
                example: "Mumbai, July 2024: 3 days triggered, avg payout ₹680/rider",
              },
              {
                Icon: Wind,
                color: "#7c3aed",
                bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)",
                border: "#c4b5fd",
                type: "Severe Pollution",
                threshold: "AQI > 400",
                source: "OpenAQ",
                sourceColor: "#7c3aed",
                desc: "Air Quality Index above 400 is hazardous. Riders face health risk and reduced order volume.",
                example: "Delhi, Nov 2024: 11 days triggered, avg payout ₹920/rider",
              },
              {
                Icon: Flame,
                color: "#d97706",
                bg: "linear-gradient(135deg,#fef3c7,#fde68a)",
                border: "#fcd34d",
                type: "Extreme Heat",
                threshold: "> 45°C",
                source: "WeatherAPI",
                sourceColor: "#d97706",
                desc: "Temperatures above 45°C cause severe heat stress. Order volumes drop 40–60% during heat waves.",
                example: "Rajasthan, May 2024: 7 days triggered, avg payout ₹540/rider",
              },
              {
                Icon: Waves,
                color: "#0891b2",
                bg: "linear-gradient(135deg,#cffafe,#a5f3fc)",
                border: "#67e8f9",
                type: "Flood Alert",
                threshold: "Official advisory",
                source: "Govt. API",
                sourceColor: "#0891b2",
                desc: "State government flood advisories for specific zones. Waterlogged roads make delivery physically impossible.",
                example: "Chennai, Oct 2024: 4 days triggered, avg payout ₹810/rider",
              },
              {
                Icon: Ban,
                color: "#e11d48",
                bg: "linear-gradient(135deg,#ffe4e6,#fecdd3)",
                border: "#fda4af",
                type: "Civic Disruption",
                threshold: "Curfew / Strike",
                source: "Civic API",
                sourceColor: "#e11d48",
                desc: "Section 144, bandhs, or transport strikes that prevent movement in specific pincodes.",
                example: "Bengaluru, Aug 2024: 2 days triggered, avg payout ₹760/rider",
              },
              {
                Icon: Globe,
                color: "#059669",
                bg: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
                border: "#6ee7b7",
                type: "Zone Precision",
                threshold: "Pincode-level",
                source: "All sources",
                sourceColor: "#059669",
                desc: "Every trigger is evaluated at your specific pincode. A flood in Andheri never pays a Kurla rider.",
                example: "400070 vs 400053 — completely independent trigger zones",
              },
            ].map(({ Icon, color, bg, border, type, threshold, source, sourceColor, desc, example }, i) => (
              <div key={type}
                className="rounded-2xl p-6 border hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1 animate-fade-up"
                style={{ background: bg, borderColor: border, animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="icon-wrap w-12 h-12" style={{ background: "rgba(255,255,255,0.7)" }}>
                    <Icon size={22} color={color} strokeWidth={1.8} />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.8)", color: sourceColor }}>
                    {source}
                  </span>
                </div>
                <h3 className="font-extrabold text-[#1c1c1e] text-lg mb-1">{type}</h3>
                <p className="font-mono text-sm font-bold mb-3" style={{ color }}>{threshold}</p>
                <p className="text-[#636366] text-sm leading-relaxed mb-4">{desc}</p>
                <div className="rounded-xl p-3 border border-white/60" style={{ background: "rgba(255,255,255,0.5)" }}>
                  <p className="text-[11px] text-[#8e8e93] leading-relaxed">{example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          6. FRAUD PROTECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 border-y border-[#e5e5ea]" style={{ background: "rgba(255,255,255,0.8)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <SectionLabel>Fraud Protection</SectionLabel>
            <h2 className="text-[32px] md:text-[42px] font-extrabold text-[#1c1c1e] tracking-tight">
              Military-grade fraud detection
            </h2>
            <p className="text-[#8e8e93] text-lg mt-3 max-w-xl mx-auto">
              Our BTS (Behavioral Trust Score) engine analyses 6 real-time signals to ensure every payout is legitimate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* BTS signals */}
            <div>
              <h3 className="font-bold text-[#1c1c1e] text-base mb-5 flex items-center gap-2">
                <BarChart3 size={18} color="#4f46e5" strokeWidth={2} />
                6 BTS Signals
              </h3>
              <div className="space-y-4">
                {[
                  { icon: Activity, label: "Claim frequency", score: 92, color: "#059669", desc: "Unusual claim spikes vs. historical baseline" },
                  { icon: MapPin, label: "Location consistency", score: 88, color: "#0284c7", desc: "GPS zone matches registered pincode" },
                  { icon: Fingerprint, label: "Device fingerprint", score: 95, color: "#7c3aed", desc: "Single device per account enforcement" },
                  { icon: Clock, label: "Timing patterns", score: 79, color: "#d97706", desc: "Claim timing vs. disruption window" },
                  { icon: Eye, label: "Behavioural anomaly", score: 84, color: "#0891b2", desc: "ML model detects unusual patterns" },
                  { icon: Phone, label: "Account age", score: 91, color: "#059669", desc: "New accounts flagged for manual review" },
                ].map(({ icon: Icon, label, score, color, desc }) => (
                  <div key={label} className="card-glass p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="icon-wrap w-8 h-8 shrink-0" style={{ background: `${color}18` }}>
                        <Icon size={15} color={color} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-[#1c1c1e] text-sm">{label}</span>
                          <span className="text-xs font-bold" style={{ color }}>{score}/100</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#f2f2f7] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${score}%`, background: `linear-gradient(90deg,${color}88,${color})` }} />
                        </div>
                      </div>
                    </div>
                    <p className="text-[#8e8e93] text-xs ml-11">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier system */}
            <div>
              <h3 className="font-bold text-[#1c1c1e] text-base mb-5 flex items-center gap-2">
                <ShieldCheck size={18} color="#4f46e5" strokeWidth={2} />
                3-Tier Decision System
              </h3>
              <div className="space-y-4">
                {[
                  {
                    tier: "Auto-Approve",
                    range: "BTS ≥ 80",
                    color: "#059669",
                    bg: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
                    border: "#6ee7b7",
                    icon: CheckCircle2,
                    desc: "Claim is automatically approved and queued for Sunday payout. No human review needed.",
                    pct: "~78% of claims",
                  },
                  {
                    tier: "Manual Review",
                    range: "BTS 50–79",
                    color: "#d97706",
                    bg: "linear-gradient(135deg,#fef3c7,#fde68a)",
                    border: "#fcd34d",
                    icon: Eye,
                    desc: "Claim is flagged for admin review within 24 hours. Rider is notified of the delay.",
                    pct: "~17% of claims",
                  },
                  {
                    tier: "Auto-Flag",
                    range: "BTS < 50",
                    color: "#e11d48",
                    bg: "linear-gradient(135deg,#ffe4e6,#fecdd3)",
                    border: "#fda4af",
                    icon: AlertTriangle,
                    desc: "Claim is rejected and account is flagged. Rider can appeal with supporting evidence.",
                    pct: "~5% of claims",
                  },
                ].map(({ tier, range, color, bg, border, icon: Icon, desc, pct }) => (
                  <div key={tier}
                    className="rounded-2xl p-5 border"
                    style={{ background: bg, borderColor: border }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <Icon size={18} color={color} strokeWidth={2} />
                        <span className="font-extrabold text-[#1c1c1e] text-base">{tier}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.7)", color }}>{range}</span>
                        <span className="text-[10px] text-[#8e8e93]">{pct}</span>
                      </div>
                    </div>
                    <p className="text-[#636366] text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 card-glass p-4 flex items-start gap-3">
                <Lock size={18} color="#4f46e5" strokeWidth={2} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#1c1c1e] text-sm mb-1">Gemini AI Integration</p>
                  <p className="text-[#8e8e93] text-xs leading-relaxed">
                    Our fraud engine uses Google Gemini AI to cross-reference claim patterns against historical disruption data, platform activity logs, and zone-level weather records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          7. PRICING
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#f2f2f7]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="text-[32px] md:text-[42px] font-extrabold text-[#1c1c1e] tracking-tight">
              Simple, transparent plans
            </h2>
            <p className="text-[#8e8e93] text-lg mt-3 max-w-lg mx-auto">
              Weekly premiums that match how you earn. No annual lock-in. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Basic Shield",
                price: "₹29",
                cap: "₹500",
                pct: "60%",
                for: "Part-time riders",
                color: "#3a3a3c",
                accentColor: "#636366",
                grad: "linear-gradient(160deg,#ffffff,#f4f4f5)",
                border: "#e5e5ea",
                features: [
                  { ok: true,  text: "Up to ₹500/week payout" },
                  { ok: true,  text: "60% of lost income covered" },
                  { ok: true,  text: "All 5 disruption triggers" },
                  { ok: true,  text: "Sunday UPI payout" },
                  { ok: true,  text: "Real-time disruption alerts" },
                  { ok: false, text: "Priority claim processing" },
                  { ok: false, text: "Dedicated support line" },
                  { ok: false, text: "Zone risk analytics" },
                ],
              },
              {
                name: "Standard Shield",
                price: "₹49",
                cap: "₹1,000",
                pct: "75%",
                for: "Full-time riders",
                color: "#4f46e5",
                accentColor: "#4f46e5",
                grad: "linear-gradient(160deg,#eef2ff,#e0e7ff)",
                border: "#a5b4fc",
                popular: true,
                features: [
                  { ok: true,  text: "Up to ₹1,000/week payout" },
                  { ok: true,  text: "75% of lost income covered" },
                  { ok: true,  text: "All 5 disruption triggers" },
                  { ok: true,  text: "Sunday UPI payout" },
                  { ok: true,  text: "Real-time disruption alerts" },
                  { ok: true,  text: "Priority claim processing" },
                  { ok: false, text: "Dedicated support line" },
                  { ok: false, text: "Zone risk analytics" },
                ],
              },
              {
                name: "Pro Shield",
                price: "₹79",
                cap: "₹1,800",
                pct: "90%",
                for: "High-income riders",
                color: "#7c3aed",
                accentColor: "#7c3aed",
                grad: "linear-gradient(160deg,#f5f3ff,#ede9fe)",
                border: "#c4b5fd",
                features: [
                  { ok: true,  text: "Up to ₹1,800/week payout" },
                  { ok: true,  text: "90% of lost income covered" },
                  { ok: true,  text: "All 5 disruption triggers" },
                  { ok: true,  text: "Sunday UPI payout" },
                  { ok: true,  text: "Real-time disruption alerts" },
                  { ok: true,  text: "Priority claim processing" },
                  { ok: true,  text: "Dedicated support line" },
                  { ok: true,  text: "Zone risk analytics" },
                ],
              },
            ].map(({ name, price, cap, pct, for: forText, color, accentColor, grad, border, popular, features }, i) => (
              <div key={name}
                className="relative rounded-2xl border overflow-hidden hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1 animate-fade-up flex flex-col"
                style={{ background: grad, borderColor: border, animationDelay: `${i * 80}ms` }}>
                {popular && (
                  <div className="text-white text-[10px] font-extrabold text-center py-1.5 tracking-widest uppercase"
                    style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                    Most Popular
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-5">
                    <h3 className="font-extrabold text-[#1c1c1e] text-lg mb-1">{name}</h3>
                    <p className="text-[#8e8e93] text-xs mb-4">Best for: {forText}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-[44px] font-extrabold leading-none" style={{ color }}>{price}</span>
                      <span className="text-[#aeaeb2] text-sm mb-2">/week</span>
                    </div>
                    <div className="flex gap-3 mt-3">
                      <div className="rounded-xl px-3 py-1.5 text-center flex-1"
                        style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${border}` }}>
                        <p className="text-[10px] text-[#8e8e93]">Max payout</p>
                        <p className="font-bold text-sm" style={{ color }}>{cap}/wk</p>
                      </div>
                      <div className="rounded-xl px-3 py-1.5 text-center flex-1"
                        style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${border}` }}>
                        <p className="text-[10px] text-[#8e8e93]">Coverage</p>
                        <p className="font-bold text-sm" style={{ color }}>{pct}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 mb-6" style={{ borderColor: border }}>
                    <p className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-wider mb-3">What you get</p>
                    <div className="space-y-0.5">
                      {features.map(({ ok, text }) => (
                        <FeatureRow key={text} ok={ok} text={text} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto">
                    {!user && (
                      <Link to="/register"
                        className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                        style={{ background: color, color: "white", boxShadow: `0 4px 14px ${color}44` }}>
                        Get {name} <ArrowRight size={15} strokeWidth={2.5} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-[#aeaeb2] text-xs mt-6">
            Premiums adjusted by zone risk score and seasonal factors · IRDAI Sandbox compliant
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          8. COMPETITIVE MOAT
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 border-y border-[#e5e5ea]" style={{ background: "rgba(255,255,255,0.8)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <SectionLabel>Competitive Moat</SectionLabel>
            <h2 className="text-[32px] md:text-[42px] font-extrabold text-[#1c1c1e] tracking-tight">
              Why incumbents can&apos;t copy us
            </h2>
            <p className="text-[#8e8e93] text-lg mt-3 max-w-xl mx-auto">
              Traditional insurers are built for salaried employees. We&apos;re built for the gig economy from the ground up.
            </p>
          </div>

          {/* comparison table header */}
          <div className="grid grid-cols-3 gap-4 mb-4 px-2">
            <div />
            <div className="text-center">
              <span className="text-xs font-bold text-[#8e8e93] uppercase tracking-wider">Traditional Insurance</span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-[#4f46e5] uppercase tracking-wider">KamaiShield</span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                aspect: "Geographic precision",
                traditional: "City-level coverage (e.g., \"Mumbai\")",
                ours: "Pincode-level (e.g., Kurla 400070)",
                icon: MapPin,
              },
              {
                aspect: "Claim process",
                traditional: "7–14 day manual adjuster review",
                ours: "Zero-touch, auto-created in seconds",
                icon: RefreshCw,
              },
              {
                aspect: "Premium cycle",
                traditional: "Annual or monthly commitment",
                ours: "Weekly — matches gig income cycles",
                icon: Clock,
              },
              {
                aspect: "Trigger mechanism",
                traditional: "Subjective loss assessment",
                ours: "Objective API thresholds — no disputes",
                icon: Activity,
              },
              {
                aspect: "Target customer",
                traditional: "Salaried employees, businesses",
                ours: "Gig workers, delivery riders",
                icon: Users,
              },
              {
                aspect: "Data infrastructure",
                traditional: "Legacy systems, no real-time data",
                ours: "WeatherAPI + OpenAQ + Gemini AI",
                icon: Wifi,
              },
            ].map(({ aspect, traditional, ours, icon: Icon }, i) => (
              <div key={aspect}
                className="grid grid-cols-3 gap-4 items-center rounded-2xl p-4 border border-[#f2f2f7] hover:border-[#e0e7ff] transition-all duration-200 animate-fade-up"
                style={{ background: "rgba(255,255,255,0.9)", animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="icon-wrap w-9 h-9 shrink-0" style={{ background: "#eef2ff" }}>
                    <Icon size={16} color="#4f46e5" strokeWidth={2} />
                  </div>
                  <span className="font-semibold text-[#1c1c1e] text-sm">{aspect}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#ffe4e6] flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48]" />
                  </span>
                  <span className="text-[#636366] text-sm">{traditional}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#d1fae5] flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  </span>
                  <span className="text-[#1c1c1e] text-sm font-medium">{ours}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          9. TESTIMONIALS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#f2f2f7]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <SectionLabel>Testimonials</SectionLabel>
            <h2 className="text-[32px] md:text-[42px] font-extrabold text-[#1c1c1e] tracking-tight">
              Riders who never miss a payout
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Rajan Mehta",
                platform: "Swiggy",
                city: "Mumbai, Kurla",
                avatar: "RM",
                avatarColor: "#4f46e5",
                rating: 5,
                quote: "Pichle mahine 3 din baarish ki wajah se kaam nahi kar paya. Sunday ko automatically ₹2,100 aa gaye UPI mein. Koi form nahi bhara, koi call nahi ki. Yeh magic hai.",
                payout: "₹2,100",
                trigger: "Heavy Rain",
              },
              {
                name: "Priya Sharma",
                platform: "Zomato",
                city: "Delhi, Rohini",
                avatar: "PS",
                avatarColor: "#e11d48",
                rating: 5,
                quote: "Delhi mein pollution season mein mera income almost zero ho jaata tha. Ab KamaiShield hai toh tension nahi. AQI 400 cross kiya aur claim khud ban gaya. Bahut achha product hai.",
                payout: "₹3,400",
                trigger: "Severe Pollution",
              },
              {
                name: "Arjun Nair",
                platform: "Blinkit",
                city: "Bengaluru, Koramangala",
                avatar: "AN",
                avatarColor: "#059669",
                rating: 5,
                quote: "Bandh ke din mujhe pata bhi nahi tha ki claim process ho raha hai. Sunday ko notification aaya — ₹1,800 credited. Standard Shield liya tha, best decision tha.",
                payout: "₹1,800",
                trigger: "Civic Disruption",
              },
            ].map(({ name, platform, city, avatar, avatarColor, rating, quote, payout, trigger }) => (
              <div key={name}
                className="card-glass hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
                {/* quote icon */}
                <Quote size={28} color="#e0e7ff" strokeWidth={1.5} className="mb-3" />

                {/* stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} size={14} color="#f59e0b" fill="#f59e0b" />
                  ))}
                </div>

                {/* quote */}
                <p className="text-[#1c1c1e] text-sm leading-relaxed flex-1 mb-5">&ldquo;{quote}&rdquo;</p>

                {/* payout badge */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#d1fae5] text-[#059669]">
                    {payout} received
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#eef2ff] text-[#4f46e5]">
                    {trigger}
                  </span>
                </div>

                {/* author */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#f2f2f7]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold shrink-0"
                    style={{ background: avatarColor }}>
                    {avatar}
                  </div>
                  <div>
                    <p className="font-bold text-[#1c1c1e] text-sm">{name}</p>
                    <p className="text-[#8e8e93] text-xs">{platform} · {city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          10. TRUST SIGNALS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 border-y border-[#e5e5ea]" style={{ background: "rgba(255,255,255,0.9)" }}>
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-[11px] font-bold text-[#aeaeb2] uppercase tracking-widest mb-8">
            Powered by &amp; compliant with
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
            {[
              { icon: Building2, label: "IRDAI Sandbox", color: "#4f46e5", bg: "#eef2ff" },
              { icon: CloudRain, label: "WeatherAPI", color: "#0284c7", bg: "#e0f2fe" },
              { icon: Wind,      label: "OpenAQ",     color: "#7c3aed", bg: "#ede9fe" },
              { icon: Zap,       label: "Gemini AI",  color: "#d97706", bg: "#fef3c7" },
              { icon: Smartphone,label: "PWA Ready",  color: "#059669", bg: "#d1fae5" },
              { icon: Lock,      label: "256-bit SSL",color: "#e11d48", bg: "#ffe4e6" },
            ].map(({ icon: Icon, label, color, bg }) => (
              <div key={label}
                className="flex items-center gap-2.5 rounded-2xl px-4 py-3 border border-[#f2f2f7] hover:border-[#e0e7ff] transition-all duration-200 hover:shadow-card"
                style={{ background: "white" }}>
                <div className="icon-wrap w-8 h-8 shrink-0" style={{ background: bg }}>
                  <Icon size={15} color={color} strokeWidth={2} />
                </div>
                <span className="font-semibold text-[#1c1c1e] text-sm whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          11. CTA SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-28"
        style={{ background: "linear-gradient(160deg,#0f0f1a 0%,#1a1a2e 50%,#0f172a 100%)" }}
      >
        {/* glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-20"
            style={{ background: "radial-gradient(ellipse,#6366f1 0%,transparent 70%)" }} />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-0.5 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} color="#f59e0b" fill="#f59e0b" />
            ))}
          </div>

          <h2 className="text-[36px] md:text-[52px] font-extrabold text-white leading-tight tracking-tight mb-4">
            Your income deserves<br />
            <span style={{ background: "linear-gradient(135deg,#6ee7b7,#6366f1,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              a safety net.
            </span>
          </h2>

          <p className="text-[#94a3b8] text-xl mb-4 leading-relaxed">
            Join thousands of delivery riders who never lose a rupee to disruptions.
          </p>

          <p className="text-2xl font-extrabold mb-10"
            style={{ background: "linear-gradient(135deg,#6ee7b7,#2e7d32)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            &ldquo;Kamai aapki, suraksha humari.&rdquo;
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to={user.role === "admin" ? "/admin" : "/dashboard"}
                className="btn-primary inline-flex items-center justify-center gap-2 text-base py-4 px-10">
                Go to Dashboard <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
            ) : (
              <>
                <Link to="/register"
                  className="btn-primary inline-flex items-center justify-center gap-2 text-base py-4 px-10">
                  Get Protected — ₹29/week <ArrowRight size={16} strokeWidth={2.5} />
                </Link>
                <Link to="/compliance"
                  className="inline-flex items-center justify-center gap-2 text-base py-4 px-8 rounded-xl font-semibold border border-white/20 text-white transition-all duration-200 hover:bg-white/10">
                  View Compliance <Scale size={15} strokeWidth={2} />
                </Link>
              </>
            )}
          </div>

          <p className="text-[#475569] text-xs mt-6">
            No paperwork · No manual claims · Automatic Sunday payouts · Cancel anytime
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          12. FOOTER
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#e5e5ea] py-14" style={{ background: "rgba(255,255,255,0.95)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* brand */}
            <div>
              <Logo height={28} />
              <p className="text-[#8e8e93] text-sm mt-3 leading-relaxed max-w-xs">
                India&apos;s first parametric income-protection product for gig delivery riders.
                Automated. Transparent. Gig-native.
              </p>
              <p className="text-sm font-bold mt-4" style={{ color: "#2e7d32" }}>
                &ldquo;Kamai aapki, suraksha humari.&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-5">
                {[
                  { icon: Lock, label: "SSL" },
                  { icon: ShieldCheck, label: "IRDAI" },
                  { icon: Award, label: "Verified" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-[#8e8e93] text-xs">
                    <Icon size={12} strokeWidth={2} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* quick links */}
            <div>
              <h4 className="font-bold text-[#1c1c1e] text-sm mb-4">Quick Links</h4>
              <div className="space-y-2.5">
                {[
                  { to: "/", label: "Home" },
                  { to: "/compliance", label: "Compliance & IRDAI" },
                  { to: "/login", label: "Sign In" },
                  { to: "/register", label: "Get Protected" },
                ].map(({ to, label }) => (
                  <Link key={label} to={to}
                    className="flex items-center gap-1.5 text-[#636366] text-sm hover:text-[#4f46e5] transition-colors group">
                    <ChevronRight size={13} strokeWidth={2.5} className="text-[#aeaeb2] group-hover:text-[#4f46e5] transition-colors" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* legal */}
            <div>
              <h4 className="font-bold text-[#1c1c1e] text-sm mb-4">Legal & Support</h4>
              <div className="space-y-2.5">
                {[
                  { to: "/compliance", label: "Compliance" },
                  { href: "mailto:privacy@kamaishield.in", label: "Privacy Policy" },
                  { href: "mailto:legal@kamaishield.in", label: "Terms of Service" },
                  { href: "mailto:support@kamaishield.in", label: "Contact Support" },
                ].map(({ to, href, label }) =>
                  to ? (
                    <Link key={label} to={to}
                      className="flex items-center gap-1.5 text-[#636366] text-sm hover:text-[#4f46e5] transition-colors group">
                      <ChevronRight size={13} strokeWidth={2.5} className="text-[#aeaeb2] group-hover:text-[#4f46e5] transition-colors" />
                      {label}
                    </Link>
                  ) : (
                    <a key={label} href={href}
                      className="flex items-center gap-1.5 text-[#636366] text-sm hover:text-[#4f46e5] transition-colors group">
                      <ChevronRight size={13} strokeWidth={2.5} className="text-[#aeaeb2] group-hover:text-[#4f46e5] transition-colors" />
                      {label}
                    </a>
                  )
                )}
              </div>
            </div>
          </div>

          {/* bottom bar */}
          <div className="border-t border-[#f2f2f7] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[#aeaeb2] text-xs">
              © 2026 KamaiShield Technologies Pvt. Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/compliance" className="flex items-center gap-1.5 text-[#8e8e93] text-xs hover:text-[#4f46e5] transition-colors">
                <Scale size={11} strokeWidth={2} />
                IRDAI Sandbox Compliant
              </Link>
              <span className="text-[#e5e5ea]">·</span>
              <span className="text-[#8e8e93] text-xs flex items-center gap-1">
                <Globe size={11} strokeWidth={2} />
                India
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
