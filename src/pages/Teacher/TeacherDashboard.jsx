import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import courseService from '../../services/courseService';
import { BookOpen, Users, Star, DollarSign, Loader2 } from 'lucide-react';
import '../Student/StudentDashboard.css';

const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedImages, setFailedImages] = useState(new Set());

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
        limit: 10,
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
  
  const avgRating = myCourses.length > 0
    ? (myCourses.reduce((sum, course) => {
        return sum + (course.rating || 0);
      }, 0) / myCourses.length).toFixed(1)
    : 0;
    
  const totalEarnings = myCourses.reduce((sum, course) => {
    return sum + ((course.price || 0) * (course.enrolledCount || course.studentsEnrolled || 0));
  }, 0);

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
      <div className="dashboard-header">
        <h1>Welcome, {currentUser?.name || 'Teacher'}!</h1>
        <p>Manage your courses and track your teaching performance</p>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '1em 0', padding: '1em', background: '#fee', color: '#c33', borderRadius: '4px' }}>
          {error}
        </div>
      )}

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
            {myCourses.map(course => {
              const courseId = course.id || course.courseID;
              const hasThumbnail = course.thumbnailUrl || course.thumbnail;
              const imageFailed = failedImages.has(courseId);
              const showPlaceholder = !hasThumbnail || imageFailed;
              
              return (
                <div key={courseId} className="course-card">
                  {hasThumbnail && !imageFailed ? (
                    <img 
                      src={course.thumbnailUrl || course.thumbnail}
                      alt={course.title}
                      onError={(e) => {
                        setFailedImages(prev => new Set(prev).add(courseId));
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {showPlaceholder && (
                    <div className="course-thumb-placeholder" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: '#e0e0e0',
                      color: '#666',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      minHeight: '200px',
                      width: '100%'
                    }}>
                      <span>{course.title?.charAt(0)?.toUpperCase() || 'C'}</span>
                    </div>
                  )}
                  <div className="course-content">
                    <h3>{course.title}</h3>
                    <p className="course-description">
                      {course.description || 'No description available'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1em 0' }}>
                      <span style={{ color: 'var(--text-light)' }}>
                        {course.enrolledCount || course.studentsEnrolled || 0} students
                      </span>
                      {course.rating && (
                        <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                          ⭐ {course.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <Link to={`/courses/${courseId}`} className="continue-btn">
                      View Details
                    </Link>
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
    </div>
  );
};

export default TeacherDashboard;
