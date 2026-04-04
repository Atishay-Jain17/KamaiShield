import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Shield, FileText, Bell, CreditCard,
  LogOut, BarChart3, Users, Zap, TrendingUp, User
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (to) => location.pathname === to;

  const riderLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={20}/>, label: 'Home' },
    { to: '/policy',    icon: <Shield size={20}/>,          label: 'Policy' },
    { to: '/claims',    icon: <FileText size={20}/>,        label: 'Claims' },
    { to: '/payouts',   icon: <CreditCard size={20}/>,      label: 'Payouts' },
    { to: '/alerts',    icon: <Bell size={20}/>,            label: 'Alerts' },
    { to: '/profile',   icon: <User size={20}/>,            label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin',             icon: <BarChart3 size={20}/>,  label: 'Dashboard' },
    { to: '/admin/analytics',   icon: <TrendingUp size={20}/>, label: 'Analytics' },
    { to: '/admin/riders',      icon: <Users size={20}/>,      label: 'Riders' },
    { to: '/admin/claims',      icon: <FileText size={20}/>,   label: 'Claims' },
    { to: '/admin/disruptions', icon: <Zap size={20}/>,        label: 'Live' },
  ];

  const links = user?.role === 'admin' ? adminLinks : riderLinks;

  return (
    <>
      {/* Top bar */}
      <nav className="sticky top-0 z-50 bg-[#0a1628]/95 backdrop-blur border-b border-[#1e3a5f]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-black text-lg text-white">
              Kamai<span className="text-cyan-400">Shield</span>
            </span>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-tight">{user.name?.split(' ')[0]}</p>
                <p className="text-xs text-cyan-400 leading-tight">
                  {user.role === 'admin' ? '⚙️ Admin' : `${user.platform} · ${user.city}`}
                </p>
              </div>
              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-1">
                {links.map(l => (
                  <Link key={l.to} to={l.to}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(l.to)
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}>
                    {l.icon} {l.label}
                  </Link>
                ))}
                <button onClick={handleLogout}
                  className="ml-1 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                  <LogOut size={18}/>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login"    className="btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn-primary  btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile bottom nav — fixed at bottom */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a1628]/98 backdrop-blur border-t border-[#1e3a5f] safe-bottom">
          <div className="flex items-center justify-around px-1 py-2">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl min-w-[56px] transition-all ${
                  isActive(l.to)
                    ? 'text-cyan-400'
                    : 'text-gray-500 active:text-white'
                }`}>
                <span className={`transition-transform ${isActive(l.to) ? 'scale-110' : ''}`}>
                  {l.icon}
                </span>
                <span className="text-[10px] font-medium leading-none">{l.label}</span>
              </Link>
            ))}
            <button onClick={handleLogout}
              className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl min-w-[56px] text-gray-500 active:text-red-400 transition-all">
              <LogOut size={20}/>
              <span className="text-[10px] font-medium leading-none">Logout</span>
            </button>
          </div>
        </nav>
      )}

      {/* Spacer so content doesn't hide behind bottom nav on mobile */}
      {user && <div className="md:hidden h-20"/>}
    </>
  );
}

export function StatusBadge({ status }) {
  const map = {
    approved: 'badge-green', paid: 'badge-green', active: 'badge-green',
    processed: 'badge-green', LOW: 'badge-green',
    under_review: 'badge-yellow', pending: 'badge-yellow', MODERATE: 'badge-yellow', MEDIUM: 'badge-yellow',
    flagged: 'badge-red', rejected: 'badge-red', cancelled: 'badge-red',
    CRITICAL: 'badge-red', HIGH: 'badge-red',
  };
  return <span className={`${map[status] || 'badge-blue'} capitalize`}>{status?.replace(/_/g, ' ')}</span>;
}

export function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"/>
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-4">
      <div className="text-5xl">{icon}</div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {subtitle && <p className="text-gray-400 text-sm max-w-xs leading-relaxed">{subtitle}</p>}
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, color = 'cyan', icon }) {
  const colors = { cyan:'text-cyan-400', green:'text-green-400', yellow:'text-yellow-400', red:'text-red-400', purple:'text-purple-400' };
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <p className="text-gray-400 text-xs leading-tight">{label}</p>
        {icon && <span className="text-xl leading-none">{icon}</span>}
      </div>
      <p className={`text-2xl font-black mt-1 ${colors[color]}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export function DisruptionIcon({ type }) {
  const icons = { HEAVY_RAIN:'🌧️', SEVERE_AQI:'😷', EXTREME_HEAT:'🔥', FLOOD_ALERT:'🌊', CIVIC_DISRUPTION:'🚫' };
  return <span>{icons[type] || '⚡'}</span>;
}

export function ProgressBar({ value, max = 100, color = '#06b6d4', height = 6 }) {
  return (
    <div className="w-full bg-[#0D1B2A] rounded-full overflow-hidden" style={{ height }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }}/>
    </div>
  );
}

// Mobile-friendly list row (replaces tables on mobile)
export function ListRow({ left, right, sub, onClick, highlight }) {
  return (
    <div onClick={onClick}
      className={`flex items-center justify-between gap-3 py-3.5 px-1 border-b border-[#1e3a5f] last:border-0 ${onClick ? 'cursor-pointer active:bg-white/5' : ''} ${highlight ? 'bg-yellow-900/10' : ''}`}>
      <div className="flex-1 min-w-0">{left}</div>
      <div className="text-right shrink-0">{right}</div>
    </div>
  );
}
