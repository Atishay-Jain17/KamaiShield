import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ks_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ks_token');
    if (token) {
      api.get('/auth/me').then(r => { setUser(r.data); localStorage.setItem('ks_user', JSON.stringify(r.data)); })
        .catch(() => { localStorage.clear(); setUser(null); })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (phone, password) => {
    const { data } = await api.post('/auth/login', { phone, password });
    localStorage.setItem('ks_token', data.token);
    localStorage.setItem('ks_user', JSON.stringify(data.rider));
    setUser(data.rider);
    return data.rider;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('ks_token', data.token);
    localStorage.setItem('ks_user', JSON.stringify(data.rider));
    setUser(data.rider);
    return data.rider;
  };

  const logout = () => {
    localStorage.removeItem('ks_token');
    localStorage.removeItem('ks_user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
