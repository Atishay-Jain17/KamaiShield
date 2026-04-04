import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Loading, StatCard, StatusBadge, DisruptionIcon } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

const DISRUPTION_TYPES = ['HEAVY_RAIN', 'SEVERE_AQI', 'EXTREME_HEAT', 'FLOOD_ALERT', 'CIVIC_DISRUPTION'];
const CITIES_ZONES = {
  'Mumbai':    [{ pincode: '400070', zone: 'Kurla' }, { pincode: '400053', zone: 'Andheri West' }],
  'Delhi':     [{ pincode: '110092', zone: 'Shahdara' }, { pincode: '110001', zone: 'Connaught Place' }],
  'Bengaluru': [{ pincode: '560034', zone: 'Koramangala' }],
  'Chennai':   [{ pincode: '600028', zone: 'T. Nagar' }],
  'Hyderabad': [{ pincode: '500032', zone: 'Gachibowli' }],
};

const COLORS = ['#06b6d4', '#22c55e', '#eab308', '#ef4444', '#a855f7'];

function TriggerPanel() {
  const [form, setForm] = useState({ type: 'HEAVY_RAIN', city: 'Mumbai', pincode: '400070', zone: 'Kurla' });
  const [firing, setFiring] = useState(false);

  const handleCityChange = (city) => {
    const zones = CITIES_ZONES[city];
    setForm(p => ({ ...p, city, pincode: zones[0].pincode, zone: zones[0].zone }));
  };

  const fire = async () => {
    setFiring(true);
    try {
      const { data } = await api.post('/admin/trigger-disruption', form);
      if (data.success) {
        toast.success(`🚨 ${form.type} triggered in ${form.zone}! ${data.claimsCreated} claims created.`);
      } else {
        toast.error(data.message);
      }
    } catch { toast.error('Failed to trigger disruption'); }
    finally { setFiring(false); }
  };

  return (
    <div className="card border-orange-700/40">
      <h3 className="font-bold text-white mb-3">⚡ Trigger Disruption (Demo)</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Disruption Type</label>
          <select className="input text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            {DISRUPTION_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">City</label>
          <select className="input text-sm" value={form.city} onChange={e => handleCityChange(e.target.value)}>
            {Object.keys(CITIES_ZONES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Zone</label>
          <select className="input text-sm" value={form.pincode}
            onChange={e => {
              const z = CITIES_ZONES[form.city].find(z => z.pincode === e.target.value);
              setForm(p => ({ ...p, pincode: e.target.value, zone: z?.zone || '' }));
            }}>
            {CITIES_ZONES[form.city]?.map(z => <option key={z.pincode} value={z.pincode}>{z.zone}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn-danger w-full" disabled={firing} onClick={fire}>
            {firing ? 'Firing...' : '🚨 Fire Disruption'}
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500">This will auto-create claims for all active policyholders in the selected zone and run fraud detection on each.</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/admin/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const seedDemo = async () => {
    setSeeding(true);
    try {
      const { data } = await api.post('/admin/seed-demo');
      toast.success(data.message);
      load();
    } catch { toast.error('Seed failed'); }
    finally { setSeeding(false); }
  };

  const processPayouts = async () => {
    await api.post('/admin/process-payouts');
    toast.success('Weekly payouts processed!');
    load();
  };

  if (loading) return <Loading text="Loading admin dashboard..." />;

  const { overview, lossRatio, recentDisruptions, fraudStats, cityStats, typeStats } = stats;

  const fraudPieData = fraudStats.map((f, i) => ({
    name: `Tier ${f.fraud_tier} (${f.fraud_tier === 1 ? 'Auto-Approve' : f.fraud_tier === 2 ? 'Soft Review' : 'Hard Flag'})`,
    value: f.count,
    color: COLORS[i]
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">KamaiShield Platform Analytics</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/analytics" className="btn-primary text-sm py-2 px-4">🔮 Predictive Analytics</Link>
          <button onClick={seedDemo} disabled={seeding} className="btn-secondary text-sm py-2 px-4">
            {seeding ? 'Seeding...' : '🌱 Seed Demo Data'}
          </button>
          <button onClick={processPayouts} className="btn-secondary text-sm py-2 px-4">💰 Process Payouts</button>
          <button onClick={load} className="btn-secondary text-sm py-2 px-4">🔄 Refresh</button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Riders" value={overview.totalRiders} icon="👤" color="cyan"/>
        <StatCard label="Active Policies" value={overview.activePolicies} icon="🛡️" color="green"/>
        <StatCard label="Total Claims" value={overview.totalClaims} sub={`${overview.approvedClaims} approved · ${overview.flaggedClaims} flagged`} icon="📋" color="yellow"/>
        <StatCard label="Active Disruptions" value={overview.activeDisruptions} icon="⚡" color={overview.activeDisruptions > 0 ? 'red' : 'cyan'}/>
        <StatCard label="Total Premiums" value={`₹${Math.round(overview.totalPremiums)}`} icon="💳" color="purple"/>
        <StatCard label="Total Payouts" value={`₹${Math.round(overview.totalPayouts)}`} icon="💰" color="green"/>
        <StatCard label="Loss Ratio" value={`${lossRatio}%`} sub={lossRatio < 70 ? 'Healthy' : lossRatio < 90 ? 'Acceptable' : 'High'} icon="📊" color={lossRatio < 70 ? 'green' : lossRatio < 90 ? 'yellow' : 'red'}/>
        <StatCard label="Fraud Flags" value={overview.flaggedClaims} sub={`${((overview.flaggedClaims / (overview.totalClaims || 1)) * 100).toFixed(1)}% of claims`} icon="🚨" color="red"/>
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Claims by city */}
        <div className="card md:col-span-2">
          <h3 className="font-bold text-white mb-3">Claims & Payouts by City</h3>
          {cityStats.length === 0
            ? <p className="text-gray-500 text-sm text-center py-8">No data yet — seed demo data first</p>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cityStats}>
                  <XAxis dataKey="city" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }}/>
                  <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }}/>
                  <Tooltip contentStyle={{ background: '#112233', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#fff' }}/>
                  <Bar dataKey="claims" fill="#06b6d4" radius={[4,4,0,0]} name="Claims"/>
                  <Bar dataKey="payouts" fill="#22c55e" radius={[4,4,0,0]} name="Payouts (₹)"/>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Fraud tier breakdown */}
        <div className="card">
          <h3 className="font-bold text-white mb-3">Fraud Tier Distribution</h3>
          {fraudPieData.length === 0
            ? <p className="text-gray-500 text-sm text-center py-8">No claims yet</p>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={fraudPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                    {fraudPieData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#112233', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#fff' }}/>
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}/>
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Trigger Panel + Recent Disruptions */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <TriggerPanel/>

        <div className="card">
          <h3 className="font-bold text-white mb-3">Disruption Type Stats</h3>
          {typeStats.length === 0
            ? <p className="text-gray-500 text-sm text-center py-8">No disruptions yet</p>
            : typeStats.map((t, i) => (
              <div key={t.type} className="flex items-center gap-3 py-2 border-b border-[#1e3a5f] last:border-0">
                <DisruptionIcon type={t.type}/>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{t.type.replace('_', ' ')}</p>
                  <div className="h-1.5 bg-[#0D1B2A] rounded-full mt-1">
                    <div className="h-full rounded-full" style={{ width: `${(t.claims / (typeStats[0]?.claims || 1)) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}/>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-white font-bold">{t.claims} claims</p>
                  <p className="text-gray-400">₹{Math.round(t.payouts || 0)}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Recent Disruptions Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">Recent Disruptions</h3>
          <Link to="/admin/disruptions" className="text-cyan-400 text-xs hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-[#1e3a5f]">
                <th className="text-left py-2 pr-4">Type</th>
                <th className="text-left py-2 pr-4">Location</th>
                <th className="text-left py-2 pr-4">Severity</th>
                <th className="text-left py-2 pr-4">Claims</th>
                <th className="text-left py-2 pr-4">Payout</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDisruptions.slice(0, 8).map(d => (
                <tr key={d.id} className="border-b border-[#1e3a5f] last:border-0 hover:bg-white/2">
                  <td className="py-2 pr-4"><DisruptionIcon type={d.type}/> <span className="text-white">{d.subtype}</span></td>
                  <td className="py-2 pr-4 text-gray-400">{d.zone}, {d.city}</td>
                  <td className="py-2 pr-4"><StatusBadge status={d.severity}/></td>
                  <td className="py-2 pr-4 text-cyan-400 font-bold">{d.claim_count || 0}</td>
                  <td className="py-2 pr-4 text-green-400 font-bold">₹{Math.round(d.total_payout || 0)}</td>
                  <td className="py-2"><StatusBadge status={d.status}/></td>
                </tr>
              ))}
              {recentDisruptions.length === 0 && (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No disruptions yet — use the trigger panel above</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
