import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import HealthCard3D from '../components/3d/HealthCard3D';
import FloatingParticles from '../components/3d/FloatingParticles';


export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const roleName = user?.role?.replace('ROLE_', '') || 'User';
  
  const roleConfigs = {
    Doctor: {
      greeting: 'Dr.',
      subtitle: 'Manage patients, create prescriptions, and track medical records across the CHC network.',
      color: '#8b5cf6',
      stats: [
        { icon: '📝', label: 'Prescriptions', value: 'Write New', color: '#8b5cf6' },
        { icon: '🔍', label: 'Patient Records', value: 'Search', color: '#00e6d9' },
        { icon: '📊', label: 'Your Profile', value: 'Verified', color: '#10b981' },
        { icon: '💬', label: 'Feedback', value: 'Send', color: '#f59e0b' },
      ],
      actions: [
        { icon: '💊', label: t('nav.createRecord'), desc: 'Create a medical record for a patient', link: '/create-record' },
        { icon: '🔍', label: t('nav.medicalHistory'), desc: 'Search and view any patient history', link: '/medical-history' },
        { icon: '💬', label: t('nav.feedback'), desc: 'Report issues or suggest improvements', link: '/feedback' },
      ],
      actionTitle: t('dashboard.doctorActions') || 'Doctor Actions'
    },
    Chemist: {
      greeting: '',
      subtitle: 'Verify prescriptions, check patient medication records, and ensure safe dispensing across CHC.',
      color: '#f59e0b',
      stats: [
        { icon: '✅', label: 'Verify Rx', value: 'Check Now', color: '#f59e0b' },
        { icon: '📋', label: 'Patient Records', value: 'View', color: '#00e6d9' },
        { icon: '📊', label: 'Your Profile', value: 'Verified', color: '#10b981' },
        { icon: '💬', label: 'Feedback', value: 'Send', color: '#8b5cf6' },
      ],
      actions: [
        { icon: '✅', label: t('nav.verifyPrescription'), desc: 'Check patient Rx before dispensing', link: '/verify-prescription' },
        { icon: '📋', label: t('nav.medicalHistory'), desc: 'Look up patient medical history', link: '/medical-history' },
        { icon: '💬', label: t('nav.feedback'), desc: 'Report issues to admin', link: '/feedback' },
      ],
      actionTitle: t('dashboard.chemistActions') || 'Chemist Actions'
    },
    Admin: {
      greeting: '',
      subtitle: 'Monitor the entire CHC network — users, registrations, verifications, and system health at a glance.',
      color: '#f43f5e',
      stats: [
        { icon: '👥', label: 'User Management', value: 'Monitor', color: '#f43f5e' },
        { icon: '📊', label: 'Analytics', value: 'View Charts', color: '#8b5cf6' },
        { icon: '✅', label: 'Verifications', value: 'Review', color: '#10b981' },
        { icon: '💬', label: 'Feedback', value: 'Manage', color: '#f59e0b' },
      ],
      actions: [
        { icon: '👥', label: t('nav.adminPanel'), desc: 'Full system monitoring dashboard', link: '/admin-panel' },
        { icon: '📋', label: t('nav.medicalHistory'), desc: 'View aggregate data', link: '/medical-history' },
      ],
      actionTitle: t('dashboard.adminActions') || 'Admin Actions'
    },
    Pathologist: {
      greeting: '',
      subtitle: 'Upload lab test results, manage pathology reports, and contribute to patient diagnostics across the CHC network.',
      color: '#ec4899',
      stats: [
        { icon: '📤', label: 'Upload Report', value: 'New', color: '#ec4899' },
        { icon: '📋', label: 'Patient Records', value: 'View', color: '#00e6d9' },
        { icon: '📊', label: 'Your Profile', value: 'Verified', color: '#10b981' },
        { icon: '💬', label: 'Feedback', value: 'Send', color: '#f59e0b' },
      ],
      actions: [
        { icon: '📤', label: t('nav.uploadReport'), desc: 'Upload pathology test results for a patient', link: '/upload-report' },
        { icon: '📋', label: t('nav.medicalHistory'), desc: 'Search and view patient medical history', link: '/medical-history' },
        { icon: '💬', label: t('nav.feedback'), desc: 'Report issues or suggest improvements', link: '/feedback' },
      ],
      actionTitle: t('dashboard.pathologistActions') || 'Pathologist Actions'
    },
    User: {
      greeting: '',
      subtitle: 'Your health data is secure and accessible. View your complete medical history and manage your digital health card.',
      color: '#00e6d9',
      stats: [
        { icon: '💳', label: 'Health Card', value: 'Active', color: '#00e6d9' },
        { icon: '📋', label: 'Medical Records', value: 'View', color: '#8b5cf6' },
        { icon: '👤', label: 'Profile', value: 'Complete', color: '#10b981' },
        { icon: '💬', label: 'Feedback', value: 'Send', color: '#f59e0b' },
      ],
      actions: [
        { icon: '📋', label: t('nav.medicalHistory'), desc: 'Access your complete health records', link: '/medical-history' },
        { icon: '📷', label: 'Medical Imaging', desc: 'View, preview, and download medical imaging files', link: '/medical-imaging' },
        { icon: '👤', label: 'Complete Profile (Health Test)', desc: 'Attempt basic healthcare test to update profile status', link: '/health-test' },
        { icon: '💬', label: t('nav.feedback'), desc: 'Share your experience with CHC', link: '/feedback' },
      ],
      actionTitle: t('dashboard.quickActions') || 'Quick Actions'
    }
  };
  
  // Patient is same as User
  roleConfigs.Patient = roleConfigs.User;

  const config = roleConfigs[roleName] || roleConfigs.User;
  const healthCardId = user?.healthCardNo || 'N/A';

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  return (
    <>
      {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="grid-layout-2"
            style={{
              background: 'var(--gradient-card)', borderRadius: 'var(--radius-xl)',
              border: `1px solid ${config.color}25`, minHeight: '320px', overflow: 'hidden', marginBottom: '32px'
            }}
          >
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ color: config.color, fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                {t('dashboard.welcomeBack')}
              </motion.p>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2 }}>
                {config.greeting} {user?.userName || 'User'}
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '360px', lineHeight: 1.6 }}>
                {config.subtitle}
              </motion.p>

              {/* Health Card ID — only for actual users, NOT admin */}
              {roleName !== 'Admin' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                  style={{ marginTop: '16px', padding: '12px 18px', background: `${config.color}10`,
                    border: `1px solid ${config.color}30`, borderRadius: 'var(--radius-md)',
                    display: 'inline-flex', alignItems: 'center', gap: '10px', width: 'fit-content' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('dashboard.healthCardId')}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', color: config.color, letterSpacing: '0.05em' }}>{healthCardId}</span>
                </motion.div>
              )}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <span className="badge" style={{ background: `${config.color}20`, color: config.color }}>
                  {roleName === 'Admin' ? `🛡️ ${t('dashboard.monitoringPlatform')}` : (t(`roles.${roleName.toLowerCase()}`) || roleName)}
                </span>
                <span className="badge badge-success">{t('dashboard.online')}</span>
              </motion.div>
            </div>

            <div style={{ position: 'relative', minHeight: '320px' }}>
              {roleName !== 'Admin' ? (
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[5, 5, 5]} intensity={1} color={config.color} />
                  <pointLight position={[-5, -3, 3]} intensity={0.4} color="#00e6d9" />
                  <HealthCard3D userName={user?.userName || 'USER'} healthCardNo={healthCardId} role={roleName} />
                  <FloatingParticles count={20} spread={6} color={config.color} />
                  <OrbitControls enableZoom={false} enablePan={false} />
                  <Environment preset="city" />
                </Canvas>
              ) : (
                /* Admin gets platform branding instead of health card */
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
                  flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '4rem', opacity: 0.2 }}>🛡️</div>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CHC {t('dashboard.monitoringPlatform')}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div className="stats-grid" variants={containerVariants} initial="hidden" animate="visible">
            {config.stats.map((stat, i) => (
              <motion.div key={i} className="glass-card stat-card" variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
                <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
                <div className="stat-info"><h3>{stat.value}</h3><p>{stat.label}</p></div>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="glass-card" style={{ padding: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '20px' }}>
              {config.actionTitle}
            </h2>
            <div className="grid-responsive">
              {config.actions.map((action, i) => (
                <motion.a key={i} href={action.link} whileHover={{ scale: 1.03, y: -2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px',
                    borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none', color: 'inherit' }}>
                  <span style={{ fontSize: '1.6rem' }}>{action.icon}</span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{action.label}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{action.desc}</p>
                </motion.a>
              ))}
            </div>
          </motion.div>
    </>
  );
}
