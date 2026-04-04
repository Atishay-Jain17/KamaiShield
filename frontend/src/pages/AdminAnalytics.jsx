import { useState, useEffect } from 'react';
import api from '../api';
import { Loading, StatCard } from '../components/UI';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts';

const RISK_COLORS = { HIGH: '#ef4444', MEDIUM: '#eab308', LOW: '#22c55e' };
const CHART_TOOLTIP = { contentStyle: { background: '#112233', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#fff' } };

function RiskCard({ zone }) {
  const { nextWeekForecast: f } = zone;
  const color = RISK_COLORS[f.riskLevel];
  const radarData = [
    { trigger: '🌧️ Rain',  value: f.probabilities.heavyRain },
    { trigger: '😷 AQI',   value: f.probabilities.severePollution },
    { trigger: '🔥 Heat',  value: f.probabilities.extremeHeat },
    { trigger: '🌊 Flood', value: f.probabilities.flood },
    { trigger: '🚫 Civic', value: f.probabilities.civic },
  ];

  return (
    <div className={`card border-2`} style={{ borderColor: color + '44' }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold text-white text-sm">{zone.zone}</h3>
          <p className="text-gray-400 text-xs">{zone.city} · {zone.pincode}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: color + '22', color }}>
            {f.riskLevel}
          </span>
          <p className="text-2xl font-black mt-1" style={{ color }}>{f.overallRiskPct}%</p>
          <p className="text-xs text-gray-500">overall risk</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <RadarChart data={radarData} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
          <PolarGrid stroke="#1e3a5f"/>
          <PolarAngleAxis dataKey="trigger" tick={{ fill: '#6b7280', fontSize: 9 }}/>
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false}/>
          <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.2}/>
        </RadarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-400">
        <div>Active policies: <strong className="text-white">{zone.activePolicies}</strong></div>
        <div>Est. claims: <strong className="text-white">{f.estimatedClaims}</strong></div>
        <div className="col-span-2">Est. payout: <strong className="text-yellow-400">₹{f.estimatedPayout.toLocaleString('en-IN')}</strong></div>
      </div>
      <p className="text-xs mt-2 pt-2 border-t border-[#1e3a5f]"
        style={{ color: f.riskLevel === 'HIGH' ? '#ef4444' : f.riskLevel === 'MEDIUM' ? '#eab308' : '#22c55e' }}>
        {f.recommendation}
      </p>
    </div>
  );
}

