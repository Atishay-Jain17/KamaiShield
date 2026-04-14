import { useState, useEffect } from 'react';
import api from '../api';
import { Loading, EmptyState, StatusBadge, DisruptionIcon } from '../components/UI';
import { Search } from 'lucide-react';

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

  if (loading) return <Loading text="Loading riders…" />;

  return (
    <div className="page-wide">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink-900">All Riders</h1>
          <p className="text-ink-500 text-sm">{riders.length} registered riders</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/>
          <input className="input pl-9 w-64 text-sm" placeholder="Search name, city, platform…"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-ink-400 border-b border-surface-100">
              {['Rider','Platform','City / Zone','Policies','Claims','Total Received'].map(h => (
                <th key={h} className="text-left py-2.5 pr-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-surface-50 last:border-0 hover:bg-surface-50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">{r.name?.[0]}</div>
                    <div>
                      <p className="font-semibold text-ink-900">{r.name}</p>
                      <p className="text-ink-400 text-[10px]">{r.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4"><span className="badge-blue">{r.platform}</span></td>
                <td className="py-3 pr-4 text-ink-500">{r.zone}, {r.city}</td>
                <td className="py-3 pr-4 text-primary-600 font-semibold">{r.total_policies}</td>
                <td className="py-3 pr-4 text-ink-800 font-semibold">{r.total_claims}</td>
                <td className="py-3 text-success-600 font-semibold">₹{Math.round(r.total_payout_received || 0)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" className="text-center py-8 text-ink-400">No riders found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminClaims() {
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    api.get('/admin/claims').then(r => setClaims(r.data)).finally(() => setLoading(false));
  }, []);

  const counts = {
    all: claims.length,
    approved: claims.filter(c => ['approved','paid'].includes(c.status)).length,
    under_review: claims.filter(c => c.status === 'under_review').length,
    flagged: claims.filter(c => c.status === 'flagged').length,
  };

  const filtered = filter === 'all' ? claims : claims.filter(c =>
    filter === 'approved' ? ['approved','paid'].includes(c.status) :
    filter === 'flagged'  ? (c.status === 'flagged' || c.fraud_tier === 3) :
    c.status === filter
  );

  if (loading) return <Loading text="Loading claims…" />;

  return (
    <div className="page-wide">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink-900">All Claims</h1>
        <p className="text-ink-500 text-sm">Full fraud analysis for every claim</p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key:'all',          label:`All (${counts.all})` },
          { key:'approved',     label:`Approved (${counts.approved})` },
          { key:'under_review', label:`Review (${counts.under_review})` },
          { key:'flagged',      label:`Flagged (${counts.flagged})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filter === f.key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-ink-600 border-surface-200 hover:border-surface-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-ink-400 border-b border-surface-100">
              {['Rider','Disruption','Location','Hours','Payout','BTS','Tier','Status'].map(h => (
                <th key={h} className="text-left py-2.5 pr-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className={`border-b border-surface-50 last:border-0 ${c.status==='flagged'?'bg-danger-50/50':c.status==='under_review'?'bg-warning-50/50':''}`}>
                <td className="py-3 pr-4">
                  <p className="font-semibold text-ink-900">{c.rider_name}</p>
                  <p className="text-ink-400 text-[10px]">{c.platform} · {c.city}</p>
                </td>
                <td className="py-3 pr-4">
                  <span className="flex items-center gap-1"><DisruptionIcon type={c.disruption_type}/> {c.disruption_type?.replace(/_/g,' ')}</span>
                  <span className={`text-[10px] font-medium ${c.severity==='CRITICAL'?'text-danger-600':c.severity==='HIGH'?'text-warning-600':'text-warning-500'}`}>{c.severity}</span>
                </td>
                <td className="py-3 pr-4 text-ink-500">{c.city}</td>
                <td className="py-3 pr-4 text-ink-800 font-medium">{c.hours_affected}h</td>
                <td className="py-3 pr-4 text-success-600 font-semibold">₹{c.payout_amount}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${c.bts_score}%`, backgroundColor: c.bts_score>=55?'#16a34a':c.bts_score>=30?'#d97706':'#dc2626' }}/>
                    </div>
                    <span className={`font-semibold ${c.bts_score>=55?'text-success-600':c.bts_score>=30?'text-warning-600':'text-danger-600'}`}>{c.bts_score}</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className={`font-bold ${c.fraud_tier===1?'text-success-600':c.fraud_tier===2?'text-warning-600':'text-danger-600'}`}>T{c.fraud_tier}</span>
                </td>
                <td className="py-3"><StatusBadge status={c.status}/></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="8" className="text-center py-8 text-ink-400">No claims in this category</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminDisruptions() {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    api.get('/disruptions/recent').then(r => setDisruptions(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading disruptions…" />;

  return (
    <div className="page-wide max-w-4xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink-900">All Disruptions</h1>
        <p className="text-ink-500 text-sm">{disruptions.filter(d => d.status === 'active').length} currently active</p>
      </div>

      {disruptions.length === 0
        ? <EmptyState icon="⚡" title="No disruptions yet" subtitle="Use the trigger panel in Admin Dashboard to fire a disruption"/>
        : (
          <div className="space-y-3">
            {disruptions.map(d => (
              <div key={d.id} className={`card ${d.status === 'active' ? 'border-warning-200 bg-warning-50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white border border-surface-200 rounded-xl flex items-center justify-center text-xl shrink-0">
                      <DisruptionIcon type={d.type}/>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-ink-900 text-sm">{d.subtype}</p>
                        <StatusBadge status={d.severity}/>
                        <StatusBadge status={d.status}/>
                      </div>
                      <p className="text-ink-600 text-xs">{d.description}</p>
                      <p className="text-ink-400 text-xs mt-1">📍 {d.zone}, {d.city} ({d.pincode}) · {d.source}</p>
                      <p className="text-ink-400 text-xs">Triggered: {new Date(d.triggered_at).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <p className="font-semibold text-ink-800">{d.value} {d.unit}</p>
                    <p className="text-ink-400">Threshold: {d.threshold}</p>
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
