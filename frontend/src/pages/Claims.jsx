import { useState, useEffect } from 'react';
import api from '../api';
import { Loading, EmptyState, StatusBadge, DisruptionIcon } from '../components/UI';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';

function BTSMeter({ score }) {
  const color = score >= 55 ? '#22c55e' : score >= 30 ? '#eab308' : '#ef4444';
  const label = score >= 55 ? 'Genuine ✅' : score >= 30 ? 'Under Review 🔍' : 'Flagged 🚨';
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">Fraud Score (BTS)</span>
        <span style={{ color }} className="font-bold">{score}/100 — {label}</span>
      </div>
      <div className="h-3 bg-[#0D1B2A] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }}/>
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
        <span>Flagged</span><span>Review (30)</span><span>Approved (55)</span><span>Max</span>
      </div>
    </div>
  );
}

export default function Claims() {
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [signals, setSignals]   = useState({});
  const [verifying, setVerifying] = useState(null);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    api.get('/claims/my').then(r => setClaims(r.data)).finally(() => setLoading(false));
  }, []);

  const loadSignals = async (id) => {
    if (signals[id]) return;
    const { data } = await api.get(`/claims/${id}/signals`);
    setSignals(p => ({ ...p, [id]: data }));
  };

  const toggle = (id) => {
    setExpanded(expanded === id ? null : id);
    if (expanded !== id) loadSignals(id);
  };

  const verify = async (claimId) => {
    setVerifying(claimId);
    try {
      const { data } = await api.post(`/claims/${claimId}/verify`);
      toast[data.success ? 'success' : 'error'](data.message);
      if (data.success) setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'approved' } : c));
    } catch { toast.error('Verification failed'); }
    finally { setVerifying(null); }
  };

  if (loading) return <Loading text="Loading your claims..." />;

  const filters = [
    { key: 'all',          label: 'All' },
    { key: 'approved',     label: '✅ Approved' },
    { key: 'under_review', label: '🔍 Review' },
    { key: 'flagged',      label: '🚨 Flagged' },
  ];

  const filtered = filter === 'all' ? claims
    : claims.filter(c => c.status === filter);

  const counts = {
    all: claims.length,
    approved: claims.filter(c => ['approved','paid'].includes(c.status)).length,
    under_review: claims.filter(c => c.status === 'under_review').length,
    flagged: claims.filter(c => c.status === 'flagged').length,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <h1 className="text-xl font-black text-white mb-1">My Claims</h1>
      <p className="text-gray-400 text-sm mb-4">Auto-created when disruptions hit your zone</p>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="card text-center py-3">
          <p className="text-2xl font-black text-green-400">{counts.approved}</p>
          <p className="text-xs text-gray-400">Approved</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-black text-yellow-400">{counts.under_review}</p>
          <p className="text-xs text-gray-400">Review</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-black text-red-400">{counts.flagged}</p>
          <p className="text-xs text-gray-400">Flagged</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-[#112233] text-gray-400 border border-[#1e3a5f]'
            }`}>
            {f.label} ({counts[f.key] ?? claims.length})
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <EmptyState icon="📋" title="No claims yet" subtitle="Claims appear automatically when disruptions are detected in your zone. No action needed from you." />
        : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id}
                className={`card cursor-pointer transition-colors ${
                  c.status === 'flagged' ? 'border-red-700/60'
                  : c.status === 'under_review' ? 'border-yellow-700/60'
                  : 'border-[#1e3a5f]'
                }`}
                onClick={() => toggle(c.id)}>

                {/* Claim header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl shrink-0 mt-0.5"><DisruptionIcon type={c.type}/></span>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm">{c.subtype}</p>
                      <p className="text-xs text-gray-400 truncate">{c.zone}, {c.city}</p>
                      <p className="text-xs text-gray-500">{new Date(c.triggered_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-green-400 font-black text-lg">₹{c.payout_amount}</p>
                    <p className="text-gray-500 text-xs">{c.hours_affected}hrs lost</p>
                    <StatusBadge status={c.status}/>
                  </div>
                </div>

                {/* Tier banners */}
                {c.status === 'flagged' && (
                  <div className="mt-3 bg-red-900/20 border border-red-700 rounded-xl p-3"
                    onClick={e => e.stopPropagation()}>
                    <p className="text-red-400 font-bold text-sm mb-1">📍 Quick Verification Needed</p>
                    <p className="text-gray-300 text-xs mb-2">Tap below to share your live location. Takes 10 seconds.</p>
                    <button className="w-full bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-3 px-4 rounded-xl transition-colors"
                      disabled={verifying === c.id}
                      onClick={e => { e.stopPropagation(); verify(c.id); }}>
                      {verifying === c.id ? 'Verifying...' : '📍 Share Live Location'}
                    </button>
                  </div>
                )}

                {c.status === 'under_review' && (
                  <div className="mt-3 bg-yellow-900/20 border border-yellow-700 rounded-xl p-3">
                    <p className="text-yellow-400 font-bold text-sm">🔍 Under Review (2–4 hours)</p>
                    <p className="text-gray-300 text-xs mt-1">Happens automatically in some weather conditions. No action needed. +₹20 goodwill bonus if it takes too long.</p>
                  </div>
                )}

                {/* Expanded fraud analysis */}
                {expanded === c.id && (
                  <div className="mt-4 border-t border-[#1e3a5f] pt-4" onClick={e => e.stopPropagation()}>
                    <BTSMeter score={c.bts_score}/>
                    {signals[c.id]?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-300 mb-2">🔬 Fraud Detection Signals</p>
                        {signals[c.id].map(s => (
                          <div key={s.id} className={`flex items-start justify-between py-2.5 border-b border-[#1e3a5f] last:border-0 gap-2 ${s.is_suspicious ? 'bg-red-900/10 -mx-1 px-1 rounded' : ''}`}>
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="shrink-0">{s.is_suspicious ? '🚨' : '✅'}</span>
                              <div className="min-w-0">
                                <p className="text-sm text-white capitalize">{s.signal_name.replace(/_/g, ' ')}</p>
                                <p className="text-xs text-gray-400 leading-snug">{s.detail}</p>
                              </div>
                            </div>
                            <span className={`text-sm font-bold shrink-0 ${s.is_suspicious ? 'text-red-400' : 'text-green-400'}`}>
                              {s.signal_value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-600">
                  {expanded === c.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  <span>{expanded === c.id ? 'Hide' : 'Fraud analysis'}</span>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
