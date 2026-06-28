import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import API from '../api/axios';

export default function MedicalHistory() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState(null);
  const [labReports, setLabReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [imagingRecords, setImagingRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('records');

  // Upload States
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadHospital, setUploadHospital] = useState('');
  const [uploadType, setUploadType] = useState('X-Ray');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const handleDownload = async (reportId, fileName) => {
    try {
      const response = await API.get(`/lab/downloadReport/${reportId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName || 'report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download file:', err);
      alert('Could not download file. Please check permissions or try again.');
    }
  };

  const handleView = async (reportId, fileType, reportName) => {
    try {
      const response = await API.get(`/lab/downloadReport/${reportId}`, {
        responseType: 'blob',
      });
      let contentType = response.headers['content-type'];
      if (!contentType) {
        contentType = fileType === 'PDF' ? 'application/pdf' : 'image/jpeg';
      }
      const blob = new Blob([response.data], { type: contentType });
      const fileUrl = window.URL.createObjectURL(blob);
      setPreviewUrl(fileUrl);
      setPreviewType(contentType);
      setPreviewName(reportName || 'Report Preview');
    } catch (err) {
      console.error('Failed to view file:', err);
      alert('Could not view file. Please check permissions or try again.');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this lab report?')) return;
    try {
      await API.delete(`/lab/deleteReport/${reportId}`);
      setLabReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert(err.response?.data?.message || 'Could not delete lab report. Please check permissions or try again.');
    }
  };

  const handleImagingView = async (recordId, fileType, title) => {
    try {
      const response = await API.get(`/medical-imaging/download/${recordId}`, {
        responseType: 'blob',
      });
      let contentType = response.headers['content-type'];
      if (!contentType) {
        contentType = fileType === 'PDF' ? 'application/pdf' : 'image/jpeg';
      }
      const blob = new Blob([response.data], { type: contentType });
      const fileUrl = window.URL.createObjectURL(blob);
      setPreviewUrl(fileUrl);
      setPreviewType(contentType);
      setPreviewName(title || 'Imaging Preview');
    } catch (err) {
      console.error('Failed to view file:', err);
      alert('Could not view file. Please check permissions or try again.');
    }
  };

  const handleImagingDownload = async (recordId, fileName) => {
    try {
      const response = await API.get(`/medical-imaging/download/${recordId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download file:', err);
      alert('Could not download file. Please check permissions or try again.');
    }
  };

  const handlePrescriptionView = async (fileUrl, fileType, title) => {
    try {
      const response = await API.get(fileUrl, {
        responseType: 'blob',
      });
      let contentType = response.headers['content-type'];
      if (!contentType) {
        contentType = fileType === 'PDF' ? 'application/pdf' : 'image/jpeg';
      }
      const blob = new Blob([response.data], { type: contentType });
      const previewUrl = window.URL.createObjectURL(blob);
      setPreviewUrl(previewUrl);
      setPreviewType(contentType);
      setPreviewName(title || 'Prescription Attachment Preview');
    } catch (err) {
      console.error('Failed to view file:', err);
      alert('Could not view file. Please check permissions or try again.');
    }
  };

  const handlePrescriptionDownload = async (fileUrl, fileName) => {
    try {
      const response = await API.get(fileUrl, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download file:', err);
      alert('Could not download file. Please check permissions or try again.');
    }
  };

  const handleImagingUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setFormError('Please select a file to upload');
      return;
    }
    
    // File validation
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.dcm'];
    const extension = uploadFile.name.substring(uploadFile.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      setFormError('Unsupported file format. Allowed: PDF, JPG, JPEG, PNG, DICOM (.dcm)');
      return;
    }
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (uploadFile.size > maxSize) {
      setFormError('File size exceeds maximum limit of 50 MB');
      return;
    }
    
    setFormError('');
    setFormSuccess('');
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('healthCardNo', records?.patientEntity?.healthCardNo);
    formData.append('imagingType', uploadType);
    formData.append('title', uploadTitle);
    formData.append('description', uploadDesc);
    formData.append('hospitalName', uploadHospital);
    
    try {
      const response = await API.post('/medical-imaging/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      
      setImagingRecords(prev => [response.data, ...prev]);
      setFormSuccess('Medical imaging uploaded successfully!');
      
      // Clear form
      setUploadTitle('');
      setUploadHospital('');
      setUploadDesc('');
      setUploadFile(null);
      setUploadType('X-Ray');
    } catch (err) {
      console.error('Failed to upload file:', err);
      setFormError(err.response?.data?.message || err.response?.data || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImagingDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this imaging record?')) return;
    try {
      await API.delete(`/medical-imaging/${recordId}`);
      setImagingRecords(prev => prev.filter(r => r.id !== recordId));
      alert('Imaging record deleted successfully.');
    } catch (err) {
      console.error('Failed to delete imaging record:', err);
      alert(err.response?.data?.message || 'Could not delete imaging record. Please check permissions or try again.');
    }
  };

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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleName = user?.role?.replace('ROLE_', '') || 'User';
  const isPatient = roleName === 'User' || roleName === 'Patient';

  // Auto-fetch for patients
  useEffect(() => {
    if (isPatient) {
      fetchRecords(user?.healthCardNo, user?.userName);
    }
  }, [isPatient, user]);

  const selectSuggestion = (s) => {
    setSelectedPatient(s);
    setSearchQuery(`${s.firstName} ${s.lastName} (${s.healthCardNo})`);
    setShowSuggestions(false);
    fetchRecords(s.healthCardNo, s.userName);
  };

  const fetchRecords = async (cardNo, uName) => {
    setLoading(true); setError(''); setRecords(null); setLabReports([]);
    try {
      const params = new URLSearchParams();
      if (cardNo) params.append('healthCardNo', cardNo);
      if (uName) params.append('userName', uName);
      
      const res = await API.get(`/chc/getPatientMedicalHistory?${params}`);
      setRecords(res.data);
      
      // Attempt to fetch lab reports if we have a healthCardNo
      const actualCardNo = cardNo || res.data?.patientEntity?.healthCardNo;
      if (actualCardNo) {
        try {
          const labRes = await API.get(`/lab/patient/${actualCardNo}/reports`);
          setLabReports(labRes.data || []);
        } catch (err) {
          console.warn('Could not fetch lab reports:', err);
        }
        try {
          const imgRes = await API.get(`/medical-imaging/patient/${actualCardNo}`);
          setImagingRecords(imgRes.data || []);
        } catch (err) {
          console.warn('Could not fetch medical imaging records:', err);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || t('medicalHistory.noRecords'));
    } finally { setLoading(false); }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    // Try as health card ID first, then as username
    const isCardId = /^[A-Z]{3}\d+$/.test(searchQuery.trim());
    fetchRecords(isCardId ? searchQuery.trim() : '', isCardId ? '' : searchQuery.trim());
  };

  const roleColor = { Doctor: '#8b5cf6', Chemist: '#f59e0b', User: '#00e6d9', Patient: '#00e6d9', Admin: '#f43f5e' }[roleName] || '#00e6d9';

  return (
    <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="page-header">
              <h1>{roleName === 'Doctor' ? `🔍 ${t('medicalHistory.patientRecords')}` : roleName === 'Chemist' ? `📋 ${t('medicalHistory.patientRecords')}` : `📋 ${t('medicalHistory.title')}`}</h1>
              <p>{roleName === 'Doctor' || roleName === 'Chemist' ? t('medicalHistory.searchHint') : t('medicalHistory.searchHint')}</p>
            </div>

            {/* Search Bar with Autocomplete - Hidden for Patients */}
            {!isPatient && (
            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <div ref={searchRef} style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: roleColor, marginBottom: '10px', display: 'block' }}>
                  🔍 {t('medicalHistory.searchPatient')}
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      className="form-input"
                      placeholder={t('medicalHistory.searchPlaceholder')}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      style={{ width: '100%', padding: '14px 18px', fontSize: '1rem' }}
                    />

                    {/* Autocomplete Dropdown */}
                    <AnimatePresence>
                      {showSuggestions && suggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)', marginTop: '4px',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.4)', maxHeight: '280px', overflowY: 'auto'
                          }}>
                          {suggestions.map((s, i) => (
                            <div key={i} onClick={() => selectSuggestion(s)}
                              style={{
                                padding: '12px 16px', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '50%',
                                  background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: 700, fontSize: '0.75rem', color: '#0a0f1a'
                                }}>{s.firstName?.charAt(0)}</div>
                                <div>
                                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.firstName} {s.lastName}</p>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>@{s.userName} · {s.district}</p>
                                </div>
                              </div>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: roleColor, fontWeight: 600 }}>
                                {s.healthCardNo}
                              </span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button onClick={handleSearch} className="btn btn-primary" style={{ padding: '14px 28px', whiteSpace: 'nowrap' }}>
                    {t('common.search')}
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                  💡 {t('medicalHistory.searchHint')}
                </p>
              </div>
            </div>
            )}

            {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}
            {loading && <div className="loading-container"><div className="loading-spinner"></div></div>}

            {/* Patient Info Card */}
            {records?.patientEntity && (
              <motion.div className="glass-card" style={{ padding: '24px', marginBottom: '24px', borderLeft: `3px solid ${roleColor}` }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ fontWeight: 700, marginBottom: '16px', color: roleColor }}>{t('medicalHistory.patientInfo')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  {[
                    { label: t('common.name'), value: records.patientEntity.userName },
                    { label: t('dashboard.healthCardId'), value: selectedPatient?.healthCardNo || 'N/A', mono: true },
                    { label: t('common.dob'), value: records.patientEntity.dob },
                    { label: t('common.gender'), value: records.patientEntity.gender },
                    { label: t('common.age'), value: records.patientEntity.age || 'N/A' },
                    { label: t('common.weight'), value: records.patientEntity.weight ? `${records.patientEntity.weight} kg` : 'N/A' },
                    { label: t('common.bp'), value: records.patientEntity.bloodPressure || 'N/A' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', ...(item.mono ? { fontFamily: 'monospace', color: roleColor } : {}) }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tab Selection (Only for Doctors) */}
            {records?.patientEntity && roleName === 'Doctor' && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                  onClick={() => setActiveTab('records')}
                  className="btn"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    background: activeTab === 'records' ? 'linear-gradient(135deg, var(--color-primary, #00e6d9), #8b5cf6)' : 'var(--bg-secondary)',
                    color: activeTab === 'records' ? '#0a0f1a' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.2s'
                  }}
                >
                  💊 Medical Records & Lab Reports
                </button>
                <button
                  onClick={() => setActiveTab('imaging')}
                  className="btn"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    background: activeTab === 'imaging' ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'var(--bg-secondary)',
                    color: activeTab === 'imaging' ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.2s'
                  }}
                >
                  📷 Medical Imaging Files
                </button>
              </div>
            )}

            {activeTab === 'records' && (
              <>
                {/* Medical Records */}
                {records?.medicalRecordResponseDTOList && (() => {
                  // Group by Year and Month
                  const grouped = records.medicalRecordResponseDTOList.reduce((acc, record) => {
                    const [year, month] = record.createdDate.split('-'); // e.g. "2023-10-15"
                    const dateObj = new Date(record.createdDate);
                    const monthName = isNaN(dateObj.getTime()) ? month : dateObj.toLocaleString('default', { month: 'long' });
                    const key = `${monthName} ${year || dateObj.getFullYear()}`;
                    
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(record);
                    return acc;
                  }, {});

                  return Object.entries(grouped).map(([period, periodRecords], pIdx) => (
                    <div key={period} style={{ marginBottom: '32px' }}>
                      <motion.h3 
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: pIdx * 0.1 }}
                        style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '16px', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '8px' }}>
                        📅 {period}
                      </motion.h3>
                      
                      {periodRecords.map((record, idx) => (
                        <motion.div key={idx} className="glass-card" style={{ padding: '24px', marginBottom: '16px', borderLeft: '4px solid #00e6d9' }}
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (pIdx * 0.1) + (idx * 0.05) }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ fontWeight: 700 }}>{t('medicalHistory.record')}</h4>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span className="badge badge-primary">{record.createdDate}</span>
                              <span className="badge" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>{t('medicalHistory.drReg')}: {record.doctorRegNo}</span>
                              {isPatient && (
                                <a href={`/feedback?dr=${record.doctorRegNo}&date=${record.createdDate}`} className="badge" style={{ background: '#f59e0b20', color: '#f59e0b', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s' }} onMouseOver={(e) => e.target.style.background = '#f59e0b40'} onMouseOut={(e) => e.target.style.background = '#f59e0b20'}>
                                  💬 Give Feedback
                                </a>
                              )}
                            </div>
                          </div>
                          <table className="data-table">
                            <thead>
                              <tr><th>{t('medicalHistory.medicine')}</th><th>{t('medicalHistory.days')}</th><th>M</th><th>A</th><th>N</th><th>{t('medicalHistory.remark')}</th></tr>
                            </thead>
                            <tbody>
                              {record.medicineInfoEntities?.map((med, mi) => (
                                <tr key={mi}>
                                  <td style={{ fontWeight: 600 }}>{med.medicineName}</td>
                                  <td>{med.days}</td>
                                  <td><span className={`dose-pill ${med.dosageEntity?.morning ? 'active' : ''}`}>M</span></td>
                                  <td><span className={`dose-pill ${med.dosageEntity?.afternoon ? 'active' : ''}`}>A</span></td>
                                  <td><span className={`dose-pill ${med.dosageEntity?.night ? 'active' : ''}`}>N</span></td>
                                  <td style={{ color: 'var(--text-secondary)' }}>{med.remark || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Scan Attachment Section */}
                          {record.fileUrl && (
                            <div style={{
                              marginTop: '16px',
                              padding: '16px',
                              background: 'rgba(0, 230, 217, 0.05)',
                              border: '1px solid rgba(0, 230, 217, 0.2)',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '1.5rem', background: 'rgba(0, 230, 217, 0.1)', padding: '8px', borderRadius: 'var(--radius-xs)', display: 'inline-flex' }}>
                                    {record.imagingType === 'X-Ray' ? '🦴' : 
                                     record.imagingType === 'MRI' ? '🧠' : 
                                     record.imagingType === 'CT Scan' ? '🌀' : 
                                     record.imagingType === 'Ultrasound' ? '🔊' : 
                                     record.imagingType === 'ECG' ? '🫀' : '📷'}
                                  </span>
                                  <div>
                                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#00e6d9' }}>
                                      {record.title || `${record.imagingType} Scan`}
                                    </h4>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                      🏥 {record.hospitalName || 'City Clinic'} · <span style={{ color: 'var(--text-tertiary)' }}>{record.imagingType} ({record.fileType}, {(record.fileSize / (1024 * 1024)).toFixed(2)} MB)</span>
                                    </p>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {record.fileType !== 'DCM' ? (
                                    <button
                                      onClick={() => handlePrescriptionView(record.fileUrl, record.fileType, record.title || `${record.imagingType} Scan`)}
                                      className="btn btn-secondary"
                                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'rgba(0, 230, 217, 0.3)', color: '#00e6d9' }}
                                    >
                                      👁️ Preview
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                                      DICOM File
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handlePrescriptionDownload(record.fileUrl, `prescription_scan_${record.medicalRecordId}.${record.fileType.toLowerCase()}`)}
                                    className="btn btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#0a0f1a', border: 'none', background: 'linear-gradient(135deg, #00e6d9, #8b5cf6)' }}
                                  >
                                    📥 Download
                                  </button>
                                </div>
                              </div>

                              {record.description && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 'var(--radius-xs)', borderLeft: '2px solid var(--border-subtle)', fontStyle: 'italic' }}>
                                  {record.description}
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ));
                })()}

                {/* Lab Reports */}
                {records && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginTop: '32px' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '16px', color: '#ec4899' }}>🔬 {t('medicalHistory.labReports')}</h3>
                    {labReports.length === 0 ? (
                      <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        {t('medicalHistory.noReports')}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                        {labReports.map((report) => (
                          <div key={report.id} className="glass-card" style={{ padding: '20px', borderLeft: '3px solid #ec4899', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ec4899', margin: 0 }}>{report.reportName}</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                                  <strong>Test:</strong> {report.testName}
                                </p>
                              </div>
                              <span className="badge badge-primary">
                                {report.uploadDateTime ? new Date(report.uploadDateTime).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                            
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                              <div><strong>Uploaded By:</strong> @{report.uploadedBy}</div>
                              <div><strong>Format:</strong> {report.fileType}</div>
                            </div>

                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '4px 0', lineHeight: 1.4 }}>
                              <strong>{t('common.findings')}:</strong> {report.findings}
                            </p>
                            {report.remarks && (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '4px 0' }}>
                                <strong>{t('medicalHistory.remark')}:</strong> {report.remarks}
                              </p>
                            )}
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                              <button
                                onClick={() => handleView(report.id, report.fileType, report.reportName)}
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '10px', fontSize: '0.9rem', borderColor: '#ec489930', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              >
                                👁️ View
                              </button>
                              <button
                                onClick={() => handleDownload(report.id, report.reportName)}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '10px', fontSize: '0.9rem', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              >
                                📥 Download
                              </button>
                              {roleName === 'Pathologist' && (
                                <button
                                  onClick={() => handleDelete(report.id)}
                                  className="btn"
                                  style={{ padding: '10px 14px', fontSize: '0.9rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}

            {/* Medical Imaging (Only for Doctors) */}
            {activeTab === 'imaging' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '24px' }}>
                {/* Upload Form */}
                <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', borderLeft: '4px solid #ec4899' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '20px', color: '#ec4899', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📤 Upload Medical Imaging Record
                  </h3>
                  
                  {formError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {formError}</div>}
                  {formSuccess && <div className="alert alert-success" style={{ marginBottom: '16px', background: '#10b98120', color: '#10b981', border: '1px solid #10b98130', padding: '12px', borderRadius: 'var(--radius-sm)' }}>✓ {formSuccess}</div>}

                  <form onSubmit={handleImagingUpload} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    {/* Left Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Report Title *</label>
                        <input
                          className="form-input"
                          required
                          value={uploadTitle}
                          onChange={e => setUploadTitle(e.target.value)}
                          placeholder="e.g. Chest X-Ray AP View"
                          style={{ width: '100%' }}
                        />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Imaging Type *</label>
                          <select
                            className="form-input"
                            value={uploadType}
                            onChange={e => setUploadType(e.target.value)}
                            style={{ width: '100%', background: 'var(--bg-tertiary)' }}
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
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Hospital/Clinic Name *</label>
                          <input
                            className="form-input"
                            required
                            value={uploadHospital}
                            onChange={e => setUploadHospital(e.target.value)}
                            placeholder="e.g. City Diagnostic Center"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Description</label>
                        <textarea
                          className="form-input"
                          rows={3}
                          value={uploadDesc}
                          onChange={e => setUploadDesc(e.target.value)}
                          placeholder="Enter a brief summary of findings..."
                          style={{ width: '100%', resize: 'vertical' }}
                        />
                      </div>
                    </div>

                    {/* Right File Upload Zone */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Upload File *</label>
                        <div 
                          onClick={() => document.getElementById('imaging-file-input').click()}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault();
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              setUploadFile(e.dataTransfer.files[0]);
                            }
                          }}
                          style={{
                            border: '2px dashed var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            padding: '30px 20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: uploadFile ? 'rgba(236, 72, 153, 0.05)' : 'var(--bg-tertiary)',
                            borderColor: uploadFile ? '#ec4899' : 'var(--border-subtle)',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#ec4899'}
                          onMouseLeave={e => { if(!uploadFile) e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
                        >
                          <input
                            id="imaging-file-input"
                            type="file"
                            style={{ display: 'none' }}
                            onChange={e => e.target.files && setUploadFile(e.target.files[0])}
                          />
                          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
                          {uploadFile ? (
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0, color: 'var(--text-primary)' }}>{uploadFile.name}</p>
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
                                {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB · {uploadFile.name.substring(uploadFile.name.lastIndexOf('.')).toUpperCase()}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0, color: 'var(--text-secondary)' }}>Drag & Drop file here or Click to Browse</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '6px 0 0 0' }}>
                                Supported formats: PDF, JPG, JPEG, PNG, DICOM (.dcm)<br/>Max size: 50MB
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: '20px' }}>
                        {isUploading && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                              <span>Uploading...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #ec4899, #8b5cf6)', transition: 'width 0.1s ease-out' }}></div>
                            </div>
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={isUploading}
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                            border: 'none',
                            color: '#fff',
                            fontWeight: 700,
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            opacity: isUploading ? 0.7 : 1
                          }}
                        >
                          {isUploading ? 'Uploading...' : '📤 Upload Imaging File'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Uploaded records list */}
                <h3 style={{ fontWeight: 700, marginBottom: '16px', color: '#ec4899' }}>📋 Uploaded Imaging Records</h3>
                {imagingRecords.length === 0 ? (
                  <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No medical imaging records found for this patient.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {imagingRecords.map((record) => {
                      const typeIcon = {
                        'X-Ray': '🦴',
                        'MRI': '🧠',
                        'CT Scan': '🌀',
                        'Ultrasound': '🔊',
                        'ECG': '🫀'
                      }[record.imagingType] || '📷';

                      return (
                        <div key={record.id} className="glass-card" style={{ padding: '20px', borderLeft: '3px solid #ec4899', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ec4899', margin: 0 }}>
                                {typeIcon} {record.title}
                              </h4>
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
                                <strong>Type:</strong> {record.imagingType}
                              </p>
                            </div>
                            <span className="badge badge-primary">
                              {record.uploadedAt ? new Date(record.uploadedAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                            <div><strong>Hospital:</strong> {record.hospitalName}</div>
                            <div><strong>Size:</strong> {(record.fileSize / (1024 * 1024)).toFixed(2)} MB</div>
                            <div><strong>Uploaded By:</strong> @{record.doctorUserName}</div>
                            <div><strong>Format:</strong> {record.fileType}</div>
                          </div>

                          {record.description && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0', lineHeight: 1.4 }}>
                              <strong>Description:</strong> {record.description}
                            </p>
                          )}

                          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                            {record.fileType !== 'DCM' ? (
                              <button
                                onClick={() => handleImagingView(record.id, record.fileType, record.title)}
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '8px', fontSize: '0.85rem', borderColor: '#ec489930', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              >
                                👁️ View
                              </button>
                            ) : (
                              <div style={{ flex: 1, padding: '8px', fontSize: '0.78rem', background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                📦 DICOM (Download only)
                              </div>
                            )}
                            <button
                              onClick={() => handleImagingDownload(record.id, record.title + '.' + record.fileType.toLowerCase())}
                              className="btn btn-primary"
                              style={{ flex: 1, padding: '8px', fontSize: '0.85rem', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              📥 Download
                            </button>
                            <button
                              onClick={() => handleImagingDelete(record.id)}
                              className="btn"
                              style={{ padding: '8px 12px', fontSize: '0.85rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* File Preview Modal */}
          <AnimatePresence>
            {previewUrl && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(10, 15, 26, 0.85)', backdropFilter: 'blur(8px)',
                  zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '20px'
                }}
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }} 
                  animate={{ scale: 1, y: 0 }} 
                  exit={{ scale: 0.9, y: 20 }}
                  className="glass-card"
                  style={{
                    width: '100%', maxWidth: '800px', background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                  }}
                >
                  {/* Modal Header */}
                  <div style={{
                    padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      👁️ {previewName}
                    </h3>
                    <button 
                      onClick={() => {
                        window.URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }}
                      className="btn"
                      style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                    >
                      ✕ Close
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div style={{ padding: '24px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)' }}>
                    {previewType.includes('pdf') ? (
                      <iframe 
                        src={previewUrl} 
                        title="Report PDF" 
                        style={{ width: '100%', height: '60vh', border: 'none', borderRadius: 'var(--radius-sm)' }} 
                      />
                    ) : (
                      <img 
                        src={previewUrl} 
                        alt="Report Preview" 
                        style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} 
                      />
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
    </>
  );
}
