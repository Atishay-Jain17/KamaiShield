import { useState, useEffect } from 'react';
import api from '../api';
import { Loading, StatCard } from '../components/UI';
import { AlertTriangle, FileText, Wallet, MapPin } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const RISK_COLORS = { HIGH:'#dc2626', MEDIUM:'#d97706', LOW:'#16a34a' };
const TT = { contentStyle: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', color:'#0f172a', fontSize:'12px' } };

function RiskCard({ zone }) {
  const { nextWeekForecast: f } = zone;
  const color = RISK_COLORS[f.riskLevel];
  const radarData = [
    { trigger:'Rain',  value: f.probabilities.heavyRain },
    { trigger:'AQI',   value: f.probabilities.severePollution },
    { trigger:'Heat',  value: f.probabilities.extremeHeat },
    { trigger:'Flood', value: f.probabilities.flood },
    { trigger:'Civic', value: f.probabilities.civic },
  ];

  return (
    <div className="card hover:shadow-card-md transition-shadow" style={{ borderColor: color + '44', borderWidth: '1.5px' }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-ink-900 text-sm">{zone.zone}</h3>
          <p className="text-ink-400 text-xs">{zone.city} · {zone.pincode}</p>
        </div>
        <div className="text-right">
          <span className="badge text-[10px]" style={{ background: color + '18', color, border: `1px solid ${color}44` }}>{f.riskLevel}</span>
          <p className="text-xl font-bold mt-1" style={{ color }}>{f.overallRiskPct}%</p>
          <p className="text-[10px] text-ink-400">overall risk</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={110}>
        <RadarChart data={radarData} margin={{ top:0, right:10, bottom:0, left:10 }}>
          <PolarGrid stroke="#e2e8f0"/>
          <PolarAngleAxis dataKey="trigger" tick={{ fill:'#94a3b8', fontSize:9 }}/>
          <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/>
          <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.15}/>
        </RadarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] text-ink-500">
        <div>Policies: <strong className="text-ink-800">{zone.activePolicies}</strong></div>
        <div>Est. claims: <strong className="text-ink-800">{f.estimatedClaims}</strong></div>
        <div className="col-span-2">Est. payout: <strong className="text-warning-600">₹{f.estimatedPayout.toLocaleString('en-IN')}</strong></div>
      </div>
      <p className="text-[10px] mt-2 pt-2 border-t border-surface-100 font-medium" style={{ color }}>
        {f.recommendation}
      </p>
    </div>
  );
}

