import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import adminAnalyticsService from '../../services/adminAnalyticsService';
import TimeRangePicker from '../../components/Admin/TimeRangePicker';
import AnalyticsChart from '../../components/Admin/AnalyticsChart';
import { Calendar, TrendingUp } from 'lucide-react';
import './Analytics.css';

const Analytics = () => {
  // Default to last 30 days
  const getDefaultDates = () => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - 30);
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
    cancelled: true
  });

  // Data states
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [coursesData, setCoursesData] = useState([]);
  const [registrationsData, setRegistrationsData] = useState([]);
  const [postsData, setPostsData] = useState([]);
  const [articlesData, setArticlesData] = useState([]);
  const [cancelledData, setCancelledData] = useState({ total: 0, overTime: [] });

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
      cancelled: true
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
        cancelled
      ] = await Promise.allSettled([
        adminAnalyticsService.getAppointmentsOverTime(fromDate, toDate),
        adminAnalyticsService.getCoursesCreatedOverTime(fromDate, toDate),
        adminAnalyticsService.getUserRegistrationsOverTime(fromDate, toDate),
        adminAnalyticsService.getPostsOverTime(fromDate, toDate),
        adminAnalyticsService.getArticlesOverTime(fromDate, toDate),
        adminAnalyticsService.getCancelledAppointmentsCount(fromDate, toDate)
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

      // Process cancelled
      if (cancelled.status === 'fulfilled') {
        setCancelledData(cancelled.value || { total: 0, overTime: [] });
        setLoading(prev => ({ ...prev, cancelled: false }));
      } else {
        setErrors(prev => ({ ...prev, cancelled: 'Failed to load cancelled appointments data' }));
        setLoading(prev => ({ ...prev, cancelled: false }));
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

  return (
    <div className="container analytics-page">
      <div className="analytics-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Comprehensive insights into platform activity</p>
        </div>
        <div className="header-icon">
          <TrendingUp size={32} />
        </div>
      </div>

      <div className="time-range-section">
        <TimeRangePicker
          fromDate={fromDate}
          toDate={toDate}
          onChange={handleDateRangeChange}
        />
      </div>

      <div className="analytics-grid">
        {/* Appointments Over Months */}
        <AnalyticsChart
          title="Appointments Over Months"
          subtitle="Total appointments by month"
          loading={loading.appointments}
          error={errors.appointments}
          className="full-width"
        >
          <BarChart data={formatMonthlyData(appointmentsData)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" name="Appointments" />
          </BarChart>
        </AnalyticsChart>

        {/* Courses Created Over Months */}
        <AnalyticsChart
          title="Courses Created Over Months"
          subtitle="New courses created by month"
          loading={loading.courses}
          error={errors.courses}
          className="full-width"
        >
          <BarChart data={formatMonthlyData(coursesData)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#10b981" name="Courses" />
          </BarChart>
        </AnalyticsChart>

        {/* New Registered Users */}
        <AnalyticsChart
          title="New Registered Users"
          subtitle="User registrations by role over time"
          loading={loading.registrations}
          error={errors.registrations}
          className="full-width"
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

        {/* Community Posts Over Time */}
        <AnalyticsChart
          title="Community Posts Over Time"
          subtitle="Posts created over time"
          loading={loading.posts}
          error={errors.posts}
          className="full-width"
        >
          <LineChart data={formatMonthlyData(postsData)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#9c27b0" strokeWidth={2} dot={{ r: 4 }} name="Posts" />
          </LineChart>
        </AnalyticsChart>

        {/* Articles Over Time */}
        <AnalyticsChart
          title="Articles Over Time"
          subtitle="Articles published over time"
          loading={loading.articles}
          error={errors.articles}
          className="full-width"
        >
          <LineChart data={formatMonthlyData(articlesData)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#ff9800" strokeWidth={2} dot={{ r: 4 }} name="Articles" />
          </LineChart>
        </AnalyticsChart>

        {/* Cancelled Appointments */}
        <div className="cancelled-appointments-section">
          <AnalyticsChart
            title="Cancelled Appointments"
            subtitle="Total cancelled appointments"
            loading={loading.cancelled}
            error={errors.cancelled}
          >
            <div className="cancelled-stat">
              <div className="stat-value">{cancelledData.total || 0}</div>
              <div className="stat-label">Total Cancelled</div>
            </div>
          </AnalyticsChart>
          
          {cancelledData.overTime && cancelledData.overTime.length > 0 && (
            <AnalyticsChart
              title="Cancelled Appointments Trend"
              subtitle="Cancelled appointments over time"
              loading={false}
            >
              <BarChart data={formatMonthlyData(cancelledData.overTime)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#ef4444" name="Cancelled" />
              </BarChart>
            </AnalyticsChart>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;

