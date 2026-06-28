import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

import ThemeLangToggle from './ThemeLangToggle';

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const roleName = user?.role?.replace('ROLE_', '') || 'User';

  const pageTitles = {
    '/dashboard': roleName === 'Doctor' ? '🩺 Doctor Dashboard' : roleName === 'Chemist' ? '💊 Chemist Dashboard' : roleName === 'Admin' ? '🛡️ Admin Dashboard' : roleName === 'Pathologist' ? '🔬 Pathologist Dashboard' : '📊 Dashboard',
    '/medical-history': roleName === 'Doctor' ? '🔍 Patient Records' : roleName === 'Chemist' ? '📋 Patient Records' : `📋 ${t('nav.medicalHistory')}`,
    '/create-record': `💊 ${t('nav.createRecord')}`,
    '/verify-prescription': `✅ ${t('nav.verifyPrescription')}`,
    '/admin-panel': `🛡️ ${t('nav.adminPanel')}`,
    '/feedback': `💬 ${t('nav.feedback')}`,
    '/profile': `👤 ${t('nav.profile')}`,
    '/upload-report': `🔬 ${t('nav.uploadReport')}`,
  };

  const title = pageTitles[location.pathname] || 'CHC';
  const roleColors = { Doctor: '#8b5cf6', Chemist: '#f59e0b', User: '#00e6d9', Patient: '#00e6d9', Admin: '#f43f5e', Pathologist: '#ec4899' };
  const color = roleColors[roleName] || '#00e6d9';



  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="mobile-menu-btn" onClick={onMenuClick} title="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h2 className="navbar-title">{title}</h2>
      </div>
      <div className="navbar-actions">
        {user?.healthCardNo && roleName !== 'Admin' && (
          <span className="health-card-badge" style={{
            padding: '5px 12px', borderRadius: 'var(--radius-full)',
            background: 'var(--bg-tertiary)', fontFamily: 'monospace',
            fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)'
          }}>
            {user.healthCardNo}
          </span>
        )}
        <span style={{
          padding: '6px 14px', borderRadius: 'var(--radius-full)',
          background: `${color}15`, color: color,
          fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em',
          display: 'flex', gap: '4px', alignItems: 'center'
        }}>
          {roleName === 'Admin' ? '🛡️' : (roleName === 'Doctor' ? '🩺' : roleName === 'Chemist' ? '💊' : '🏥')}
          <span className="badge-role-text">{roleName === 'Admin' ? 'Platform' : roleName}</span>
        </span>

        <ThemeLangToggle />
        <button className="navbar-btn" title={t('nav.logout')} onClick={logout}>🚪</button>
      </div>
    </header>
  );
}
