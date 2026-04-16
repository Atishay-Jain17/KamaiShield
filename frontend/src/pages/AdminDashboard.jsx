import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Loading, StatCard, StatusBadge, DisruptionIcon } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { RefreshCw, Zap, TrendingUp, CreditCard, Users, ShieldCheck, FileText, Activity, Wallet, BarChart3, AlertTriangle } from 'lucide-react';

const DISRUPTION_TYPES = ['HEAVY_RAIN', 'SEVERE_AQI', 'EXTREME_HEAT', 'FLOOD_ALERT', 'CIVIC_DISRUPTION'];
const CITIES_ZONES = {
  'Mumbai':    [{ pincode:'400070',zone:'Kurla'},{pincode:'400053',zone:'Andheri West'}],
  'Delhi':     [{ pincode:'110092',zone:'Shahdara'},{pincode:'110001',zone:'Connaught Place'}],
  'Bengaluru': [{ pincode:'560034',zone:'Koramangala'}],
  'Chennai':   [{ pincode:'600028',zone:'T. Nagar'}],
  'Hyderabad': [{ pincode:'500032',zone:'Gachibowli'}],
};
const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#9333ea'];
const TT = { contentStyle: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', color:'#0f172a', fontSize:'12px' } };

function TriggerPanel() {
  const [form, setForm] = useState({ type:'HEAVY_RAIN', city:'Mumbai', pincode:'400070', zone:'Kurla' });
  const [firing, setFiring] = useState(false);

  const handleCityChange = (city) => {
    const zones = CITIES_ZONES[city];
    setForm(p => ({ ...p, city, pincode: zones[0].pincode, zone: zones[0].zone }));
  };

  const fire = async () => {
    setFiring(true);
    try {
      const { data } = await api.post('/admin/trigger-disruption', form);
      if (data.success) toast.success(`${form.type} triggered in ${form.zone}! ${data.claimsCreated} claims created.`);
      else toast.error(data.message);
    } catch { toast.error('Failed to trigger disruption'); }
    finally { setFiring(false); }
  };

  return (
    <div className="card border-warning-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-warning-100 rounded-lg flex items-center justify-center">
          <Zap size={14} className="text-warning-600"/>
        </div>
        <h3 className="text-sm font-semibold text-ink-800">Trigger Disruption (Demo)</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">Type</label>
          <select className="input text-xs" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            {DISRUPTION_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">City</label>
          <select className="input text-xs" value={form.city} onChange={e => handleCityChange(e.target.value)}>
            {Object.keys(CITIES_ZONES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">Zone</label>
          <select className="input text-xs" value={form.pincode}
            onChange={e => {
              const z = CITIES_ZONES[form.city].find(z => z.pincode === e.target.value);
              setForm(p => ({ ...p, pincode: e.target.value, zone: z?.zone || '' }));
            }}>
            {CITIES_ZONES[form.city]?.map(z => <option key={z.pincode} value={z.pincode}>{z.zone}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn-danger w-full text-xs" disabled={firing} onClick={fire}>
            {firing ? 'Firing…' : '🚨 Fire Disruption'}
          </button>
        </div>
      </div>
      <p className="text-xs text-ink-400">Auto-creates claims for all active policyholders in the zone and runs fraud detection.</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [zoneRisk, setZoneRisk] = useState([]);
  const [ringAlerts, setRingAlerts] = useState([]);
  const [liveConditions, setLiveConditions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/zone-risk'),
      api.get('/admin/ring-alerts'),
      api.get('/admin/live-conditions').catch(() => ({ data: [] })),
    ]).then(([s, z, r, lc]) => {
      setStats(s.data);
      setZoneRisk(z.data);
      setRingAlerts(r.data);
      setLiveConditions(lc.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const processPayouts = async () => {
    await api.post('/admin/process-payouts');
    toast.success('Weekly payouts processed!');
    load();
  };

  const clearStale = async () => {
    try {
      const { data } = await api.post('/admin/clear-stale');
      toast.success(data.message);
      load();
    } catch { toast.error('Failed to clear stale data'); }
  };

  if (loading) return <Loading text="Loading admin dashboard…" />;

  const { overview, lossRatio, recentDisruptions, fraudStats, cityStats, typeStats } = stats;

  const fraudPieData = fraudStats.map((f, i) => ({
    name: `T${f.fraud_tier} ${f.fraud_tier === 1 ? 'Auto' : f.fraud_tier === 2 ? 'Review' : 'Flag'}`,
    value: f.count,
    color: COLORS[i]
  }));

  return (
    <div className="page-wide">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Admin Dashboard</h1>
          <p className="text-ink-500 text-sm">KamaiShield Platform Analytics</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/analytics" className="btn-primary btn-sm flex items-center gap-1.5">
            <TrendingUp size={13}/> Analytics
          </Link>
          <button onClick={processPayouts} className="btn-secondary btn-sm flex items-center gap-1.5">
            <CreditCard size={13}/> Process Payouts
          </button>
          <button onClick={clearStale} className="btn-secondary btn-sm flex items-center gap-1.5 text-danger-600">
            <RefreshCw size={13}/> Clear Stale
          </button>
          <button onClick={load} className="btn-secondary btn-sm flex items-center gap-1.5">
            <RefreshCw size={13}/> Refresh
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Riders"       value={overview.totalRiders}       icon={Users}        color="blue"/>
        <StatCard label="Active Policies"    value={overview.activePolicies}    icon={ShieldCheck}  color="green"/>
        <StatCard label="Total Claims"       value={overview.totalClaims}       sub={`${overview.approvedClaims} approved`} icon={FileText} color="yellow"/>
        <StatCard label="Active Disruptions" value={overview.activeDisruptions} icon={Activity}     color={overview.activeDisruptions > 0 ? 'red' : 'blue'}/>
        <StatCard label="Total Premiums"     value={`₹${Math.round(overview.totalPremiums)}`}  icon={CreditCard} color="purple"/>
        <StatCard label="Total Payouts"      value={`₹${Math.round(overview.totalPayouts)}`}   icon={Wallet}     color="green"/>
        <StatCard label="Loss Ratio"         value={`${lossRatio}%`} sub={lossRatio < 70 ? 'Healthy' : lossRatio < 90 ? 'Acceptable' : 'High'} icon={BarChart3} color={lossRatio < 70 ? 'green' : lossRatio < 90 ? 'yellow' : 'red'}/>
        <StatCard label="Fraud Flags"        value={overview.flaggedClaims} sub={`${((overview.flaggedClaims/(overview.totalClaims||1))*100).toFixed(1)}% of claims`} icon={AlertTriangle} color="red"/>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card md:col-span-2">
          <h3 className="text-sm font-semibold text-ink-800 mb-3">Claims & Payouts by City</h3>
          {cityStats.length === 0
            ? <p className="text-ink-400 text-xs text-center py-10">No data yet — seed demo data first</p>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cityStats}>
                  <XAxis dataKey="city" stroke="#cbd5e1" tick={{ fill:'#64748b', fontSize:11 }}/>
                  <YAxis stroke="#cbd5e1" tick={{ fill:'#64748b', fontSize:11 }}/>
                  <Tooltip {...TT}/>
                  <Bar dataKey="claims"  fill="#2563eb" radius={[4,4,0,0]} name="Claims"/>
                  <Bar dataKey="payouts" fill="#16a34a" radius={[4,4,0,0]} name="Payouts (₹)"/>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-ink-800 mb-3">Fraud Tier Distribution</h3>
          {fraudPieData.length === 0
            ? <p className="text-ink-400 text-xs text-center py-10">No claims yet</p>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={fraudPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                    {fraudPieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip {...TT}/>
                  <Legend iconSize={10} wrapperStyle={{ fontSize:'11px', color:'#64748b' }}/>
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Trigger + Type stats */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <TriggerPanel/>
        <div className="card">
          <h3 className="text-sm font-semibold text-ink-800 mb-3">Disruption Type Stats</h3>
          {typeStats.length === 0
            ? <p className="text-ink-400 text-xs text-center py-10">No disruptions yet</p>
            : typeStats.map((t, i) => (
              <div key={t.type} className="flex items-center gap-3 py-2.5 border-b border-surface-100 last:border-0">
                <DisruptionIcon type={t.type}/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink-800">{t.type.replace(/_/g,' ')}</p>
                  <div className="h-1.5 bg-surface-100 rounded-full mt-1">
                    <div className="h-full rounded-full" style={{ width:`${(t.claims/(typeStats[0]?.claims||1))*100}%`, backgroundColor:COLORS[i%COLORS.length] }}/>
                  </div>
                </div>
                <div className="text-right text-xs shrink-0">
                  <p className="font-semibold text-ink-800">{t.claims}</p>
                  <p className="text-ink-400">₹{Math.round(t.payouts||0)}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Zone Risk Map */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-ink-800 mb-4">Zone Risk Map</h3>
        {zoneRisk.length === 0
          ? <p className="text-ink-400 text-xs text-center py-4">No zone data available</p>
          : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {zoneRisk.map(z => (
                <div key={z.pincode} className={`bg-surface-50 border rounded-xl p-3 ${
                  z.risk_score >= 1.15 ? 'border-danger-200' :
                  z.risk_score <= 0.9  ? 'border-success-200' : 'border-surface-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-ink-900 font-semibold text-xs truncate">{z.zone}</p>
                      <p className="text-ink-400 text-[10px]">{z.city}</p>
                    </div>
                    <span className={`badge text-[10px] shrink-0 ml-1 ${
                      z.risk_score >= 1.15 ? 'badge-red' :
                      z.risk_score <= 0.9  ? 'badge-green' : 'badge-yellow'
                    }`}>{z.risk_score}×</span>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between text-ink-500"><span>Policies</span><span className="font-semibold text-primary-600">{z.activePolicies}</span></div>
                    <div className="flex justify-between text-ink-500"><span>Claims</span><span className="font-semibold text-warning-600">{z.activeClaims}</span></div>
                    <div className="flex justify-between text-ink-500"><span>Loss Ratio</span>
                      <span className={`font-semibold ${parseFloat(z.lossRatio)>90?'text-danger-600':parseFloat(z.lossRatio)>70?'text-warning-600':'text-success-600'}`}>{z.lossRatio}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Actuarial Summary */}
      {(() => {
        const totalPremiums = overview.totalPremiums || 0;
        const totalPayouts  = overview.totalPayouts  || 0;
        const totalClaims   = overview.totalClaims   || 0;
        const totalPolicies = overview.activePolicies || 1;
        const lr            = parseFloat(lossRatio) || 0;

        // Estimated next week payout (rough: avg weekly from total)
        const estNextWeekPayout = totalPayouts > 0 ? totalPayouts / 8 : 0; // assume 8 weeks of data
        const reserveReq95      = estNextWeekPayout * 1.5;
        const solvencyMargin    = totalPremiums - totalPayouts;
        const claimsFreq        = totalPolicies > 0 ? ((totalClaims / totalPolicies) * 100).toFixed(1) : 0;
        const avgClaimSize      = totalClaims > 0 ? (totalPayouts / totalClaims).toFixed(0) : 0;

        const rows = [
          {
            label: 'Expected Loss Ratio Target',
            value: '70%',
            note: 'Industry benchmark for micro-insurance',
            status: 'info',
          },
          {
            label: 'Current Loss Ratio',
            value: `${lr}%`,
            note: lr < 70 ? 'Healthy — below target' : lr < 85 ? 'Acceptable — monitor closely' : 'High — review reserve',
            status: lr < 70 ? 'green' : lr < 85 ? 'yellow' : 'red',
          },
          {
            label: 'Reserve Requirement (95% confidence)',
            value: `₹${Math.round(reserveReq95).toLocaleString('en-IN')}`,
            note: 'Est. next week payout × 1.5',
            status: solvencyMargin >= reserveReq95 ? 'green' : 'red',
          },
          {
            label: 'Solvency Margin',
            value: `₹${Math.round(solvencyMargin).toLocaleString('en-IN')}`,
            note: solvencyMargin >= 0 ? 'Positive — solvent' : 'Negative — reserve deficit',
            status: solvencyMargin >= 0 ? 'green' : 'red',
          },
          {
            label: 'Claims Frequency',
            value: `${claimsFreq}%`,
            note: 'Total claims / total policies',
            status: parseFloat(claimsFreq) < 50 ? 'green' : parseFloat(claimsFreq) < 80 ? 'yellow' : 'red',
          },
          {
            label: 'Average Claim Size',
            value: `₹${avgClaimSize}`,
            note: 'Total payouts / total claims',
            status: 'info',
          },
        ];

        const statusColor = {
          green:  { row: 'hover:bg-success-50/30', dot: 'bg-success-500', text: 'text-success-700' },
          yellow: { row: 'hover:bg-warning-50/30', dot: 'bg-warning-500', text: 'text-warning-700' },
          red:    { row: 'hover:bg-danger-50/30',  dot: 'bg-danger-500',  text: 'text-danger-700'  },
          info:   { row: 'hover:bg-surface-50',    dot: 'bg-primary-400', text: 'text-primary-700' },
        };

        return (
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center">
                <BarChart3 size={14} className="text-primary-600"/>
              </div>
              <h3 className="text-sm font-semibold text-ink-800">Actuarial Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-ink-400 border-b border-surface-100">
                    <th className="text-left py-2 pr-4 font-medium">Metric</th>
                    <th className="text-left py-2 pr-4 font-medium">Value</th>
                    <th className="text-left py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const s = statusColor[row.status];
                    return (
                      <tr key={row.label} className={`border-b border-surface-50 last:border-0 transition-colors ${s.row}`}>
                        <td className="py-2.5 pr-4 text-ink-700 font-medium">{row.label}</td>
                        <td className="py-2.5 pr-4 font-bold text-ink-900">{row.value}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`}/>
                            <span className={`text-[10px] font-medium ${s.text}`}>{row.note}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Ring Detection Alerts */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink-800">Ring Detection Alerts</h3>
          {ringAlerts.length > 0 && <span className="badge-red">{ringAlerts.length} alert{ringAlerts.length !== 1 ? 's' : ''}</span>}
        </div>
        {ringAlerts.length === 0
          ? (
            <div className="text-center py-6">
              <p className="text-ink-500 text-sm">✓ No ring fraud detected</p>
              <p className="text-ink-400 text-xs mt-1">Coordinated fraud patterns will appear here</p>
            </div>
          )
          : (
            <div className="space-y-2">
              {ringAlerts.map(a => (
                <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                  a.severity === 'HIGH' ? 'bg-danger-50 border-danger-200' : 'bg-warning-50 border-warning-200'
                }`}>
                  <span className="text-lg shrink-0">{a.severity === 'HIGH' ? '🚨' : '⚠️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`badge text-[10px] ${a.flag_type === 'TEMPORAL_SPIKE' ? 'badge-red' : a.flag_type === 'BASELINE_DEVIATION' ? 'badge-red' : 'badge-yellow'}`}>
                        {a.flag_type.replace(/_/g,' ')}
                      </span>
                      <span className={`text-xs font-semibold ${a.severity === 'HIGH' ? 'text-danger-600' : 'text-warning-600'}`}>{a.severity}</span>
                    </div>
                    <p className="text-ink-700 text-xs leading-snug">{a.detail}</p>
                    <p className="text-ink-400 text-[10px] mt-1">{a.zone}, {a.city} · {a.claim_count} claims · {new Date(a.created_at).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Live Weather Conditions */}
      {liveConditions.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-ink-800 mb-4">🌤️ Live Conditions (Real-time)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {liveConditions.map(c => (
              <div key={c.city} className="bg-surface-50 border border-surface-200 rounded-xl p-3">
                <p className="text-ink-900 font-semibold text-xs mb-2">{c.city}</p>
                {c.error ? (
                  <p className="text-ink-400 text-[10px]">Data unavailable</p>
                ) : (
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between text-ink-500">
                      <span>🌧️ Rain</span>
                      <span className={`font-semibold ${c.weather?.rain >= 15 ? 'text-danger-600' : 'text-ink-800'}`}>{c.weather?.rain ?? '—'} mm/hr</span>
                    </div>
                    <div className="flex justify-between text-ink-500">
                      <span>🌡️ Feels</span>
                      <span className={`font-semibold ${c.weather?.temp >= 45 ? 'text-danger-600' : 'text-ink-800'}`}>{c.weather?.temp ?? '—'}°C</span>
                    </div>
                    <div className="flex justify-between text-ink-500">
                      <span>😷 AQI</span>
                      <span className={`font-semibold ${c.aqi?.aqi >= 400 ? 'text-danger-600' : c.aqi?.aqi >= 200 ? 'text-warning-600' : 'text-ink-800'}`}>{c.aqi?.aqi ?? '—'}</span>
                    </div>
                    <p className="text-ink-400 truncate">{c.weather?.condition}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-ink-400 text-[10px] mt-2">Sources: WeatherAPI.com · OpenAQ · Updated every 5 min</p>
        </div>
      )}

      {/* Recent Disruptions */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink-800">Recent Disruptions</h3>
          <Link to="/admin/disruptions" className="text-primary-600 text-xs font-semibold hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-400 border-b border-surface-100">
                <th className="text-left py-2 pr-4 font-medium">Type</th>
                <th className="text-left py-2 pr-4 font-medium">Location</th>
                <th className="text-left py-2 pr-4 font-medium">Severity</th>
                <th className="text-left py-2 pr-4 font-medium">Claims</th>
                <th className="text-left py-2 pr-4 font-medium">Payout</th>
                <th className="text-left py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDisruptions.slice(0, 8).map(d => (
                <tr key={d.id} className="border-b border-surface-50 last:border-0 hover:bg-surface-50">
                  <td className="py-2.5 pr-4"><span className="mr-1"><DisruptionIcon type={d.type}/></span><span className="text-ink-800 font-medium">{d.subtype}</span></td>
                  <td className="py-2.5 pr-4 text-ink-500">{d.zone}, {d.city}</td>
                  <td className="py-2.5 pr-4"><StatusBadge status={d.severity}/></td>
                  <td className="py-2.5 pr-4 text-primary-600 font-semibold">{d.claim_count || 0}</td>
                  <td className="py-2.5 pr-4 text-success-600 font-semibold">₹{Math.round(d.total_payout || 0)}</td>
                  <td className="py-2.5"><StatusBadge status={d.status}/></td>
                </tr>
              ))}
              {recentDisruptions.length === 0 && (
                <tr><td colSpan="6" className="text-center py-8 text-ink-400">No disruptions yet — use the trigger panel above</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
