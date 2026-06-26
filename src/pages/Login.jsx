import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import DNAHelix from '../components/3d/DNAHelix';
import FloatingParticles from '../components/3d/FloatingParticles';
import ThemeLangToggle from '../components/layout/ThemeLangToggle';

export default function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleKeyDown = (e, nextFieldId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById(nextFieldId)?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(userName, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || t('login.invalidError', 'Invalid username or password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* 3D Panel */}
      <div className="auth-3d-panel">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00e6d9" />
          <pointLight position={[-10, -5, 5]} intensity={0.5} color="#8b5cf6" />
          <DNAHelix />
          <FloatingParticles count={60} spread={12} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
          <Environment preset="night" />
        </Canvas>

        {/* Overlay text */}
        <div style={{
          position: 'absolute',
          bottom: '48px',
          left: '48px',
          right: '48px',
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.4rem',
              fontWeight: 800,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}
          >
            {t('login.chcTitle', 'Centralized Health Card')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '400px' }}
          >
            {t('login.chcDesc', 'Your complete medical history, securely accessible. One card, every record.')}
          </motion.p>
        </div>
      </div>

      {/* Form Panel */}
      <motion.div
        className="auth-form-panel"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{ position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
          <ThemeLangToggle />
        </div>

        <div className="auth-form-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 800, color: 'var(--bg-primary)'
            }}>+</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CHC Portal</span>
          </div>
          <h1>{t('login.welcome', 'Welcome Back')}</h1>
          <p>{t('login.signInMsg', 'Sign in to access your health records')}</p>
        </div>

        {error && (
          <motion.div
            className="alert alert-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ⚠️ {error}
          </motion.div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">{t('login.username', 'Email or Username')}</label>
            <input
              id="login-username"
              type="text"
              className="form-input"
              placeholder={t('login.usernamePlaceholder', 'Enter your email or username')}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'login-password')}
              required
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" htmlFor="login-password">{t('login.password', 'Password')}</label>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              className="form-input"
              style={{ paddingRight: '40px' }}
              placeholder={t('login.passwordPlaceholder', 'Enter your password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('login-btn')?.click(); } }}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', bottom: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>

          <button
            id="login-btn"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '16px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                {t('login.signingIn', 'Signing in...')}
              </span>
            ) : t('login.signInBtn', 'Sign In')}
          </button>
        </form>

        <div className="auth-form-footer">
          <p>{t('login.noAccount', 'Don\'t have an account?')} <Link to="/signup">{t('login.createAccount', 'Create Account')}</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
