import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Loading, StatusBadge } from '../components/UI';
import toast from 'react-hot-toast';
import { CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function Policy() {
  const [quotes, setQuotes] = useState([]);
  const [zoneInfo, setZoneInfo] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/policies/quotes'),
      api.get('/policies/active'),
      api.get('/policies/my'),
    ]).then(([q, a, h]) => {
      setQuotes(q.data.quotes);
      setZoneInfo(q.data.zoneInfo);
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

  if (loading) return <Loading text="Calculating your quotes..." />;

  const planColors    = { basic: 'border-gray-600', standard: 'border-cyan-500', pro: 'border-purple-500' };
  const planEmojis    = { basic: '🌧️', standard: '⚡', pro: '🛡️' };
  const planTextColor = { basic: 'text-gray-300', standard: 'text-cyan-400', pro: 'text-purple-400' };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <h1 className="text-xl font-black text-white mb-1">My Policy</h1>
      <p className="text-gray-400 text-sm mb-4">AI-adjusted weekly premiums for your zone</p>

      {/* Active policy */}
      {activePolicy?.active && (
        <div className="card border-green-700/50 mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-400 shrink-0" size={24}/>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white capitalize">{activePolicy.policy.plan} Shield — Active</p>
              <p className="text-gray-400 text-sm">
                Valid until {activePolicy.policy.end_date} · ₹{activePolicy.policy.coverage_cap}/week
              </p>
              {activePolicy.claimsThisWeek?.count > 0 && (
                <p className="text-cyan-400 text-sm font-semibold mt-1">
                  {activePolicy.claimsThisWeek.count} claims this week = ₹{activePolicy.claimsThisWeek.total} in payouts
                </p>
              )}
            </div>
            <span className="badge-green text-sm px-3 py-1 shrink-0">ACTIVE</span>
          </div>
        </div>
      )}

      {/* Zone info pill */}
      {zoneInfo && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: '📍 Zone', val: zoneInfo.zone },
            { label: '⚡ Risk', val: `${zoneInfo.risk_score}x`, color: zoneInfo.risk_score >= 1.15 ? 'text-red-400' : zoneInfo.risk_score <= 0.9 ? 'text-green-400' : 'text-yellow-400' },
            { label: '🌧️ Rain', val: `${Math.round(zoneInfo.rain_risk * 100)}%` },
            { label: '😷 AQI', val: `${Math.round(zoneInfo.aqi_risk * 100)}%` },
          ].map(b => (
            <div key={b.label} className="bg-[#112233] border border-[#1e3a5f] rounded-lg px-3 py-1.5 text-xs">
              <span className="text-gray-400">{b.label}: </span>
              <span className={b.color || 'text-white font-semibold'}>{b.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quote cards — stacked on mobile */}
      <div className="flex flex-col gap-3 mb-5">
        {quotes.map(q => (
          <div key={q.plan} className={`card border-2 ${planColors[q.plan]} relative`}>
            {q.plan === 'standard' && (
              <div className="absolute -top-3 left-4 bg-cyan-500 text-black text-xs font-black px-3 py-0.5 rounded-full">
                MOST POPULAR
              </div>
            )}
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-3xl">{planEmojis[q.plan]}</span>
                <h3 className="font-black text-white text-lg mt-1">{q.planName}</h3>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-black ${planTextColor[q.plan]}`}>
                  ₹{q.finalPremium}
                </p>
                <p className="text-gray-400 text-sm">/week</p>
              </div>
            </div>

            {/* Key stats row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-[#0D1B2A] rounded-lg p-2 text-center">
                <p className="text-white font-bold text-sm">₹{q.coverageCap}</p>
                <p className="text-gray-500 text-xs">max/week</p>
              </div>
              <div className="bg-[#0D1B2A] rounded-lg p-2 text-center">
                <p className="text-white font-bold text-sm">{Math.round(q.coveragePct * 100)}%</p>
                <p className="text-gray-500 text-xs">covered</p>
              </div>
              <div className="bg-[#0D1B2A] rounded-lg p-2 text-center">
                <p className="text-white font-bold text-sm">Sun</p>
                <p className="text-gray-500 text-xs">payout</p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-[#0D1B2A] rounded-lg p-2.5 text-xs text-gray-400 mb-3 space-y-1">
              <div className="flex justify-between"><span>Base</span><span>₹{q.basePremium}</span></div>
              <div className="flex justify-between">
                <span>Zone ({q.zoneLabel})</span>
                <span className={q.zoneMultiplier > 1 ? 'text-red-400' : q.zoneMultiplier < 1 ? 'text-green-400' : ''}>{q.zoneMultiplier}×</span>
              </div>
              <div className="flex justify-between">
                <span>Season ({q.seasonLabel})</span>
                <span className={q.seasonalFactor > 1 ? 'text-yellow-400' : ''}>{q.seasonalFactor}×</span>
              </div>
              <div className="flex justify-between border-t border-[#1e3a5f] pt-1 text-white font-bold">
                <span>You pay</span><span>₹{q.finalPremium}/week</span>
              </div>
            </div>

            <button className="btn-primary w-full" onClick={() => buyPlan(q.plan)}
              disabled={buying === q.plan || (activePolicy?.active && activePolicy?.policy?.plan === q.plan)}>
              {buying === q.plan ? 'Processing...'
                : activePolicy?.active && activePolicy?.policy?.plan === q.plan ? '✅ Current Plan'
                : activePolicy?.active ? `Switch to ${q.planName}` : `Get ${q.planName} — ₹${q.finalPremium}/wk`}
            </button>
          </div>
        ))}
      </div>

      {/* Payout example */}
      <div className="card mb-4">
        <h3 className="font-bold text-white mb-2">💡 Example Payout</h3>
        <div className="bg-[#0D1B2A] rounded-xl p-3 text-sm font-mono text-gray-300">
          <p className="text-white font-bold mb-1">Standard Shield · Heavy rain · 4 hours</p>
          <p>₹100/hr × 4hrs × 75% = <span className="text-cyan-400 font-black text-base">₹300</span></p>
          <p className="text-gray-500 text-xs mt-1">Added to Sunday's UPI payout</p>
        </div>
      </div>

      {/* Policy history toggle */}
      {history.length > 0 && (
        <div className="card">
          <button className="flex items-center justify-between w-full" onClick={() => setShowHistory(!showHistory)}>
            <h3 className="font-bold text-white">Policy History</h3>
            {showHistory ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
          </button>
          {showHistory && (
            <div className="mt-3 space-y-0">
              {history.map(p => (
                <div key={p.id} className="flex justify-between items-center py-3 border-b border-[#1e3a5f] last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm capitalize">{p.plan} Shield</p>
                    <p className="text-gray-500 text-xs">{p.start_date} → {p.end_date}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-cyan-400 text-sm font-bold">₹{p.premium}/wk</span>
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
