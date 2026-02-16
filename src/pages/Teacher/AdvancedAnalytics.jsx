import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import analyticsService from '../../services/analyticsService';
import courseService from '../../services/courseService';
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
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Target,
  Clock,
  Loader2
} from 'lucide-react';
import './AdvancedAnalytics.css';

const AdvancedAnalytics = () => {
  const { currentUser } = useAuth();
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Fetch teacher courses for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      if (currentUser?.id) {
        try {
          const response = await courseService.getTeacherCourses({
            teacherID: currentUser.id,
            limit: 1000,
            loadBlock: 1
          });
          const courses = Array.isArray(response) ? response : response.courses || response.data || [];
          setTeacherCourses(courses);
        } catch (err) {
          console.error('Error fetching courses:', err);
        }
      }
    };
    fetchCourses();
  }, [currentUser?.id]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (currentUser?.id) {
        try {
          setLoading(true);
          setError('');
          const data = await analyticsService.getTeacherAnalytics({
            teacherID: currentUser.id,
            timeRange,
            courseID: selectedCourse
          });
          setAnalyticsData(data);
        } catch (err) {
          console.error('Error fetching analytics:', err);
          setError(err.message || 'Failed to load analytics data');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAnalytics();
  }, [currentUser?.id, timeRange, selectedCourse]);

  // Use real data or fallback to empty arrays
  const enrollmentTrend = analyticsData?.enrollmentTrend || [];
  const coursePerformance = analyticsData?.coursePerformance || [];
  const studentEngagement = analyticsData?.studentEngagement || [
    { name: 'Active', value: 0, color: '#10b981' },
    { name: 'Inactive', value: 0, color: '#f59e0b' },
    { name: 'At Risk', value: 0, color: '#ef4444' }
  ];
  const lectureCompletion = analyticsData?.lectureCompletion || [];

  const performanceMetrics = analyticsData?.performanceMetrics ? [
    {
      icon: <Users size={24} />,
      label: 'Total Students',
      value: analyticsData.performanceMetrics.totalStudents || 0,
      change: null, // No change data available yet - will be calculated when historical comparison is implemented
      positive: true
    },
    {
      icon: <BookOpen size={24} />,
      label: 'Active Courses',
      value: analyticsData.performanceMetrics.activeCourses || 0,
      change: null, // No change data available yet
      positive: true
    },
    {
      icon: <Award size={24} />,
      label: 'Avg. Rating',
      value: analyticsData.performanceMetrics.avgRating?.toFixed(1) || '0.0',
      change: null, // No change data available yet
      positive: true
    },
    {
      icon: <Target size={24} />,
      label: 'Completion Rate',
      value: `${analyticsData.performanceMetrics.completionRate || 0}%`,
      change: null, // No change data available yet
      positive: true
    }
  ] : [];

  if (loading) {
    return (
      <div className="container analytics-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader2 size={48} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="container analytics-page">
      <div className="page-header">
        <div>
          <h1>Advanced Analytics</h1>
          <p>Comprehensive insights into your teaching performance</p>
        </div>
        <div className="filters">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="filter-select"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Courses</option>
            {teacherCourses.map(course => (
              <option key={course.id || course.courseID} value={course.id || course.courseID}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '1em 0', padding: '1em', background: '#fee', color: '#c33', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {performanceMetrics.length > 0 && (
        <div className="metrics-grid">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="metric-card card">
              <div className="metric-icon" style={{ backgroundColor: 'rgba(42, 143, 155, 0.1)' }}>
                {metric.icon}
              </div>
              <div className="metric-content">
                <span className="metric-label">{metric.label}</span>
                <h3 className="metric-value">{metric.value}</h3>
                {metric.change && (
                  <span className={`metric-change ${metric.positive ? 'positive' : 'negative'}`}>
                    {metric.change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="charts-grid">
        <div className="chart-card card">
          <div className="chart-header">
            <h3>Student Enrollment Trend</h3>
            <span className="chart-subtitle">Last 6 weeks</span>
          </div>
          {enrollmentTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="var(--primary-color)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary-color)', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              No enrollment data available
            </div>
          )}
        </div>

        <div className="chart-card card">
          <div className="chart-header">
            <h3>Course Performance</h3>
            <span className="chart-subtitle">Completion rates by course</span>
          </div>
          {coursePerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coursePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completion" fill="var(--primary-color)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              No course performance data available
            </div>
          )}
        </div>

        <div className="chart-card card">
          <div className="chart-header">
            <h3>Student Engagement</h3>
            <span className="chart-subtitle">Current status distribution</span>
          </div>
          {studentEngagement.some(e => e.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={studentEngagement}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {studentEngagement.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              No student engagement data available
            </div>
          )}
        </div>

        <div className="chart-card card">
          <div className="chart-header">
            <h3>Lecture Completion Rate</h3>
            <span className="chart-subtitle">Weekly completion percentage</span>
          </div>
          {lectureCompletion.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lectureCompletion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              No lecture completion data available
            </div>
          )}
        </div>
      </div>

      <div className="insights-section">
        <div className="card insights-card">
          <h3>Key Insights</h3>
          <div className="insights-list">
            <div className="insight-item">
              <div className="insight-icon success">
                <TrendingUp size={20} />
              </div>
              <div className="insight-content">
                <h4>Student enrollment is growing</h4>
                <p>Your courses have seen a 12% increase in enrollments this month.</p>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon warning">
                <Clock size={20} />
              </div>
              <div className="insight-content">
                <h4>Lecture completion needs attention</h4>
                <p>10% of students haven't completed recent lectures. Consider sending reminders.</p>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon success">
                <Award size={20} />
              </div>
              <div className="insight-content">
                <h4>High student satisfaction</h4>
                <p>Your average rating has improved by 0.3 points this quarter.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card recommendations-card">
          <h3>Recommendations</h3>
          <div className="recommendations-list">
            <div className="recommendation-item">
              <span className="recommendation-badge">📚</span>
              <p>Create more interactive content to boost engagement</p>
            </div>
            <div className="recommendation-item">
              <span className="recommendation-badge">⏰</span>
              <p>Schedule office hours to help struggling students</p>
            </div>
            <div className="recommendation-item">
              <span className="recommendation-badge">🎯</span>
              <p>Add quizzes to increase lecture completion rates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
