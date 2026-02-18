import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, MessageSquare, FileText, BarChart3,
  Bell, AlertTriangle, CheckCircle,
  Shield, ChevronRight, TrendingUp,
  UserCheck, Calendar, CheckCircle2, XCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import adminAnalyticsService from '../../services/adminAnalyticsService';
import TimeRangePicker from '../../components/Admin/TimeRangePicker';
import AnalyticsChart from '../../components/Admin/AnalyticsChart';
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
      api.get('/admin/parents-number'),
      api.get('/admin/articles-number'),
      api.get('/admin/posts-number'),
      api.get('/admin/course-status'),
      api.get('/admin/appointment-status-counts'),
      api.get('/admin/supervisors-list'),
    ]).then(([s, t, par, a, p, c, app, sv]) => {
      setData({
        students:    s.data?.number ?? 0,
        teachers:    t.data?.number ?? 0,
        parents:     par.data?.number ?? 0,
        articles:    a.data?.number ?? 0,
        posts:       p.data?.number ?? 0,
        courses:     c.data ?? { scheduled: 0, completed: 0, canceled: 0 },
        appointments: app.data ?? { scheduled: 0, completed: 0, canceled: 0 },
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
        <StatCard icon={<UserCheck  size={26} color="#9c27b0" />} bg="#f3e5f5" value={data.parents}     label="Parents" />
        <StatCard icon={<Shield     size={26} color="#607d8b" />} bg="#eceff1" value={data.supervisors} label="Supervisors" />
        <StatCard icon={<TrendingUp size={26} color="#e91e63" />} bg="#fce4ec" value={totalCourses}     label="Total Courses" />
        <StatCard icon={<FileText   size={26} color="#ff9800" />} bg="#fff3e0" value={data.articles}    label="Articles" />
        <StatCard icon={<MessageSquare size={26} color="#9c27b0" />} bg="#f3e5f5" value={data.posts}    label="Community Posts" />
        <StatCard icon={<Calendar   size={26} color="#2196f3" />} bg="#e3f2fd" value={data.appointments?.scheduled ?? 0} label="Active Appointments" />
        <StatCard icon={<CheckCircle2 size={26} color="#4caf50" />} bg="#e8f5e9" value={data.appointments?.completed ?? 0} label="Completed Appointments" />
        <StatCard icon={<XCircle    size={26} color="#f44336" />} bg="#ffebee" value={data.appointments?.canceled ?? 0} label="Cancelled Appointments" />
      </div>

    </div>
  );
};

// ─── Analytics Section ────────────────────────────────────────────────────────────
const AnalyticsSection = () => {
  // Default to last 30 days
  const getDefaultDates = () => {
    const today = new Date();
    const from = new Date();
    // Default to last 3 months (approx. 90 days)
    from.setDate(today.getDate() - 90);
    return {
      from: from.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };
  };

  const [fromDate, setFromDate] = useState(getDefaultDates().from);
  const [toDate, setToDate] = useState(getDefaultDates().to);
  
  // Loading states
  const [loading, setLoading] = useState({
    appointments: true,
    courses: true,
    registrations: true,
    posts: true,
    articles: true,
    blockedPosts: true,
    blockedArticles: true,
    appointmentStatus: true,
    userRoles: true
  });

  // Data states
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [coursesData, setCoursesData] = useState([]);
  const [registrationsData, setRegistrationsData] = useState([]);
  const [postsData, setPostsData] = useState([]);
  const [articlesData, setArticlesData] = useState([]);
  const [blockedPostsData, setBlockedPostsData] = useState([]);
  const [blockedArticlesData, setBlockedArticlesData] = useState([]);
  const [appointmentStatusData, setAppointmentStatusData] = useState({ scheduled: 0, completed: 0, canceled: 0 });
  const [userRolesData, setUserRolesData] = useState({ students: 0, teachers: 0, parents: 0 });

  // Error states
  const [errors, setErrors] = useState({});

  const fetchAllData = async () => {
    if (!fromDate || !toDate || fromDate > toDate) return;

    // Reset loading and errors
    setLoading({
      appointments: true,
      courses: true,
      registrations: true,
      posts: true,
      articles: true,
      blockedPosts: true,
      blockedArticles: true,
      appointmentStatus: true,
      userRoles: true
    });
    setErrors({});

    try {
      // Fetch all data in parallel
      const [
        appointments,
        courses,
        registrations,
        posts,
        articles,
        blockedPosts,
        blockedArticles,
        appointmentStatus,
        studentsCount,
        teachersCount,
        parentsCount
      ] = await Promise.allSettled([
        adminAnalyticsService.getAppointmentsOverTime(fromDate, toDate),
        adminAnalyticsService.getCoursesCreatedOverTime(fromDate, toDate),
        adminAnalyticsService.getUserRegistrationsOverTime(fromDate, toDate),
        adminAnalyticsService.getPostsOverTime(fromDate, toDate),
        adminAnalyticsService.getArticlesOverTime(fromDate, toDate),
        adminAnalyticsService.getBlockedPostsOverTime(fromDate, toDate),
        adminAnalyticsService.getBlockedArticlesOverTime(fromDate, toDate),
        api.get('/admin/appointment-status-counts'),
        api.get('/admin/students-number'),
        api.get('/admin/teachers-number'),
        api.get('/admin/parents-number')
      ]);

      // Process appointments
      if (appointments.status === 'fulfilled') {
        setAppointmentsData(appointments.value || []);
        setLoading(prev => ({ ...prev, appointments: false }));
      } else {
        setErrors(prev => ({ ...prev, appointments: 'Failed to load appointments data' }));
        setLoading(prev => ({ ...prev, appointments: false }));
      }

      // Process courses
      if (courses.status === 'fulfilled') {
        setCoursesData(courses.value || []);
        setLoading(prev => ({ ...prev, courses: false }));
      } else {
        setErrors(prev => ({ ...prev, courses: 'Failed to load courses data' }));
        setLoading(prev => ({ ...prev, courses: false }));
      }

      // Process registrations
      if (registrations.status === 'fulfilled') {
        setRegistrationsData(registrations.value || []);
        setLoading(prev => ({ ...prev, registrations: false }));
      } else {
        setErrors(prev => ({ ...prev, registrations: 'Failed to load registrations data' }));
        setLoading(prev => ({ ...prev, registrations: false }));
      }

      // Process posts
      if (posts.status === 'fulfilled') {
        setPostsData(posts.value || []);
        setLoading(prev => ({ ...prev, posts: false }));
      } else {
        setErrors(prev => ({ ...prev, posts: 'Failed to load posts data' }));
        setLoading(prev => ({ ...prev, posts: false }));
      }

      // Process articles
      if (articles.status === 'fulfilled') {
        setArticlesData(articles.value || []);
        setLoading(prev => ({ ...prev, articles: false }));
      } else {
        setErrors(prev => ({ ...prev, articles: 'Failed to load articles data' }));
        setLoading(prev => ({ ...prev, articles: false }));
      }

      // Process blocked posts
      if (blockedPosts.status === 'fulfilled') {
        setBlockedPostsData(blockedPosts.value || []);
        setLoading(prev => ({ ...prev, blockedPosts: false }));
      } else {
        setErrors(prev => ({ ...prev, blockedPosts: 'Failed to load blocked posts data' }));
        setLoading(prev => ({ ...prev, blockedPosts: false }));
      }

      // Process blocked articles
      if (blockedArticles.status === 'fulfilled') {
        setBlockedArticlesData(blockedArticles.value || []);
        setLoading(prev => ({ ...prev, blockedArticles: false }));
      } else {
        setErrors(prev => ({ ...prev, blockedArticles: 'Failed to load blocked articles data' }));
        setLoading(prev => ({ ...prev, blockedArticles: false }));
      }

      // Process appointment status
      if (appointmentStatus.status === 'fulfilled') {
        setAppointmentStatusData(appointmentStatus.value?.data || { scheduled: 0, completed: 0, canceled: 0 });
        setLoading(prev => ({ ...prev, appointmentStatus: false }));
      } else {
        setErrors(prev => ({ ...prev, appointmentStatus: 'Failed to load appointment status data' }));
        setLoading(prev => ({ ...prev, appointmentStatus: false }));
      }

      // Process user roles
      if (studentsCount.status === 'fulfilled' && teachersCount.status === 'fulfilled' && parentsCount.status === 'fulfilled') {
        setUserRolesData({
          students: studentsCount.value?.data?.number || 0,
          teachers: teachersCount.value?.data?.number || 0,
          parents: parentsCount.value?.data?.number || 0
        });
        setLoading(prev => ({ ...prev, userRoles: false }));
      } else {
        setErrors(prev => ({ ...prev, userRoles: 'Failed to load user roles data' }));
        setLoading(prev => ({ ...prev, userRoles: false }));
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [fromDate, toDate]);

  const handleDateRangeChange = (newFromDate, newToDate) => {
    if (newFromDate && newToDate && newFromDate <= newToDate) {
      setFromDate(newFromDate);
      setToDate(newToDate);
    }
  };

  // Format data for charts
  const formatMonthlyData = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      name: item.month ? `${item.month} ${item.year}` : item.date,
      value: item.count || 0
    }));
  };

  const combineMonthlySeries = (primary, secondary, key1, key2) => {
    const map = {};
    if (Array.isArray(primary)) {
      primary.forEach(item => {
        const name = item.month ? `${item.month} ${item.year}` : item.date;
        if (!map[name]) {
          map[name] = { name, [key1]: 0, [key2]: 0 };
        }
        map[name][key1] = item.count || 0;
      });
    }
    if (Array.isArray(secondary)) {
      secondary.forEach(item => {
        const name = item.month ? `${item.month} ${item.year}` : item.date;
        if (!map[name]) {
          map[name] = { name, [key1]: 0, [key2]: 0 };
        }
        map[name][key2] = item.count || 0;
      });
    }
    return Object.values(map);
  };

  const combineFourSeries = (data1, data2, data3, data4, key1, key2, key3, key4) => {
    const map = {};
    
    [data1, data2, data3, data4].forEach((data, index) => {
      const key = [key1, key2, key3, key4][index];
      if (Array.isArray(data)) {
        data.forEach(item => {
          const name = item.month ? `${item.month} ${item.year}` : item.date;
          if (!map[name]) {
            map[name] = { name, [key1]: 0, [key2]: 0, [key3]: 0, [key4]: 0 };
          }
          map[name][key] = item.count || 0;
        });
      }
    });
    
    return Object.values(map);
  };

  const formatRegistrationsData = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
      const name = item.month ? `${item.month} ${item.year}` : item.date;
      return {
        name,
        Students: item.students || 0,
        Teachers: item.teachers || 0,
        Parents: item.parents || 0
      };
    });
  };

  // Format appointment status data for pie chart
  const formatAppointmentStatusData = () => {
    const total = appointmentStatusData.scheduled + appointmentStatusData.completed + appointmentStatusData.canceled;
    if (total === 0) return [];
    
    return [
      { name: 'Active/Pending', value: appointmentStatusData.scheduled, color: '#2196f3' },
      { name: 'Completed', value: appointmentStatusData.completed, color: '#4caf50' },
      { name: 'Cancelled', value: appointmentStatusData.canceled, color: '#f44336' }
    ];
  };

  // Format user roles data for pie chart
  const formatUserRolesData = () => {
    const total = userRolesData.students + userRolesData.teachers + userRolesData.parents;
    if (total === 0) return [];
    
    return [
      { name: 'Students', value: userRolesData.students, color: '#2196f3' },
      { name: 'Teachers', value: userRolesData.teachers, color: '#4caf50' },
      { name: 'Parents', value: userRolesData.parents, color: '#9c27b0' }
    ];
  };

  return (
    <div className="ad-section">
      <div className="ad-time-range-wrapper">
        <TimeRangePicker
          fromDate={fromDate}
          toDate={toDate}
          onChange={handleDateRangeChange}
        />
      </div>

          <div className="ad-analytics-grid">
            {/* First Row: Appointments & Courses Over Months */}
            <AnalyticsChart
              title="Appointments & Courses Over Months"
              subtitle="Total appointments and courses by month"
              loading={loading.appointments || loading.courses}
              error={errors.appointments || errors.courses}
              className="ad-card"
            >
              <BarChart data={combineMonthlySeries(appointmentsData, coursesData, 'Appointments', 'Courses')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Appointments" fill="#3b82f6" name="Appointments" />
                <Bar dataKey="Courses" fill="#10b981" name="Courses" />
              </BarChart>
            </AnalyticsChart>

            {/* First Row: Posts, Articles, Blocked Posts & Blocked Articles Over Time */}
            <AnalyticsChart
              title="Posts, Articles & Blocked Content Over Time"
              subtitle="Posts, articles, and blocked content over time"
              loading={loading.posts || loading.articles || loading.blockedPosts || loading.blockedArticles}
              error={errors.posts || errors.articles || errors.blockedPosts || errors.blockedArticles}
              className="ad-card"
            >
              <LineChart data={combineFourSeries(
                articlesData,
                blockedArticlesData,
                postsData,
                blockedPostsData,
                'Articles',
                'Blocked Articles',
                'Posts',
                'Blocked Posts'
              )}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Articles" stroke="#ff9800" strokeWidth={2} dot={{ r: 4 }} name="Articles" />
                <Line type="monotone" dataKey="Blocked Articles" stroke="#ff5722" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Blocked Articles" />
                <Line type="monotone" dataKey="Posts" stroke="#9c27b0" strokeWidth={2} dot={{ r: 4 }} name="Posts" />
                <Line type="monotone" dataKey="Blocked Posts" stroke="#7b1fa2" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Blocked Posts" />
              </LineChart>
            </AnalyticsChart>

            {/* Second Row: Appointment Status Breakdown */}
            <AnalyticsChart
              title="Appointment Status Breakdown"
              subtitle="Distribution of appointment statuses"
              loading={loading.appointmentStatus}
              error={errors.appointmentStatus}
              className="ad-card"
            >
              <PieChart>
                <Pie
                  data={formatAppointmentStatusData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formatAppointmentStatusData().map((entry, index) => (
                    <Cell key={`appointment-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </AnalyticsChart>

            {/* Second Row: User Roles Breakdown */}
            <AnalyticsChart
              title="User Roles Breakdown"
              subtitle="Distribution of user roles"
              loading={loading.userRoles}
              error={errors.userRoles}
              className="ad-card"
            >
              <PieChart>
                <Pie
                  data={formatUserRolesData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formatUserRolesData().map((entry, index) => (
                    <Cell key={`user-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </AnalyticsChart>

            {/* Third Row: New Registered Users (Full Width) */}
            <AnalyticsChart
              title="New Registered Users"
              subtitle="User registrations by role over time"
              loading={loading.registrations}
              error={errors.registrations}
              className="ad-card ad-chart-full"
            >
              <LineChart data={formatRegistrationsData(registrationsData)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Students" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Teachers" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Parents" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </AnalyticsChart>
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
    <AnalyticsSection />
  </div>
);

export default AdminDashboard;
