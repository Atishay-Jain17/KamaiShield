import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone:'', password:'' });
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.phone, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 🛡️`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🛡️</div>
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Log in to your KamaiShield account</p>
        </div>

        <div className="card">
          <form onSubmit={handle} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Mobile Number</label>
              <input className="input" type="tel" inputMode="numeric" placeholder="9876543210" maxLength={10}
                value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/,'') }))} required/>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
              <input className="input" type="password" placeholder="Your password"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required/>
            </div>
            <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In →'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#1e3a5f]">
            <p className="text-xs text-gray-500 text-center mb-3">Quick demo login</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label:'👤 Demo Rider', phone:'9111111111', pass:'demo123' },
                { label:'🔧 Admin',      phone:'0000000000', pass:'admin123' },
              ].map(d => (
                <button key={d.phone}
                  onClick={() => setForm({ phone: d.phone, password: d.pass })}
                  className="bg-[#0D1B2A] border border-[#1e3a5f] rounded-xl px-3 py-3 text-left hover:border-cyan-500/50 active:scale-95 transition-all">
                  <p className="text-gray-200 text-sm font-medium">{d.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{d.phone}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 text-center mt-2">Seed demo data from Admin first</p>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-5">
          New rider?{' '}
          <Link to="/register" className="text-cyan-400 font-semibold">Create account</Link>
        </p>
      </div>
    </div>
  );
}
