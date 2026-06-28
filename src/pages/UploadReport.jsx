import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function UploadReport() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    patientHealthCardId: '',
    testName: '',
    findings: '',
    remarks: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientHealthCardId || !form.testName || !form.findings) {
      setError('Please fill all required fields');
      return;
    }
    if (!file) {
      setError('Please select a report file to upload');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Create a lab test request
      const testRes = await API.post('/lab/requestTest', {
        doctorUserName: 'self-upload',
        patientHealthCardId: form.patientHealthCardId,
        testName: form.testName,
        notes: form.remarks || '',
      });

      // Step 2: Pass the generated test request ID to report upload
      const formData = new FormData();
      formData.append('labTestRequestId', testRes.data.id);
      formData.append('pathologistUserName', user?.userName || 'pathologist');
      formData.append('findings', form.findings);
      formData.append('remarks', form.remarks || '');
      formData.append('file', file);

      await API.post('/lab/uploadReport', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(t('uploadReport.success'));
      // Removed form reset to keep fields visible until manually cleared
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || t('uploadReport.error'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '14px 18px', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none',
    transition: 'border 0.2s',
  };
  const labelStyle = {
    fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)',
    marginBottom: '8px', display: 'block', textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="page-header">
              <h1>🔬 {t('uploadReport.title')}</h1>
              <p>{t('uploadReport.subtitle')}</p>
            </div>

            <div className="glass-card" style={{ padding: '32px', maxWidth: '700px' }}>
              {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}
              {success && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="alert alert-success" style={{ marginBottom: '16px' }}>
                  ✅ {success}
                </motion.div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>{t('uploadReport.patientHealthCard')} *</label>
                  <input style={inputStyle} name="patientHealthCardId" value={form.patientHealthCardId}
                    onChange={handleChange} placeholder="e.g. PUN00000001" required />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>{t('uploadReport.testName')} *</label>
                  <input style={inputStyle} name="testName" value={form.testName}
                    onChange={handleChange} placeholder="e.g. Complete Blood Count, Lipid Profile" required />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>{t('uploadReport.findings')} *</label>
                  <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} name="findings"
                    value={form.findings} onChange={handleChange}
                    placeholder="Enter detailed findings / test results..." required />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>{t('uploadReport.remarks')}</label>
                  <input style={inputStyle} name="remarks" value={form.remarks}
                    onChange={handleChange} placeholder="Any additional notes..." />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>{t('uploadReport.selectFile')} *</label>
                  <div style={{
                    padding: '20px', borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--border-subtle)', textAlign: 'center',
                    background: 'var(--bg-tertiary)', cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                    onClick={() => document.getElementById('reportFile').click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#ec4899'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border-subtle)'; setFile(e.dataTransfer.files[0]); }}
                  >
                    <input id="reportFile" type="file" accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={(e) => setFile(e.target.files[0])} />
                    {file ? (
                      <p style={{ color: '#ec4899', fontWeight: 600 }}>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                    ) : (
                      <>
                        <p style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</p>
                        <p style={{ color: 'var(--text-secondary)' }}>Click or drag file here</p>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '4px' }}>Supports PDF, JPG, PNG</p>
                      </>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
                    background: loading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    border: 'none', color: '#fff', fontWeight: 700, fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  }}>
                  {loading ? t('uploadReport.uploading') : `📤 ${t('uploadReport.upload')}`}
                </button>
              </form>
            </div>
          </motion.div>
    </>
  );
}
