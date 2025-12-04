import { users, courses, communityPosts, blogArticles } from '../../data/mockData';
import { Users, BookOpen, MessageSquare, FileText, TrendingUp } from 'lucide-react';
import '../Student/StudentDashboard.css';

const AdminDashboard = () => {
  const totalUsers = users.length;
  const totalCourses = courses.length;
  const totalPosts = communityPosts.length;
  const totalArticles = blogArticles.length;

  const studentCount = users.filter(u => u.role === 'student').length;
  const teacherCount = users.filter(u => u.role === 'teacher').length;
  const totalEnrollments = users
    .filter(u => u.enrolledCourses)
    .reduce((sum, u) => sum + u.enrolledCourses.length, 0);

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and management</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
            <Users size={28} color="#2196f3" />
          </div>
          <div className="stat-info">
            <h3>{totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
            <BookOpen size={28} color="#4caf50" />
          </div>
          <div className="stat-info">
            <h3>{totalCourses}</h3>
            <p>Total Courses</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
            <TrendingUp size={28} color="#ff9800" />
          </div>
          <div className="stat-info">
            <h3>{totalEnrollments}</h3>
            <p>Total Enrollments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>
            <MessageSquare size={28} color="#9c27b0" />
          </div>
          <div className="stat-info">
            <h3>{totalPosts + totalArticles}</h3>
            <p>Posts & Articles</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>User Distribution</h2>
        <div className="course-grid">
          <div className="card">
            <h3>Students</h3>
            <p style={{ fontSize: '2.5em', color: 'var(--primary-color)', margin: '0.5em 0' }}>
              {studentCount}
            </p>
            <p style={{ color: 'var(--text-light)' }}>
              {((studentCount / totalUsers) * 100).toFixed(1)}% of total users
            </p>
          </div>
          <div className="card">
            <h3>Teachers</h3>
            <p style={{ fontSize: '2.5em', color: 'var(--primary-color)', margin: '0.5em 0' }}>
              {teacherCount}
            </p>
            <p style={{ color: 'var(--text-light)' }}>
              {((teacherCount / totalUsers) * 100).toFixed(1)}% of total users
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Recent Courses</h2>
        <div className="course-grid">
          {courses.slice(0, 3).map(course => {
            const teacher = users.find(u => u.id === course.teacherId);
            return (
              <div key={course.id} className="card">
                <h3>{course.title}</h3>
                <p style={{ color: 'var(--text-light)', margin: '0.5em 0' }}>
                  By {teacher?.name}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1em' }}>
                  <span>{course.studentsEnrolled} students</span>
                  <span>⭐ {course.rating}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
