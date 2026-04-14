import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Smartphone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handle = async e => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(form.phone)) { toast.error('Enter a valid 10-digit mobile number'); return; }
    setLoading(true);
    try {
      const user = await login(form.phone, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #f0f0ff 0%, #f2f2f7 50%, #f0fdf4 100%)' }}>
      <div className="w-full max-w-sm animate-slide-up">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Logo height={36}/>
          </div>
          <h1 className="text-[28px] font-bold text-[#1c1c1e] tracking-tight">Welcome back</h1>
          <p className="text-[#8e8e93] text-sm mt-1.5">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="card-glass">
          <form onSubmit={handle} className="flex flex-col gap-4">
            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[#3a3a3c] mb-1.5 ml-1">Mobile Number</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: '#e0e7ff' }}>
                  <Smartphone size={14} color="#4f46e5" strokeWidth={2}/>
                </div>
                <input className="input pl-12" type="tel" inputMode="numeric" placeholder="9876543210" maxLength={10}
                  value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/, '') }))} required/>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#3a3a3c] mb-1.5 ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: '#e0e7ff' }}>
                  <Lock size={14} color="#4f46e5" strokeWidth={2}/>
                </div>
                <input className="input pl-12 pr-12" type={showPw ? 'text' : 'password'} placeholder="Your password"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required/>
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-[#8e8e93] hover:text-[#3a3a3c] transition-colors"
                  style={{ background: '#f4f4f5' }}>
                  {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight size={15} strokeWidth={2.5}/></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#8e8e93] text-sm mt-6">
          New rider?{' '}
          <Link to="/register" className="text-[#4f46e5] font-semibold hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}
