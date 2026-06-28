import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import API from '../api/axios';

export default function CreateRecord() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctorRegNo, setDoctorRegNo] = useState('');
  const [patientInfo, setPatientInfo] = useState({ age: '', weight: '', bloodPressure: '' });
  const [medicines, setMedicines] = useState([
    { medicineName: '', dosageEntity: { morning: false, afternoon: false, night: false }, days: '', remark: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('X-Ray');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadHospital, setUploadHospital] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Real-time autocomplete
  useEffect(() => {
    if (searchQuery.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await API.get(`/chc/search-users?q=${encodeURIComponent(searchQuery)}`);
        setSuggestions(res.data || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 300);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSuggestion = (s) => {
    setSelectedPatient(s);
    setSearchQuery(`${s.firstName} ${s.lastName} (${s.healthCardNo})`);
    setShowSuggestions(false);
  };

  const addMedicine = () => {
    setMedicines(prev => [...prev, { medicineName: '', dosageEntity: { morning: false, afternoon: false, night: false }, days: '', remark: '' }]);
  };

  const removeMedicine = (index) => {
    if (medicines.length > 1) setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    setMedicines(prev => prev.map((m, i) => {
      if (i !== index) return m;
      if (field.startsWith('dosage.')) {
        const dosageField = field.split('.')[1];
        return { ...m, dosageEntity: { ...m.dosageEntity, [dosageField]: value } };
      }
      return { ...m, [field]: value };
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) { setError(t('createRecord.selectPatient')); return; }
    setError(''); setSuccess(''); setLoading(true);

    try {
      const payload = {
        doctorRegNo: parseInt(doctorRegNo),
        medicineInfoEntities: medicines.map(m => ({ ...m, days: parseInt(m.days) })),
        patientEntity: {
          age: parseInt(patientInfo.age),
          weight: parseInt(patientInfo.weight),
          bloodPressure: patientInfo.bloodPressure,
        }
      };

      const formData = new FormData();
      formData.append('record', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      if (uploadFile) {
        if (!uploadTitle.trim()) { 
          setError('Report Title is required when attaching a scan.'); 
          setLoading(false); 
          return; 
        }
        if (!uploadHospital.trim()) { 
          setError('Hospital/Clinic Name is required when attaching a scan.'); 
          setLoading(false); 
          return; 
        }

        formData.append('file', uploadFile);
        formData.append('imagingType', uploadType);
        formData.append('title', uploadTitle.trim());
        formData.append('hospitalName', uploadHospital.trim());
        if (uploadDesc.trim()) {
          formData.append('description', uploadDesc.trim());
        }
        setIsUploading(true);
        setUploadProgress(0);
      }

      await API.post('/doctor/createMedicineRecord', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: { userName: selectedPatient.userName, healthCardNo: selectedPatient.healthCardNo },
        onUploadProgress: (progressEvent) => {
          if (uploadFile) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      setSuccess(t('createRecord.success'));
      setUploadFile(null);
      setUploadType('X-Ray');
      setUploadTitle('');
      setUploadHospital('');
      setUploadDesc('');
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || t('createRecord.failed'));
    } finally { 
      setLoading(false); 
      setIsUploading(false); 
    }
  };

  return (
    <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="page-header">
              <h1>✏️ {t('createRecord.title')}</h1>
              <p>{t('createRecord.subtitle')}</p>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ padding: '16px 20px', background: '#10b98115', border: '1px solid #10b98140',
                  borderRadius: 'var(--radius-md)', marginBottom: '20px', color: '#10b981', fontWeight: 600 }}>
                ✅ {success}
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Patient Search with Autocomplete */}
              <div className="glass-card" style={{ padding: '28px', marginBottom: '20px', borderLeft: '3px solid #8b5cf6' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: '#8b5cf6' }}>
                  {t('createRecord.patientDoctorDetails')}
                </h3>
                <div className="grid-layout-2-1">
                  <div ref={searchRef} style={{ position: 'relative' }}>
                    <label className="form-label">🔍 {t('createRecord.searchPatient')}</label>
                    <input className="form-input" placeholder={t('createRecord.searchPlaceholder')}
                      value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSelectedPatient(null); }}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} />
                    <AnimatePresence>
                      {showSuggestions && suggestions.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)', marginTop: '4px',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.4)', maxHeight: '240px', overflowY: 'auto' }}>
                          {suggestions.map((s, i) => (
                            <div key={i} onClick={() => selectSuggestion(s)}
                              style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName} <span style={{ color: 'var(--text-tertiary)' }}>@{s.userName}</span></span>
                              <span style={{ fontFamily: 'monospace', color: '#8b5cf6', fontWeight: 600 }}>{s.healthCardNo}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {selectedPatient && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: '#10b98110', border: '1px solid #10b98130',
                        borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#10b981' }}>
                        ✅ {t('createRecord.selected')}: {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.healthCardNo})
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('createRecord.doctorRegNo')}</label>
                    <input className="form-input" value={doctorRegNo} onChange={e => setDoctorRegNo(e.target.value)} placeholder="12345" required />
                  </div>
                </div>
              </div>

              {/* Patient Vitals */}
              <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: '#f59e0b' }}>
                  {t('createRecord.patientVitals')}
                </h3>
                <div className="grid-layout-3">
                  <div className="form-group">
                    <label className="form-label">{t('createRecord.age')}</label>
                    <input className="form-input" type="number" value={patientInfo.age} onChange={e => setPatientInfo(p => ({ ...p, age: e.target.value }))} placeholder="25" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('createRecord.weight')}</label>
                    <input className="form-input" type="number" value={patientInfo.weight} onChange={e => setPatientInfo(p => ({ ...p, weight: e.target.value }))} placeholder="70" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('createRecord.bp')}</label>
                    <input className="form-input" value={patientInfo.bloodPressure} onChange={e => setPatientInfo(p => ({ ...p, bloodPressure: e.target.value }))} placeholder="120/80" required />
                  </div>
                </div>
              </div>

              {/* Medicines */}
              <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
                    {t('createRecord.prescribedMedicines')} ({medicines.length})
                  </h3>
                  <button type="button" className="btn btn-secondary" onClick={addMedicine} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    {t('createRecord.addMedicine')}
                  </button>
                </div>

                {medicines.map((med, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '20px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('medicalHistory.medicine')} #{idx + 1}</span>
                      {medicines.length > 1 && (
                        <button type="button" onClick={() => removeMedicine(idx)}
                          style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', padding: '4px 12px',
                            borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                          {t('createRecord.remove')}
                        </button>
                      )}
                    </div>
                    <div className="grid-layout-2-1" style={{ marginBottom: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">{t('createRecord.medicineName')}</label>
                        <input className="form-input" value={med.medicineName} onChange={e => updateMedicine(idx, 'medicineName', e.target.value)} placeholder="Paracetamol 500mg" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('createRecord.days')}</label>
                        <input className="form-input" type="number" value={med.days} onChange={e => updateMedicine(idx, 'days', e.target.value)} placeholder="7" required min="1" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span className="form-label" style={{ marginBottom: 0 }}>{t('createRecord.dosage')}:</span>
                      {['morning', 'afternoon', 'night'].map(d => (
                        <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: med.dosageEntity[d] ? '#8b5cf6' : 'var(--text-tertiary)' }}>
                          <input type="checkbox" checked={med.dosageEntity[d]} onChange={e => updateMedicine(idx, `dosage.${d}`, e.target.checked)}
                            style={{ accentColor: '#8b5cf6', width: '18px', height: '18px' }} />
                          {t(`createRecord.${d}`)}
                        </label>
                      ))}
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('createRecord.remarkOptional')}</label>
                      <input className="form-input" value={med.remark} onChange={e => updateMedicine(idx, 'remark', e.target.value)} placeholder={t('createRecord.remarkPlaceholder')} />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Attach Medical Scan (Optional) */}
              <div className="glass-card" style={{ padding: '28px', marginBottom: '20px', borderLeft: '3px solid #00e6d9' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: '#00e6d9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📷 Attach Medical Scan <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>(Optional)</span>
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* File Selector */}
                  <div>
                    <label className="form-label">Select Medical Scan File</label>
                    <div 
                      style={{
                        border: '2px dashed var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '24px',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.01)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00e6d9'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                      onClick={() => document.getElementById('record-file-input').click()}
                    >
                      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📤</span>
                      {uploadFile ? (
                        <p style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 600 }}>
                          Selected: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Click to select a file (PDF, JPG, JPEG, PNG, DICOM)<br />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Max size: 50MB</span>
                        </p>
                      )}
                    </div>
                    <input 
                      type="file" 
                      id="record-file-input" 
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.dcm'];
                          const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                          if (!allowed.includes(ext)) {
                            alert('Unsupported file format. Allowed: PDF, JPG, JPEG, PNG, DICOM (.dcm)');
                            return;
                          }
                          if (file.size > 50 * 1024 * 1024) {
                            alert('File exceeds maximum size of 50MB.');
                            return;
                          }
                          setUploadFile(file);
                        }
                      }}
                    />
                  </div>

                  {/* Imaging Options — Only visible when a file is selected */}
                  {uploadFile && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label className="form-label">Imaging Type *</label>
                        <select 
                          className="form-input"
                          value={uploadType} 
                          onChange={(e) => setUploadType(e.target.value)}
                          style={{ width: '100%', background: 'var(--bg-secondary)', padding: '10px' }}
                        >
                          <option value="X-Ray">🦴 X-Ray</option>
                          <option value="MRI">🧠 MRI</option>
                          <option value="CT Scan">🌀 CT Scan</option>
                          <option value="Ultrasound">🔊 Ultrasound</option>
                          <option value="ECG">🫀 ECG</option>
                          <option value="Other">📷 Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label">Report Title *</label>
                        <input 
                          className="form-input" 
                          placeholder="e.g. Chest X-Ray, Brain MRI" 
                          value={uploadTitle} 
                          onChange={(e) => setUploadTitle(e.target.value)} 
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label className="form-label">Hospital / Clinic Name *</label>
                        <input 
                          className="form-input" 
                          placeholder="e.g. City General Hospital" 
                          value={uploadHospital} 
                          onChange={(e) => setUploadHospital(e.target.value)} 
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label className="form-label">Short Description (Optional)</label>
                        <textarea 
                          className="form-input" 
                          placeholder="Add findings or short notes..." 
                          value={uploadDesc} 
                          onChange={(e) => setUploadDesc(e.target.value)} 
                          rows={2} 
                          style={{ width: '100%', resize: 'none', background: 'var(--bg-secondary)' }}
                        />
                      </div>

                      <button 
                        type="button" 
                        onClick={() => { 
                          setUploadFile(null); 
                          setUploadType('X-Ray');
                          setUploadTitle('');
                          setUploadHospital('');
                          setUploadDesc('');
                        }}
                        className="btn btn-secondary" 
                        style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', width: 'fit-content' }}
                      >
                        Remove Attachment
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                      <span>Uploading Scan...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #00e6d9, #8b5cf6)', transition: 'width 0.1s ease-out' }}></div>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '18px', fontSize: '1.05rem' }}>
                {loading ? t('createRecord.creating') : `📝 ${t('createRecord.createBtn')}`}
              </button>
            </form>
          </motion.div>
    </>
  );
}