export default function AdminAnalytics() {
  const [predictive, setPredictive] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [fraud, setFraud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('predictive');

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

  if (loading) return <Loading text="Running predictive models..." />;

  const highRisk = predictive.filter(z => z.nextWeekForecast.riskLevel === 'HIGH');
  const totalEstPayout = predictive.reduce((s, z) => s + z.nextWeekForecast.estimatedPayout, 0);
  const totalEstClaims = predictive.reduce((s, z) => s + z.nextWeekForecast.estimatedClaims, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Predictive Analytics</h1>
        <p className="text-gray-400 text-sm">AI-powered forecast for next 7 days across all delivery zones</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="High Risk Zones" value={highRisk.length} sub="Next 7 days" color="red" icon="🚨"/>
        <StatCard label="Est. Claims Next Week" value={totalEstClaims} sub="Across all zones" color="yellow" icon="📋"/>
        <StatCard label="Est. Payout Next Week" value={`₹${(totalEstPayout / 1000).toFixed(1)}K`} sub="Reserve accordingly" color="cyan" icon="💰"/>
        <StatCard label="Zones Monitored" value={predictive.length} sub="Real-time" color="green" icon="📍"/>
      </div>

      {/* High risk alert banner */}
      {highRisk.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-2xl p-4 mb-6">
          <p className="text-red-400 font-bold text-sm mb-1">⚠️ High Risk Alert — Action Required</p>
          <p className="text-gray-300 text-sm">
            {highRisk.map(z => `${z.zone} (${z.city})`).join(', ')} — are at HIGH risk next week.
            Consider increasing reserve pool by ₹{highRisk.reduce((s, z) => s + z.nextWeekForecast.estimatedPayout, 0).toLocaleString('en-IN')} for these zones.
          </p>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6 border-b border-[#1e3a5f]">
        {[
          { key: 'predictive', label: '🔮 Zone Forecast' },
          { key: 'weekly', label: '📈 Weekly Trends' },
          { key: 'fraud', label: '🔒 Fraud Insights' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 ${tab === t.key ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Predictive Zone Cards */}
      {tab === 'predictive' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {predictive.map(z => <RiskCard key={z.pincode} zone={z}/>)}
        </div>
      )}

      {/* Weekly Trends */}
      {tab === 'weekly' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-white mb-4">Claims & Payouts — Last 8 Weeks</h3>
            {weekly.every(w => w.claims === 0)
              ? <p className="text-gray-500 text-center py-10">No historical data yet — seed demo data and trigger disruptions to see trends</p>
              : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weekly}>
                    <XAxis dataKey="week" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }}
                      tickFormatter={v => v.slice(5)}/>
                    <YAxis yAxisId="left" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }}/>
                    <YAxis yAxisId="right" orientation="right" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }}/>
                    <Tooltip {...CHART_TOOLTIP}/>
                    <Bar yAxisId="left" dataKey="claims" fill="#06b6d4" radius={[4,4,0,0]} name="Claims"/>
                    <Bar yAxisId="right" dataKey="payouts" fill="#22c55e" radius={[4,4,0,0]} name="Payouts (₹)"/>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>

          <div className="card">
            <h3 className="font-bold text-white mb-4">Average BTS Score — Weekly Fraud Health</h3>
            <p className="text-gray-400 text-xs mb-3">Higher BTS = more genuine claims. Below 55 indicates fraud risk. Target: above 70.</p>
            {weekly.every(w => w.avgBts === 0)
              ? <p className="text-gray-500 text-center py-10">No BTS data yet</p>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weekly}>
                    <XAxis dataKey="week" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => v.slice(5)}/>
                    <YAxis domain={[0, 100]} stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }}/>
                    <Tooltip {...CHART_TOOLTIP}/>
                    {/* Reference line at 55 */}
                    <Line type="monotone" dataKey="avgBts" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} name="Avg BTS"/>
                  </LineChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>
      )}

      {/* Fraud Insights */}
      {tab === 'fraud' && fraud && (
        <div className="space-y-6">
          {/* Fraud tier breakdown */}
          <div className="grid md:grid-cols-3 gap-4">
            {fraud.avgBTSByTier.map(t => (
              <div key={t.fraud_tier} className="card text-center">
                <p className={`text-3xl font-black ${t.fraud_tier === 1 ? 'text-green-400' : t.fraud_tier === 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {t.count}
                </p>
                <p className="text-white font-semibold text-sm">Tier {t.fraud_tier} — {t.fraud_tier === 1 ? 'Auto-Approved' : t.fraud_tier === 2 ? 'Soft Review' : 'Hard Flagged'}</p>
                <p className="text-gray-400 text-xs">Avg BTS: <strong className="text-white">{Math.round(t.avg_bts)}</strong></p>
                <p className="text-gray-400 text-xs">Risk amount: <strong className="text-red-400">₹{Math.round(t.potential_fraud_amount || 0)}</strong></p>
              </div>
            ))}
          </div>

          {/* Disruption claim pattern */}
          <div className="card">
            <h3 className="font-bold text-white mb-4">🔍 Claim Pattern Per Disruption (Ring Detection View)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs border-b border-[#1e3a5f]">
                    <th className="text-left py-2 pr-4">Disruption</th>
                    <th className="text-left py-2 pr-4">Location</th>
                    <th className="text-left py-2 pr-4">Claims</th>
                    <th className="text-left py-2 pr-4">Avg BTS</th>
                    <th className="text-left py-2 pr-4">Flagged</th>
                    <th className="text-left py-2">Ring Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {fraud.claimsPerDisruption.length === 0
                    ? <tr><td colSpan="6" className="text-center py-8 text-gray-500">No disruption data yet</td></tr>
                    : fraud.claimsPerDisruption.map(d => {
                      const ringRisk = d.flagged_count / Math.max(d.claim_count, 1);
                      return (
                        <tr key={d.id} className={`border-b border-[#1e3a5f] last:border-0 ${ringRisk > 0.3 ? 'bg-red-900/10' : ''}`}>
                          <td className="py-2 pr-4 text-white font-medium">{d.type?.replace('_', ' ')}</td>
                          <td className="py-2 pr-4 text-gray-400 text-xs">{d.zone}, {d.city}</td>
                          <td className="py-2 pr-4 text-cyan-400 font-bold">{d.claim_count}</td>
                          <td className="py-2 pr-4">
                            <span className={`font-bold ${d.avg_bts >= 55 ? 'text-green-400' : d.avg_bts >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {Math.round(d.avg_bts)}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-red-400 font-bold">{d.flagged_count}</td>
                          <td className="py-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ringRisk > 0.3 ? 'bg-red-900/40 text-red-400' : ringRisk > 0.1 ? 'bg-yellow-900/40 text-yellow-400' : 'bg-green-900/40 text-green-400'}`}>
                              {ringRisk > 0.3 ? '🚨 HIGH' : ringRisk > 0.1 ? '⚠️ MEDIUM' : '✅ LOW'}
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

          {/* Recent Tier 3 claims */}
          {fraud.tier3Claims.length > 0 && (
            <div className="card border-red-700/40">
              <h3 className="font-bold text-white mb-3">🚨 Recent Hard-Flagged Claims (Tier 3)</h3>
              <div className="space-y-2">
                {fraud.tier3Claims.slice(0, 8).map(c => (
                  <div key={c.id} className="flex justify-between items-center py-2 border-b border-[#1e3a5f] last:border-0 text-sm">
                    <div>
                      <p className="text-white font-medium">{c.rider_name} <span className="text-gray-400">({c.platform} · {c.city})</span></p>
                      <p className="text-gray-400 text-xs">{c.type?.replace('_', ' ')} · {c.zone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-bold">BTS: {c.bts_score}</p>
                      <p className="text-gray-400 text-xs">₹{c.payout_amount} held</p>
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
