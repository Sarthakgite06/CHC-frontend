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

  const handleView = async (reportId, fileType) => {
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
      window.open(fileUrl, '_blank');
    } catch (err) {
      console.error('Failed to view file:', err);
      alert('Could not view file. Please check permissions or try again.');
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
                            onClick={() => handleView(report.id, report.fileType)}
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
    </>
  );
}
