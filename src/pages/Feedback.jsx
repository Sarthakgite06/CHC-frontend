import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Feedback() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const roleName = user?.role?.replace('ROLE_', '') || 'User';

  useEffect(() => {
    fetchTickets();
    const dr = searchParams.get('dr');
    const date = searchParams.get('date');
    if (dr && date) {
      setSubject(`[Doctor ${dr}] - Feedback regarding Record on ${date}`);
    }
  }, [searchParams]);

  const fetchTickets = async () => {
    try {
      const endpoint = roleName === 'Doctor' ? '/feedback/doctor' : '/feedback/my';
      const res = await API.get(endpoint);
      setTickets(res.data || []);
    } catch { }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!subject || !message) { setError('Please fill all fields'); return; }
    setLoading(true); setError('');
    try {
      await API.post('/feedback/submit', { subject, message });
      setSuccess('Feedback submitted successfully!');
      setSubject(''); setMessage('');
      fetchTickets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit');
    } finally { setLoading(false); }
  };

  const roleColor = { Doctor: '#8b5cf6', Chemist: '#f59e0b', User: '#00e6d9', Patient: '#00e6d9', Admin: '#f43f5e' }[roleName] || '#00e6d9';
  const statusColors = { OPEN: '#f59e0b', IN_PROGRESS: '#8b5cf6', RESOLVED: '#10b981' };
  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' };

  return (
    <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="page-header">
              <h1>💬 Feedback & Support</h1>
              <p>Share your experience, report issues, or suggest improvements</p>
            </div>

            {/* Submit Form - Only for non-admins (or just let anyone submit) */}
            {roleName !== 'Admin' && (
            <div className="glass-card" style={{ padding: '28px', marginBottom: '24px', borderLeft: `3px solid ${roleColor}` }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '16px', color: roleColor }}>Submit New Feedback</h3>

              {success && <div style={{ padding: '12px', background: '#10b98115', border: '1px solid #10b98140', borderRadius: 'var(--radius-md)', marginBottom: '16px', color: '#10b981', fontWeight: 600 }}>✅ {success}</div>}
              {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}

              <form onSubmit={submitFeedback}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Subject</label>
                  <input style={inputStyle} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of your feedback" required />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Message</label>
                  <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue, suggestion, or experience in detail..." required />
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px 32px' }}>
                  {loading ? 'Submitting...' : '📨 Submit Feedback'}
                </button>
              </form>
            </div>
            )}

            {/* My Tickets */}
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '16px' }}>
              {roleName === 'Doctor' ? `📋 Patient Feedback for Me (${tickets.length})` : `📋 My Tickets (${tickets.length})`}
            </h3>

            {tickets.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</p>
                <p style={{ color: 'var(--text-secondary)' }}>No feedback tickets yet. Submit your first one above!</p>
              </div>
            ) : (
              tickets.map((t, i) => (
                <motion.div key={t.feedbackId || i} className="glass-card"
                  style={{ padding: '20px', marginBottom: '12px', borderLeft: `3px solid ${statusColors[t.status] || '#f59e0b'}` }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h4 style={{ fontWeight: 700 }}>{t.subject}</h4>
                    <span className="badge" style={{ background: `${statusColors[t.status]}20`, color: statusColors[t.status] }}>{t.status}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>{t.message}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Submitted: {t.createdDate}</p>

                  {t.adminResponse && (
                    <div style={{ marginTop: '12px', padding: '14px', background: '#10b98108', border: '1px solid #10b98120', borderRadius: 'var(--radius-sm)' }}>
                      <p style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, marginBottom: '4px' }}>🛡️ Admin Response ({t.resolvedDate})</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t.adminResponse}</p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
    </>
  );
}
