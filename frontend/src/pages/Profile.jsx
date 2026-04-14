import { useState, useEffect } from 'react';
import api from '../api';
import { Loading } from '../components/UI';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { LogOut, ShieldAlert, CreditCard, IndianRupee, Clock, Phone, MapPin, Bike } from 'lucide-react';

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
    try { await api.patch('/rider/profile', form); toast.success('Profile updated!'); }
    catch (err) { toast.error(err.response?.data?.error || 'Update failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  const weeklyPreview = parseFloat(form.avg_hourly_earnings) * parseFloat(form.hours_per_day) * 6;

  const identityFields = [
    { label:'Phone',    value:profile.phone,                    icon:Phone,  color:'#4f46e5', bg:'#e0e7ff' },
    { label:'Zone',     value:`${profile.zone}, ${profile.city}`, icon:MapPin, color:'#0284c7', bg:'#e0f2fe' },
    { label:'Platform', value:profile.platform,                 icon:Bike,   color:'#059669', bg:'#d1fae5' },
  ];

  return (
    <div className="page max-w-lg">
      <div className="mb-5 animate-fade-up">
        <h1 className="text-[22px] font-bold text-[#1c1c1e] tracking-tight">My Profile</h1>
        <p className="text-[#8e8e93] text-sm mt-0.5">Manage your account and payout settings</p>
      </div>

      {/* Avatar card */}
      <div className="card-glass mb-4 animate-fade-up">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
            {profile.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-[#1c1c1e] text-base">{profile.name}</p>
            <p className="text-[#8e8e93] text-sm">{profile.platform} · {profile.city}</p>
            <span className={`badge mt-1.5 ${profile.role === 'admin' ? 'badge-purple' : 'badge-green'}`}>
              {profile.role}
            </span>
          </div>
        </div>
        <div className="border-t border-[#f2f2f7] pt-3 space-y-0">
          {identityFields.map((f, i) => (
            <div key={f.label} className={`flex items-center justify-between py-2.5 ${i < identityFields.length - 1 ? 'border-b border-[#f2f2f7]' : ''}`}>
              <div className="flex items-center gap-2.5">
                <div className="icon-wrap w-7 h-7" style={{ background: f.bg }}>
                  <f.icon size={13} color={f.color} strokeWidth={2}/>
                </div>
                <span className="text-xs text-[#8e8e93]">{f.label}</span>
              </div>
              <span className="text-xs font-semibold text-[#1c1c1e]">{f.value}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#aeaeb2] mt-3 pt-3 border-t border-[#f2f2f7]">Contact support to change identity details</p>
      </div>

      {/* Payout settings */}
      <div className="card-glass mb-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <p className="text-sm font-bold text-[#1c1c1e] mb-4">Payout Settings</p>
        <div className="flex flex-col gap-4">
          {[
            { key:'upi_id',              label:'UPI ID for Payouts',        hint:'Sunday payouts sent here',  icon:CreditCard,   type:'text',   placeholder:'yourname@upi' },
            { key:'avg_hourly_earnings', label:'Average Hourly Earnings (₹)', hint:'Used to calculate payouts', icon:IndianRupee,  type:'number', placeholder:'100' },
            { key:'hours_per_day',       label:'Hours Worked Per Day',       hint:'Typical working hours',     icon:Clock,        type:'number', placeholder:'8' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-[#3a3a3c] mb-1.5 ml-1">{f.label}</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#e0e7ff' }}>
                  <f.icon size={14} color="#4f46e5" strokeWidth={2}/>
                </div>
                <input className="input pl-12" type={f.type} inputMode={f.type === 'number' ? 'numeric' : 'email'}
                  placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}/>
              </div>
              <p className="text-[11px] text-[#aeaeb2] mt-1 ml-1">{f.hint}</p>
            </div>
          ))}

          {!isNaN(weeklyPreview) && weeklyPreview > 0 && (
            <div className="rounded-xl p-3 border border-[#c7d2fe]" style={{ background: '#eef2ff' }}>
              <p className="text-[11px] text-[#4f46e5] font-semibold mb-0.5">Estimated weekly earnings</p>
              <p className="text-xl font-bold text-[#1c1c1e]">₹{Math.round(weeklyPreview).toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-[#8e8e93]">₹{form.avg_hourly_earnings}/hr × {form.hours_per_day}hrs × 6 days</p>
            </div>
          )}

          <button className="btn-primary" disabled={saving} onClick={save}>
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                Saving…
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl p-4 mb-4 border border-[#fde68a] animate-fade-up" style={{ background: '#fffbeb', animationDelay: '120ms' }}>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="icon-wrap w-7 h-7" style={{ background: '#fef3c7' }}>
            <ShieldAlert size={13} color="#d97706" strokeWidth={2}/>
          </div>
          <p className="text-xs font-bold text-[#92400e]">Stay Safe</p>
        </div>
        <ul className="text-xs text-[#636366] space-y-1.5">
          {[
            'Never share your password with anyone',
            'KamaiShield will NEVER ask for your UPI PIN',
            'Payouts only go to your registered UPI',
            'Suspicious call? Hang up and report',
          ].map(tip => (
            <li key={tip} className="flex items-start gap-1.5">
              <span className="text-[#d97706] mt-0.5">•</span> {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Logout */}
      <button onClick={logout} className="btn-danger w-full flex items-center justify-center gap-2 animate-fade-up" style={{ animationDelay: '180ms' }}>
        <LogOut size={16} strokeWidth={2}/> Log Out
      </button>
    </div>
  );
}
