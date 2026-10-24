import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('slotsync_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('slotsync_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
          localStorage.setItem('slotsync_user', JSON.stringify(res.data.data));
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, ...userData } = res.data.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('slotsync_token', newToken);
    localStorage.setItem('slotsync_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token: newToken, ...userData } = res.data.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('slotsync_token', newToken);
    localStorage.setItem('slotsync_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('slotsync_token');
    localStorage.removeItem('slotsync_user');
  };

  // 1-Click Demo Login Helper
  const quickLogin = async (role) => {
    let email = 'coordinator@slotsync.io';
    if (role === 'interviewer') email = 'alex.chen@slotsync.io';
    if (role === 'candidate') email = 'david.miller@candidate.io';

    return await login(email, 'Password123!');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, quickLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
