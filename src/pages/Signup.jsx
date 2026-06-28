import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import DNAHelix from '../components/3d/DNAHelix';
import FloatingParticles from '../components/3d/FloatingParticles';
import ThemeLangToggle from '../components/layout/ThemeLangToggle';
import API from '../api/axios';

const DISTRICTS = [
  'Pune','Mumbai','Nagpur','Nashik','Thane','Aurangabad','Solapur','Kolhapur',
  'Delhi','Noida','Gurgaon','Bangalore','Mysore','Chennai','Coimbatore',
  'Hyderabad','Kolkata','Ahmedabad','Surat','Jaipur','Jodhpur','Lucknow',
  'Varanasi','Kanpur','Bhopal','Indore','Chandigarh','Amritsar','Kochi',
  'Thiruvananthapuram','Patna','Bhubaneswar','Guwahati','Dehradun','Shimla','Ranchi','Raipur','Goa'
];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', userName: '', email: '',
    password: '', confirmPassword: '', dob: '', gender: 'Male',
    contactNo: '', district: '', address: '', bloodGroup: 'O+',
    role: 'Patient', doctorRegiNo: '', chemistRegiNo: '', pathologistLicenseNo: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  useEffect(() => {
    if (form.firstName && form.lastName && form.dob) {
      const year = new Date(form.dob).getFullYear() || '';
      const generated = `${form.firstName.toLowerCase()}${form.lastName.toLowerCase()}${year}`;
      setForm(prev => ({ ...prev, userName: generated }));
    }
  }, [form.firstName, form.lastName, form.dob]);

  const handleKeyDown = (e, nextFieldName) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.querySelector(`[name="${nextFieldName}"]`)?.focus();
    }
  };

  const nextStep = () => {
    if (!form.firstName || !form.lastName || !form.userName || !form.email || !form.password || !form.dob) {
      setError(t('signup.reqFields', 'Please fill all required fields'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t('signup.pwdMatch', 'Passwords do not match'));
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.district || !form.contactNo || !form.address) {
      setError(t('signup.reqFields', 'Please fill all required fields'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        userName: form.userName, firstName: form.firstName, lastName: form.lastName,
        password: form.password, email: form.email,
        contactNo: parseInt(form.contactNo), district: form.district,
        role: form.role, dob: form.dob, address: form.address,
        gender: form.gender, bloodGroup: form.bloodGroup,
        ...(form.role === 'Doctor' && form.doctorRegiNo ? { doctorRegiNo: parseInt(form.doctorRegiNo) } : {}),
        ...(form.role === 'Chemist' && form.chemistRegiNo ? { chemistRegiNo: parseInt(form.chemistRegiNo) } : {}),
        ...(form.role === 'Pathologist' && form.pathologistLicenseNo ? { pathologistLicenseNo: form.pathologistLicenseNo } : {}),
      };
      const res = await signup(payload);
      setSuccessMsg(res.msg || t('signup.successMsg', 'Registration successful!'));
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || t('signup.failed', 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s' };
  const labelStyle = { fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' };

  return (
    <div className="auth-layout">
      {/* Left: 3D Scene */}
      <div className="auth-3d-panel" style={{ position: 'relative', background: 'var(--bg-primary)' }}>
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
          <ambientLight intensity={0.4} /><pointLight position={[5, 5, 5]} intensity={0.8} color="#00e6d9" />
          <DNAHelix /><FloatingParticles count={30} spread={8} color="#8b5cf6" />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
          <Environment preset="city" />
        </Canvas>
        <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>{t('signup.joinNetwork', 'Join CHC Network')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{t('signup.digitalIdentity', 'Your digital health identity across India')}</p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="auth-form-panel" style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', overflowY: 'auto', width: '100%' }}>
        <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 50 }}>
          <ThemeLangToggle />
        </div>
        
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} style={{ width: '100%', maxWidth: '480px', marginTop: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: '8px',
            background: 'linear-gradient(135deg, #00e6d9, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('login.createAccount', 'Create Account')}
          </h1>

          {/* Progress */}
          {step > 0 && (
            <>
              <div style={{ display: 'flex', gap: '8px', margin: '16px 0 24px' }}>
                {[1, 2].map(s => (
                  <div key={s} style={{ flex: 1, height: '4px', borderRadius: '4px',
                    background: step >= s ? 'linear-gradient(90deg, #00e6d9, #8b5cf6)' : 'var(--bg-tertiary)', transition: 'all 0.3s' }} />
                ))}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
                Step {step}/2 — {step === 1 ? t('signup.step1', 'Personal Details') : `${form.role} ${t('signup.step2', 'Details')}`}
              </p>
            </>
          )}

          {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}

          {successMsg && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ padding: '20px', background: '#10b98115', border: '1px solid #10b98140',
                borderRadius: 'var(--radius-md)', marginBottom: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>✅</p>
              <p style={{ color: '#10b981', fontWeight: 600 }}>{successMsg}</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '8px' }}>{t('signup.redirectMsg', 'Redirecting to login...')}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{t('signup.howToUse', 'How will you use the system?')}</p>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {[
                      { role: 'Patient', icon: '👤', desc: t('signup.patientDesc', 'Get your digital health card instantly') },
                      { role: 'Doctor', icon: '🩺', desc: t('signup.doctorDesc', 'Register with your medical license') },
                      { role: 'Chemist', icon: '💊', desc: t('signup.chemistDesc', 'Register your pharmacy to fulfill prescriptions') },
                      { role: 'Pathologist', icon: '🔬', desc: t('signup.pathologistDesc', 'Register your lab to upload test reports') }
                    ].map(r => (
                      <div key={r.role} onClick={() => { setForm({ ...form, role: r.role }); setStep(1); }}
                        style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-tertiary)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '16px' }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#00e6d9'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <div style={{ fontSize: '2rem' }}>{r.icon}</div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t(`roles.${r.role.toLowerCase()}`) || r.role}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{r.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="grid-layout-2">
                    <div><label style={labelStyle}>{t('signup.firstName', 'First Name *')}</label><input style={inputStyle} name="firstName" value={form.firstName} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'lastName')} required /></div>
                    <div><label style={labelStyle}>{t('signup.lastName', 'Last Name *')}</label><input style={inputStyle} name="lastName" value={form.lastName} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'email')} required /></div>
                  </div>
                  <div style={{ marginTop: '16px' }}><label style={labelStyle}>{t('signup.email', 'Email *')}</label><input style={inputStyle} name="email" type="email" value={form.email} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'dob')} required /></div>
                  <div className="grid-layout-2" style={{ marginTop: '16px' }}>
                    <div><label style={labelStyle}>{t('common.dob', 'Date of Birth')} *</label><input style={inputStyle} name="dob" type="date" value={form.dob} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'password')} required /></div>
                    <div><label style={labelStyle}>{t('common.gender', 'Gender')} *</label>
                      <select style={inputStyle} name="gender" value={form.gender} onChange={handleChange}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px', opacity: 0.7, pointerEvents: 'none' }}><label style={labelStyle}>{t('login.username', 'Username')} * (Auto-generated)</label><input style={inputStyle} name="userName" value={form.userName} readOnly required /></div>
                  <div className="grid-layout-2" style={{ marginTop: '16px' }}>
                    <div style={{ position: 'relative' }}>
                      <label style={labelStyle}>{t('login.password', 'Password')} *</label>
                      <input style={{...inputStyle, paddingRight: '40px'}} name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'confirmPassword')} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', bottom: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>{showPassword ? '👁️‍🗨️' : '👁️'}</button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <label style={labelStyle}>{t('signup.confirmPassword', 'Confirm Password *')}</label>
                      <input style={{...inputStyle, paddingRight: '40px'}} name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); nextStep(); } }} required />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', bottom: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>{showConfirmPassword ? '👁️‍🗨️' : '👁️'}</button>
                    </div>
                  </div>

                  <button type="button" onClick={nextStep}
                    style={{ width: '100%', marginTop: '24px', padding: '14px', borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, #00e6d9, #8b5cf6)', border: 'none',
                      color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                    Continue →
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="grid-layout-2">
                    <div><label style={labelStyle}>{t('signup.contactNo', 'Contact No. *')}</label><input style={inputStyle} name="contactNo" type="tel" value={form.contactNo} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'address')} required /></div>
                    <div><label style={labelStyle}>{t('profile.district', 'District')} *</label>
                      <select style={inputStyle} name="district" value={form.district} onChange={handleChange} required>
                        <option value="">Select District</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px' }}><label style={labelStyle}>{t('signup.address', 'Address *')}</label><input style={inputStyle} name="address" value={form.address} onChange={handleChange} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }} required /></div>
                  <div className="grid-layout-2" style={{ marginTop: '16px' }}>
                    {form.role === 'Patient' ? (
                      <div><label style={labelStyle}>{t('signup.bloodGroup', 'Blood Group *')}</label>
                        <select style={inputStyle} name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg}>{bg}</option>)}
                        </select>
                      </div>
                    ) : <div />}
                  </div>

                  {form.role === 'Doctor' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '16px' }}>
                      <label style={labelStyle}>{t('signup.doctorRegNo', 'Doctor Registration No. *')}</label>
                      <input style={{ ...inputStyle, borderColor: '#8b5cf640' }} name="doctorRegiNo" type="number" value={form.doctorRegiNo} onChange={handleChange} placeholder={t('signup.doctorRegNoHint', 'Your medical council reg. number')} />
                    </motion.div>
                  )}
                  {form.role === 'Chemist' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '16px' }}>
                      <label style={labelStyle}>{t('signup.chemistRegNo', 'Chemist Registration No. *')}</label>
                      <input style={{ ...inputStyle, borderColor: '#f59e0b40' }} name="chemistRegiNo" type="number" value={form.chemistRegiNo} onChange={handleChange} placeholder={t('signup.chemistRegNoHint', 'Your pharmacy council reg. number')} />
                    </motion.div>
                  )}
                  {form.role === 'Pathologist' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '16px' }}>
                      <label style={labelStyle}>{t('signup.pathologistLicense', 'Lab License No. *')}</label>
                      <input style={{ ...inputStyle, borderColor: '#ec489940' }} name="pathologistLicenseNo" type="text" value={form.pathologistLicenseNo} onChange={handleChange} placeholder={t('signup.pathologistLicenseHint', 'Your laboratory license number')} />
                    </motion.div>
                  )}

                  {/* Info about auto-generated health card */}
                  <div style={{ marginTop: '16px', padding: '12px 16px', background: '#00e6d910', border: '1px solid #00e6d930',
                    borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    💳 {t('signup.healthCardInfo', 'Your Health Card ID will be auto-generated based on your district')}
                  </div>

                  <div className="grid-layout-2" style={{ marginTop: '24px' }}>
                    <button type="button" onClick={() => setStep(1)}
                      style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
                      {t('signup.back', '← Back')}
                    </button>
                    <button type="submit" disabled={loading}
                      style={{ padding: '14px', borderRadius: 'var(--radius-md)',
                        background: loading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #00e6d9, #8b5cf6)',
                        border: 'none', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
                      {loading ? t('signup.creatingBtn', 'Creating...') : t('signup.createBtn', 'Create Account')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            {t('signup.alreadyHaveAccount', 'Already have an account?')} <Link to="/login" style={{ color: '#00e6d9', fontWeight: 600 }}>{t('signup.signIn', 'Sign In')}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