export default function AdminAnalytics() {
  const [predictive, setPredictive] = useState([]);
  const [weekly, setWeekly]         = useState([]);
  const [fraud, setFraud]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('predictive');

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics/predictive'),
      api.get('/admin/analytics/weekly'),
      api.get('/admin/analytics/fraud'),
    ]).then(([p, w, f]) => {
      setPredictive(p.data);
      setWeekly(w.data);
      setFraud(f.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Running predictive models…" />;

  const highRisk = predictive.filter(z => z.nextWeekForecast.riskLevel === 'HIGH');
  const totalEstPayout = predictive.reduce((s, z) => s + z.nextWeekForecast.estimatedPayout, 0);
  const totalEstClaims = predictive.reduce((s, z) => s + z.nextWeekForecast.estimatedClaims, 0);

  return (
    <div className="page-wide">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-900">Predictive Analytics</h1>
        <p className="text-ink-500 text-sm">AI-powered forecast for next 7 days across all delivery zones</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="High Risk Zones"       value={highRisk.length}                         sub="Next 7 days"         color="red"    icon={AlertTriangle}/>
        <StatCard label="Est. Claims Next Week"  value={totalEstClaims}                          sub="Across all zones"    color="yellow" icon={FileText}/>
        <StatCard label="Est. Payout Next Week"  value={`₹${(totalEstPayout/1000).toFixed(1)}K`} sub="Reserve accordingly" color="blue"   icon={Wallet}/>
        <StatCard label="Zones Monitored"        value={predictive.length}                       sub="Real-time"           color="green"  icon={MapPin}/>
      </div>

      {/* High risk banner */}
      {highRisk.length > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 mb-6">
          <p className="text-danger-700 font-semibold text-sm mb-1">⚠️ High Risk Alert — Action Required</p>
          <p className="text-ink-700 text-sm">
            {highRisk.map(z => `${z.zone} (${z.city})`).join(', ')} — at HIGH risk next week.
            Consider increasing reserve by ₹{highRisk.reduce((s,z) => s + z.nextWeekForecast.estimatedPayout, 0).toLocaleString('en-IN')}.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-surface-200">
        {[
          { key:'predictive', label:'Zone Forecast' },
          { key:'weekly',     label:'Weekly Trends' },
          { key:'fraud',      label:'Fraud Insights' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Zone Forecast */}
      {tab === 'predictive' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {predictive.map(z => <RiskCard key={z.pincode} zone={z}/>)}
        </div>
      )}

      {/* Weekly Trends */}
      {tab === 'weekly' && (
        <div className="space-y-5">
          <div className="card">
            <h3 className="text-sm font-semibold text-ink-800 mb-4">Claims & Payouts — Last 8 Weeks</h3>
            {weekly.every(w => w.claims === 0)
              ? <p className="text-ink-400 text-xs text-center py-10">No historical data yet — seed demo data and trigger disruptions</p>
              : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={weekly}>
                    <XAxis dataKey="week" stroke="#cbd5e1" tick={{ fill:'#64748b', fontSize:11 }} tickFormatter={v => v.slice(5)}/>
                    <YAxis yAxisId="left"  stroke="#cbd5e1" tick={{ fill:'#64748b', fontSize:11 }}/>
                    <YAxis yAxisId="right" orientation="right" stroke="#cbd5e1" tick={{ fill:'#64748b', fontSize:11 }}/>
                    <Tooltip {...TT}/>
                    <Bar yAxisId="left"  dataKey="claims"  fill="#2563eb" radius={[4,4,0,0]} name="Claims"/>
                    <Bar yAxisId="right" dataKey="payouts" fill="#16a34a" radius={[4,4,0,0]} name="Payouts (₹)"/>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-ink-800 mb-1">Average BTS Score — Weekly Fraud Health</h3>
            <p className="text-ink-400 text-xs mb-4">Higher BTS = more genuine claims. Target: above 70.</p>
            {weekly.every(w => w.avgBts === 0)
              ? <p className="text-ink-400 text-xs text-center py-10">No BTS data yet</p>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weekly}>
                    <XAxis dataKey="week" stroke="#cbd5e1" tick={{ fill:'#64748b', fontSize:11 }} tickFormatter={v => v.slice(5)}/>
                    <YAxis domain={[0,100]} stroke="#cbd5e1" tick={{ fill:'#64748b', fontSize:11 }}/>
                    <Tooltip {...TT}/>
                    <Line type="monotone" dataKey="avgBts" stroke="#2563eb" strokeWidth={2} dot={{ fill:'#2563eb', r:3 }} name="Avg BTS"/>
                  </LineChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>
      )}

      {/* Fraud Insights */}
      {tab === 'fraud' && fraud && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-3 gap-4">
            {fraud.avgBTSByTier.map(t => (
              <div key={t.fraud_tier} className="card text-center">
                <p className={`text-3xl font-bold ${t.fraud_tier===1?'text-success-600':t.fraud_tier===2?'text-warning-600':'text-danger-600'}`}>{t.count}</p>
                <p className="text-ink-800 font-semibold text-sm mt-1">Tier {t.fraud_tier} — {t.fraud_tier===1?'Auto-Approved':t.fraud_tier===2?'Soft Review':'Hard Flagged'}</p>
                <p className="text-ink-500 text-xs mt-1">Avg BTS: <strong className="text-ink-800">{Math.round(t.avg_bts)}</strong></p>
                <p className="text-ink-500 text-xs">Risk: <strong className="text-danger-600">₹{Math.round(t.potential_fraud_amount||0)}</strong></p>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-ink-800 mb-4">Claim Pattern Per Disruption</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-ink-400 border-b border-surface-100">
                    {['Disruption','Location','Claims','Avg BTS','Flagged','Ring Flags','Ring Risk'].map(h => (
                      <th key={h} className="text-left py-2 pr-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fraud.claimsPerDisruption.length === 0
                    ? <tr><td colSpan="7" className="text-center py-8 text-ink-400">No disruption data yet</td></tr>
                    : fraud.claimsPerDisruption.map(d => {
                      const ringRisk = d.flagged_count / Math.max(d.claim_count, 1);
                      return (
                        <tr key={d.id} className={`border-b border-surface-50 last:border-0 ${ringRisk > 0.3 ? 'bg-danger-50' : ''}`}>
                          <td className="py-2.5 pr-4 font-medium text-ink-800">{d.type?.replace(/_/g,' ')}</td>
                          <td className="py-2.5 pr-4 text-ink-500">{d.zone}, {d.city}</td>
                          <td className="py-2.5 pr-4 text-primary-600 font-semibold">{d.claim_count}</td>
                          <td className="py-2.5 pr-4">
                            <span className={`font-semibold ${d.avg_bts>=55?'text-success-600':d.avg_bts>=30?'text-warning-600':'text-danger-600'}`}>{Math.round(d.avg_bts)}</span>
                          </td>
                          <td className="py-2.5 pr-4 text-danger-600 font-semibold">{d.flagged_count}</td>
                          <td className="py-2.5 pr-4">
                            {d.ring_flag_count > 0
                              ? <span className="badge-red text-[10px]">🔗 {d.ring_flag_count}</span>
                              : <span className="text-ink-300">—</span>
                            }
                          </td>
                          <td className="py-2.5">
                            <span className={`badge text-[10px] ${ringRisk>0.3?'badge-red':ringRisk>0.1?'badge-yellow':'badge-green'}`}>
                              {ringRisk>0.3?'HIGH':ringRisk>0.1?'MEDIUM':'LOW'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>

          {fraud.tier3Claims.length > 0 && (
            <div className="card border-danger-200">
              <h3 className="text-sm font-semibold text-ink-800 mb-3">Recent Hard-Flagged Claims (Tier 3)</h3>
              <div className="space-y-0">
                {fraud.tier3Claims.slice(0, 8).map(c => (
                  <div key={c.id} className="flex justify-between items-center py-2.5 border-b border-surface-100 last:border-0">
                    <div>
                      <p className="text-ink-800 font-medium text-xs">{c.rider_name} <span className="text-ink-400">({c.platform} · {c.city})</span></p>
                      <p className="text-ink-400 text-[10px]">{c.type?.replace(/_/g,' ')} · {c.zone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-danger-600 font-semibold text-xs">BTS: {c.bts_score}</p>
                      <p className="text-ink-400 text-[10px]">₹{c.payout_amount} held</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
