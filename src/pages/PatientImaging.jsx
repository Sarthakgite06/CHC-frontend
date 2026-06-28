import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import API from '../api/axios';

export default function PatientImaging() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  // Preview Modal States
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (user?.healthCardNo) {
      fetchImagingRecords(user.healthCardNo);
    }
  }, [user]);

  const fetchImagingRecords = async (cardNo) => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/medical-imaging/patient/${cardNo}`);
      setRecords(res.data || []);
    } catch (err) {
      console.error('Failed to fetch imaging records:', err);
      setError('Could not load imaging records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (recordId, fileType, title) => {
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
      setPreviewName(title || 'Imaging Report');
      setZoomLevel(1);
      setIsFullscreen(false);
    } catch (err) {
      console.error('Failed to view file:', err);
      alert('Could not view file. Please check permissions or try again.');
    }
  };

  const handleDownload = async (recordId, fileName) => {
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

  // Filtered & Sorted Records
  const processedRecords = records
    .filter((r) => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'All' || r.imagingType === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.uploadedAt || 0);
      const dateB = new Date(b.uploadedAt || 0);
      return sortBy === 'Newest' ? dateB - dateA : dateA - dateB;
    });

  const getIcon = (type) => {
    return {
      'X-Ray': '🦴',
      'MRI': '🧠',
      'CT Scan': '🌀',
      'Ultrasound': '🔊',
      'ECG': '🫀'
    }[type] || '📷';
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="page-header">
          <h1>📷 Medical Imaging Records</h1>
          <p>View, preview, and download your X-Rays, MRIs, CT Scans, ECGs, and Ultrasounds</p>
        </div>

        {/* Search & Filter bar */}
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 2, minWidth: '240px' }}>
            <input
              className="form-input"
              placeholder="🔍 Search by report title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <select
              className="form-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-secondary)' }}
            >
              <option value="All">All Imaging Types</option>
              <option value="X-Ray">🦴 X-Ray</option>
              <option value="MRI">🧠 MRI</option>
              <option value="CT Scan">🌀 CT Scan</option>
              <option value="Ultrasound">🔊 Ultrasound</option>
              <option value="ECG">🫀 ECG</option>
              <option value="Other">📷 Other</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '140px' }}>
            <select
              className="form-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-secondary)' }}
            >
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}
        {loading && <div className="loading-container"><div className="loading-spinner"></div></div>}

        {!loading && processedRecords.length === 0 && (
          <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            📭 No medical imaging records found matching your filters.
          </div>
        )}

        {/* Cards list */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {processedRecords.map((record) => (
            <motion.div
              key={record.id}
              className="glass-card"
              style={{
                padding: '24px',
                borderLeft: '4px solid var(--color-primary, #00e6d9)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {getIcon(record.imagingType)} {record.title}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-primary, #00e6d9)', fontWeight: 600 }}>
                    {record.imagingType}
                  </span>
                </div>
                <span className="badge badge-primary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                  {record.uploadedAt ? new Date(record.uploadedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: 'rgba(255,255,255,0.02)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div><strong>Hospital:</strong> {record.hospitalName}</div>
                <div><strong>Size:</strong> {(record.fileSize / (1024 * 1024)).toFixed(2)} MB</div>
                <div><strong>Uploaded By:</strong> Dr. @{record.doctorUserName}</div>
                <div><strong>Format:</strong> {record.fileType}</div>
              </div>

              {record.description && (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '4px 0', lineHeight: 1.4 }}>
                  <strong>Description:</strong> {record.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '12px' }}>
                {record.fileType !== 'DCM' ? (
                  <button
                    onClick={() => handleView(record.id, record.fileType, record.title)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '10px', fontSize: '0.9rem', borderColor: 'rgba(0, 230, 217, 0.3)', color: 'var(--color-primary, #00e6d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    👁️ View
                  </button>
                ) : (
                  <div style={{ flex: 1, padding: '10px', fontSize: '0.8rem', background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    📦 DICOM File
                  </div>
                )}
                <button
                  onClick={() => handleDownload(record.id, record.title + '.' + record.fileType.toLowerCase())}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '0.9rem', background: 'linear-gradient(135deg, var(--color-primary, #00e6d9), #8b5cf6)', color: '#0a0f1a', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  📥 Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Modern Preview Modal with Zoom/Fullscreen for Images */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(5, 8, 16, 0.92)', backdropFilter: 'blur(10px)',
              zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: isFullscreen ? '0' : '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: isFullscreen ? '100vw' : '880px',
                height: isFullscreen ? '100vh' : 'auto',
                background: 'var(--bg-secondary)',
                border: isFullscreen ? 'none' : '1px solid var(--border-subtle)',
                borderRadius: isFullscreen ? '0' : 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  👁️ {previewName}
                </h3>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {/* Zoom controls for non-PDFs */}
                  {!previewType.includes('pdf') && (
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
                      <button 
                        onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                        className="btn" 
                        style={{ padding: '4px 10px', fontSize: '0.85rem', cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--text-primary)' }}
                      >
                        ➖
                      </button>
                      <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', minWidth: '45px', justifyContent: 'center' }}>
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button 
                        onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                        className="btn" 
                        style={{ padding: '4px 10px', fontSize: '0.85rem', cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--text-primary)' }}
                      >
                        ➕
                      </button>
                    </div>
                  )}

                  {!previewType.includes('pdf') && (
                    <button 
                      onClick={() => setIsFullscreen(prev => !prev)}
                      className="btn"
                      style={{ padding: '8px 12px', fontSize: '0.85rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                    >
                      {isFullscreen ? '📺 Exit Fullscreen' : '📺 Fullscreen'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      window.URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }}
                    className="btn"
                    style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div style={{
                padding: '24px',
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'var(--bg-primary)',
                overflow: 'auto',
                minHeight: isFullscreen ? 'calc(100vh - 70px)' : '480px'
              }}>
                {previewType.includes('pdf') ? (
                  <iframe
                    src={previewUrl}
                    title="Imaging Report PDF"
                    style={{ width: '100%', height: isFullscreen ? '80vh' : '65vh', border: 'none', borderRadius: 'var(--radius-sm)' }}
                  />
                ) : (
                  <div style={{ overflow: 'auto', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img
                      src={previewUrl}
                      alt="Imaging Record Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: isFullscreen ? '80vh' : '65vh',
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-sm)',
                        transform: `scale(${zoomLevel})`,
                        transition: 'transform 0.15s ease-out'
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
