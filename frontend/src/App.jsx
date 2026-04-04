import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar, Loading } from './components/UI';
import { Toaster } from 'react-hot-toast';

import Landing      from './pages/Landing';
import Login        from './pages/Login';
import Register     from './pages/Register';
import Dashboard    from './pages/Dashboard';
import Policy       from './pages/Policy';
import Claims       from './pages/Claims';
import Profile      from './pages/Profile';
import { Payouts, Alerts } from './pages/PayoutsAlerts';
import AdminDashboard  from './pages/AdminDashboard';
import AdminAnalytics  from './pages/AdminAnalytics';
import { AdminRiders, AdminClaims, AdminDisruptions } from './pages/AdminPages';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#112233', color: '#fff', border: '1px solid #1e3a5f' },
        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}/>
      <Navbar/>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Landing/>}/>
        <Route path="/login"    element={<PublicOnlyRoute><Login/></PublicOnlyRoute>}/>
        <Route path="/register" element={<PublicOnlyRoute><Register/></PublicOnlyRoute>}/>

        {/* Rider */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
        <Route path="/policy"    element={<PrivateRoute><Policy/></PrivateRoute>}/>
        <Route path="/claims"    element={<PrivateRoute><Claims/></PrivateRoute>}/>
        <Route path="/payouts"   element={<PrivateRoute><Payouts/></PrivateRoute>}/>
        <Route path="/alerts"    element={<PrivateRoute><Alerts/></PrivateRoute>}/>
        <Route path="/profile"   element={<PrivateRoute><Profile/></PrivateRoute>}/>

        {/* Admin */}
        <Route path="/admin"                 element={<PrivateRoute adminOnly><AdminDashboard/></PrivateRoute>}/>
        <Route path="/admin/analytics"       element={<PrivateRoute adminOnly><AdminAnalytics/></PrivateRoute>}/>
        <Route path="/admin/riders"          element={<PrivateRoute adminOnly><AdminRiders/></PrivateRoute>}/>
        <Route path="/admin/claims"          element={<PrivateRoute adminOnly><AdminClaims/></PrivateRoute>}/>
        <Route path="/admin/disruptions"     element={<PrivateRoute adminOnly><AdminDisruptions/></PrivateRoute>}/>

        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </>
  );
}
