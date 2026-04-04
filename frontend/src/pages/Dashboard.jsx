import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { StatCard, Loading, DisruptionIcon, StatusBadge, EmptyState } from '../components/UI';
import { AlertTriangle, ChevronRight } from 'lucide-react';

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
      setData({
        policy: policy.data,
        claims: claims.data.slice(0, 5),
        payouts: payouts.data,
        disruptions: disruptions.data,
        alerts: alerts.data,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading your dashboard..." />;

  const { policy, claims, payouts, disruptions, alerts } = data;
  const pendingPayout = payouts.pendingThisWeek;
  const recentPayouts = payouts.payouts || [];
  const totalEarned = recentPayouts.reduce((s, p) => s + p.total_amount, 0);
  const daysLeft = policy.active ? Math.ceil((new Date(policy.policy.end_date) - new Date()) / 86400000) : 0;
  const unreadAlerts = alerts.filter(a => !a.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-white">Namaskar, {user.name?.split(' ')[0]} 🙏</h1>
          <p className="text-gray-400 text-sm">{user.platform} · {user.zone}, {user.city}</p>
        </div>
        {unreadAlerts > 0 && (
          <Link to="/alerts" className="relative">
            <div className="w-9 h-9 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center">
              <span className="text-red-400 text-lg">🔔</span>
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadAlerts}
            </span>
          </Link>
        )}
      </div>

      {/* Active disruption banner */}
      {disruptions.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20}/>
            <div className="flex-1 min-w-0">
              <p className="text-red-400 font-bold text-sm">⚠️ Active Disruption in Your Zone</p>
              {disruptions.slice(0, 2).map(d => (
                <p key={d.id} className="text-gray-300 text-sm mt-1 truncate">
                  <DisruptionIcon type={d.type}/> {d.description}
                </p>
              ))}
              {policy.active
                ? <p className="text-green-400 text-xs mt-2 font-medium">✅ You're covered — added to Sunday payout</p>
                : <Link to="/policy" className="text-yellow-400 text-xs mt-2 font-medium block">⚠️ No policy — tap to get covered →</Link>
              }
            </div>
          </div>
        </div>
      )}

      {/* Coverage card */}
      {policy.active ? (
        <div className="card border-cyan-500/40 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center text-2xl shrink-0">🛡️</div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white capitalize">{policy.policy.plan} Shield — Active</p>
              <p className="text-gray-400 text-sm">₹{policy.policy.coverage_cap}/week · {Math.round(policy.policy.coverage_pct * 100)}% income protected</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-cyan-400 font-black text-xl">₹{policy.policy.premium}</p>
              <p className="text-gray-500 text-xs">/week</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
            <span className="text-xs text-gray-400">Ends {policy.policy.end_date}</span>
          </div>
          <div className="bg-[#0D1B2A] rounded-lg h-2">
            <div className="bg-cyan-500 h-2 rounded-lg transition-all" style={{ width: `${(daysLeft / 7) * 100}%` }}/>
          </div>
        </div>
      ) : (
        <Link to="/policy" className="block card border-yellow-700/50 mb-4 active:scale-[0.99] transition-transform">
          <div className="flex items-center gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <p className="font-bold text-white">No Active Policy</p>
              <p className="text-gray-400 text-sm">Get covered from ₹29/week</p>
            </div>
            <ChevronRight className="text-cyan-400" size={20}/>
          </div>
        </Link>
      )}

      {/* Stats row — 2x2 on mobile */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Pending Payout" value={`₹${pendingPayout?.total || 0}`} sub="This Sunday" color="green" icon="💰"/>
        <StatCard label="Claims This Week" value={pendingPayout?.count || 0} sub="Auto-verified" color="cyan" icon="📋"/>
        <StatCard label="Total Earned" value={`₹${Math.round(totalEarned)}`} sub="From KamaiShield" color="purple" icon="📈"/>
        <StatCard label="Zone Alerts" value={unreadAlerts} sub="New this week" color={unreadAlerts > 0 ? 'yellow' : 'cyan'} icon="🔔"/>
      </div>

      {/* Recent claims */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">Recent Claims</h3>
          <Link to="/claims" className="text-cyan-400 text-sm font-medium flex items-center gap-1">
            View all <ChevronRight size={14}/>
          </Link>
        </div>
        {claims.length === 0
          ? <EmptyState icon="📋" title="No claims yet" subtitle="Claims appear automatically when disruptions hit your zone" />
          : claims.map(c => (
            <div key={c.id} className="flex items-center justify-between py-3.5 border-b border-[#1e3a5f] last:border-0 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl shrink-0"><DisruptionIcon type={c.type}/></span>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{c.subtype}</p>
                  <p className="text-xs text-gray-500">{c.hours_affected}hrs · BTS: {c.bts_score}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-green-400 font-bold">₹{c.payout_amount}</p>
                <StatusBadge status={c.status}/>
              </div>
            </div>
          ))
        }
      </div>

      {/* Recent payouts */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">Recent Payouts</h3>
          <Link to="/payouts" className="text-cyan-400 text-sm font-medium flex items-center gap-1">
            View all <ChevronRight size={14}/>
          </Link>
        </div>
        {recentPayouts.length === 0
          ? <EmptyState icon="💸" title="No payouts yet" subtitle="First payout arrives this Sunday" />
          : recentPayouts.slice(0, 3).map(p => (
            <div key={p.id} className="flex justify-between items-center py-3.5 border-b border-[#1e3a5f] last:border-0 gap-2">
              <div className="min-w-0">
                <p className="text-sm text-white font-medium">Week of {p.week_start}</p>
                <p className="text-xs text-gray-500 truncate">{p.total_claims} claims · {p.upi_id}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-green-400 font-bold">₹{p.total_amount}</p>
                <StatusBadge status={p.status}/>
              </div>
            </div>
          ))
        }
      </div>

      {/* Latest alert */}
      {alerts.length > 0 && (
        <Link to="/alerts" className="block card border-[#1e3a5f] active:scale-[0.99] transition-transform">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0"><DisruptionIcon type={alerts[0].type}/></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 leading-snug">{alerts[0].message}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(alerts[0].created_at).toLocaleString('en-IN')}</p>
            </div>
            <ChevronRight className="text-gray-500 shrink-0 mt-0.5" size={16}/>
          </div>
        </Link>
      )}
    </div>
  );
}
