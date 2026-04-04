import { useState, useEffect } from 'react';
import api from '../api';
import { Loading, EmptyState, StatusBadge, DisruptionIcon } from '../components/UI';

export function Payouts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payouts/my').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading payouts..." />;

  const { payouts, pendingThisWeek } = data;
  const totalPaid = payouts.filter(p => p.status === 'processed').reduce((s, p) => s + p.total_amount, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <h1 className="text-xl font-black text-white mb-1">Payouts</h1>
      <p className="text-gray-400 text-sm mb-4">Consolidated every Sunday to your UPI</p>

      {/* Big pending card */}
      <div className="card border-cyan-500/40 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm">Pending This Sunday</p>
            <p className="text-5xl font-black text-cyan-400 mt-1">
              ₹{pendingThisWeek?.total || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {pendingThisWeek?.count || 0} approved claims
            </p>
          </div>
          <div className="text-6xl">💰</div>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          {[
            { icon: '✅', label: 'Mon–Sat', desc: 'Disruptions detected & claims verified automatically' },
            { icon: '🔍', label: 'Throughout week', desc: 'Fraud engine validates each claim silently' },
            { icon: '💸', label: 'Sunday 11:30 PM', desc: 'All claims consolidated → single UPI transfer' },
            { icon: '📱', label: 'Monday morning', desc: 'Money in your account — wake up protected' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 bg-[#0D1B2A] rounded-xl p-3">
              <span className="text-lg shrink-0">{s.icon}</span>
              <div>
                <p className="text-white text-sm font-semibold">{s.label}</p>
                <p className="text-gray-400 text-xs">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card text-center py-4">
          <p className="text-2xl font-black text-green-400">₹{Math.round(totalPaid).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">Total Earned</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-black text-cyan-400">{payouts.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Payouts</p>
        </div>
      </div>

      {/* History */}
      <h3 className="font-bold text-white mb-3">Payout History</h3>
      {payouts.length === 0
        ? <EmptyState icon="💸" title="No payouts yet" subtitle="Your first Sunday payout appears here after your first week" />
        : (
          <div className="card space-y-0">
            {payouts.map(p => (
              <div key={p.id} className="flex justify-between items-start py-4 border-b border-[#1e3a5f] last:border-0 gap-2">
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm">Week of {p.week_start}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{p.total_claims} claims</p>
                  <p className="text-gray-500 text-xs truncate">→ {p.upi_id}</p>
                  {p.processed_at && (
                    <p className="text-gray-600 text-xs">{new Date(p.processed_at).toLocaleDateString('en-IN')}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-green-400 font-black text-xl">₹{p.total_amount}</p>
                  <StatusBadge status={p.status}/>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

export function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/alerts/my'),
      api.get('/disruptions/my-zone'),
    ]).then(([a, d]) => { setAlerts(a.data); setDisruptions(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading alerts..." />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <h1 className="text-xl font-black text-white mb-1">Zone Alerts</h1>
      <p className="text-gray-400 text-sm mb-4">Real-time disruptions in your delivery area</p>

      {/* Active disruptions */}
      {disruptions.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"/>
            <h3 className="font-bold text-red-400 text-sm">ACTIVE IN YOUR ZONE</h3>
          </div>
          <div className="space-y-3">
            {disruptions.map(d => (
              <div key={d.id} className="card border-red-700/50">
                <div className="flex items-start gap-3">
                  <span className="text-3xl shrink-0"><DisruptionIcon type={d.type}/></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-white text-sm">{d.subtype}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        d.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-400'
                        : d.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-400'
                        : 'bg-yellow-900/50 text-yellow-400'
                      }`}>{d.severity}</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-snug">{d.description}</p>
                    <p className="text-xs text-gray-500 mt-1.5">
                      📍 {d.zone}, {d.city} · {new Date(d.triggered_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All alerts */}
      <h3 className="font-bold text-white mb-3">All Notifications</h3>
      {alerts.length === 0
        ? <EmptyState icon="🔔" title="All clear!" subtitle="No alerts in your zone. You'll be notified when any disruption is detected." />
        : (
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className={`card-sm flex gap-3 items-start ${!a.read ? 'border-cyan-500/40' : ''}`}>
                <span className="text-xl shrink-0"><DisruptionIcon type={a.type}/></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 leading-snug">{a.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(a.created_at).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
                {!a.read && <span className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0"/>}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
