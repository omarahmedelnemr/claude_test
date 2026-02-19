import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import courseService from '../../services/courseService';
import { BookOpen, Clock, Award, TrendingUp, Loader2 } from 'lucide-react';
import Pagination from '../../components/Common/Pagination';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedImages, setFailedImages] = useState(new Set());
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const [pagination, setPagination] = useState({ 
    total: 0, 
    totalPages: 1, 
    hasNextPage: false, 
    hasPreviousPage: false 
  });

  // Sync state from URL on mount
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    if (urlPage !== page) setPage(urlPage);
  }, []); // Only run on mount

  // Update URL when page changes (but not on initial mount)
  useEffect(() => {
    const currentPage = searchParams.get('page');
    if (page.toString() !== (currentPage || '1')) {
      const params = new URLSearchParams();
      if (page > 1) params.set('page', page.toString());
      setSearchParams(params, { replace: true });
    }
  }, [page, setSearchParams, searchParams]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchEnrolledCourses();
    }
  }, [currentUser?.id, page]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await courseService.getStudentEnrollments({
        studentID: currentUser.id,
        status: 'enrolled',
        limit: 10,
        loadBlock: page,
      });
      
      // Extract data and pagination info
      const enrollments = Array.isArray(response) 
        ? response 
        : response.enrollments || response.data || [];
      setEnrolledCourses(enrollments);
      
      // Extract pagination metadata
      if (response.pagination) {
        setPagination({
          total: response.pagination.total || 0,
          totalPages: response.pagination.totalPages || 1,
          hasNextPage: response.pagination.hasNextPage || false,
          hasPreviousPage: response.pagination.hasPreviousPage || false,
        });
      }
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    // URL will be updated by useEffect
  };

  // Calculate statistics from enrolled courses
  const overallProgress = enrolledCourses.length > 0
    ? Math.round(
        enrolledCourses.reduce((sum, enrollment) => {
          return sum + (enrollment.progress || enrollment.course?.progress || 0);
        }, 0) / enrolledCourses.length
      )
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
      <div className="dashboard-header">
        <h1>Welcome back, {currentUser?.name || 'Student'}!</h1>
        <p>Continue your learning journey</p>
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
            <h3>{enrolledCourses.length}</h3>
            <p>Enrolled Courses</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
            <TrendingUp size={28} color="#4caf50" />
          </div>
          <div className="stat-info">
            <h3>{overallProgress}%</h3>
            <p>Overall Progress</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
            <Award size={28} color="#ff9800" />
          </div>
          <div className="stat-info">
            <h3>--</h3>
            <p>Average Score</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>
            <Clock size={28} color="#9c27b0" />
          </div>
          <div className="stat-info">
            <h3>--</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Continue Learning</h2>
          <Link to="/enrolled-courses">View All</Link>
        </div>

        {enrolledCourses.length > 0 ? (
          <div className="course-grid">
            {enrolledCourses.map(enrollment => {
              const course = enrollment.course || enrollment;
              const progress = enrollment.progress || 0;
              const courseId = course.id || course.courseID || enrollment.courseID;
              const hasThumbnail = course.thumbnailUrl || course.thumbnail;
              const imageFailed = failedImages.has(courseId);
              const showPlaceholder = !hasThumbnail || imageFailed;
              
              return (
                <div key={courseId || enrollment.id} className="course-card">
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
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="progress-text">
                      {progress}% Complete
                    </p>
                    <Link
                      to={`/course-player/${courseId}`}
                      className="continue-btn"
                    >
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
            <p>Start learning by enrolling in a course</p>
            <Link to="/courses" className="btn-primary">
              Browse Courses
            </Link>
          </div>
        )}
        
        {enrolledCourses.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
