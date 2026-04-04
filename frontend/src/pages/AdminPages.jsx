import { useState, useEffect } from 'react';
import api from '../api';
import { Loading, EmptyState, StatusBadge, DisruptionIcon } from '../components/UI';

export function AdminRiders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">All Riders</h1>
          <p className="text-gray-400 text-sm">{riders.length} registered riders</p>
        </div>
        <input className="input w-64 text-sm" placeholder="Search name, city, platform..."
          value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-[#1e3a5f]">
              <th className="text-left py-2 pr-4">Rider</th>
              <th className="text-left py-2 pr-4">Platform</th>
              <th className="text-left py-2 pr-4">City / Zone</th>
              <th className="text-left py-2 pr-4">Policies</th>
              <th className="text-left py-2 pr-4">Claims</th>
              <th className="text-left py-2">Total Received</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-[#1e3a5f] last:border-0 hover:bg-white/2">
                <td className="py-3 pr-4">
                  <p className="text-white font-semibold">{r.name}</p>
                  <p className="text-gray-500 text-xs">{r.phone}</p>
                </td>
                <td className="py-3 pr-4">
                  <span className="badge-blue">{r.platform}</span>
                </td>
                <td className="py-3 pr-4 text-gray-400">{r.zone}, {r.city}</td>
                <td className="py-3 pr-4 text-cyan-400 font-bold">{r.total_policies}</td>
                <td className="py-3 pr-4 text-white font-bold">{r.total_claims}</td>
                <td className="py-3 text-green-400 font-bold">₹{Math.round(r.total_payout_received || 0)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">No riders found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/claims').then(r => setClaims(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? claims : claims.filter(c => c.status === filter || (filter === 'flagged' && c.fraud_tier === 3));

  if (loading) return <Loading text="Loading claims..." />;

  const counts = {
    all: claims.length,
    approved: claims.filter(c => c.status === 'approved' || c.status === 'paid').length,
    under_review: claims.filter(c => c.status === 'under_review').length,
    flagged: claims.filter(c => c.status === 'flagged').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-white mb-1">All Claims</h1>
      <p className="text-gray-400 text-sm mb-4">Full fraud analysis for every claim</p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: `All (${counts.all})` },
          { key: 'approved', label: `✅ Approved (${counts.approved})` },
          { key: 'under_review', label: `🔍 Review (${counts.under_review})` },
          { key: 'flagged', label: `🚨 Flagged (${counts.flagged})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.key ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-[#112233] text-gray-400 border border-[#1e3a5f] hover:border-gray-500'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-[#1e3a5f]">
              <th className="text-left py-2 pr-4">Rider</th>
              <th className="text-left py-2 pr-4">Disruption</th>
              <th className="text-left py-2 pr-4">Location</th>
              <th className="text-left py-2 pr-4">Hours</th>
              <th className="text-left py-2 pr-4">Payout</th>
              <th className="text-left py-2 pr-4">BTS Score</th>
              <th className="text-left py-2 pr-4">Tier</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className={`border-b border-[#1e3a5f] last:border-0 ${c.status === 'flagged' ? 'bg-red-900/5' : c.status === 'under_review' ? 'bg-yellow-900/5' : ''}`}>
                <td className="py-3 pr-4">
                  <p className="text-white font-semibold">{c.rider_name}</p>
                  <p className="text-gray-500 text-xs">{c.platform} · {c.city}</p>
                </td>
                <td className="py-3 pr-4">
                  <span className="flex items-center gap-1"><DisruptionIcon type={c.disruption_type}/> {c.disruption_type?.replace('_', ' ')}</span>
                  <span className={`text-xs ${c.severity === 'CRITICAL' ? 'text-red-400' : c.severity === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'}`}>{c.severity}</span>
                </td>
                <td className="py-3 pr-4 text-gray-400 text-xs">{c.city}</td>
                <td className="py-3 pr-4 text-white">{c.hours_affected}h</td>
                <td className="py-3 pr-4 text-green-400 font-bold">₹{c.payout_amount}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[#0D1B2A] rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${c.bts_score}%`, backgroundColor: c.bts_score >= 55 ? '#22c55e' : c.bts_score >= 30 ? '#eab308' : '#ef4444' }}/>
                    </div>
                    <span className={`text-xs font-bold ${c.bts_score >= 55 ? 'text-green-400' : c.bts_score >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>{c.bts_score}</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className={`text-xs font-bold ${c.fraud_tier === 1 ? 'text-green-400' : c.fraud_tier === 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                    T{c.fraud_tier}
                  </span>
                </td>
                <td className="py-3"><StatusBadge status={c.status}/></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="8" className="text-center py-8 text-gray-500">No claims in this category</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminDisruptions() {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/disruptions/recent').then(r => setDisruptions(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading disruptions..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-white mb-1">All Disruptions</h1>
      <p className="text-gray-400 text-sm mb-6">{disruptions.filter(d => d.status === 'active').length} currently active</p>

      {disruptions.length === 0
        ? <EmptyState icon="⚡" title="No disruptions yet" subtitle="Use the trigger panel in Admin Dashboard to fire a disruption"/>
        : (
          <div className="space-y-3">
            {disruptions.map(d => (
              <div key={d.id} className={`card ${d.status === 'active' ? 'border-orange-700/50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl"><DisruptionIcon type={d.type}/></span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white">{d.subtype}</p>
                        <StatusBadge status={d.severity}/>
                        <StatusBadge status={d.status}/>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{d.description}</p>
                      <p className="text-xs text-gray-500 mt-1">📍 {d.zone}, {d.city} ({d.pincode}) · Source: {d.source}</p>
                      <p className="text-xs text-gray-500">Triggered: {new Date(d.triggered_at).toLocaleString('en-IN')}</p>
                      {d.resolved_at && <p className="text-xs text-gray-500">Resolved: {new Date(d.resolved_at).toLocaleString('en-IN')}</p>}
                    </div>
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <p className="text-white font-mono">Value: <strong>{d.value} {d.unit}</strong></p>
                    <p className="text-gray-400">Threshold: {d.threshold} {d.unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
