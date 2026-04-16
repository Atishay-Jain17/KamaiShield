import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Zap, CheckCircle2, ArrowRight, Star, CloudRain, Wind, Flame, Waves, Ban, MapPin, RefreshCw, Activity, Scale } from 'lucide-react';
import Logo from '../components/Logo';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ background:'#f2f2f7' }}>

      {/* Hero */}
      <section style={{ background:'linear-gradient(160deg,#eef2ff 0%,#f2f2f7 60%,#ecfdf5 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border border-[#c7d2fe]"
            style={{ background:'rgba(238,242,255,0.9)' }}>
            <Zap size={12} color="#4f46e5" strokeWidth={2.5}/>
            <span className="text-[#4f46e5] text-xs font-semibold">Automated Parametric Insurance</span>
          </div>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo height={48}/>
          </div>
          <h1 className="text-[36px] md:text-[48px] font-bold text-[#1c1c1e] mb-4 leading-tight tracking-tight">
            Protect your income.<br/>
            <span style={{ background:'linear-gradient(135deg,#4caf50,#1e88e5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Get paid every Sunday.
            </span>
          </h1>
          <p className="text-[#636366] text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            When rain, pollution, or a curfew stops you from delivering — KamaiShield automatically detects it and pays you. No claims. No waiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}
                className="btn-primary inline-flex items-center gap-2 text-base py-3.5 px-8">
                Go to Dashboard <ArrowRight size={16} strokeWidth={2.5}/>
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base py-3.5 px-8">
                  Get Protected — ₹29/week <ArrowRight size={16} strokeWidth={2.5}/>
                </Link>
                <Link to="/login" className="btn-secondary text-base py-3.5 px-8">Sign In</Link>
              </>
            )}
          </div>
          <p className="text-[#aeaeb2] text-xs mt-4">No paperwork · No manual claims · Automatic Sunday payouts</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#e5e5ea] py-8" style={{ background:'rgba(255,255,255,0.7)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4 text-center">
          {[
            { val:'10M+', label:'Riders Need Protection' },
            { val:'₹29',  label:'Starting Weekly Premium' },
            { val:'5',    label:'Automated Triggers' },
            { val:'Sun',  label:'Weekly Payout Day' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold" style={{ color:'#4f46e5' }}>{s.val}</p>
              <p className="text-[#8e8e93] text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2">How it works</p>
          <h2 className="text-[26px] font-bold text-[#1c1c1e] tracking-tight">Four steps to income protection</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { step:'01', icon:'📱', title:'Sign Up', desc:'Register with your phone, platform, and zone in under 2 minutes.' },
            { step:'02', icon:'💳', title:'Buy a Plan', desc:'Pick Basic, Standard, or Pro. Pay ₹29–₹79/week. Active immediately.' },
            { step:'03', icon:'📡', title:'We Monitor', desc:'Real-time APIs track weather, AQI, and civic alerts for your exact pincode every 5 minutes.' },
            { step:'04', icon:'💰', title:'Get Paid', desc:'Lost income consolidated and sent to your UPI every Sunday night.' },
          ].map((s, i) => (
            <div key={s.step} className="card-glass hover:shadow-card-md transition-all duration-200 animate-fade-up"
              style={{ animationDelay:`${i*80}ms` }}>
              <p className="text-[11px] font-bold mb-2" style={{ color:'#4f46e5' }}>{s.step}</p>
              <div className="text-2xl mb-2">{s.icon}</div>
              <h3 className="font-bold text-[#1c1c1e] text-sm mb-1">{s.title}</h3>
              <p className="text-[#8e8e93] text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Triggers */}
      <section className="border-y border-[#e5e5ea] py-16" style={{ background:'rgba(255,255,255,0.6)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2">Parametric triggers</p>
            <h2 className="text-[26px] font-bold text-[#1c1c1e] tracking-tight">5 automated disruption types</h2>
            <p className="text-[#8e8e93] text-sm mt-2">Pincode-zone specific — a flood in Kurla doesn't trigger payouts in Andheri</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { Icon:CloudRain, color:'#0284c7', bg:'#e0f2fe', type:'Heavy Rain',       threshold:'>15mm/hr' },
              { Icon:Wind,      color:'#7c3aed', bg:'#ede9fe', type:'Severe Pollution', threshold:'AQI > 400' },
              { Icon:Flame,     color:'#d97706', bg:'#fef3c7', type:'Extreme Heat',     threshold:'>45°C' },
              { Icon:Waves,     color:'#0284c7', bg:'#e0f2fe', type:'Flood Alert',      threshold:'Official advisory' },
              { Icon:Ban,       color:'#e11d48', bg:'#ffe4e6', type:'Civic Disruption', threshold:'Curfew / Strike' },
            ].map((t, i) => (
              <div key={t.type} className="card-glass text-center hover:shadow-card-md transition-all duration-200 animate-fade-up"
                style={{ animationDelay:`${i*60}ms` }}>
                <div className="icon-wrap w-10 h-10 mx-auto mb-2" style={{ background:t.bg }}>
                  <t.Icon size={18} color={t.color} strokeWidth={1.8}/>
                </div>
                <h3 className="font-semibold text-[#1c1c1e] text-xs mb-1">{t.type}</h3>
                <p className="text-[#4f46e5] text-[10px] font-mono">{t.threshold}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2">Pricing</p>
          <h2 className="text-[26px] font-bold text-[#1c1c1e] tracking-tight">Simple weekly plans</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name:'Basic Shield',    price:'₹29', cap:'₹500',   pct:'60%', for:'Part-time riders',  grad:'linear-gradient(135deg,#f4f4f5,#e4e4e7)', border:'#e5e5ea', color:'#3a3a3c' },
            { name:'Standard Shield', price:'₹49', cap:'₹1,000', pct:'75%', for:'Full-time riders',  grad:'linear-gradient(135deg,#eef2ff,#e0e7ff)', border:'#a5b4fc', color:'#4f46e5', popular:true },
            { name:'Pro Shield',      price:'₹79', cap:'₹1,800', pct:'90%', for:'High-income riders', grad:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'#c4b5fd', color:'#7c3aed' },
          ].map((p, i) => (
            <div key={p.name} className="relative rounded-2xl p-4 border hover:shadow-card-md transition-all duration-200 animate-fade-up"
              style={{ background:p.grad, borderColor:p.border, animationDelay:`${i*80}ms` }}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-3 py-0.5 rounded-full"
                  style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow:'0 2px 8px rgba(99,102,241,0.4)' }}>
                  Most Popular
                </div>
              )}
              <h3 className="font-bold text-[#1c1c1e] text-sm mb-1">{p.name}</h3>
              <p className="text-[32px] font-bold leading-none mb-1" style={{ color:p.color }}>{p.price}<span className="text-sm text-[#aeaeb2] font-normal">/week</span></p>
              <div className="space-y-1.5 mt-3 mb-4">
                {[`Up to ${p.cap}/week`, `${p.pct} of lost income`, 'Sunday UPI payout'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={13} color="#059669" strokeWidth={2.5}/>
                    <span className="text-[#636366] text-xs">{f}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#aeaeb2]">Best for: {p.for}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-[#aeaeb2] text-xs mt-4">Premiums adjusted by zone risk score and seasonal factors</p>
      </section>

      {/* Competitive Moat */}
      <section className="border-y border-[#e5e5ea] py-16" style={{ background: 'rgba(255,255,255,0.6)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2">Competitive advantage</p>
            <h2 className="text-[26px] font-bold text-[#1c1c1e] tracking-tight">Why KamaiShield wins</h2>
            <p className="text-[#8e8e93] text-sm mt-2">The moat that incumbents can't replicate</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                Icon: MapPin,
                color: '#0284c7',
                bg: '#e0f2fe',
                title: 'Pincode-level precision',
                desc: 'Bajaj Allianz covers "Mumbai". We cover Kurla (400070) specifically. A flood in Andheri doesn\'t pay Kurla riders.',
              },
              {
                Icon: Zap,
                color: '#d97706',
                bg: '#fef3c7',
                title: 'Zero-claim friction',
                desc: 'Traditional insurers require 7–14 day claim processing. We pay in 7 days with zero rider action.',
              },
              {
                Icon: RefreshCw,
                color: '#059669',
                bg: '#d1fae5',
                title: 'Gig-native pricing',
                desc: 'Weekly premiums match weekly income cycles. No annual commitment. Cancel anytime.',
              },
              {
                Icon: Activity,
                color: '#7c3aed',
                bg: '#ede9fe',
                title: 'Real-time parametric triggers',
                desc: 'We use live WeatherAPI + OpenAQ data. No adjuster. No dispute. Threshold crossed = payout triggered.',
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className="card-glass hover:shadow-card-md transition-all duration-200 animate-fade-up flex gap-4"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="icon-wrap w-11 h-11 shrink-0" style={{ background: item.bg }}>
                  <item.Icon size={20} color={item.color} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-bold text-[#1c1c1e] text-sm mb-1">{item.title}</h3>
                  <p className="text-[#636366] text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => <Star key={i} size={14} color="#f59e0b" fill="#f59e0b"/>)}
          <span className="text-[#8e8e93] text-xs ml-1">Trusted by delivery riders across India</span>
        </div>
        <h2 className="text-[26px] font-bold text-[#1c1c1e] mb-3 tracking-tight">Ready to protect your earnings?</h2>
        <p className="text-[#8e8e93] text-sm mb-2">Join thousands of delivery riders who never lose a rupee to disruptions.</p>
        <p className="text-lg font-bold mb-6" style={{ color:'#2e7d32' }}>"Kamai aapki, suraksha humari."</p>
        {!user && (
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base py-3.5 px-8">
            Get Started — ₹29/week <ArrowRight size={16} strokeWidth={2.5}/>
          </Link>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e5ea] py-8" style={{ background: 'rgba(255,255,255,0.7)' }}>
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo height={24} />
            <span className="text-[#8e8e93] text-xs">© 2026 KamaiShield. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/compliance" className="flex items-center gap-1.5 text-[#636366] text-xs hover:text-[#4f46e5] transition-colors font-medium">
              <Scale size={12} strokeWidth={2} />
              Compliance &amp; IRDAI
            </Link>
            <a href="mailto:legal@kamaishield.in" className="text-[#636366] text-xs hover:text-[#4f46e5] transition-colors">
              legal@kamaishield.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
