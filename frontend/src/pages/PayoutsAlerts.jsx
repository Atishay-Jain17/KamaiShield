import { useState, useEffect } from 'react';
import api from '../api';
import { Loading, EmptyState, StatusBadge, DisruptionIcon } from '../components/UI';
import { Wallet, TrendingUp, CheckCircle2, Search, Clock, Smartphone, IndianRupee, Bell } from 'lucide-react';

export function Payouts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payouts/my').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading payouts…" />;

  const { payouts, pendingThisWeek } = data;
  const totalPaid = payouts.filter(p => p.status === 'processed').reduce((s, p) => s + p.total_amount, 0);

  const timeline = [
    { icon: CheckCircle2, color: '#059669', bg: '#d1fae5', label: 'Mon–Sat', desc: 'Disruptions detected & claims verified automatically' },
    { icon: Search,       color: '#7c3aed', bg: '#ede9fe', label: 'Throughout week', desc: 'Fraud engine validates each claim silently' },
    { icon: IndianRupee,  color: '#4f46e5', bg: '#e0e7ff', label: 'Sunday 11:30 PM', desc: 'All claims consolidated → single UPI transfer' },
    { icon: Smartphone,   color: '#0284c7', bg: '#e0f2fe', label: 'Monday morning', desc: 'Money in your account' },
  ];

  return (
    <div className="page">
      <div className="mb-5 animate-fade-up">
        <h1 className="text-[22px] font-bold text-[#1c1c1e] tracking-tight">Payouts</h1>
        <p className="text-[#8e8e93] text-sm mt-0.5">Consolidated every Sunday to your UPI</p>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl p-5 mb-4 animate-fade-up border border-[#c7d2fe]"
        style={{ background: 'linear-gradient(135deg,#eef2ff 0%,#f5f3ff 60%,#fff 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.12)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] text-[#8e8e93] font-semibold uppercase tracking-wider">Pending This Sunday</p>
            <p className="text-[40px] font-bold text-[#4f46e5] mt-1 leading-none tracking-tight">
              ₹{pendingThisWeek?.total || 0}
            </p>
            <p className="text-[#636366] text-sm mt-1.5">{pendingThisWeek?.count || 0} approved claims</p>
          </div>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
            <Wallet size={28} className="text-white" strokeWidth={1.8}/>
          </div>
        </div>
        <div className="space-y-2">
          {timeline.map((t, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl p-2.5 border border-white/60"
              style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="icon-wrap w-7 h-7 shrink-0" style={{ background: t.bg }}>
                <t.icon size={13} color={t.color} strokeWidth={2.2}/>
              </div>
              <div>
                <p className="text-[#1c1c1e] text-xs font-semibold">{t.label}</p>
                <p className="text-[#8e8e93] text-[11px]">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5 stagger">
        <div className="card-glass text-center py-4 animate-fade-up">
          <div className="flex justify-center mb-1.5">
            <div className="icon-wrap w-8 h-8" style={{ background: '#d1fae5' }}>
              <TrendingUp size={15} color="#059669" strokeWidth={2}/>
            </div>
          </div>
          <p className="text-xl font-bold text-[#059669]">₹{Math.round(totalPaid).toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-[#8e8e93] mt-0.5">Total Earned</p>
        </div>
        <div className="card-glass text-center py-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <div className="flex justify-center mb-1.5">
            <div className="icon-wrap w-8 h-8" style={{ background: '#e0e7ff' }}>
              <Wallet size={15} color="#4f46e5" strokeWidth={2}/>
            </div>
          </div>
          <p className="text-xl font-bold text-[#4f46e5]">{payouts.length}</p>
          <p className="text-[11px] text-[#8e8e93] mt-0.5">Total Payouts</p>
        </div>
      </div>

      {/* History */}
      <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2 px-1">Payout History</p>
      {payouts.length === 0
        ? <EmptyState icon={Wallet} iconColor="#aeaeb2" title="No payouts yet" subtitle="Your first Sunday payout appears here after your first week" />
        : (
          <div className="card-glass animate-fade-up">
            {payouts.map(p => (
              <div key={p.id} className="flex justify-between items-center py-3.5 border-b border-[#f2f2f7] last:border-0 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="icon-wrap w-9 h-9" style={{ background: '#d1fae5' }}>
                    <IndianRupee size={15} color="#059669" strokeWidth={2}/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#1c1c1e] font-semibold text-sm">Week of {p.week_start}</p>
                    <p className="text-[#8e8e93] text-xs mt-0.5">{p.total_claims} claims · {p.upi_id}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[#059669] font-bold text-base">₹{p.total_amount}</p>
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
    Promise.all([api.get('/alerts/my'), api.get('/disruptions/my-zone')])
      .then(([a, d]) => { setAlerts(a.data); setDisruptions(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading alerts…" />;

  return (
    <div className="page">
      <div className="mb-5 animate-fade-up">
        <h1 className="text-[22px] font-bold text-[#1c1c1e] tracking-tight">Zone Alerts</h1>
        <p className="text-[#8e8e93] text-sm mt-0.5">Real-time disruptions in your delivery area</p>
      </div>

      {/* Active disruptions */}
      {disruptions.length > 0 && (
        <div className="mb-5 animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative w-2.5 h-2.5">
              <div className="absolute inset-0 rounded-full bg-[#e11d48] animate-pulse-ring"/>
              <div className="w-2.5 h-2.5 rounded-full bg-[#e11d48]"/>
            </div>
            <p className="text-xs font-bold text-[#e11d48] uppercase tracking-wider">Active in Your Zone</p>
          </div>
          <div className="space-y-3">
            {disruptions.map(d => (
              <div key={d.id} className="rounded-2xl p-4 border border-[#fecdd3] animate-scale-in"
                style={{ background: 'linear-gradient(135deg,#fff1f2,#ffe4e6)' }}>
                <div className="flex items-start gap-3">
                  <DisruptionIcon type={d.type} size={16}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-[#1c1c1e] text-sm">{d.subtype}</p>
                      <span className={`badge ${d.severity === 'CRITICAL' || d.severity === 'HIGH' ? 'badge-red' : 'badge-yellow'}`}>
                        {d.severity}
                      </span>
                    </div>
                    <p className="text-[#3a3a3c] text-xs leading-snug">{d.description}</p>
                    <p className="text-[11px] text-[#8e8e93] mt-1.5">
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
      <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2 px-1">All Notifications</p>
      {alerts.length === 0
        ? <EmptyState icon={Bell} iconColor="#aeaeb2" title="All clear!" subtitle="No alerts in your zone. You'll be notified when any disruption is detected." />
        : (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={a.id}
                className={`card-sm flex gap-3 items-start animate-fade-up ${!a.read ? 'border-[#c7d2fe]' : ''}`}
                style={{ animationDelay: `${i * 30}ms`, background: !a.read ? '#eef2ff' : undefined }}>
                <DisruptionIcon type={a.type} size={14}/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#3a3a3c] leading-snug">{a.message}</p>
                  <p className="text-[11px] text-[#aeaeb2] mt-1">
                    {new Date(a.created_at).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
                {!a.read && <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: '#4f46e5' }}/>}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
