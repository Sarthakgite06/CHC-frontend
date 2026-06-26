import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('chc_token');
    const saved = localStorage.getItem('chc_user');
    if (token && saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const login = async (userName, password) => {
    const res = await API.post('/auth/login', { userName, password });
    const { token, role, healthCardNo, district } = res.data;
    const cleanRole = role?.replace('ROLE_', '');
    const userData = { userName, role: cleanRole, healthCardNo, district };
    localStorage.setItem('chc_token', token);
    localStorage.setItem('chc_user', JSON.stringify(userData));
    setUser(userData);
    navigate('/dashboard');
    return userData;
  };

  const signup = async (formData) => {
    const res = await API.post('/user/signUp', formData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('chc_token');
    localStorage.removeItem('chc_user');
    setUser(null);
    navigate('/login');
  };

  const isDoctor = () => user?.role === 'Doctor';
  const isChemist = () => user?.role === 'Chemist';
  const isAdmin = () => user?.role === 'Admin';
  const isPatient = () => user?.role === 'User' || user?.role === 'Patient';

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isDoctor, isChemist, isAdmin, isPatient }}>
      {children}
    </AuthContext.Provider>
  );
};
