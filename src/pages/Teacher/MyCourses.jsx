import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import { BookOpen, Users, Star, DollarSign, Edit, Loader2 } from 'lucide-react';
import '../Student/StudentDashboard.css';
import './MyCourses.css';

const MyCourses = () => {
  const { currentUser } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.id) {
      fetchMyCourses();
    }
  }, [currentUser?.id]);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await courseService.getTeacherCourses({
        teacherID: currentUser.id,
        limit: 100,
        loadBlock: 1,
      });
      
      const courses = Array.isArray(response) ? response : response.courses || response.data || [];
      setMyCourses(courses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = myCourses.reduce((sum, course) => {
    return sum + (course.enrolledCount || course.studentsEnrolled || 0);
  }, 0);
  
  const totalEarnings = myCourses.reduce((sum, course) => {
    return sum + ((course.price || 0) * (course.enrolledCount || course.studentsEnrolled || 0));
  }, 0);
  
  const avgRating = myCourses.length > 0
    ? (myCourses.reduce((sum, course) => {
        return sum + (course.rating || 0);
      }, 0) / myCourses.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader2 size={48} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>My Courses</h1>
        <p>Manage and track your courses</p>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '1em 0', padding: '1em', background: '#fee', color: '#c33', borderRadius: '4px' }}>
          {error}
        </div>
      )}

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
          {myCourses.map(course => {
            const courseId = course.id || course.courseID;
            const enrolledCount = course.enrolledCount || course.studentsEnrolled || 0;
            const price = course.price || 0;
            const lectureCount = course.lectureCount || 0;
            
            return (
              <div key={courseId} className="teacher-course-card card">
                <div className="course-image">
                  <img 
                    src={course.thumbnailUrl || course.thumbnail || 'https://via.placeholder.com/400x225?text=Course'} 
                    alt={course.title} 
                  />
                  {course.status && course.status !== 'published' && (
                    <span className="course-level">{course.status}</span>
                  )}
                </div>

                <div className="teacher-course-content">
                  <div className="course-header">
                    <div>
                      <h3>{course.title}</h3>
                      {course.subject && <p className="course-category">{course.subject}</p>}
                    </div>
                    <button className="icon-btn">
                      <Edit size={18} />
                    </button>
                  </div>

                  <p className="course-description">
                    {course.description || 'No description available'}
                  </p>

                  <div className="course-metrics">
                    <div className="metric">
                      <Users size={16} />
                      <span>{enrolledCount} students</span>
                    </div>
                    {course.rating && (
                      <div className="metric">
                        <Star size={16} />
                        <span>{course.rating.toFixed(1)} rating</span>
                      </div>
                    )}
                    {lectureCount > 0 && (
                      <div className="metric">
                        <BookOpen size={16} />
                        <span>{lectureCount} lectures</span>
                      </div>
                    )}
                    <div className="metric">
                      <DollarSign size={16} />
                      <span>{course.currency || '$'}{price}</span>
                    </div>
                  </div>

                  <div className="course-actions">
                    <Link to={`/courses/${courseId}`} className="view-course-btn">
                      View Course
                    </Link>
                    <span className="revenue">
                      Revenue: ${(price * enrolledCount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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
