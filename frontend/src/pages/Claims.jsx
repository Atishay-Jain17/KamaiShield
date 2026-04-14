import { useState, useEffect } from 'react';
import api from '../api';
import { Loading, EmptyState, StatusBadge, DisruptionIcon } from '../components/UI';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, MapPin, Sparkles, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react';

function BTSMeter({ score }) {
  const color = score >= 55 ? '#059669' : score >= 30 ? '#d97706' : '#e11d48';
  const bg    = score >= 55 ? '#d1fae5' : score >= 30 ? '#fef3c7' : '#ffe4e6';
  const label = score >= 55 ? 'Genuine' : score >= 30 ? 'Under Review' : 'Flagged';
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-[#636366] font-medium">Behavioural Truth Score</span>
        <span className="font-bold px-2 py-0.5 rounded-full text-[11px]" style={{ color, background: bg }}>
          {score}/100 — {label}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f4f4f5' }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${score}%`, background: `linear-gradient(90deg,${color}99,${color})` }}/>
      </div>
      <div className="flex justify-between text-[10px] text-[#aeaeb2] mt-1">
        <span>Flagged &lt;30</span><span>Review 30–54</span><span>Approved ≥55</span>
      </div>
    </div>
  );
}

export default function Claims() {
  const [claims, setClaims]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [signals, setSignals]     = useState({});
  const [verifying, setVerifying] = useState(null);
  const [filter, setFilter]       = useState('all');
  const [aiExplanations, setAiExplanations] = useState({});
  const [loadingAI, setLoadingAI] = useState({});

  useEffect(() => {
    api.get('/claims/my').then(r => setClaims(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    claims.filter(c => ['flagged','under_review'].includes(c.status)).forEach(c => {
      if (!signals[c.id]) loadSignals(c.id);
    });
  }, [claims]);

  const loadSignals = async (id) => {
    if (signals[id]) return;
    try { const { data } = await api.get(`/claims/${id}/signals`); setSignals(p => ({ ...p, [id]: data })); } catch {}
  };

  const toggle = (id) => { setExpanded(expanded === id ? null : id); if (expanded !== id) loadSignals(id); };

  const verify = async (claimId) => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setVerifying(claimId);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await api.post(`/claims/${claimId}/verify`, { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
          toast[data.success ? 'success' : 'error'](data.message);
          if (data.success) setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'approved' } : c));
        } catch { toast.error('Verification failed'); }
        finally { setVerifying(null); }
      },
      () => { toast.error('Location access denied. Please enable location.'); setVerifying(null); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getAIExplanation = async (claim) => {
    if (aiExplanations[claim.id]) return;
    setLoadingAI(p => ({ ...p, [claim.id]: true }));
    try {
      const { data } = await api.post('/ai/explain-claim', { btsScore: claim.bts_score, tier: claim.fraud_tier, signals: signals[claim.id] || [], disruptionType: claim.type });
      setAiExplanations(p => ({ ...p, [claim.id]: data.explanation }));
    } catch { setAiExplanations(p => ({ ...p, [claim.id]: 'Unable to load explanation.' })); }
    finally { setLoadingAI(p => ({ ...p, [claim.id]: false })); }
  };

  if (loading) return <Loading text="Loading your claims…" />;

  const counts = {
    all: claims.length,
    approved: claims.filter(c => ['approved','paid'].includes(c.status)).length,
    under_review: claims.filter(c => c.status === 'under_review').length,
    flagged: claims.filter(c => c.status === 'flagged').length,
  };
  const filtered = filter === 'all' ? claims : claims.filter(c =>
    filter === 'approved' ? ['approved','paid'].includes(c.status) : c.status === filter
  );

  return (
    <div className="page">
      <div className="mb-5 animate-fade-up">
        <h1 className="text-[22px] font-bold text-[#1c1c1e] tracking-tight">My Claims</h1>
        <p className="text-[#8e8e93] text-sm mt-0.5">Auto-created when disruptions hit your zone</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-2 mb-4 stagger">
        {[
          { label:'Approved', count:counts.approved, color:'#059669', bg:'#d1fae5', icon:CheckCircle2 },
          { label:'Review',   count:counts.under_review, color:'#d97706', bg:'#fef3c7', icon:AlertCircle },
          { label:'Flagged',  count:counts.flagged, color:'#e11d48', bg:'#ffe4e6', icon:XCircle },
        ].map((s, i) => (
          <div key={s.label} className="card-glass text-center py-3 animate-fade-up" style={{ animationDelay: `${i*60}ms` }}>
            <div className="flex justify-center mb-1">
              <s.icon size={16} color={s.color} strokeWidth={2}/>
            </div>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-[11px] text-[#8e8e93] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {[
          { key:'all',          label:`All (${counts.all})` },
          { key:'approved',     label:`Approved (${counts.approved})` },
          { key:'under_review', label:`Review (${counts.under_review})` },
          { key:'flagged',      label:`Flagged (${counts.flagged})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
              filter === f.key
                ? 'text-white border-transparent'
                : 'bg-white text-[#636366] border-[#e5e5ea] hover:border-[#c7d2fe]'
            }`}
            style={filter === f.key ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' } : {}}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <EmptyState icon={FileText} iconColor="#aeaeb2" title="No claims yet" subtitle="Claims appear automatically when disruptions are detected in your zone." />
        : (
          <div className="space-y-3">
            {filtered.map((c, i) => (
              <div key={c.id}
                className={`card-glass cursor-pointer transition-all duration-200 hover:shadow-card-md animate-fade-up ${
                  c.status === 'flagged' ? 'border-[#fecdd3]' :
                  c.status === 'under_review' ? 'border-[#fde68a]' : ''
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => toggle(c.id)}>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <DisruptionIcon type={c.type} size={16}/>
                    <div className="min-w-0">
                      <p className="font-bold text-[#1c1c1e] text-sm">{c.subtype}</p>
                      <p className="text-xs text-[#8e8e93] truncate">{c.zone}, {c.city}</p>
                      <p className="text-[11px] text-[#aeaeb2]">{new Date(c.triggered_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#059669] font-bold text-base">₹{c.payout_amount}</p>
                    <p className="text-[#aeaeb2] text-[11px]">{c.hours_affected}h lost</p>
                    <StatusBadge status={c.status}/>
                    <p className="text-[#aeaeb2] text-[10px] mt-0.5">
                      {c.status === 'approved' ? 'स्वीकृत' : c.status === 'under_review' ? 'समीक्षाधीन' : c.status === 'flagged' ? 'संदिग्ध' : c.status === 'paid' ? 'भुगतान हो गया' : ''}
                    </p>
                  </div>
                </div>

                {/* Flagged banner */}
                {c.status === 'flagged' && (
                  <div className="mt-3 rounded-xl p-3 border border-[#fecdd3]" style={{ background: '#fff1f2' }}
                    onClick={e => e.stopPropagation()}>
                    <p className="text-[#9f1239] font-bold text-xs mb-1">Location Verification Required</p>
                    <p className="text-[#636366] text-xs mb-2">Share your live location to verify your claim.</p>
                    {signals[c.id]?.length > 0 && (
                      <p className="text-[#e11d48] text-xs mb-2 font-medium">
                        Issue: {signals[c.id].find(s => s.is_suspicious)?.signal_name?.replace(/_/g,' ') || 'GPS location'} could not be verified
                      </p>
                    )}
                    <button
                      className="w-full text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)', boxShadow: '0 2px 8px rgba(244,63,94,0.3)' }}
                      disabled={verifying === c.id}
                      onClick={e => { e.stopPropagation(); verify(c.id); }}>
                      {verifying === c.id
                        ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Verifying…</>
                        : <><MapPin size={13} strokeWidth={2.5}/> Share Live Location</>
                      }
                    </button>
                  </div>
                )}

                {/* Under review banner */}
                {c.status === 'under_review' && (
                  <div className="mt-3 rounded-xl p-3 border border-[#fde68a]" style={{ background: '#fffbeb' }}>
                    <p className="text-[#92400e] font-bold text-xs">Under Review (2–4 hours)</p>
                    <p className="text-[#636366] text-xs mt-1">No action needed. +₹20 goodwill bonus if review takes too long.</p>
                  </div>
                )}

                {/* Expanded */}
                {expanded === c.id && (
                  <div className="mt-4 border-t border-[#f2f2f7] pt-4 animate-scale-in" onClick={e => e.stopPropagation()}>
                    <BTSMeter score={c.bts_score}/>

                    {/* AI Explanation */}
                    <div className="mt-3 rounded-xl p-3 border border-[#c7d2fe]" style={{ background: '#eef2ff' }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={12} color="#4f46e5" strokeWidth={2}/>
                          <p className="text-[#4f46e5] font-semibold text-xs">AI Explanation</p>
                        </div>
                        {!aiExplanations[c.id] && (
                          <button onClick={() => getAIExplanation(c)} disabled={loadingAI[c.id]}
                            className="text-[#4f46e5] text-xs font-semibold hover:underline disabled:opacity-50">
                            {loadingAI[c.id] ? 'Loading…' : 'Explain'}
                          </button>
                        )}
                      </div>
                      {aiExplanations[c.id] && <p className="text-[#636366] text-xs leading-relaxed">{aiExplanations[c.id]}</p>}
                    </div>

                    {signals[c.id]?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-[#3a3a3c] mb-2">Fraud Detection Signals</p>
                        {signals[c.id].map(s => (
                          <div key={s.id} className={`flex items-start justify-between py-2.5 border-b border-[#f2f2f7] last:border-0 gap-2 ${s.is_suspicious ? 'rounded-lg px-2 -mx-2' : ''}`}
                            style={s.is_suspicious ? { background: '#fff1f2' } : {}}>
                            <div className="flex items-start gap-2 min-w-0">
                              {s.is_suspicious
                                ? <XCircle size={14} color="#e11d48" strokeWidth={2} className="shrink-0 mt-0.5"/>
                                : <CheckCircle2 size={14} color="#059669" strokeWidth={2} className="shrink-0 mt-0.5"/>
                              }
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#1c1c1e] capitalize">{s.signal_name.replace(/_/g,' ')}</p>
                                <p className="text-[11px] text-[#8e8e93] leading-snug">{s.detail}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-bold shrink-0 ${s.is_suspicious ? 'text-[#e11d48]' : 'text-[#059669]'}`}>{s.signal_value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-1 mt-2 text-[11px] text-[#aeaeb2]">
                  {expanded === c.id ? <ChevronUp size={13} strokeWidth={2}/> : <ChevronDown size={13} strokeWidth={2}/>}
                  <span>{expanded === c.id ? 'Hide details' : 'View fraud analysis'}</span>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
