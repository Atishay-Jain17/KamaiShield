import { useState, useEffect } from 'react';
import api from '../api';
import { Loading, EmptyState, StatusBadge, DisruptionIcon } from '../components/UI';
import { Search, Users, ShieldCheck, Wallet, FileText, Zap, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

const PLATFORM_COLORS = {
  Swiggy:    { bg: '#fff3e0', color: '#e65100', border: '#ffcc80' },
  Zomato:    { bg: '#fce4ec', color: '#c62828', border: '#f48fb1' },
  Blinkit:   { bg: '#fffde7', color: '#f57f17', border: '#fff176' },
  Dunzo:     { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
  Zepto:     { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
  Amazon:    { bg: '#fff8e1', color: '#f57c00', border: '#ffe082' },
  Flipkart:  { bg: '#e8eaf6', color: '#3949ab', border: '#9fa8da' },
  BigBasket: { bg: '#e8f5e9', color: '#388e3c', border: '#a5d6a7' },
};

function PlatformBadge({ platform }) {
  const cfg = PLATFORM_COLORS[platform] || { bg: '#f4f4f5', color: '#636366', border: '#e5e5ea' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {platform}
    </span>
  );
}

function AvatarInitial({ name, platform }) {
  const cfg = PLATFORM_COLORS[platform] || { bg: '#e0e7ff', color: '#4f46e5' };
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

/* ── AdminRiders ─────────────────────────────────────────────────────────── */
export function AdminRiders() {
  const [riders, setRiders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/admin/riders').then(r => setRiders(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = riders.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.city?.toLowerCase().includes(search.toLowerCase()) ||
    r.platform?.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.includes(search)
  );

  if (loading) return <Loading text="Loading riders..." />;

  const totalPolicies = riders.reduce((s, r) => s + (r.total_policies || 0), 0);
  const totalPayouts  = riders.reduce((s, r) => s + (r.total_payout_received || 0), 0);

  return (
    <div className="page-wide">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-widest mb-0.5">Admin</p>
          <h1 className="text-2xl font-bold text-[#1c1c1e] tracking-tight">All Riders</h1>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e93]"/>
          <input
            className="input pl-9 w-64 text-sm"
            placeholder="Search name, city, platform..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card-glass flex items-center gap-3">
          <div className="icon-wrap w-9 h-9" style={{ background: '#e0f2fe' }}>
            <Users size={16} color="#0284c7" strokeWidth={2}/>
          </div>
          <div>
            <p className="text-[11px] text-[#8e8e93] font-medium uppercase tracking-wide">Total Riders</p>
            <p className="text-xl font-bold text-[#0284c7]">{riders.length}</p>
          </div>
        </div>
        <div className="card-glass flex items-center gap-3">
          <div className="icon-wrap w-9 h-9" style={{ background: '#d1fae5' }}>
            <ShieldCheck size={16} color="#059669" strokeWidth={2}/>
          </div>
          <div>
            <p className="text-[11px] text-[#8e8e93] font-medium uppercase tracking-wide">Total Policies</p>
            <p className="text-xl font-bold text-[#059669]">{totalPolicies}</p>
          </div>
        </div>
        <div className="card-glass flex items-center gap-3">
          <div className="icon-wrap w-9 h-9" style={{ background: '#ede9fe' }}>
            <Wallet size={16} color="#7c3aed" strokeWidth={2}/>
          </div>
          <div>
            <p className="text-[11px] text-[#8e8e93] font-medium uppercase tracking-wide">Total Payouts</p>
            <p className="text-xl font-bold text-[#7c3aed]">₹{Math.round(totalPayouts).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[#8e8e93] border-b border-[#f2f2f7]">
              {['Rider', 'Platform', 'City / Zone', 'Policies', 'Claims', 'Total Received'].map(h => (
                <th key={h} className="text-left py-2.5 pr-4 font-semibold text-[10px] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-[#f2f2f7] last:border-0 hover:bg-[#f9f9fb] transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <AvatarInitial name={r.name} platform={r.platform}/>
                    <div>
                      <p className="font-semibold text-[#1c1c1e]">{r.name}</p>
                      <p className="text-[#8e8e93] text-[10px]">{r.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4"><PlatformBadge platform={r.platform}/></td>
                <td className="py-3 pr-4 text-[#636366]">{r.zone}, {r.city}</td>
                <td className="py-3 pr-4 text-[#4f46e5] font-bold">{r.total_policies}</td>
                <td className="py-3 pr-4 text-[#1c1c1e] font-bold">{r.total_claims}</td>
                <td className="py-3 text-[#059669] font-bold">₹{Math.round(r.total_payout_received || 0)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" className="text-center py-8 text-[#8e8e93]">No riders found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── AdminClaims ─────────────────────────────────────────────────────────── */
export function AdminClaims() {
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    api.get('/admin/claims').then(r => setClaims(r.data)).finally(() => setLoading(false));
  }, []);

  const counts = {
    all:          claims.length,
    approved:     claims.filter(c => ['approved','paid'].includes(c.status)).length,
    under_review: claims.filter(c => c.status === 'under_review').length,
    flagged:      claims.filter(c => c.status === 'flagged' || c.fraud_tier === 3).length,
  };

  const filtered = filter === 'all' ? claims : claims.filter(c =>
    filter === 'approved'     ? ['approved','paid'].includes(c.status) :
    filter === 'flagged'      ? (c.status === 'flagged' || c.fraud_tier === 3) :
    c.status === filter
  );

  if (loading) return <Loading text="Loading claims..." />;

  const FILTERS = [
    { key: 'all',          label: 'All',      count: counts.all,          icon: FileText },
    { key: 'approved',     label: 'Approved', count: counts.approved,     icon: CheckCircle2 },
    { key: 'under_review', label: 'Review',   count: counts.under_review, icon: Clock },
    { key: 'flagged',      label: 'Flagged',  count: counts.flagged,      icon: XCircle },
  ];

  const severityColor = { CRITICAL: '#e11d48', HIGH: '#f59e0b', MODERATE: '#d97706', LOW: '#10b981' };

  return (
    <div className="page-wide">
      <div className="mb-6">
        <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-widest mb-0.5">Admin</p>
        <h1 className="text-2xl font-bold text-[#1c1c1e] tracking-tight">All Claims</h1>
        <p className="text-[#636366] text-sm mt-0.5">Full fraud analysis for every claim</p>
      </div>

      {/* Segmented filter */}
      <div className="flex gap-1 mb-5 p-1 rounded-2xl w-fit" style={{ background: '#f2f2f7' }}>
        {FILTERS.map(f => {
          const Icon = f.icon;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={active
                ? { background: '#fff', color: '#1c1c1e', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                : { background: 'transparent', color: '#8e8e93' }
              }
            >
              <Icon size={12}/>
              {f.label}
              <span
                className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: active ? '#f2f2f7' : 'rgba(0,0,0,0.06)',
                  color: active ? '#1c1c1e' : '#8e8e93',
                }}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[#8e8e93] border-b border-[#f2f2f7]">
              {['Rider', 'Disruption', 'Location', 'Hours', 'Payout', 'BTS', 'Tier', 'Status'].map(h => (
                <th key={h} className="text-left py-2.5 pr-4 font-semibold text-[10px] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const btsColor = c.bts_score >= 55 ? '#059669' : c.bts_score >= 30 ? '#d97706' : '#e11d48';
              const tierBg   = c.fraud_tier === 1 ? '#d1fae5' : c.fraud_tier === 2 ? '#fef3c7' : '#ffe4e6';
              const tierColor= c.fraud_tier === 1 ? '#059669' : c.fraud_tier === 2 ? '#d97706' : '#e11d48';
              return (
                <tr
                  key={c.id}
                  className="border-b border-[#f2f2f7] last:border-0 hover:bg-[#f9f9fb] transition-colors"
                  style={c.status === 'flagged' ? { background: '#fff5f5' } : c.status === 'under_review' ? { background: '#fffbeb' } : {}}
                >
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-[#1c1c1e]">{c.rider_name}</p>
                    <p className="text-[#8e8e93] text-[10px]">{c.platform} · {c.city}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <DisruptionIcon type={c.disruption_type} size={14}/>
                      <div>
                        <p className="font-medium text-[#1c1c1e]">{c.disruption_type?.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] font-semibold" style={{ color: severityColor[c.severity] || '#636366' }}>{c.severity}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-[#636366]">{c.city}</td>
                  <td className="py-3 pr-4 text-[#1c1c1e] font-medium">{c.hours_affected}h</td>
                  <td className="py-3 pr-4 text-[#059669] font-bold">₹{c.payout_amount}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-14 h-1.5 bg-[#f2f2f7] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${c.bts_score}%`, backgroundColor: btsColor }}
                        />
                      </div>
                      <span className="font-bold text-[11px]" style={{ color: btsColor }}>{c.bts_score}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
                      style={{ background: tierBg, color: tierColor }}
                    >
                      T{c.fraud_tier}
                    </span>
                  </td>
                  <td className="py-3"><StatusBadge status={c.status}/></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="8" className="text-center py-8 text-[#8e8e93]">No claims in this category</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── AdminDisruptions ────────────────────────────────────────────────────── */
export function AdminDisruptions() {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const r = await api.get('/disruptions/recent');
      setDisruptions(r.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading text="Loading disruptions..." />;

  const severityBorder = { CRITICAL: '#e11d48', HIGH: '#f59e0b', MODERATE: '#d97706', LOW: '#10b981' };
  const severityBg     = { CRITICAL: '#fff5f5', HIGH: '#fffbeb', MODERATE: '#fffbeb', LOW: '#f0fdf4' };

  return (
    <div className="page-wide max-w-4xl">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-widest mb-0.5">Admin</p>
          <h1 className="text-2xl font-bold text-[#1c1c1e] tracking-tight">All Disruptions</h1>
          <p className="text-[#636366] text-sm mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse inline-block"/>
            {disruptions.filter(d => d.status === 'active').length} currently active
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="btn-secondary btn-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''}/>
          {refreshing ? 'Checking…' : 'Refresh Now'}
        </button>
      </div>

      {disruptions.length === 0
        ? <EmptyState icon={Zap} iconColor="#8e8e93" title="No disruptions yet" subtitle="Use the trigger panel in Admin Dashboard to fire a disruption"/>
        : (
          <div className="space-y-2">
            {disruptions.map(d => {
              const borderColor = severityBorder[d.severity] || '#e5e5ea';
              const rowBg       = d.status === 'active' ? (severityBg[d.severity] || '#fafafa') : '#fff';
              return (
                <div
                  key={d.id}
                  className="rounded-2xl border hover:shadow-card-md transition-all duration-200 p-4"
                  style={{ borderLeft: `4px solid ${borderColor}`, background: rowBg, borderColor: '#e5e5ea' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <DisruptionIcon type={d.type} size={16}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-[#1c1c1e] text-sm">{d.subtype}</p>
                          <StatusBadge status={d.severity}/>
                          {d.status === 'active' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d1fae5] text-[#059669]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse inline-block"/>
                              LIVE
                            </span>
                          )}
                          {d.status !== 'active' && <StatusBadge status={d.status}/>}
                        </div>
                        <p className="text-[#3a3a3c] text-xs leading-relaxed">{d.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#8e8e93]">
                          <span>📍 {d.zone}, {d.city} ({d.pincode})</span>
                          <span>· {d.source}</span>
                          <span>· {new Date(d.triggered_at).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs shrink-0">
                      <p className="font-bold text-[#1c1c1e]">{d.value} {d.unit}</p>
                      <p className="text-[#8e8e93] text-[10px]">Threshold: {d.threshold}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
