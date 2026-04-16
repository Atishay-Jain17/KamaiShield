import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Loading, StatusBadge } from '../components/UI';
import toast from 'react-hot-toast';
import { CheckCircle2, ChevronDown, ChevronUp, ShieldCheck, Sparkles, MapPin, Gauge, CloudRain, Wind, Ban } from 'lucide-react';

export default function Policy() {
  const [quotes, setQuotes] = useState([]);
  const [zoneInfo, setZoneInfo] = useState(null);
  const [rider, setRider] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [simHours, setSimHours] = useState(4);
  const [aiExplanation, setAiExplanation] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/policies/quotes'),
      api.get('/policies/active'),
      api.get('/policies/my'),
    ]).then(([q, a, h]) => {
      setQuotes(q.data.quotes);
      setZoneInfo(q.data.zoneInfo);
      setRider(q.data.rider);
      setActivePolicy(a.data);
      setHistory(h.data);
    }).finally(() => setLoading(false));
  }, []);

  const buyPlan = async (plan) => {
    setBuying(plan);
    try {
      const { data } = await api.post('/policies/buy', { plan });
      toast.success(data.message);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Purchase failed');
    } finally { setBuying(null); }
  };

  const getAIExplanation = async () => {
    if (!quotes[1]) return;
    setLoadingAI(true);
    try {
      const q = quotes[1];
      const { data } = await api.post('/ai/explain-pricing', {
        plan: q.planName, finalPremium: q.finalPremium, basePremium: q.basePremium,
        zoneLabel: q.zoneLabel, zoneMultiplier: q.zoneMultiplier,
        seasonLabel: q.seasonLabel, seasonalFactor: q.seasonalFactor,
        city: rider?.city, zone: rider?.zone,
      });
      setAiExplanation(data.explanation);
    } catch { setAiExplanation('Unable to load AI explanation right now.'); }
    finally { setLoadingAI(false); }
  };

  if (loading) return <Loading text="Calculating your quotes…" />;

  const planCfg = {
    basic:    { grad:'linear-gradient(135deg,#f4f4f5,#e4e4e7)', border:'#e5e5ea', text:'#3a3a3c', badge:'' },
    standard: { grad:'linear-gradient(135deg,#eef2ff,#e0e7ff)', border:'#a5b4fc', text:'#4f46e5', badge:'Most Popular' },
    pro:      { grad:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'#c4b5fd', text:'#7c3aed', badge:'Best Coverage' },
  };

  return (
    <div className="page">
      <div className="mb-5 animate-fade-up">
        <h1 className="text-[22px] font-bold text-[#1c1c1e] tracking-tight">My Policy</h1>
        <p className="text-[#8e8e93] text-sm mt-0.5">Zone & season-adjusted weekly premiums</p>
      </div>

      {/* Active policy */}
      {activePolicy?.active && (
        <div className="rounded-2xl p-4 mb-4 border border-[#a7f3d0] animate-fade-up"
          style={{ background:'linear-gradient(135deg,#ecfdf5,#d1fae5)', boxShadow:'0 4px 16px rgba(16,185,129,0.12)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background:'linear-gradient(135deg,#10b981,#059669)', boxShadow:'0 4px 12px rgba(16,185,129,0.35)' }}>
              <ShieldCheck size={22} className="text-white" strokeWidth={1.8}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-[#1c1c1e] text-sm capitalize">{activePolicy.policy.plan} Shield</p>
                <span className="badge-green">Active</span>
              </div>
              <p className="text-[#636366] text-xs mt-0.5">Valid until {activePolicy.policy.end_date} · ₹{activePolicy.policy.coverage_cap}/week cap</p>
              {activePolicy.claimsThisWeek?.count > 0 && (
                <p className="text-[#4f46e5] text-xs font-semibold mt-1">
                  {activePolicy.claimsThisWeek.count} claims this week = ₹{activePolicy.claimsThisWeek.total} pending
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Zone chips */}
      {zoneInfo && (
        <div className="flex flex-wrap gap-2 mb-4 animate-fade-up">
          {[
            { label:'Zone', val:zoneInfo.zone, icon:MapPin, color:'#4f46e5', bg:'#e0e7ff' },
            { label:'Risk', val:`${zoneInfo.risk_score}×`, icon:Gauge, color:zoneInfo.risk_score>=1.15?'#e11d48':zoneInfo.risk_score<=0.9?'#059669':'#d97706', bg:zoneInfo.risk_score>=1.15?'#ffe4e6':zoneInfo.risk_score<=0.9?'#d1fae5':'#fef3c7' },
            { label:'Rain', val:`${Math.round(zoneInfo.rain_risk*100)}%`, icon:CloudRain, color:'#0284c7', bg:'#e0f2fe' },
            { label:'AQI',  val:`${Math.round(zoneInfo.aqi_risk*100)}%`,  icon:Wind,      color:'#7c3aed', bg:'#ede9fe' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border border-white/60"
              style={{ background:'rgba(255,255,255,0.8)', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="icon-wrap w-5 h-5" style={{ background:b.bg }}>
                <b.icon size={11} color={b.color} strokeWidth={2.2}/>
              </div>
              <span className="text-[11px] text-[#8e8e93]">{b.label}:</span>
              <span className="text-[11px] font-bold" style={{ color:b.color }}>{b.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* AI Pricing */}
      <div className="rounded-xl p-3 mb-4 border border-[#c7d2fe] animate-fade-up" style={{ background:'#eef2ff' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} color="#4f46e5" strokeWidth={2}/>
            <p className="text-[#4f46e5] font-semibold text-xs">Pricing Breakdown</p>
          </div>
          {!aiExplanation && (
            <button onClick={getAIExplanation} disabled={loadingAI}
              className="text-[#4f46e5] text-xs font-semibold hover:underline disabled:opacity-50">
              {loadingAI ? 'Loading…' : 'Explain in detail'}
            </button>
          )}
        </div>
        {aiExplanation
          ? <p className="text-[#636366] text-xs leading-relaxed">{aiExplanation}</p>
          : (
            <div className="space-y-1">
              {quotes[0]?.zoneMultiplier > 1.0 && <p className="text-[#636366] text-xs">📍 Your area has <span className="text-[#d97706] font-semibold">{Math.round((quotes[0].zoneMultiplier-1)*100)}% higher disruption risk</span></p>}
              {quotes[0]?.seasonalFactor > 1.0 && <p className="text-[#636366] text-xs">🌦️ <span className="text-[#d97706] font-semibold">{quotes[0].seasonLabel}</span> season adjustment applied</p>}
            </div>
          )
        }
      </div>

      {/* Quote cards */}
      <div className="flex flex-col gap-3 mb-5">
        {quotes.map((q, i) => {
          const cfg = planCfg[q.plan] || planCfg.basic;
          return (
            <div key={q.plan} className="relative rounded-2xl p-4 border animate-fade-up"
              style={{ background:cfg.grad, borderColor:cfg.border, animationDelay:`${i*60}ms`, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              {cfg.badge && (
                <div className="absolute -top-3 left-4 text-white text-[10px] font-bold px-3 py-0.5 rounded-full"
                  style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow:'0 2px 8px rgba(99,102,241,0.4)' }}>
                  {cfg.badge}
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-[#1c1c1e] text-base">{q.planName}</h3>
                  <p className="text-[#8e8e93] text-xs mt-0.5">Weekly income protection</p>
                </div>
                <div className="text-right">
                  <p className="text-[26px] font-bold leading-none" style={{ color:cfg.text }}>₹{q.finalPremium}</p>
                  <p className="text-[#aeaeb2] text-xs">/week</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[{val:`₹${q.coverageCap}`,label:'max/week'},{val:`${Math.round(q.coveragePct*100)}%`,label:'covered'},{val:'Sunday',label:'payout'}].map(s => (
                  <div key={s.label} className="rounded-xl p-2 text-center border border-white/60" style={{ background:'rgba(255,255,255,0.7)' }}>
                    <p className="text-[#1c1c1e] font-bold text-xs">{s.val}</p>
                    <p className="text-[#aeaeb2] text-[10px]">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-2.5 mb-3 border border-white/60 text-xs space-y-1" style={{ background:'rgba(255,255,255,0.6)', color:'#8e8e93' }}>
                <div className="flex justify-between"><span>Base premium</span><span>₹{q.basePremium}</span></div>
                <div className="flex justify-between"><span>Zone ({q.zoneLabel})</span><span style={{ color:q.zoneMultiplier>1?'#e11d48':q.zoneMultiplier<1?'#059669':'#636366' }}>{q.zoneMultiplier}×</span></div>
                <div className="flex justify-between"><span>Season ({q.seasonLabel})</span><span style={{ color:q.seasonalFactor>1?'#d97706':'#636366' }}>{q.seasonalFactor}×</span></div>
                <div className="flex justify-between border-t border-white/60 pt-1 font-bold text-[#1c1c1e]"><span>You pay</span><span>₹{q.finalPremium}/week</span></div>
              </div>
              <button className="w-full font-semibold py-3 px-5 rounded-xl transition-all duration-200 text-sm min-h-[48px] active:scale-[0.97]"
                style={activePolicy?.active && activePolicy?.policy?.plan === q.plan
                  ? { background:'rgba(255,255,255,0.7)', color:cfg.text, border:`1px solid ${cfg.border}` }
                  : { background:`linear-gradient(135deg,${cfg.text}dd,${cfg.text})`, color:'#fff', boxShadow:`0 2px 8px ${cfg.text}44` }
                }
                onClick={() => buyPlan(q.plan)}
                disabled={buying === q.plan || (activePolicy?.active && activePolicy?.policy?.plan === q.plan)}>
                {buying === q.plan
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Processing…</span>
                  : activePolicy?.active && activePolicy?.policy?.plan === q.plan
                    ? <span className="flex items-center justify-center gap-1.5"><CheckCircle2 size={14} strokeWidth={2.5}/> Current Plan</span>
                    : activePolicy?.active ? `Switch to ${q.planName}` : `Get ${q.planName} — ₹${q.finalPremium}/wk`
                }
              </button>
            </div>
          );
        })}
      </div>

      {/* What-if Simulator */}
      <div className="card-glass mb-4 animate-fade-up">
        <p className="text-sm font-bold text-[#1c1c1e] mb-0.5">What-if Simulator</p>
        <p className="text-[#aeaeb2] text-xs mb-3">Disruption Duration / व्यवधान की अवधि</p>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[#aeaeb2] text-xs w-6">1h</span>
          <input type="range" min="1" max="12" step="0.5" value={simHours}
            onChange={e => setSimHours(parseFloat(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor:'#4f46e5' }}/>
          <span className="text-[#4f46e5] font-bold text-sm w-10 text-right">{simHours}h</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {quotes.map(q => {
            const raw = (rider?.avg_hourly_earnings || 100) * simHours * q.coveragePct;
            const capped = Math.min(raw, q.coverageCap);
            const cfg = planCfg[q.plan] || planCfg.basic;
            return (
              <div key={q.plan} className="rounded-xl p-3 text-center border border-white/60" style={{ background:cfg.grad }}>
                <p className="text-[10px] text-[#8e8e93] mb-1 capitalize">{q.plan}</p>
                <p className="text-base font-bold" style={{ color:cfg.text }}>₹{Math.round(capped)}</p>
                {raw > q.coverageCap && <p className="text-[#d97706] text-[10px] mt-0.5">Capped</p>}
              </div>
            );
          })}
        </div>
        <p className="text-[#aeaeb2] text-[11px] mt-2 text-center">Based on your ₹{rider?.avg_hourly_earnings || 100}/hr earnings</p>
      </div>

      {/* Coverage Exclusions */}
      <div className="rounded-2xl p-4 mb-4 border border-[#e5e5ea] animate-fade-up" style={{ background:'#f4f4f5' }}>
        <div className="flex items-start gap-3">
          <div className="icon-wrap w-10 h-10 shrink-0" style={{ background:'#ffe4e6' }}>
            <Ban size={16} color="#e11d48" strokeWidth={2}/>
          </div>
          <div>
            <p className="font-bold text-[#1c1c1e] text-sm mb-1.5">What's Not Covered</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                'Health & medical expenses',
                'Life or accidental death',
                'Vehicle repair or damage',
                'Personal accidents',
                'War or armed conflict',
                'Pandemic or epidemic',
                'Terrorism or civil unrest',
                'Acts of God (outside defined triggers)',
              ].map(ex => (
                <div key={ex} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#e11d48] shrink-0"/>
                  <span className="text-[11px] text-[#636366]">{ex}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#aeaeb2] mt-2">Coverage is strictly limited to income loss caused by the 5 defined parametric triggers.</p>
          </div>
        </div>
      </div>

      {/* Honest Worker Guarantee */}
      <div className="rounded-2xl p-4 mb-4 border border-[#a7f3d0] animate-fade-up"
        style={{ background:'linear-gradient(135deg,#ecfdf5,#d1fae5)' }}>
        <div className="flex items-start gap-3">
          <div className="icon-wrap w-10 h-10" style={{ background:'#d1fae5' }}>
            <ShieldCheck size={18} color="#059669" strokeWidth={2}/>
          </div>
          <div>
            <p className="font-bold text-[#1c1c1e] text-sm">Honest Worker Guarantee</p>
            <p className="text-[#636366] text-xs mt-1 leading-relaxed">
              If your genuine claim is wrongly rejected, you receive <span className="text-[#059669] font-bold">2× the payout amount</span>. We stand by every honest rider.
            </p>
          </div>
        </div>
      </div>

      {/* Policy history */}
      {history.length > 0 && (
        <div className="card-glass animate-fade-up">
          <button className="flex items-center justify-between w-full" onClick={() => setShowHistory(!showHistory)}>
            <p className="text-sm font-bold text-[#1c1c1e]">Policy History</p>
            {showHistory ? <ChevronUp size={16} color="#aeaeb2" strokeWidth={2}/> : <ChevronDown size={16} color="#aeaeb2" strokeWidth={2}/>}
          </button>
          {showHistory && (
            <div className="mt-3 animate-scale-in">
              {history.map(p => (
                <div key={p.id} className="flex justify-between items-center py-2.5 border-b border-[#f2f2f7] last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="text-[#1c1c1e] font-semibold text-xs capitalize">{p.plan} Shield</p>
                    <p className="text-[#aeaeb2] text-[11px]">{p.start_date} → {p.end_date}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[#4f46e5] text-xs font-semibold">₹{p.premium}/wk</span>
                    <StatusBadge status={p.status}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
