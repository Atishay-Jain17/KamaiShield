import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ChevronLeft, CheckCircle2, User, Smartphone, Lock, MapPin, IndianRupee, CreditCard } from 'lucide-react';
import Logo from '../components/Logo';

const CITIES = {
  'Mumbai':    [{ pincode:'400001',zone:'Fort/CST'},{pincode:'400070',zone:'Kurla'},{pincode:'400053',zone:'Andheri West'},{pincode:'400058',zone:'Borivali'}],
  'Delhi':     [{ pincode:'110001',zone:'Connaught Place'},{pincode:'110092',zone:'Shahdara'},{pincode:'110045',zone:'Dwarka'}],
  'Bengaluru': [{ pincode:'560001',zone:'MG Road'},{pincode:'560034',zone:'Koramangala'},{pincode:'560037',zone:'HSR Layout'}],
  'Chennai':   [{ pincode:'600001',zone:'Parrys'},{pincode:'600028',zone:'T. Nagar'}],
  'Hyderabad': [{ pincode:'500001',zone:'Charminar'},{pincode:'500032',zone:'Gachibowli'}],
};
const PLATFORMS = ['Swiggy','Zomato','Blinkit','Zepto','BigBasket','Amazon','Flipkart','Meesho','Dunzo','Other'];
const STEPS = ['Personal', 'Delivery', 'Earnings'];

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
  const handleZone = (pincode) => { const z = zones.find(z => z.pincode === pincode); set('pincode', pincode); set('zone', z?.zone || ''); };

  const canNext1 = form.name.trim().length >= 2 && /^[0-9]{10}$/.test(form.phone) && form.password.length >= 6;
  const canNext2 = form.platform && form.city && form.pincode;
  const dailyEarnings = parseFloat(form.avg_hourly_earnings || 0) * parseFloat(form.hours_per_day || 0);
  const earningsError = form.avg_hourly_earnings && form.hours_per_day && (dailyEarnings < 100 || dailyEarnings > 5000)
    ? 'Daily earnings must be ₹100–₹5,000'
    : null;

  const submit = async () => {
    setLoading(true);
    try {
      await register(form);
      toast.success('Welcome to KamaiShield!');
      navigate('/policy');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col px-4 py-8"
      style={{ background: 'linear-gradient(160deg,#f0f0ff 0%,#f2f2f7 60%,#f0fdf4 100%)' }}>
      <div className="w-full max-w-sm mx-auto animate-slide-up">

        {/* Brand */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo height={28}/>
          </div>
          <h1 className="text-[22px] font-bold text-[#1c1c1e] tracking-tight">Create Account</h1>
          <p className="text-[#8e8e93] text-sm mt-1">Protect your earnings in 2 minutes</p>
        </div>

        {/* Step progress */}
        <div className="mb-5">
          <div className="flex gap-1.5 mb-2">
            {[1,2,3].map(s => (
              <div key={s} className="flex-1 h-1 rounded-full transition-all duration-400"
                style={{ background: s <= step ? 'linear-gradient(90deg,#6366f1,#4f46e5)' : '#e5e5ea' }}/>
            ))}
          </div>
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[11px] text-[#8e8e93]">Step {step} of 3</p>
            <p className="text-[11px] font-semibold text-[#3a3a3c]">{STEPS[step-1]}</p>
          </div>
        </div>

        <div className="card-glass">

          {/* Step 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-scale-in">
              {[
                { key:'name',     label:'Full Name',      hint:'पूरा नाम',       icon:User,       type:'text',     placeholder:'Raju Verma' },
                { key:'phone',    label:'Mobile Number',  hint:'मोबाइल नंबर',    icon:Smartphone, type:'tel',      placeholder:'9876543210', maxLen:10 },
                { key:'password', label:'Password',       hint:'पासवर्ड',        icon:Lock,       type:'password', placeholder:'Min 6 characters' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-[#3a3a3c] mb-1.5 ml-1">
                    {f.label} <span className="text-[#aeaeb2] font-normal">{f.hint}</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#e0e7ff' }}>
                      <f.icon size={14} color="#4f46e5" strokeWidth={2}/>
                    </div>
                    <input className="input pl-12" type={f.type} inputMode={f.type === 'tel' ? 'numeric' : undefined}
                      placeholder={f.placeholder} maxLength={f.maxLen}
                      value={form[f.key]}
                      onChange={e => set(f.key, f.key === 'phone' ? e.target.value.replace(/\D/g,'') : e.target.value)}/>
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-[#3a3a3c] mb-1.5 ml-1">Email <span className="text-[#aeaeb2] font-normal">(optional)</span></label>
                <input className="input" type="email" inputMode="email" placeholder="you@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)}/>
              </div>
              <button className="btn-primary mt-1" disabled={!canNext1} onClick={() => setStep(2)}>Continue →</button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-scale-in">
              <div>
                <label className="block text-xs font-semibold text-[#3a3a3c] mb-2 ml-1">
                  Platform <span className="text-[#aeaeb2] font-normal">आपका प्लेटफ़ॉर्म</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => set('platform', p)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                        form.platform === p
                          ? 'border-[#4f46e5] text-[#4f46e5] font-semibold'
                          : 'border-[#e5e5ea] text-[#636366] bg-white hover:border-[#c7d2fe]'
                      }`}
                      style={form.platform === p ? { background: '#eef2ff' } : {}}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3a3a3c] mb-2 ml-1">
                  City <span className="text-[#aeaeb2] font-normal">आपका शहर</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(CITIES).map(c => (
                    <button key={c} onClick={() => handleCity(c)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                        form.city === c
                          ? 'border-[#4f46e5] text-[#4f46e5] font-semibold'
                          : 'border-[#e5e5ea] text-[#636366] bg-white hover:border-[#c7d2fe]'
                      }`}
                      style={form.city === c ? { background: '#eef2ff' } : {}}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {form.city && (
                <div>
                  <label className="block text-xs font-semibold text-[#3a3a3c] mb-1.5 ml-1">
                    Delivery Zone <span className="text-[#aeaeb2] font-normal">डिलीवरी ज़ोन</span>
                  </label>
                  <select className="input" value={form.pincode} onChange={e => handleZone(e.target.value)}>
                    <option value="">Select your zone</option>
                    {zones.map(z => <option key={z.pincode} value={z.pincode}>{z.zone} ({z.pincode})</option>)}
                  </select>
                  {form.pincode && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                      <CheckCircle2 size={11} strokeWidth={2.5}/> {form.zone} ({form.pincode})
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2 mt-1">
                <button className="btn-secondary flex-1" onClick={() => setStep(1)}>
                  <ChevronLeft size={14} className="inline"/> Back
                </button>
                <button className="btn-primary flex-1" disabled={!canNext2} onClick={() => setStep(3)}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-4 animate-scale-in">
              <div className="rounded-xl p-3 border border-[#c7d2fe]" style={{ background: '#eef2ff' }}>
                <p className="text-[#4f46e5] font-semibold text-xs mb-1">Why do we need this?</p>
                <p className="text-[#636366] text-xs leading-relaxed">Your hourly earnings help us calculate exact payout amounts. Stays completely private.</p>
              </div>
              {[
                { key:'avg_hourly_earnings', label:'Avg Hourly Earnings (₹)', hint:'औसत प्रति घंटा कमाई', icon:IndianRupee, placeholder:'100', note:'Typical: ₹80–₹200/hour' },
                { key:'hours_per_day',       label:'Hours Worked Per Day',    hint:'प्रतिदिन काम के घंटे', icon:MapPin,       placeholder:'8',   note:'Usually 6–12 hours' },
                { key:'upi_id',              label:'UPI ID',                  hint:'UPI आईडी',             icon:CreditCard,   placeholder:'yourname@upi', note:'Sunday payouts sent here' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-[#3a3a3c] mb-1.5 ml-1">
                    {f.label} <span className="text-[#aeaeb2] font-normal">{f.hint}</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#e0e7ff' }}>
                      <f.icon size={14} color="#4f46e5" strokeWidth={2}/>
                    </div>
                    <input className="input pl-12"
                      type={f.key === 'upi_id' ? 'text' : 'number'}
                      inputMode={f.key === 'upi_id' ? 'email' : 'numeric'}
                      placeholder={f.placeholder}
                      value={form[f.key]} onChange={e => set(f.key, e.target.value)}/>
                  </div>
                  {f.key === 'hours_per_day' && earningsError
                    ? <p className="text-[#e11d48] text-xs mt-1 ml-1">{earningsError}</p>
                    : <p className="text-[#aeaeb2] text-[11px] mt-1 ml-1">{f.note}</p>
                  }
                </div>
              ))}

              {/* Summary */}
              <div className="rounded-xl p-3 border border-[#e5e5ea]" style={{ background: '#f4f4f5' }}>
                <p className="text-xs font-bold text-[#1c1c1e] mb-2">Account Summary</p>
                {[
                  ['Zone', `${form.zone}, ${form.city}`],
                  ['Platform', form.platform],
                  ['Earnings', `₹${form.avg_hourly_earnings}/hr · ${form.hours_per_day}hrs/day`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-[#e5e5ea] last:border-0">
                    <span className="text-[11px] text-[#8e8e93]">{k}</span>
                    <span className="text-[11px] font-semibold text-[#1c1c1e]">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button className="btn-secondary flex-1" onClick={() => setStep(2)}>
                  <ChevronLeft size={14} className="inline"/> Back
                </button>
                <button className="btn-primary flex-1" disabled={loading || !form.upi_id || !!earningsError} onClick={submit}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      Creating…
                    </span>
                  ) : 'Activate Account'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[#8e8e93] text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-[#4f46e5] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
