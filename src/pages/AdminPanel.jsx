import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

const ROLE_COLORS = { Doctor: '#8b5cf6', Chemist: '#f59e0b', User: '#00e6d9', Patient: '#00e6d9', Admin: '#f43f5e' };
const PIE_COLORS = ['#00e6d9', '#8b5cf6', '#f59e0b', '#f43f5e', '#10b981'];

export default function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [districtStats, setDistrictStats] = useState([]);
  const [roleStats, setRoleStats] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyType, setVerifyType] = useState('doctor');
  const [verifyResult, setVerifyResult] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [newMember, setNewMember] = useState({ userName: '', email: '', password: '', firstName: '', lastName: '' });
  const [memberMsg, setMemberMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, u, d, r, f] = await Promise.all([
        API.get('/admin/stats'), API.get('/admin/users'),
        API.get('/admin/district-stats'), API.get('/admin/role-stats'),
        API.get('/admin/feedbacks'),
      ]);
      setStats(s.data); setUsers(u.data);
      setDistrictStats(d.data); setRoleStats(r.data);
      setFeedbacks(f.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const verifyCredential = async () => {
    if (!verifyInput) return;
    try {
      const res = await API.get(`/admin/verify-${verifyType}/${verifyInput}`);
      setVerifyResult(res.data);
    } catch { setVerifyResult({ verified: false, message: 'Verification failed' }); }
  };

  const respondFeedback = async (id) => {
    if (!responseText) return;
    try {
      await API.put(`/admin/feedbacks/${id}/respond`, { response: responseText, status: 'RESOLVED' });
      setResponseText('');
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const addTeamMember = async () => {
    if (!newMember.userName || !newMember.email || !newMember.password) {
      setMemberMsg('Username, email and password are required');
      return;
    }
    try {
      const res = await API.post('/admin/create-member', newMember);
      setMemberMsg(res.data.msg || 'Team member added!');
      setNewMember({ userName: '', email: '', password: '', firstName: '', lastName: '' });
      fetchAll();
    } catch (err) {
      setMemberMsg(err.response?.data?.msg || 'Failed to add member');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchFilter = filter === 'All' || u.role === filter;
    const matchSearch = !searchTerm || [u.userName, u.firstName, u.lastName, u.email, u.healthCardNo]
      .some(f => f?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users', label: '👥 Registered Users' },
    { id: 'verify', label: '✅ Verification' },
    { id: 'feedback', label: '💬 Feedback' },
    { id: 'team', label: '👤 Team' },
  ];

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Navbar />
        <div className="dashboard-content">
          <div className="page-header">
            <h1>🛡️ Admin Control Panel</h1>
            <p>System-wide monitoring, user management, and analytics</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)', fontWeight: 600,
                  background: tab === t.id ? '#f43f5e20' : 'var(--bg-tertiary)',
                  color: tab === t.id ? '#f43f5e' : 'var(--text-secondary)',
                  border: `1px solid ${tab === t.id ? '#f43f5e40' : 'var(--border-subtle)'}`,
                  cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? <div className="loading-container"><div className="loading-spinner"></div></div> : (
            <>
              {/* OVERVIEW TAB */}
              {tab === 'overview' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* Stats Cards */}
                  <div className="stats-grid">
                    {[
                      { icon: '👥', label: 'Registered Users', value: stats?.totalRegistered || 0, color: '#00e6d9' },
                      { icon: '🩺', label: 'Doctors', value: stats?.doctors || 0, color: '#8b5cf6' },
                      { icon: '💊', label: 'Chemists', value: stats?.chemists || 0, color: '#f59e0b' },
                      { icon: '🏥', label: 'Patients', value: stats?.patients || 0, color: '#10b981' },
                    ].map((s, i) => (
                      <motion.div key={i} className="glass-card stat-card" whileHover={{ scale: 1.02 }}
                        style={{ borderLeft: `3px solid ${s.color}` }}>
                        <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color, fontSize: '1.3rem' }}>{s.icon}</div>
                        <div className="stat-info"><h3 style={{ fontSize: '2rem' }}>{s.value}</h3><p>{s.label}</p></div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Charts Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                    {/* Pie Chart - Role Distribution */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '16px' }}>📊 Role Distribution</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={roleStats} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={100} label={({ role, count }) => `${role}: ${count}`}>
                            {roleStats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2a2f3e', borderRadius: '8px' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Bar Chart - District Distribution */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '16px' }}>🗺️ District-wise Registrations</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={districtStats.slice(0, 10)}>
                          <XAxis dataKey="district" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                          <YAxis tick={{ fill: '#94a3b8' }} />
                          <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2a2f3e', borderRadius: '8px' }} />
                          <Bar dataKey="count" fill="#00e6d9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Feedback Stats */}
                  <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '16px' }}>💬 Feedback Overview</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      {[
                        { label: 'Open', value: stats?.feedbackOpen || 0, color: '#f59e0b' },
                        { label: 'In Progress', value: stats?.feedbackInProgress || 0, color: '#8b5cf6' },
                        { label: 'Resolved', value: stats?.feedbackResolved || 0, color: '#10b981' },
                      ].map((f, i) => (
                        <div key={i} style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${f.color}`, textAlign: 'center' }}>
                          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: f.color }}>{f.value}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{f.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* USERS TAB */}
              {tab === 'users' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="glass-card" style={{ padding: '20px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['All', 'Doctor', 'Chemist', 'User'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                          style={{ padding: '7px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                            background: filter === f ? (ROLE_COLORS[f] || '#00e6d9') + '25' : 'var(--bg-tertiary)',
                            color: filter === f ? ROLE_COLORS[f] || '#00e6d9' : 'var(--text-secondary)',
                            border: `1px solid ${filter === f ? (ROLE_COLORS[f] || '#00e6d9') + '50' : 'var(--border-subtle)'}` }}>
                          {f === 'User' ? 'Patient' : f} ({f === 'All' ? users.filter(u => u.role !== 'Admin').length : users.filter(u => u.role === f).length})
                        </button>
                      ))}
                    </div>
                    <input style={{ ...inputStyle, flex: 1, minWidth: '200px' }} placeholder="🔍 Search..."
                      value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead><tr><th>User</th><th>Role</th><th>Health Card</th><th>District</th><th>Contact</th><th>Registered</th></tr></thead>
                        <tbody>
                          {filteredUsers.map((u, i) => (
                            <tr key={i}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${ROLE_COLORS[u.role] || '#00e6d9'}, ${ROLE_COLORS[u.role] || '#00e6d9'}88)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#0a0f1a' }}>
                                    {u.userName?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <div>
                                    <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.firstName} {u.lastName}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>@{u.userName}</p>
                                  </div>
                                </div>
                              </td>
                              <td><span className="badge" style={{ background: `${ROLE_COLORS[u.role] || '#00e6d9'}20`, color: ROLE_COLORS[u.role] || '#00e6d9' }}>{u.role}</span></td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600, color: u.role === 'Admin' ? 'var(--text-tertiary)' : '#00e6d9' }}>{u.role === 'Admin' ? '— (Platform)' : (u.healthCardNo || '—')}</td>
                              <td>{u.district}</td>
                              <td>{u.contactNo || '—'}</td>
                              <td>{u.createdAt || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* VERIFICATION TAB */}
              {tab === 'verify' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="glass-card" style={{ padding: '28px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '20px' }}>✅ Verify Doctor / Chemist Credentials</h3>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      {['doctor', 'chemist'].map(t => (
                        <button key={t} onClick={() => { setVerifyType(t); setVerifyResult(null); }}
                          style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer',
                            background: verifyType === t ? (t === 'doctor' ? '#8b5cf6' : '#f59e0b') + '20' : 'var(--bg-tertiary)',
                            color: verifyType === t ? (t === 'doctor' ? '#8b5cf6' : '#f59e0b') : 'var(--text-secondary)',
                            border: `1px solid ${verifyType === t ? (t === 'doctor' ? '#8b5cf6' : '#f59e0b') + '40' : 'var(--border-subtle)'}` }}>
                          {t === 'doctor' ? '🩺 Doctor' : '💊 Chemist'}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder={`Enter ${verifyType} registration number...`}
                        value={verifyInput} onChange={e => setVerifyInput(e.target.value)} />
                      <button onClick={verifyCredential} className="btn btn-primary" style={{ padding: '12px 28px' }}>Verify</button>
                    </div>

                    {verifyResult && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: '20px', padding: '20px', borderRadius: 'var(--radius-md)',
                          background: verifyResult.verified ? '#10b98110' : '#f43f5e10',
                          border: `1px solid ${verifyResult.verified ? '#10b98140' : '#f43f5e40'}` }}>
                        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: verifyResult.verified ? '#10b981' : '#f43f5e', marginBottom: '8px' }}>
                          {verifyResult.verified ? '✅ Verified Successfully' : '❌ Not Verified'}
                        </p>
                        {verifyResult.verified ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginTop: '12px' }}>
                            {[
                              { label: 'Name', value: verifyResult.doctorName || verifyResult.chemistName },
                              { label: 'Health Card', value: verifyResult.healthCardNo },
                              { label: 'District', value: verifyResult.district },
                              { label: 'Registered', value: verifyResult.registeredOn },
                            ].map((f, i) => (
                              <div key={i} style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{f.label}</p>
                                <p style={{ fontWeight: 600 }}>{f.value || '—'}</p>
                              </div>
                            ))}
                          </div>
                        ) : <p style={{ color: 'var(--text-secondary)' }}>{verifyResult.message}</p>}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* FEEDBACK TAB */}
              {tab === 'feedback' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {feedbacks.length === 0 ? (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                      <p style={{ fontSize: '2rem' }}>📭</p><p style={{ color: 'var(--text-secondary)' }}>No feedback tickets yet</p>
                    </div>
                  ) : feedbacks.map((fb, i) => (
                    <motion.div key={fb.feedbackId || i} className="glass-card"
                      style={{ padding: '20px', marginBottom: '16px', borderLeft: `3px solid ${fb.status === 'RESOLVED' ? '#10b981' : fb.status === 'IN_PROGRESS' ? '#8b5cf6' : '#f59e0b'}` }}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                        <div>
                          <h4 style={{ fontWeight: 700 }}>{fb.subject}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>From: {fb.userName} ({fb.healthCardNo}) · {fb.createdDate}</p>
                        </div>
                        <span className="badge" style={{
                          background: fb.status === 'RESOLVED' ? '#10b98120' : fb.status === 'IN_PROGRESS' ? '#8b5cf620' : '#f59e0b20',
                          color: fb.status === 'RESOLVED' ? '#10b981' : fb.status === 'IN_PROGRESS' ? '#8b5cf6' : '#f59e0b',
                        }}>{fb.status}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>{fb.message}</p>
                      {fb.adminResponse && (
                        <div style={{ padding: '12px', background: '#10b98108', border: '1px solid #10b98120', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
                          <p style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>Admin Response:</p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{fb.adminResponse}</p>
                        </div>
                      )}
                      {fb.status !== 'RESOLVED' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input style={{ ...inputStyle, flex: 1 }} placeholder="Type your response..."
                            value={responseText} onChange={e => setResponseText(e.target.value)} />
                          <button onClick={() => respondFeedback(fb.feedbackId)} className="btn btn-primary" style={{ padding: '10px 20px' }}>Send</button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* TEAM TAB — Add new admin team members */}
              {tab === 'team' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px' }}>👤 Add Team Member</h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '20px' }}>Invite new members to the CHC monitoring platform</p>

                    {memberMsg && (
                      <div style={{ padding: '10px 16px', marginBottom: '16px', borderRadius: 'var(--radius-md)',
                        background: memberMsg.includes('success') || memberMsg.includes('added') ? '#10b98115' : '#f43f5e15',
                        border: `1px solid ${memberMsg.includes('success') || memberMsg.includes('added') ? '#10b98140' : '#f43f5e40'}`,
                        color: memberMsg.includes('success') || memberMsg.includes('added') ? '#10b981' : '#f43f5e',
                        fontWeight: 600, fontSize: '0.9rem' }}>
                        {memberMsg}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>First Name</label>
                        <input style={inputStyle} value={newMember.firstName} onChange={e => setNewMember(m => ({ ...m, firstName: e.target.value }))} placeholder="First name" />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Last Name</label>
                        <input style={inputStyle} value={newMember.lastName} onChange={e => setNewMember(m => ({ ...m, lastName: e.target.value }))} placeholder="Last name" />
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Username *</label>
                      <input style={inputStyle} value={newMember.userName} onChange={e => setNewMember(m => ({ ...m, userName: e.target.value }))} placeholder="team_member_username" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email *</label>
                        <input style={inputStyle} type="email" value={newMember.email} onChange={e => setNewMember(m => ({ ...m, email: e.target.value }))} placeholder="member@chc.com" />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Password *</label>
                        <input style={inputStyle} type="password" value={newMember.password} onChange={e => setNewMember(m => ({ ...m, password: e.target.value }))} placeholder="Strong password" />
                      </div>
                    </div>
                    <button onClick={addTeamMember} className="btn btn-primary" style={{ padding: '12px 32px' }}>➕ Add to Team</button>
                  </div>

                  {/* Current Team Members */}
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '16px' }}>🛡️ Current Team ({users.filter(u => u.role === 'Admin').length})</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {users.filter(u => u.role === 'Admin').map((m, i) => (
                      <div key={i} className="glass-card" style={{ padding: '20px', borderLeft: '3px solid #f43f5e' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #f43f5e, #f43f5e88)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#0a0f1a' }}>
                            {m.userName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600 }}>{m.firstName} {m.lastName}</p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>@{m.userName}</p>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{m.email}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Joined: {m.createdAt || '—'}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
