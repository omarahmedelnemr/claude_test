import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import { BookOpen, Play, Award, Loader2 } from 'lucide-react';
import '../Student/StudentDashboard.css';
import './EnrolledCourses.css';

const EnrolledCourses = () => {
  const { currentUser } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.id) {
      fetchEnrolledCourses();
    }
  }, [currentUser?.id]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await courseService.getStudentEnrollments({
        studentID: currentUser.id,
        status: 'enrolled',
        limit: 50,
        loadBlock: 1,
      });
      
      const enrollments = Array.isArray(response) ? response : response.enrollments || response.data || [];
      setEnrolledCourses(enrollments);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

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
        <h1>My Learning</h1>
        <p>Continue where you left off and track your progress</p>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '1em 0', padding: '1em', background: '#fee', color: '#c33', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {enrolledCourses.length > 0 ? (
        <div className="enrolled-courses-grid">
          {enrolledCourses.map(enrollment => {
            const course = enrollment.course || enrollment;
            const teacher = course.teacher || {};
            const progress = enrollment.progress || 0;
            const courseId = course.id || course.courseID || enrollment.courseID;
            const lectureCount = course.lectureCount || 0;

            return (
              <div key={courseId || enrollment.id} className="enrolled-course-card card">
                <div className="course-image-wrapper">
                  {course.thumbnailUrl || course.thumbnail ? (
                    <img
                      src={course.thumbnailUrl || course.thumbnail}
                      alt={course.title}
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div className="course-thumb-placeholder" style={{ display: course.thumbnailUrl || course.thumbnail ? 'none' : 'flex' }}>
                    <span>{course.title?.charAt(0) || 'C'}</span>
                  </div>
                  <div className="progress-overlay">
                    <div className="circular-progress">
                      <span>{progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="enrolled-course-content">
                  <h3>{course.title}</h3>
                  {teacher.name && (
                    <div className="teacher-mini">
                      <img
                        src={teacher.profileImage || teacher.avatar || '/default-avatar.png'}
                        alt={teacher.name}
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                      <span>{teacher.name}</span>
                    </div>
                  )}

                  <div className="course-progress-section">
                    <div className="progress-stats">
                      <div className="stat">
                        <BookOpen size={18} color="var(--primary-color)" />
                        <span>{lectureCount} lectures</span>
                      </div>
                    </div>

                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <Link to={`/course-player/${courseId}`} className="continue-learning-btn">
                    <Play size={18} />
                    Continue Learning
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <BookOpen size={64} color="#ccc" />
          <h3>No Enrolled Courses</h3>
          <p>Start your learning journey by enrolling in a course</p>
          <Link to="/courses" className="btn-primary">
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
};

export default EnrolledCourses;
