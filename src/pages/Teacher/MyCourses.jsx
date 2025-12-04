import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courses } from '../../data/mockData';
import { BookOpen, Users, Star, DollarSign, Edit } from 'lucide-react';
import '../Student/StudentDashboard.css';
import './MyCourses.css';

const MyCourses = () => {
  const { currentUser } = useAuth();

  const myCourses = courses.filter(course => course.teacherId === currentUser.id);

  const totalStudents = myCourses.reduce((sum, course) => sum + course.studentsEnrolled, 0);
  const totalEarnings = myCourses.reduce(
    (sum, course) => sum + course.price * course.studentsEnrolled,
    0
  );
  const avgRating = myCourses.length > 0
    ? (myCourses.reduce((sum, course) => sum + course.rating, 0) / myCourses.length).toFixed(1)
    : 0;

  return (
    <div className="container">
      <div className="page-header">
        <h1>My Courses</h1>
        <p>Manage and track your courses</p>
      </div>

      {myCourses.length > 0 && (
        <div className="teacher-stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
              <BookOpen size={24} color="#2196f3" />
            </div>
            <div className="stat-info">
              <h3>{myCourses.length}</h3>
              <p>Total Courses</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
              <Users size={24} color="#4caf50" />
            </div>
            <div className="stat-info">
              <h3>{totalStudents}</h3>
              <p>Total Students</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
              <Star size={24} color="#ff9800" />
            </div>
            <div className="stat-info">
              <h3>{avgRating}</h3>
              <p>Average Rating</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>
              <DollarSign size={24} color="#9c27b0" />
            </div>
            <div className="stat-info">
              <h3>${totalEarnings.toLocaleString()}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
        </div>
      )}

      {myCourses.length > 0 ? (
        <div className="my-courses-list">
          {myCourses.map(course => (
            <div key={course.id} className="teacher-course-card card">
              <div className="course-image">
                <img src={course.thumbnail} alt={course.title} />
                <span className="course-level">{course.level}</span>
              </div>

              <div className="teacher-course-content">
                <div className="course-header">
                  <div>
                    <h3>{course.title}</h3>
                    <p className="course-category">{course.category}</p>
                  </div>
                  <button className="icon-btn">
                    <Edit size={18} />
                  </button>
                </div>

                <p className="course-description">{course.description}</p>

                <div className="course-metrics">
                  <div className="metric">
                    <Users size={16} />
                    <span>{course.studentsEnrolled} students</span>
                  </div>
                  <div className="metric">
                    <Star size={16} />
                    <span>{course.rating} rating</span>
                  </div>
                  <div className="metric">
                    <BookOpen size={16} />
                    <span>{course.lectures.length} lectures</span>
                  </div>
                  <div className="metric">
                    <DollarSign size={16} />
                    <span>${course.price}</span>
                  </div>
                </div>

                <div className="course-actions">
                  <Link to={`/courses/${course.id}`} className="view-course-btn">
                    View Course
                  </Link>
                  <span className="revenue">
                    Revenue: ${(course.price * course.studentsEnrolled).toLocaleString()}
                  </span>
                </div>
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
  );
};

export default MyCourses;
