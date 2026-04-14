import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import {
  Home, ShieldCheck, FileText, Bell, Wallet,
  LogOut, BarChart3, Users, Zap, TrendingUp, UserCircle,
  ChevronRight, CloudRain, Wind, Flame, Waves, Ban,
  CheckCircle2, Clock, AlertCircle, XCircle, Info
} from 'lucide-react';

/* ── Navbar ─────────────────────────────────────────────────────────────── */
export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (to) => location.pathname === to;

  const riderLinks = [
    { to: '/dashboard', icon: Home,       label: 'Home' },
    { to: '/policy',    icon: ShieldCheck, label: 'Policy' },
    { to: '/claims',    icon: FileText,    label: 'Claims' },
    { to: '/payouts',   icon: Wallet,      label: 'Payouts' },
    { to: '/alerts',    icon: Bell,        label: 'Alerts' },
    { to: '/profile',   icon: UserCircle,  label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin',             icon: BarChart3,  label: 'Dashboard' },
    { to: '/admin/analytics',   icon: TrendingUp, label: 'Analytics' },
    { to: '/admin/riders',      icon: Users,      label: 'Riders' },
    { to: '/admin/claims',      icon: FileText,   label: 'Claims' },
    { to: '/admin/disruptions', icon: Zap,        label: 'Live' },
  ];

  const links = user?.role === 'admin' ? adminLinks : riderLinks;

  return (
    <>
      {/* Top bar — frosted glass */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/60"
        style={{ background: 'rgba(242,242,247,0.85)' }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <Logo height={22}/>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-0.5">
                {links.map(l => {
                  const Icon = l.icon;
                  const active = isActive(l.to);
                  return (
                    <Link key={l.to} to={l.to}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                        active
                          ? 'bg-[#4f46e5]/10 text-[#4f46e5]'
                          : 'text-[#636366] hover:text-[#1c1c1e] hover:bg-black/5'
                      }`}>
                      <Icon size={15} strokeWidth={active ? 2.2 : 1.8}/>
                      {l.label}
                    </Link>
                  );
                })}
              </div>
              <div className="hidden md:flex items-center gap-2 pl-3 ml-1 border-l border-[#e5e5ea]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <button onClick={handleLogout}
                  className="p-1.5 text-[#8e8e93] hover:text-[#e11d48] hover:bg-[#ffe4e6] rounded-lg transition-all duration-200">
                  <LogOut size={15}/>
                </button>
              </div>
              <div className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login"    className="btn-secondary btn-sm">Sign In</Link>
              <Link to="/register" className="btn-primary  btn-sm">Get Started</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile bottom tab bar — frosted glass */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom"
          style={{ background: 'rgba(242,242,247,0.92)', backdropFilter: 'blur(20px)', borderTop: '0.5px solid rgba(0,0,0,0.12)' }}>
          <div className="flex items-center justify-around px-1 py-1">
            {links.map(l => {
              const Icon = l.icon;
              const active = isActive(l.to);
              return (
                <Link key={l.to} to={l.to}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[52px] transition-all duration-200 ${
                    active ? 'text-[#4f46e5]' : 'text-[#8e8e93]'
                  }`}>
                  <span className={`transition-all duration-200 ${active ? 'scale-110' : ''}`}>
                    <Icon size={20} strokeWidth={active ? 2.2 : 1.7}/>
                  </span>
                  <span className={`text-[10px] leading-none tracking-tight ${active ? 'font-semibold' : 'font-medium'}`}>{l.label}</span>
                </Link>
              );
            })}
            <button onClick={handleLogout}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[52px] text-[#8e8e93] active:text-[#e11d48] transition-all duration-200">
              <LogOut size={20} strokeWidth={1.7}/>
              <span className="text-[10px] font-medium leading-none">Logout</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
}

/* ── Status Badge ────────────────────────────────────────────────────────── */
export function StatusBadge({ status }) {
  const cfg = {
    approved:     { cls: 'badge-green',  icon: CheckCircle2 },
    paid:         { cls: 'badge-green',  icon: CheckCircle2 },
    active:       { cls: 'badge-green',  icon: CheckCircle2 },
    processed:    { cls: 'badge-green',  icon: CheckCircle2 },
    LOW:          { cls: 'badge-green',  icon: CheckCircle2 },
    under_review: { cls: 'badge-yellow', icon: Clock },
    pending:      { cls: 'badge-yellow', icon: Clock },
    MODERATE:     { cls: 'badge-yellow', icon: AlertCircle },
    MEDIUM:       { cls: 'badge-yellow', icon: AlertCircle },
    flagged:      { cls: 'badge-red',    icon: XCircle },
    rejected:     { cls: 'badge-red',    icon: XCircle },
    cancelled:    { cls: 'badge-red',    icon: XCircle },
    CRITICAL:     { cls: 'badge-red',    icon: AlertCircle },
    HIGH:         { cls: 'badge-red',    icon: AlertCircle },
    expired:      { cls: 'badge-gray',   icon: Clock },
  };
  const { cls, icon: Icon } = cfg[status] || { cls: 'badge-blue', icon: Info };
  return (
    <span className={cls}>
      <Icon size={10} strokeWidth={2.5}/>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

/* ── Disruption Icon (Lucide-based) ──────────────────────────────────────── */
export function DisruptionIcon({ type, size = 18 }) {
  const cfg = {
    HEAVY_RAIN:       { Icon: CloudRain, color: '#0ea5e9', bg: '#e0f2fe' },
    SEVERE_AQI:       { Icon: Wind,      color: '#8b5cf6', bg: '#ede9fe' },
    EXTREME_HEAT:     { Icon: Flame,     color: '#f59e0b', bg: '#fef3c7' },
    FLOOD_ALERT:      { Icon: Waves,     color: '#0284c7', bg: '#e0f2fe' },
    CIVIC_DISRUPTION: { Icon: Ban,       color: '#e11d48', bg: '#ffe4e6' },
  };
  const { Icon, color, bg } = cfg[type] || { Icon: Zap, color: '#6366f1', bg: '#e0e7ff' };
  return (
    <div className="icon-wrap" style={{ width: size + 12, height: size + 12, background: bg }}>
      <Icon size={size - 2} color={color} strokeWidth={1.8}/>
    </div>
  );
}

/* ── Loading ─────────────────────────────────────────────────────────────── */
export function Loading({ text = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-[#e0e7ff]"/>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4f46e5] animate-spin"/>
      </div>
      <p className="text-[#8e8e93] text-sm font-medium">{text}</p>
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, iconColor = '#8e8e93', title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4 animate-fade-up">
      <div className="w-14 h-14 bg-[#f4f4f5] rounded-3xl flex items-center justify-center mb-1">
        {typeof Icon === 'string'
          ? <span className="text-2xl">{Icon}</span>
          : <Icon size={24} color={iconColor} strokeWidth={1.5}/>
        }
      </div>
      <h3 className="text-sm font-semibold text-[#1c1c1e]">{title}</h3>
      {subtitle && <p className="text-[#8e8e93] text-xs max-w-xs leading-relaxed">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, color = 'primary', icon: Icon, iconBg }) {
  const colorMap = {
    primary: '#4f46e5', green: '#059669', yellow: '#d97706',
    red: '#e11d48', purple: '#7c3aed', teal: '#0d9488', sky: '#0284c7',
  };
  const bgMap = {
    primary: '#e0e7ff', green: '#d1fae5', yellow: '#fef3c7',
    red: '#ffe4e6', purple: '#ede9fe', teal: '#ccfbf1', sky: '#e0f2fe',
  };
  const c = colorMap[color] || colorMap.primary;
  const bg = iconBg || bgMap[color] || bgMap.primary;
  return (
    <div className="card-glass animate-fade-up">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[#8e8e93] font-medium">{label}</p>
        {Icon && (
          <div className="icon-wrap w-8 h-8" style={{ background: bg }}>
            <Icon size={15} color={c} strokeWidth={2}/>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: c }}>{value}</p>
      {sub && <p className="text-[#aeaeb2] text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Progress Bar ────────────────────────────────────────────────────────── */
export function ProgressBar({ value, max = 100, color = '#4f46e5', height = 5 }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: '#f4f4f5' }}>
      <div className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}/>
    </div>
  );
}

/* ── Section Label ───────────────────────────────────────────────────────── */
export function SectionLabel({ children }) {
  return <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2 px-1">{children}</p>;
}

/* ── Divider ─────────────────────────────────────────────────────────────── */
export function Divider() {
  return <div className="h-px bg-[#f2f2f7] my-1"/>;
}
