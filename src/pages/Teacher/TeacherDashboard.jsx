import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { courses, users } from '../../data/mockData';
import { BookOpen, Users, Star, DollarSign } from 'lucide-react';
import '../Student/StudentDashboard.css';

const TeacherDashboard = () => {
  const { currentUser } = useAuth();

  const myCourses = courses.filter(course => course.teacherId === currentUser.id);
  const totalStudents = myCourses.reduce((sum, course) => sum + course.studentsEnrolled, 0);
  const avgRating = myCourses.length > 0
    ? (myCourses.reduce((sum, course) => sum + course.rating, 0) / myCourses.length).toFixed(1)
    : 0;
  const totalEarnings = myCourses.reduce(
    (sum, course) => sum + course.price * course.studentsEnrolled,
    0
  );

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Welcome, {currentUser.name}!</h1>
        <p>Manage your courses and track your teaching performance</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
            <BookOpen size={28} color="#2196f3" />
          </div>
          <div className="stat-info">
            <h3>{myCourses.length}</h3>
            <p>My Courses</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
            <Users size={28} color="#4caf50" />
          </div>
          <div className="stat-info">
            <h3>{totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
            <Star size={28} color="#ff9800" />
          </div>
          <div className="stat-info">
            <h3>{avgRating}</h3>
            <p>Average Rating</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>
            <DollarSign size={28} color="#9c27b0" />
          </div>
          <div className="stat-info">
            <h3>${totalEarnings.toLocaleString()}</h3>
            <p>Total Earnings</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>My Courses</h2>
          <Link to="/my-courses">Manage All Courses</Link>
        </div>

        {myCourses.length > 0 ? (
          <div className="course-grid">
            {myCourses.map(course => (
              <div key={course.id} className="course-card">
                <img src={course.thumbnail} alt={course.title} />
                <div className="course-content">
                  <h3>{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1em 0' }}>
                    <span style={{ color: 'var(--text-light)' }}>
                      {course.studentsEnrolled} students
                    </span>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                      ⭐ {course.rating}
                    </span>
                  </div>
                  <Link to={`/courses/${course.id}`} className="continue-btn">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen size={64} color="#ccc" />
            <h3>No Courses Yet</h3>
            <p>Create your first course and start teaching</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
