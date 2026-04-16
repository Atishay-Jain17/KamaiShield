import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Loading, DisruptionIcon, StatusBadge, EmptyState, ProgressBar } from '../components/UI';
import {
  Bell, ShieldCheck, ShieldOff, ChevronRight, TrendingUp,
  Wallet, FileText, AlertTriangle, Clock, IndianRupee
} from 'lucide-react';

function StatTile({ label, value, sub, icon: Icon, iconBg, iconColor, delay = 0 }) {
  return (
    <div className="card-glass animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-[#8e8e93] font-medium">{label}</p>
        <div className="icon-wrap w-8 h-8" style={{ background: iconBg }}>
          <Icon size={15} color={iconColor} strokeWidth={2}/>
        </div>
      </div>
      <p className="text-[22px] font-bold tracking-tight" style={{ color: iconColor }}>{value}</p>
      {sub && <p className="text-[11px] text-[#aeaeb2] mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/policies/active'),
      api.get('/claims/my'),
      api.get('/payouts/my'),
      api.get('/disruptions/my-zone'),
      api.get('/alerts/my'),
    ]).then(([policy, claims, payouts, disruptions, alerts]) => {
      setData({ policy: policy.data, claims: claims.data.slice(0, 5), payouts: payouts.data, disruptions: disruptions.data, alerts: alerts.data });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading your dashboard…" />;
  if (!data) return <div className="page"><p className="text-[#8e8e93] text-sm">Failed to load. Please refresh.</p></div>;

  const { policy, claims, payouts, disruptions, alerts } = data;
  const pendingPayout = payouts.pendingThisWeek;
  const recentPayouts = payouts.payouts || [];
  const totalEarned = recentPayouts.reduce((s, p) => s + p.total_amount, 0);
  const daysLeft = policy.active ? Math.max(0, Math.ceil((new Date(policy.policy.end_date) - new Date()) / 86400000)) : 0;
  const unreadAlerts = alerts.filter(a => !a.read).length;

  return (
    <div className="page">

      {/* Header */}
      <div className="flex items-start justify-between mb-5 animate-fade-up">
        <div>
          <p className="text-[11px] text-[#8e8e93] font-semibold uppercase tracking-wider">Dashboard</p>
          <h1 className="text-[22px] font-bold text-[#1c1c1e] mt-0.5 tracking-tight">
            Hello, {user.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-[12px] text-[#8e8e93] mt-0.5">{user.platform} · {user.zone}, {user.city}</p>
        </div>
        <Link to="/alerts" className="relative">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            unreadAlerts > 0 ? 'shadow-card' : ''
          }`} style={{ background: unreadAlerts > 0 ? '#ffe4e6' : '#f4f4f5' }}>
            <Bell size={18} color={unreadAlerts > 0 ? '#e11d48' : '#8e8e93'} strokeWidth={1.8}/>
          </div>
          {unreadAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: '#e11d48' }}>
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </span>
          )}
        </Link>
      </div>

      {/* Active disruption banner */}
      {disruptions.length > 0 && (
        <div className="rounded-2xl p-4 mb-4 animate-fade-up border border-[#fecdd3]"
          style={{ background: 'linear-gradient(135deg,#fff1f2,#ffe4e6)' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ffe4e6' }}>
              <AlertTriangle size={17} color="#e11d48" strokeWidth={2}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#9f1239] font-semibold text-sm">Active Disruption in Your Zone</p>
              {disruptions.slice(0, 2).map(d => (
                <p key={d.id} className="text-[#3a3a3c] text-xs mt-1 leading-snug">{d.description}</p>
              ))}
              {policy.active
                ? <p className="text-[#065f46] text-xs mt-2 font-semibold flex items-center gap-1">
                    <ShieldCheck size={11} strokeWidth={2.5}/> Covered — claim added to Sunday payout
                  </p>
                : <Link to="/policy" className="text-[#92400e] text-xs mt-2 font-semibold block">
                    No active policy — get covered now →
                  </Link>
              }
            </div>
          </div>
        </div>
      )}

      {/* Coverage card */}
      {policy.active ? (
        <div className="rounded-2xl p-4 mb-4 animate-fade-up border border-[#c7d2fe]"
          style={{ background: 'linear-gradient(135deg,#eef2ff 0%,#f5f3ff 50%,#fff 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.12)' }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
              <ShieldCheck size={22} className="text-white" strokeWidth={1.8}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-[#1c1c1e] text-sm capitalize">{policy.policy.plan} Shield</p>
                <span className="badge-green"><span className="w-1.5 h-1.5 rounded-full bg-[#059669] inline-block"/> Active</span>
              </div>
              <p className="text-[#4f46e5] text-xs font-semibold mt-0.5">Aap covered ho ✅</p>
              <p className="text-[#636366] text-xs">Up to ₹{policy.policy.coverage_cap}/week · {Math.round(policy.policy.coverage_pct * 100)}% covered</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[#4f46e5] font-bold text-lg leading-none">₹{policy.policy.premium}</p>
              <p className="text-[#aeaeb2] text-[11px]">/week</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-[#636366] flex items-center gap-1">
              <Clock size={11} strokeWidth={2}/> {daysLeft} days left
            </span>
            <span className="text-[11px] text-[#aeaeb2]">Expires {policy.policy.end_date}</span>
          </div>
          <ProgressBar value={daysLeft} max={7} color="#4f46e5"/>
        </div>
      ) : (
        <Link to="/policy" className="block rounded-2xl p-4 mb-4 animate-fade-up border border-[#fde68a] active:scale-[0.99] transition-transform"
          style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#fef3c7' }}>
              <ShieldOff size={22} color="#d97706" strokeWidth={1.8}/>
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#1c1c1e] text-sm">No Active Policy</p>
              <p className="text-[#636366] text-xs mt-0.5">You're not covered. Get protected from ₹29/week.</p>
            </div>
            <ChevronRight size={18} color="#aeaeb2" strokeWidth={2}/>
          </div>
        </Link>
      )}

      {/* Stats 2×2 */}
      <div className="grid grid-cols-2 gap-3 mb-4 stagger">
        <StatTile label="Pending Payout" value={`₹${pendingPayout?.total || 0}`}
          sub="This Sunday" icon={IndianRupee} iconBg="#d1fae5" iconColor="#059669" delay={0}/>
        <StatTile label="Claims This Week" value={pendingPayout?.count || 0}
          sub="Auto-verified" icon={FileText} iconBg="#e0e7ff" iconColor="#4f46e5" delay={60}/>
        <StatTile label="Total Protected" value={`₹${Math.round(totalEarned).toLocaleString('en-IN')}`}
          sub="कुल सुरक्षित कमाई" icon={TrendingUp} iconBg="#ede9fe" iconColor="#7c3aed" delay={120}/>
        <StatTile label="Zone Alerts" value={unreadAlerts}
          sub="Unread" icon={Bell} iconBg={unreadAlerts > 0 ? '#fef3c7' : '#f4f4f5'} iconColor={unreadAlerts > 0 ? '#d97706' : '#8e8e93'} delay={180}/>
      </div>

      {/* Recent claims */}
      <div className="card-glass mb-4 animate-fade-up">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#1c1c1e]">Recent Claims</p>
          <Link to="/claims" className="flex items-center gap-0.5 text-[#4f46e5] text-xs font-semibold hover:underline">
            View all <ChevronRight size={13} strokeWidth={2.5}/>
          </Link>
        </div>
        {claims.length === 0
          ? <EmptyState icon={FileText} iconColor="#aeaeb2" title="No claims yet" subtitle="Claims are created automatically when disruptions hit your zone" />
          : claims.map(c => (
            <div key={c.id} className="flex items-center justify-between py-3 border-b border-[#f2f2f7] last:border-0 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <DisruptionIcon type={c.type} size={16}/>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1c1c1e] truncate">{c.subtype}</p>
                  <p className="text-[11px] text-[#aeaeb2]">{c.hours_affected}h · BTS {c.bts_score}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[#059669] font-bold text-sm">₹{c.payout_amount}</p>
                <StatusBadge status={c.status}/>
              </div>
            </div>
          ))
        }
      </div>

      {/* Recent payouts */}
      {recentPayouts.length > 0 && (
        <div className="card-glass mb-4 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-[#1c1c1e]">Recent Payouts</p>
            <Link to="/payouts" className="flex items-center gap-0.5 text-[#4f46e5] text-xs font-semibold hover:underline">
              View all <ChevronRight size={13} strokeWidth={2.5}/>
            </Link>
          </div>
          {recentPayouts.slice(0, 3).map(p => (
            <div key={p.id} className="flex justify-between items-center py-3 border-b border-[#f2f2f7] last:border-0 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="icon-wrap w-9 h-9" style={{ background: '#d1fae5' }}>
                  <Wallet size={15} color="#059669" strokeWidth={2}/>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1c1c1e]">Week of {p.week_start}</p>
                  <p className="text-[11px] text-[#aeaeb2] truncate">{p.total_claims} claims · {p.upi_id}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[#059669] font-bold text-sm">₹{p.total_amount}</p>
                <StatusBadge status={p.status}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Latest alert */}
      {alerts.length > 0 && (
        <Link to="/alerts" className="block card-glass mb-4 active:scale-[0.99] transition-transform animate-fade-up">
          <div className="flex items-start gap-3">
            <DisruptionIcon type={alerts[0].type} size={16}/>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#3a3a3c] leading-snug">{alerts[0].message}</p>
              <p className="text-[11px] text-[#aeaeb2] mt-1">{new Date(alerts[0].created_at).toLocaleString('en-IN')}</p>
            </div>
            <ChevronRight size={15} color="#c7c7cc" strokeWidth={2}/>
          </div>
        </Link>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl p-3 border border-[#e5e5ea] animate-fade-up" style={{ background: '#f4f4f5' }}>
        <p className="text-[#aeaeb2] text-[11px] text-center leading-relaxed font-medium mb-1">Coverage Exclusions</p>
        <p className="text-[#aeaeb2] text-[11px] text-center leading-relaxed">
          KamaiShield covers <strong className="text-[#636366]">income loss from weather & civic disruptions only</strong>.<br/>
          Not covered: health, life, accident, vehicle damage, war, pandemic, terrorism, or acts of God outside defined triggers.
        </p>
      </div>
    </div>
  );
}
