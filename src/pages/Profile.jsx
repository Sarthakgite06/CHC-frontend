import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import HealthCard3D from '../components/3d/HealthCard3D';

const roleFeatures = {
  Doctor: [
    { icon: '🩺', title: 'Prescribe Medicines', desc: 'Create prescriptions for patients across the CHC network' },
    { icon: '🔍', title: 'Patient Search', desc: 'Search any patient by name or health card ID' },
    { icon: '📝', title: 'Medical Records', desc: 'Full read/write access to patient medical records' },
    { icon: '💬', title: 'Feedback', desc: 'Report issues or suggest improvements to CHC admin' },
  ],
  Chemist: [
    { icon: '✅', title: 'Verify Prescriptions', desc: 'Check prescriptions before dispensing medication' },
    { icon: '📋', title: 'View Records', desc: 'Search and view patient medical records' },
    { icon: '💊', title: 'Safe Dispensing', desc: 'Ensure correct medication with verified prescriptions' },
    { icon: '💬', title: 'Feedback', desc: 'Report issues or suggest improvements to CHC admin' },
  ],
  Admin: [
    { icon: '📊', title: 'System Analytics', desc: 'Monitor user growth, district distribution, and trends' },
    { icon: '✅', title: 'Credential Verification', desc: 'Verify doctor and chemist registration numbers' },
    { icon: '👥', title: 'User Management', desc: 'View and manage all registered users' },
    { icon: '💬', title: 'Feedback Management', desc: 'Respond to user feedback and resolve tickets' },
  ],
  User: [
    { icon: '🏥', title: 'Universal Access', desc: 'Access your records at any CHC-connected hospital' },
    { icon: '💳', title: 'Digital Health Card', desc: 'Your unique health card ID works across all CHC centers' },
    { icon: '📱', title: 'Complete History', desc: 'View your full medical history anytime' },
    { icon: '💬', title: 'Feedback & Support', desc: 'Share your experience or report issues to admin' },
  ],
};

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [doctorRegNo, setDoctorRegNo] = useState(null);
  const roleName = user?.role?.replace('ROLE_', '') || 'User';
  const features = roleFeatures[roleName] || roleFeatures.User;
  const roleColors = { Doctor: '#8b5cf6', Chemist: '#f59e0b', User: '#00e6d9', Admin: '#f43f5e' };
  const color = roleColors[roleName] || '#00e6d9';
  const healthCardId = user?.healthCardNo || 'N/A';
  const [healthResults, setHealthResults] = useState(null);

  useEffect(() => {
    if (roleName === 'Doctor' && user?.userName) {
      import('../api/axios').then(module => {
        module.default.get(`/user/getDoctorRegNo?userName=${user.userName}`)
          .then(res => setDoctorRegNo(res.data))
          .catch(err => console.warn('Could not fetch doctor reg no', err));
      });
    }

    if ((roleName === 'User' || roleName === 'Patient') && user?.userName) {
      const saved = localStorage.getItem(`chc_health_test_${user.userName}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.completed) setHealthResults(parsed.results);
      }
    }
  }, [roleName, user?.userName]);

  return (
    <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="page-header">
              <h1>👤 My Profile</h1>
              <p>View and manage your personal information</p>
            </div>

            {/* 3D Card Preview */}
            <div className="glass-card" style={{ marginBottom: '28px', overflow: 'hidden', borderRadius: 'var(--radius-xl)', border: `1px solid ${color}25` }}>
              <div className="grid-layout-2" style={{ minHeight: '280px' }}>
                <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <p style={{ color, fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      {roleName === 'Admin' ? 'Team Account' : 'Your Health Card'}
                    </p>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>
                      {roleName === 'Doctor' ? 'Dr. ' : ''}{user?.userName || 'User'}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <span className="badge" style={{ background: `${color}20`, color }}>{roleName === 'Admin' ? '🛡️ Platform' : roleName}</span>
                      <span className="badge badge-success">Active</span>
                    </div>

                    {/* Health Card ID — NOT for admin */}
                    {roleName !== 'Admin' && (
                      <div style={{ marginTop: '4px', padding: '10px 16px', background: `${color}08`, border: `1px solid ${color}25`,
                        borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health Card ID</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color, fontSize: '1rem', letterSpacing: '0.04em' }}>{healthCardId}</span>
                      </div>
                    )}

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginTop: '12px' }}>
                      {roleName === 'Doctor'
                        ? 'Your doctor credentials are verified. You have prescription privileges across the CHC network.'
                        : roleName === 'Chemist'
                        ? 'Your chemist credentials are verified. You can verify and dispense prescriptions.'
                        : roleName === 'Admin'
                        ? 'CHC monitoring platform — manage users, analytics, verifications, and feedback.'
                        : 'Your digitized health card gives you instant access to your complete medical history.'}
                    </p>
                  </motion.div>
                </div>

                <div style={{ position: 'relative', minHeight: '280px' }}>
                  {roleName !== 'Admin' ? (
                    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                      <ambientLight intensity={0.5} />
                      <pointLight position={[5, 5, 5]} intensity={1} color={color} />
                      <pointLight position={[-5, -3, 3]} intensity={0.4} color="#8b5cf6" />
                      <HealthCard3D userName={user?.userName || 'USER'} healthCardNo={healthCardId} role={roleName} />
                      <OrbitControls enableZoom={false} enablePan={false} />
                      <Environment preset="city" />
                    </Canvas>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '4rem', opacity: 0.2 }}>🛡️</div>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Monitoring Platform</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid-layout-2">
              <motion.div className="glass-card" style={{ padding: '28px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color }}>
                  Account Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: t('profile.username') || 'Username', value: user?.userName || 'N/A' },
                    ...(roleName !== 'Admin' ? [
                      { label: t('dashboard.healthCardId') || 'Health Card ID', value: healthCardId, valueColor: color, mono: true },
                      { label: t('profile.district') || 'District', value: user?.district || 'N/A' },
                    ] : []),
                    ...(roleName === 'Doctor' ? [
                      { label: t('profile.doctorRegNo') || 'Doctor Registration No.', value: doctorRegNo || t('profile.loading') || 'Loading...', mono: true },
                    ] : []),
                    { label: t('profile.role') || 'Role', value: roleName === 'Admin' ? `🛡️ ${t('dashboard.monitoringPlatform') || 'Monitoring Platform'}` : `${roleName === 'Doctor' ? '🩺 ' : roleName === 'Chemist' ? '💊 ' : '🏥 '}${t(`roles.${roleName.toLowerCase()}`) || roleName}` },
                    { label: 'Status', value: '● Active', valueColor: '#10b981' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{item.label}</p>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', color: item.valueColor || 'var(--text-primary)', ...(item.mono ? { fontFamily: 'monospace' } : {}) }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div className="glass-card" style={{ padding: '28px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: '#10b981' }}>
                  Data Privacy & Access
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Data Encryption', value: '🔒 End-to-end secured' },
                    { label: 'Access Level', value: roleName === 'Doctor' ? 'Read + Write (Prescriptions)' : roleName === 'Chemist' ? 'Read (Verification only)' : roleName === 'Admin' ? 'System Monitoring (no private data)' : 'Personal records only' },
                    { label: 'Network', value: 'CHC India — Pan-India access' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{item.label}</p>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', color: item.valueColor || 'var(--text-primary)' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Basic Health Info / Vitals (Patient Only) */}
            {(roleName === 'User' || roleName === 'Patient') && (
              <motion.div className="glass-card" style={{ padding: '28px', marginTop: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#f43f5e' }}>
                    ❤️ Basic Health Info (Follow-Up Vitals)
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#f43f5e', background: '#f43f5e20', padding: '6px 12px', borderRadius: '16px', fontWeight: 600 }}>
                    {healthResults ? 'Latest Check' : 'Pending'}
                  </span>
                </div>
                
                {!healthResults ? (
                  <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>You haven't completed your basic healthcare assessment yet.</p>
                    <a href="/health-test" className="btn btn-primary" style={{ display: 'inline-block', padding: '10px 24px' }}>Take Health Assessment</a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                      { label: 'Overall Health Score', value: healthResults.score, max: 100, unit: '%', color: '#10b981', status: healthResults.overallStatus },
                      { label: 'BMI / Weight Status', value: healthResults.bmi, max: 40, unit: 'kg/m²', color: '#f59e0b', status: healthResults.bmiStatus },
                      { label: 'Blood Pressure (Systolic)', value: healthResults.bloodPressure?.sys || 120, max: 200, unit: 'mmHg', color: '#10b981', status: 'Normal' },
                      { label: 'Blood Pressure (Diastolic)', value: healthResults.bloodPressure?.dia || 80, max: 130, unit: 'mmHg', color: '#10b981', status: 'Normal' },
                      { label: 'Heart Rate', value: healthResults.heartRate?.value || 72, max: 150, unit: 'bpm', color: '#f43f5e', status: 'Resting' },
                      { label: 'Oxygen Saturation (SpO2)', value: healthResults.spO2?.value || 98, max: 100, unit: '%', color: '#00e6d9', status: 'Optimal' }
                    ].map((vital, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{vital.label}</span>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <span style={{ color: vital.color, fontWeight: 700 }}>{vital.status}</span>
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{vital.value} {vital.unit}</span>
                          </div>
                        </div>
                        {/* Follow-up Progress Bar */}
                        <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${(vital.value / vital.max) * 100}%` }} 
                            transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                            style={{ height: '100%', background: `linear-gradient(90deg, ${vital.color}50, ${vital.color})`, borderRadius: '4px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Role Features */}
            <motion.div className="glass-card" style={{ padding: '28px', marginTop: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>
                {roleName === 'Doctor' ? '🩺 Doctor Capabilities' : roleName === 'Chemist' ? '💊 Chemist Capabilities' : roleName === 'Admin' ? '🛡️ Admin Capabilities' : '🏥 Your CHC Benefits'}
              </h3>
              <div className="grid-responsive">
                {features.map((f, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02, y: -2 }}
                    style={{ padding: '20px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{f.icon}</p>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px' }}>{f.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
    </>
  );
}
