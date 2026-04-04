import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Zap, TrendingUp, Lock, IndianRupee, Clock } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm px-4 py-1.5 rounded-full mb-6">
          <Zap size={14}/> AI-Powered Parametric Insurance
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
          Your Kamai.<br/><span className="text-cyan-400">Our Protection.</span>
        </h1>
        <p className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto">
          When rain, pollution, or a curfew stops you from delivering — KamaiShield automatically detects it and pays you for the lost income. Every Sunday. No claims. No waiting.
        </p>
        <div className="flex flex-col gap-3 justify-center">
          {user ? (
            <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn-primary text-lg py-4 px-6 text-base">
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary text-lg py-4 px-6 text-base">Protect My Earnings — ₹29/week</Link>
              <Link to="/login" className="btn-secondary text-lg py-4 px-6 text-base">I already have an account</Link>
            </>
          )}
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#112233] border-y border-[#1e3a5f] py-8 mb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4 text-center">
          {[
            { val: '10M+', label: 'Riders Need Protection' },
            { val: '₹29', label: 'Starting Weekly Premium' },
            { val: '5', label: 'Automated Triggers' },
            { val: 'Sunday', label: 'Weekly Payout Day' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black text-cyan-400">{s.val}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <h2 className="text-3xl font-black text-center text-white mb-10">How KamaiShield Works</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { step: '01', icon: '📱', title: 'Sign Up in 2 Min', desc: 'Register with your phone, select your platform and zone. Get AI risk profiled instantly.' },
            { step: '02', icon: '💳', title: 'Buy Weekly Plan', desc: 'Pick Basic, Standard, or Pro. Pay ₹29–₹79/week via UPI. Policy active immediately.' },
            { step: '03', icon: '🤖', title: 'We Watch 24/7', desc: 'Our AI monitors weather APIs, AQI feeds, and civic alerts for your exact pincode zone.' },
            { step: '04', icon: '💰', title: 'Payout Every Sunday', desc: 'All disruptions auto-verified. Lost income consolidated and sent to your UPI every Sunday.' },
          ].map(s => (
            <div key={s.step} className="card relative">
              <div className="text-xs text-cyan-500 font-bold mb-2">{s.step}</div>
              <div className="text-3xl mb-2">{s.icon}</div>
              <h3 className="font-bold text-white mb-1">{s.title}</h3>
              <p className="text-gray-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Triggers */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <h2 className="text-3xl font-black text-center text-white mb-10">5 Automated Parametric Triggers</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { icon: '🌧️', type: 'Heavy Rain', threshold: '>15mm/hr', api: 'OpenWeatherMap' },
            { icon: '😷', type: 'Severe Pollution', threshold: 'AQI > 400', api: 'OpenAQ / CPCB' },
            { icon: '🔥', type: 'Extreme Heat', threshold: '>45°C feels-like', api: 'OpenWeatherMap' },
            { icon: '🌊', type: 'Flood Alert', threshold: 'Official advisory', api: 'NDMA Feed' },
            { icon: '🚫', type: 'Civic Disruption', threshold: 'Curfew / Strike', api: 'News API' },
          ].map(t => (
            <div key={t.type} className="card text-center">
              <div className="text-4xl mb-2">{t.icon}</div>
              <h3 className="font-semibold text-white text-sm mb-1">{t.type}</h3>
              <p className="text-cyan-400 text-xs font-mono mb-1">{t.threshold}</p>
              <p className="text-gray-500 text-xs">{t.api}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">All triggers are <strong className="text-cyan-400">pincode-zone specific</strong> — a flood in Kurla doesn't trigger payouts in Andheri.</p>
      </section>

      {/* Plans */}
      <section className="max-w-3xl mx-auto px-4 mb-16">
        <h2 className="text-3xl font-black text-center text-white mb-10">Weekly Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { emoji: '🌧️', name: 'Basic Shield', price: '₹29', cap: '₹500', pct: '60%', for: 'Part-time riders' },
            { emoji: '⚡', name: 'Standard Shield', price: '₹49', cap: '₹1,000', pct: '75%', for: 'Full-time riders', popular: true },
            { emoji: '🛡️', name: 'Pro Shield', price: '₹79', cap: '₹1,800', pct: '90%', for: 'High-income riders' },
          ].map(p => (
            <div key={p.name} className={`card relative ${p.popular ? 'border-cyan-500 ring-1 ring-cyan-500/30' : ''}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-bold px-3 py-0.5 rounded-full">MOST POPULAR</div>}
              <div className="text-3xl mb-2">{p.emoji}</div>
              <h3 className="font-bold text-white mb-1">{p.name}</h3>
              <p className="text-3xl font-black text-cyan-400 mb-1">{p.price}<span className="text-base text-gray-400">/week</span></p>
              <p className="text-sm text-gray-400 mb-1">Coverage up to <strong className="text-white">{p.cap}/week</strong></p>
              <p className="text-sm text-gray-400 mb-3">Coverage: <strong className="text-white">{p.pct}</strong> of lost income</p>
              <p className="text-xs text-gray-500">Best for: {p.for}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-500 text-xs mt-4">Premiums dynamically adjusted by AI based on your zone risk score and season</p>
      </section>

      {/* Fraud shield */}
      <section className="max-w-4xl mx-auto px-4 mb-16">
        <div className="card border-red-800/50">
          <h2 className="text-2xl font-black text-white mb-2">🔒 Military-Grade Anti-Fraud Protection</h2>
          <p className="text-gray-400 mb-4 text-sm">Our 6-signal Behavioural Truth Score (BTS) catches GPS spoofing syndicates without punishing honest riders.</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: '📍', title: 'GPS + Cell Tower', desc: 'Cell towers cannot be spoofed by GPS apps' },
              { icon: '📱', title: 'Accelerometer', desc: 'Genuine riders move. Spoofers lie still at home.' },
              { icon: '🔗', title: 'Platform Heartbeat', desc: 'Was the rider online on the delivery app?' },
              { icon: '📶', title: 'Signal Quality', desc: 'Perfect GPS in a storm = suspicious' },
              { icon: '🔋', title: 'Battery Patterns', desc: 'Spoofing apps drain battery unusually fast' },
              { icon: '⏱️', title: 'Ring Detection', desc: 'Synchronized claim spikes = coordinated fraud' },
            ].map(f => (
              <div key={f.title} className="bg-[#0D1B2A] rounded-lg p-3">
                <span className="text-2xl">{f.icon}</span>
                <h4 className="font-semibold text-white text-sm mt-1">{f.title}</h4>
                <p className="text-gray-400 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 mb-20 text-center">
        <h2 className="text-3xl font-black text-white mb-3">Ready to protect your earnings?</h2>
        <p className="text-gray-400 mb-6">Join thousands of delivery riders across India who never lose a rupee to disruptions.</p>
        {!user && (
          <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-block">
            Get Started — ₹29/week 🛡️
          </Link>
        )}
      </section>
    </div>
  );
}
