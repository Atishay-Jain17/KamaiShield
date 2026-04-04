import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ChevronLeft } from 'lucide-react';

const CITIES = {
  'Mumbai':    [{ pincode:'400001',zone:'Fort/CST'},{pincode:'400070',zone:'Kurla'},{pincode:'400053',zone:'Andheri West'},{pincode:'400058',zone:'Borivali'}],
  'Delhi':     [{ pincode:'110001',zone:'Connaught Place'},{pincode:'110092',zone:'Shahdara'},{pincode:'110045',zone:'Dwarka'}],
  'Bengaluru': [{ pincode:'560001',zone:'MG Road'},{pincode:'560034',zone:'Koramangala'},{pincode:'560037',zone:'HSR Layout'}],
  'Chennai':   [{ pincode:'600001',zone:'Parrys'},{pincode:'600028',zone:'T. Nagar'}],
  'Hyderabad': [{ pincode:'500001',zone:'Charminar'},{pincode:'500032',zone:'Gachibowli'}],
};
const PLATFORMS = ['Swiggy','Zomato','Blinkit','Zepto','BigBasket','Amazon','Flipkart','Meesho','Dunzo','Other'];
const STEPS = ['Personal Details','Delivery Info','Earnings & UPI'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:'', phone:'', password:'', email:'',
    platform:'', city:'', pincode:'', zone:'',
    upi_id:'', avg_hourly_earnings:'100', hours_per_day:'8'
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const zones = CITIES[form.city] || [];

  const handleCity = (city) => { set('city', city); set('pincode',''); set('zone',''); };
  const handleZone = (pincode) => {
    const z = zones.find(z => z.pincode === pincode);
    set('pincode', pincode); set('zone', z?.zone || '');
  };

  const canNext1 = form.name.trim().length >= 2 && /^[0-9]{10}$/.test(form.phone) && form.password.length >= 6;
  const canNext2 = form.platform && form.city && form.pincode;

  const submit = async () => {
    setLoading(true);
    try {
      await register(form);
      toast.success('Welcome to KamaiShield! 🛡️');
      navigate('/policy');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🛡️</div>
        <h1 className="text-2xl font-black text-white">Create Account</h1>
        <p className="text-gray-400 text-sm mt-1">Protect your earnings in 2 minutes</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-2">
        {[1,2,3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'bg-cyan-500' : 'bg-[#1e3a5f]'}`}/>
        ))}
      </div>
      <p className="text-center text-xs text-gray-500 mb-5">Step {step} of 3 — {STEPS[step-1]}</p>

      <div className="card flex-1">
        {/* Step 1 */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Full Name *</label>
              <input className="input" placeholder="Raju Verma" value={form.name} onChange={e => set('name', e.target.value)}/>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Mobile Number *</label>
              <input className="input" type="tel" inputMode="numeric" placeholder="9876543210" maxLength={10}
                value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g,''))}/>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Password *</label>
              <input className="input" type="password" placeholder="Minimum 6 characters"
                value={form.password} onChange={e => set('password', e.target.value)}/>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Email <span className="text-gray-600">(optional)</span></label>
              <input className="input" type="email" inputMode="email" placeholder="you@email.com"
                value={form.email} onChange={e => set('email', e.target.value)}/>
            </div>
            <button className="btn-primary mt-2" disabled={!canNext1} onClick={() => setStep(2)}>
              Next: Delivery Info →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Your Platform *</label>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map(p => (
                  <button key={p} onClick={() => set('platform', p)}
                    className={`py-3 px-2 rounded-xl text-sm border transition-all ${
                      form.platform === p
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 font-semibold'
                        : 'border-[#1e3a5f] text-gray-400'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Your City *</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(CITIES).map(c => (
                  <button key={c} onClick={() => handleCity(c)}
                    className={`py-3 px-2 rounded-xl text-sm border transition-all ${
                      form.city === c
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 font-semibold'
                        : 'border-[#1e3a5f] text-gray-400'
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {form.city && (
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Your Delivery Zone *</label>
                <select className="input" value={form.pincode} onChange={e => handleZone(e.target.value)}>
                  <option value="">Select your zone</option>
                  {zones.map(z => <option key={z.pincode} value={z.pincode}>{z.zone} ({z.pincode})</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button className="btn-secondary flex-1" onClick={() => setStep(1)}>
                <ChevronLeft size={16} className="inline"/> Back
              </button>
              <button className="btn-primary flex-1" disabled={!canNext2} onClick={() => setStep(3)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
              <p className="text-cyan-400 font-semibold text-sm mb-1">Why do we need this?</p>
              <p className="text-gray-300 text-xs leading-relaxed">Your hourly earnings help us calculate exact payout amounts when disruptions occur. Stays completely private.</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Average Hourly Earnings (₹) *</label>
              <input className="input" type="number" inputMode="numeric" placeholder="100" min="50" max="500"
                value={form.avg_hourly_earnings} onChange={e => set('avg_hourly_earnings', e.target.value)}/>
              <p className="text-xs text-gray-500 mt-1">Typical: ₹80–₹200/hour including tips & incentives</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Hours Worked Per Day *</label>
              <input className="input" type="number" inputMode="numeric" placeholder="8" min="2" max="16"
                value={form.hours_per_day} onChange={e => set('hours_per_day', e.target.value)}/>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">UPI ID *</label>
              <input className="input" inputMode="email" placeholder="yourname@upi or 9876543210@paytm"
                value={form.upi_id} onChange={e => set('upi_id', e.target.value)}/>
              <p className="text-xs text-gray-500 mt-1">Sunday payouts sent here</p>
            </div>

            {/* Summary */}
            <div className="bg-[#0D1B2A] rounded-xl p-3 text-sm space-y-1 text-gray-400">
              <p className="text-white font-bold mb-1">Summary</p>
              <p>📍 {form.zone}, {form.city}</p>
              <p>🛵 {form.platform} rider</p>
              <p>💰 ₹{form.avg_hourly_earnings}/hr · {form.hours_per_day}hrs/day</p>
            </div>

            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setStep(2)}>
                <ChevronLeft size={16} className="inline"/> Back
              </button>
              <button className="btn-primary flex-1" disabled={loading || !form.upi_id} onClick={submit}>
                {loading ? 'Creating...' : '🛡️ Activate'}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-gray-500 text-sm mt-4">
        Already have an account? <Link to="/login" className="text-cyan-400 font-semibold">Log in</Link>
      </p>
    </div>
  );
}
