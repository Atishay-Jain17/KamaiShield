import { useState, useEffect } from 'react';
import api from '../api';
import { Loading } from '../components/UI';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ upi_id:'', avg_hourly_earnings:'', hours_per_day:'' });

  useEffect(() => {
    api.get('/auth/me').then(r => {
      setProfile(r.data);
      setForm({ upi_id: r.data.upi_id||'', avg_hourly_earnings: r.data.avg_hourly_earnings||'', hours_per_day: r.data.hours_per_day||'' });
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/rider/profile', form);
      toast.success('Profile updated! ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  const weeklyPreview = parseFloat(form.avg_hourly_earnings) * parseFloat(form.hours_per_day) * 6;

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <h1 className="text-xl font-black text-white mb-1">My Profile</h1>
      <p className="text-gray-400 text-sm mb-5">Update your UPI and earnings for accurate payouts</p>

      {/* Identity */}
      <div className="card mb-4">
        <h3 className="font-bold text-white mb-3 text-sm">Your Details</h3>
        <div className="space-y-2.5">
          {[
            { label:'Name', value: profile.name, icon:'👤' },
            { label:'Phone', value: profile.phone, icon:'📱' },
            { label:'Platform', value: profile.platform, icon:'🛵' },
            { label:'Zone', value: `${profile.zone}, ${profile.city}`, icon:'📍' },
          ].map(f => (
            <div key={f.label} className="flex items-center justify-between py-1">
              <span className="text-gray-400 text-sm flex items-center gap-2"><span>{f.icon}</span>{f.label}</span>
              <span className="text-white font-medium text-sm">{f.value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-[#1e3a5f]">Contact support to change identity details</p>
      </div>

      {/* Editable */}
      <div className="card mb-4">
        <h3 className="font-bold text-white mb-4 text-sm">Payout Settings</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">UPI ID for Payouts</label>
            <input className="input" inputMode="email" placeholder="yourname@upi"
              value={form.upi_id} onChange={e => setForm(p => ({...p, upi_id: e.target.value}))}/>
            <p className="text-xs text-gray-500 mt-1">Sunday payouts sent here. Keep this correct.</p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Average Hourly Earnings (₹)</label>
            <input className="input" type="number" inputMode="numeric" placeholder="100" min="10" max="10000"
              value={form.avg_hourly_earnings} onChange={e => setForm(p => ({...p, avg_hourly_earnings: e.target.value}))}/>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Hours Worked Per Day</label>
            <input className="input" type="number" inputMode="numeric" placeholder="8" min="1" max="24"
              value={form.hours_per_day} onChange={e => setForm(p => ({...p, hours_per_day: e.target.value}))}/>
          </div>

          {!isNaN(weeklyPreview) && weeklyPreview > 0 && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
              <p className="text-xs text-cyan-400 font-semibold mb-0.5">Estimated weekly earnings</p>
              <p className="text-2xl font-black text-white">₹{Math.round(weeklyPreview).toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400">₹{form.avg_hourly_earnings}/hr × {form.hours_per_day}hrs × 6 days</p>
            </div>
          )}

          <button className="btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="card mb-4 border-yellow-700/30">
        <h3 className="font-bold text-yellow-400 text-sm mb-2">🔒 Stay Safe</h3>
        <ul className="text-xs text-gray-400 space-y-1.5">
          <li>• Never share your password with anyone</li>
          <li>• KamaiShield will NEVER ask for your UPI PIN</li>
          <li>• Payouts only go to your registered UPI — never to a different number</li>
          <li>• Suspicious call claiming to be KamaiShield? Hang up and report</li>
        </ul>
      </div>

      {/* Logout */}
      <button onClick={logout} className="btn-danger w-full">
        Log Out
      </button>
    </div>
  );
}
