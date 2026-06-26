import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

export default function VerifyPrescription() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

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
    setSearchQuery(`${s.firstName} ${s.lastName} (${s.healthCardNo})`);
    setShowSuggestions(false);
    fetchRecords(s.healthCardNo, s.userName);
  };

  const fetchRecords = async (cardNo, uName) => {
    setLoading(true); setError(''); setRecords(null);
    try {
      const params = new URLSearchParams();
      if (cardNo) params.append('healthCardNo', cardNo);
      if (uName) params.append('userName', uName);
      const res = await API.get(`/chc/getPatientMedicalHistory?${params}`);
      setRecords(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'No prescriptions found for this patient');
    } finally { setLoading(false); }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Navbar />
        <div className="dashboard-content">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="page-header">
              <h1>✅ Verify Prescription</h1>
              <p>Search a patient and verify their prescriptions before dispensing medication</p>
            </div>

            {/* Search */}
            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', borderLeft: '3px solid #f59e0b' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b', marginBottom: '10px', display: 'block' }}>🔍 Search Patient</label>
              <div ref={searchRef} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input className="form-input" placeholder="Type patient name or health card ID..."
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      style={{ width: '100%', padding: '14px 18px', fontSize: '1rem' }} />
                    <AnimatePresence>
                      {showSuggestions && suggestions.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginTop: '4px',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.4)', maxHeight: '240px', overflowY: 'auto' }}>
                          {suggestions.map((s, i) => (
                            <div key={i} onClick={() => selectSuggestion(s)}
                              style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>@{s.userName}</span></span>
                              <span style={{ fontFamily: 'monospace', color: '#f59e0b', fontWeight: 600 }}>{s.healthCardNo}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button onClick={() => { const q = searchQuery.trim(); fetchRecords(q, q); }} className="btn btn-primary" style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                    Verify
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}
            {loading && <div className="loading-container"><div className="loading-spinner"></div></div>}

            {/* Prescription Records */}
            {records?.medicalRecordResponseDTOList?.map((record, idx) => (
              <motion.div key={idx} className="glass-card" style={{ padding: '24px', marginBottom: '16px', borderLeft: '3px solid #f59e0b' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ fontWeight: 700 }}>Prescription #{idx + 1}</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Patient: {records.patientEntity?.userName}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge" style={{ background: '#f59e0b20', color: '#f59e0b' }}>{record.createdDate}</span>
                    <span className="badge" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>Dr. #{record.doctorRegNo}</span>
                  </div>
                </div>
                <table className="data-table">
                  <thead><tr><th>Medicine</th><th>Days</th><th>Morning</th><th>Afternoon</th><th>Night</th><th>Remark</th></tr></thead>
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
                <div style={{ marginTop: '12px', padding: '10px 14px', background: '#10b98108', borderRadius: 'var(--radius-sm)', border: '1px solid #10b98120' }}>
                  <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>✅ Prescription verified — safe to dispense</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
