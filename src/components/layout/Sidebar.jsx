import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const patientNav = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: '📊' },
  { path: '/medical-history', labelKey: 'nav.medicalHistory', icon: '📋' },
  { path: '/medical-imaging', labelKey: 'nav.medicalImaging', icon: '📷' },
  { path: '/feedback', labelKey: 'nav.feedback', icon: '💬' },
  { path: '/profile', labelKey: 'nav.profile', icon: '👤' },
];

const doctorNav = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: '📊' },
  { path: '/create-record', labelKey: 'nav.createRecord', icon: '💊' },
  { path: '/medical-history', labelKey: 'nav.medicalHistory', icon: '🔍' },
  { path: '/feedback', labelKey: 'nav.feedback', icon: '💬' },
  { path: '/profile', labelKey: 'nav.profile', icon: '👤' },
];

const chemistNav = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: '📊' },
  { path: '/verify-prescription', labelKey: 'nav.verifyPrescription', icon: '✅' },
  { path: '/medical-history', labelKey: 'nav.medicalHistory', icon: '📋' },
  { path: '/feedback', labelKey: 'nav.feedback', icon: '💬' },
  { path: '/profile', labelKey: 'nav.profile', icon: '👤' },
];

const pathologistNav = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: '📊' },
  { path: '/upload-report', labelKey: 'nav.uploadReport', icon: '📤' },
  { path: '/medical-history', labelKey: 'nav.medicalHistory', icon: '📋' },
  { path: '/feedback', labelKey: 'nav.feedback', icon: '💬' },
  { path: '/profile', labelKey: 'nav.profile', icon: '👤' },
];

const adminNav = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: '📊' },
  { path: '/admin-panel', labelKey: 'nav.adminPanel', icon: '🛡️' },
  { path: '/medical-history', labelKey: 'nav.medicalHistory', icon: '📋' },
  { path: '/profile', labelKey: 'nav.profile', icon: '👤' },
];

const roleConfig = {
  Doctor:       { nav: doctorNav,       color: '#8b5cf6', badgeKey: 'roles.doctor', badgeIcon: '🩺', icon: '⚕️' },
  Chemist:      { nav: chemistNav,      color: '#f59e0b', badgeKey: 'roles.chemist', badgeIcon: '💊', icon: '🧪' },
  Pathologist:  { nav: pathologistNav,  color: '#ec4899', badgeKey: 'roles.pathologist', badgeIcon: '🔬', icon: '🔬' },
  Admin:        { nav: adminNav,        color: '#f43f5e', badgeKey: 'dashboard.monitoringPlatform', badgeIcon: '🛡️', icon: '🔒' },
  User:         { nav: patientNav,      color: '#00e6d9', badgeKey: 'roles.patient', badgeIcon: '🏥', icon: '💳' },
  Patient:      { nav: patientNav,      color: '#00e6d9', badgeKey: 'roles.patient', badgeIcon: '🏥', icon: '💳' },
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const roleName = user?.role?.replace('ROLE_', '') || 'User';
  const config = roleConfig[roleName] || roleConfig.User;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="sidebar-logo-icon">+</div>
          <div>
            <div className="sidebar-logo-text">CHC</div>
            <div className="sidebar-logo-sub">{t('sidebar.healthCardSystem')}</div>
          </div>
        </div>
        <button className="mobile-close-btn" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Role Badge */}
      <div style={{
        padding: '10px 16px', margin: '0 4px 20px', borderRadius: 'var(--radius-md)',
        background: `${config.color}12`, border: `1px solid ${config.color}30`,
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '0.85rem', fontWeight: 600, color: config.color
      }}>
        {config.badgeIcon} {t(config.badgeKey)}
      </div>

      {/* Health Card ID — NOT shown for Admin (Admin is a platform, not a user) */}
      {user?.healthCardNo && roleName !== 'Admin' && (
        <div style={{
          padding: '8px 16px', margin: '0 4px 20px', borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-tertiary)', fontSize: '0.72rem', color: 'var(--text-tertiary)',
          textAlign: 'center', letterSpacing: '0.03em'
        }}>
          <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '2px' }}>{t('sidebar.healthCard')}</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: config.color, fontSize: '0.82rem' }}>{user.healthCardNo}</span>
        </div>
      )}

      <nav className="sidebar-nav">
        {config.nav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={logout} title="Click to logout">
          <div className="sidebar-avatar" style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}88)` }}>
            {user?.userName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <h4>{user?.userName || 'User'}</h4>
            <span>{t(`roles.${roleName.toLowerCase()}`) || roleName} · {t('nav.logout')}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
