import { useState, useEffect } from 'react';
import api from '../api';
import { Loading, StatCard } from '../components/UI';
import { AlertTriangle, FileText, Wallet, MapPin, TrendingUp, TrendingDown, DollarSign, BarChart3, ChevronDown, ChevronUp, Activity, Percent, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ReferenceLine, Cell
} from 'recharts';

const RISK_COLORS = { HIGH:'#dc2626', MEDIUM:'#d97706', LOW:'#16a34a' };
const TT = { contentStyle: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', color:'#0f172a', fontSize:'12px' } };

function RiskCard({ zone }) {
  const { nextWeekForecast: f } = zone;
  const color = RISK_COLORS[f.riskLevel];
  const [showML, setShowML] = useState(false);
  const radarData = [
    { trigger:'Rain',  value: f.probabilities.heavyRain },
    { trigger:'AQI',   value: f.probabilities.severePollution },
    { trigger:'Heat',  value: f.probabilities.extremeHeat },
    { trigger:'Flood', value: f.probabilities.flood },
    { trigger:'Civic', value: f.probabilities.civic },
  ];

  // ML features from the zone object (populated by analyticsEngine via mlRiskModel)
  const mlFeatures = zone.mlFeatures || null;
  const linearScore = zone.linearScore;
  const sigmoidScore = zone.sigmoidScore;
  const confidence = zone.confidence;

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

      {/* ML Details toggle */}
      <button
        onClick={() => setShowML(v => !v)}
        className="mt-2 w-full flex items-center justify-between text-[10px] text-ink-400 hover:text-primary-600 transition-colors pt-2 border-t border-surface-100"
      >
        <span className="font-semibold">Show ML details</span>
        {showML ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
      </button>

      {showML && (
        <div className="mt-2 bg-surface-50 rounded-xl p-2.5 text-[10px] space-y-1.5">
          <p className="font-semibold text-ink-700 mb-1.5">ML Feature Weights</p>
          {mlFeatures ? (
            <>
              {[
                { label: 'Disruption Freq', key: 'disruptionFrequency', weight: '0.28' },
                { label: 'Claim Rate',      key: 'claimRate',           weight: '0.22' },
                { label: 'Flood Risk',      key: 'floodRisk',           weight: '0.15' },
                { label: 'Rain Risk',       key: 'rainRisk',            weight: '0.14' },
                { label: 'AQI Risk',        key: 'aqiRisk',             weight: '0.10' },
                { label: 'Heat Risk',       key: 'heatRisk',            weight: '0.07' },
                { label: 'Seasonal',        key: 'seasonalFactor',      weight: '0.04' },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-1.5">
                  <span className="text-ink-400 w-24 shrink-0">{f.label}</span>
                  <div className="flex-1 h-1 bg-surface-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${Math.round((mlFeatures[f.key] || 0) * 100)}%` }}
                    />
                  </div>
                  <span className="text-ink-600 w-8 text-right">{((mlFeatures[f.key] || 0) * 100).toFixed(0)}%</span>
                  <span className="text-ink-300 w-8 text-right">w={f.weight}</span>
                </div>
              ))}
              <div className="border-t border-surface-200 pt-1.5 mt-1 space-y-0.5">
                <div className="flex justify-between text-ink-500">
                  <span>Linear score</span>
                  <span className="font-mono font-semibold text-ink-800">{linearScore ?? zone.riskScore}</span>
                </div>
                <div className="flex justify-between text-ink-500">
                  <span>Sigmoid output</span>
                  <span className="font-mono font-semibold text-ink-800">{sigmoidScore ?? '—'}</span>
                </div>
                <div className="flex justify-between text-ink-500">
                  <span>Confidence</span>
                  <span className="font-semibold text-primary-600">{confidence ?? '—'}%</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-ink-400">ML feature data not available for this zone.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const [predictive, setPredictive] = useState([]);
  const [weekly, setWeekly]         = useState([]);
  const [fraud, setFraud]           = useState(null);
  const [unitEcon, setUnitEcon]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('predictive');

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics/predictive'),
      api.get('/admin/analytics/weekly'),
      api.get('/admin/analytics/fraud'),
      api.get('/admin/unit-economics'),
    ]).then(([p, w, f, u]) => {
      setPredictive(p.data);
      setWeekly(w.data);
      setFraud(f.data);
      setUnitEcon(u.data);
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
          { key:'predictive',   label:'Zone Forecast' },
          { key:'weekly',       label:'Weekly Trends' },
          { key:'fraud',        label:'Fraud Insights' },
          { key:'uniteconomics',label:'Unit Economics' },
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

      {/* Unit Economics */}
      {tab === 'uniteconomics' && unitEcon && (
        <div className="space-y-5">
          {/* CAC highlight */}
          <div className="card border-success-200 bg-success-50/40">
            <div className="flex items-center gap-3">
              <div className="icon-wrap w-10 h-10 bg-success-100">
                <TrendingDown size={18} className="text-success-600"/>
              </div>
              <div>
                <p className="text-success-700 font-bold text-lg">CAC = ₹0</p>
                <p className="text-ink-600 text-xs">Customer Acquisition Cost — organic word-of-mouth model. No paid ads, no agents, no commissions. This is the moat.</p>
              </div>
            </div>
          </div>

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="LTV"              value={`₹${unitEcon.ltv.toFixed(0)}`}          sub="Lifetime value / rider"       color="blue"   icon={DollarSign}/>
            <StatCard label="MRR"              value={`₹${Math.round(unitEcon.mrr).toLocaleString('en-IN')}`} sub="Monthly recurring revenue" color="green"  icon={TrendingUp}/>
            <StatCard label="ARR"              value={`₹${Math.round(unitEcon.arr).toLocaleString('en-IN')}`} sub="Projected annual revenue"  color="purple" icon={BarChart3}/>
            <StatCard label="Avg Premium"      value={`₹${unitEcon.avgPremium.toFixed(0)}`}   sub="Per policy per week"          color="yellow" icon={Wallet}/>
            <StatCard label="Loss Ratio"       value={`${unitEcon.lossRatio}%`}               sub={`Break-even: ${unitEcon.breakEvenLossRatio}%`} color={unitEcon.lossRatio < 70 ? 'green' : unitEcon.lossRatio < 85 ? 'yellow' : 'red'} icon={Percent}/>
            <StatCard label="Combined Ratio"   value={`${unitEcon.combinedRatio}%`}           sub={`Incl. ${unitEcon.expenseRatio}% expense ratio`} color={unitEcon.combinedRatio < 85 ? 'green' : 'yellow'} icon={Activity}/>
            <StatCard label="Reserve Adequacy" value={`${unitEcon.reserveAdequacy}×`}         sub="Current / est. next week"     color={unitEcon.reserveAdequacy >= 1.5 ? 'green' : 'red'} icon={ShieldCheck}/>
            <StatCard label="Retention Rate"   value={`${(unitEcon.retentionRate * 100).toFixed(0)}%`} sub="Riders with 2+ policies" color="blue" icon={RefreshCw}/>
          </div>

          {/* Loss Ratio vs Break-even chart */}
          <div className="card">
            <h3 className="text-sm font-semibold text-ink-800 mb-1">Loss Ratio vs Break-even</h3>
            <p className="text-ink-400 text-xs mb-4">Industry break-even is 85%. Below = profitable. Above = reserve strain.</p>
            {(() => {
              const chartData = [
                { name: 'Loss Ratio',     value: unitEcon.lossRatio,          color: unitEcon.lossRatio < 70 ? '#16a34a' : unitEcon.lossRatio < 85 ? '#d97706' : '#dc2626' },
                { name: 'Combined Ratio', value: unitEcon.combinedRatio,      color: unitEcon.combinedRatio < 85 ? '#2563eb' : '#d97706' },
                { name: 'Break-even',     value: unitEcon.breakEvenLossRatio, color: '#94a3b8' },
              ];
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fill:'#64748b', fontSize:11 }}/>
                    <YAxis domain={[0, 100]} stroke="#cbd5e1" tick={{ fill:'#64748b', fontSize:11 }} tickFormatter={v => `${v}%`}/>
                    <Tooltip {...TT} formatter={v => [`${v}%`]}/>
                    <ReferenceLine y={85} stroke="#dc2626" strokeDasharray="4 2" label={{ value:'Break-even 85%', fill:'#dc2626', fontSize:10, position:'insideTopRight' }}/>
                    <Bar dataKey="value" radius={[6,6,0,0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>

          {/* Financial summary table */}
          <div className="card">
            <h3 className="text-sm font-semibold text-ink-800 mb-4">Financial Summary</h3>
            <div className="space-y-0">
              {[
                { label: 'Total Premiums Collected', value: `₹${unitEcon.totalPremiumsCollected.toLocaleString('en-IN')}`, color: 'text-success-600' },
                { label: 'Total Payouts Made',       value: `₹${unitEcon.totalPayoutsMade.toLocaleString('en-IN')}`,       color: 'text-danger-600' },
                { label: 'Solvency Margin',          value: `₹${unitEcon.solvencyMargin.toLocaleString('en-IN')}`,         color: unitEcon.solvencyMargin >= 0 ? 'text-success-600' : 'text-danger-600' },
                { label: 'Claims Frequency',         value: `${unitEcon.claimsFrequency}%`,                                color: 'text-ink-800' },
                { label: 'Avg Claim Size',           value: `₹${unitEcon.avgClaimSize.toFixed(0)}`,                        color: 'text-ink-800' },
                { label: 'Avg Policy Weeks / Rider', value: unitEcon.avgPolicyWeeks,                                       color: 'text-ink-800' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-surface-100 last:border-0">
                  <span className="text-ink-500 text-xs">{row.label}</span>
                  <span className={`font-semibold text-sm ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
