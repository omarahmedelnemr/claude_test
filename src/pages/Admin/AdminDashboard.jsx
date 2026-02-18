import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, MessageSquare, FileText, BarChart3,
  Bell, AlertTriangle, CheckCircle,
  Shield, ChevronRight, TrendingUp,
} from 'lucide-react';
import api from '../../services/api';
import '../Student/StudentDashboard.css';
import './AdminDashboard.css';

// ─── Shared helpers ─────────────────────────────────────────────────────────
const Toast = ({ msg, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!msg) return null;
  const isOk = msg.type === 'success';
  return (
    <div className={`ad-toast ${isOk ? 'ad-toast--ok' : 'ad-toast--err'}`}>
      {isOk ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      <span>{msg.text}</span>
      <button onClick={onClose}>✕</button>
    </div>
  );
};

const StatCard = ({ icon, bg, value, label }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ backgroundColor: bg }}>{icon}</div>
    <div className="stat-info">
      <h3>{value ?? '—'}</h3>
      <p>{label}</p>
    </div>
  </div>
);

// ─── Overview Tab ────────────────────────────────────────────────────────────
const OverviewTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/students-number'),
      api.get('/admin/teachers-number'),
      api.get('/admin/articles-number'),
      api.get('/admin/posts-number'),
      api.get('/admin/course-status'),
      api.get('/admin/supervisors-list'),
    ]).then(([s, t, a, p, c, sv]) => {
      setData({
        students:    s.data?.number ?? 0,
        teachers:    t.data?.number ?? 0,
        articles:    a.data?.number ?? 0,
        posts:       p.data?.number ?? 0,
        courses:     c.data ?? { scheduled: 0, completed: 0, canceled: 0 },
        supervisors: Array.isArray(sv.data) ? sv.data.length : 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ad-loading"><span className="ad-spinner" />Loading metrics…</div>;
  if (!data)   return <div className="ad-error">Failed to load metrics.</div>;

  const totalCourses = data.courses.scheduled + data.courses.completed + data.courses.canceled;
  const courseRows = [
    { label: 'Scheduled', value: data.courses.scheduled, color: '#2196f3', bg: '#e3f2fd' },
    { label: 'Completed', value: data.courses.completed, color: '#4caf50', bg: '#e8f5e9' },
    { label: 'Canceled',  value: data.courses.canceled,  color: '#f44336', bg: '#ffebee' },
  ];

  return (
    <div className="ad-section">
      {/* Main stat cards */}
      <div className="stats-grid">
        <StatCard icon={<Users      size={26} color="#2196f3" />} bg="#e3f2fd" value={data.students}    label="Students" />
        <StatCard icon={<BookOpen   size={26} color="#4caf50" />} bg="#e8f5e9" value={data.teachers}    label="Teachers" />
        <StatCard icon={<FileText   size={26} color="#ff9800" />} bg="#fff3e0" value={data.articles}    label="Articles" />
        <StatCard icon={<MessageSquare size={26} color="#9c27b0" />} bg="#f3e5f5" value={data.posts}    label="Community Posts" />
        <StatCard icon={<Shield     size={26} color="#607d8b" />} bg="#eceff1" value={data.supervisors} label="Supervisors" />
        <StatCard icon={<TrendingUp size={26} color="#e91e63" />} bg="#fce4ec" value={totalCourses}     label="Total Courses" />
      </div>

      {/* Course status breakdown */}
      <div className="ad-card">
        <h3 className="ad-card__title"><BarChart3 size={18} /> Course Status Breakdown</h3>
        <div className="ad-status-list">
          {courseRows.map(r => (
            <div key={r.label} className="ad-status-row">
              <div className="ad-status-row__label">
                <span className="ad-status-row__dot" style={{ background: r.color }} />
                {r.label}
              </div>
              <div className="ad-status-row__bar-wrap">
                <div
                  className="ad-status-row__bar"
                  style={{
                    width: totalCourses ? `${(r.value / totalCourses) * 100}%` : '0%',
                    background: r.color,
                  }}
                />
              </div>
              <span className="ad-status-row__count" style={{ color: r.color }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="ad-card">
        <h3 className="ad-card__title"><Bell size={18} /> Quick Actions</h3>
        <div className="ad-quick-actions">
          <Link to="/admin/send-notification" className="ad-action-card">
            <Bell size={22} color="#1976d2" />
            <div>
              <p className="ad-action-card__title">Send Notification</p>
              <p className="ad-action-card__desc">Push alert to selected users via Firebase</p>
            </div>
            <ChevronRight size={18} className="ad-action-card__arrow" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── Main AdminDashboard ─────────────────────────────────────────────────────
const AdminDashboard = () => (
  <div className="container">
    <div className="dashboard-header">
      <h1>Admin Dashboard</h1>
      <p>Platform overview and quick actions</p>
    </div>
    <OverviewTab />
  </div>
);

export default AdminDashboard;
