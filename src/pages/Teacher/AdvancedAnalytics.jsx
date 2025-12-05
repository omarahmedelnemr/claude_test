import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courses, studentProgress } from '../../data/mockData';
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
  Clock
} from 'lucide-react';
import './AdvancedAnalytics.css';

const AdvancedAnalytics = () => {
  const { currentUser } = useAuth();
  const [timeRange, setTimeRange] = useState('7days');
  const [selectedCourse, setSelectedCourse] = useState('all');

  const teacherCourses = courses.filter(c => c.teacherId === currentUser.id);

  // Mock data for charts
  const enrollmentTrend = [
    { date: 'Week 1', students: 12 },
    { date: 'Week 2', students: 19 },
    { date: 'Week 3', students: 25 },
    { date: 'Week 4', students: 32 },
    { date: 'Week 5', students: 38 },
    { date: 'Week 6', students: 45 }
  ];

  const coursePerformance = teacherCourses.map(course => ({
    name: course.title.substring(0, 15) + '...',
    students: course.studentsEnrolled,
    rating: course.rating,
    completion: Math.floor(Math.random() * 40) + 60
  }));

  const studentEngagement = [
    { name: 'Active', value: 65, color: '#10b981' },
    { name: 'Inactive', value: 25, color: '#f59e0b' },
    { name: 'At Risk', value: 10, color: '#ef4444' }
  ];

  const lectureCompletion = [
    { week: 'Week 1', completed: 85 },
    { week: 'Week 2', completed: 78 },
    { week: 'Week 3', completed: 82 },
    { week: 'Week 4', completed: 88 },
    { week: 'Week 5', completed: 90 }
  ];

  const performanceMetrics = [
    {
      icon: <Users size={24} />,
      label: 'Total Students',
      value: teacherCourses.reduce((sum, c) => sum + c.studentsEnrolled, 0),
      change: '+12%',
      positive: true
    },
    {
      icon: <BookOpen size={24} />,
      label: 'Active Courses',
      value: teacherCourses.length,
      change: '+2',
      positive: true
    },
    {
      icon: <Award size={24} />,
      label: 'Avg. Rating',
      value: (teacherCourses.reduce((sum, c) => sum + c.rating, 0) / teacherCourses.length).toFixed(1),
      change: '+0.3',
      positive: true
    },
    {
      icon: <Target size={24} />,
      label: 'Completion Rate',
      value: '82%',
      change: '+5%',
      positive: true
    }
  ];

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
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="metrics-grid">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="metric-card card">
            <div className="metric-icon" style={{ backgroundColor: 'rgba(42, 143, 155, 0.1)' }}>
              {metric.icon}
            </div>
            <div className="metric-content">
              <span className="metric-label">{metric.label}</span>
              <h3 className="metric-value">{metric.value}</h3>
              <span className={`metric-change ${metric.positive ? 'positive' : 'negative'}`}>
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card card">
          <div className="chart-header">
            <h3>Student Enrollment Trend</h3>
            <span className="chart-subtitle">Last 6 weeks</span>
          </div>
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
        </div>

        <div className="chart-card card">
          <div className="chart-header">
            <h3>Course Performance</h3>
            <span className="chart-subtitle">Completion rates by course</span>
          </div>
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
        </div>

        <div className="chart-card card">
          <div className="chart-header">
            <h3>Student Engagement</h3>
            <span className="chart-subtitle">Current status distribution</span>
          </div>
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
        </div>

        <div className="chart-card card">
          <div className="chart-header">
            <h3>Lecture Completion Rate</h3>
            <span className="chart-subtitle">Weekly completion percentage</span>
          </div>
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
