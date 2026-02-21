import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import { Search, Loader2 } from 'lucide-react';
import Pagination from '../../components/Common/Pagination';
import SEO from '../../components/SEO/SEO';
import './CourseList.css';

const CourseList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Initialize from URL params or defaults
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [selectedSubject, setSelectedSubject] = useState(() => searchParams.get('subject') || 'all');
  const [subjects, setSubjects] = useState(['all']);
  const [failedImages, setFailedImages] = useState(new Set());
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const [pagination, setPagination] = useState({ 
    total: 0, 
    totalPages: 1, 
    hasNextPage: false, 
    hasPreviousPage: false 
  });

  // Fetch subjects on mount (metadata)
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Sync state from URL on mount
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    const urlSearch = searchParams.get('search') || '';
    const urlSubject = searchParams.get('subject') || 'all';
    
    if (urlPage !== page) setPage(urlPage);
    if (urlSearch !== searchTerm) setSearchTerm(urlSearch);
    if (urlSubject !== selectedSubject) setSelectedSubject(urlSubject);
  }, []); // Only run on mount

  // Update URL when filters or page change (but not on initial mount)
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (searchTerm) params.set('search', searchTerm);
    if (selectedSubject !== 'all') params.set('subject', selectedSubject);
    
    // Only update if URL is different
    const currentPage = searchParams.get('page');
    const currentSearch = searchParams.get('search') || '';
    const currentSubject = searchParams.get('subject') || 'all';
    
    if (page.toString() !== (currentPage || '1') || 
        searchTerm !== currentSearch || 
        selectedSubject !== currentSubject) {
      setSearchParams(params, { replace: true });
    }
  }, [page, searchTerm, selectedSubject, setSearchParams, searchParams]);

  // Reset to page 1 when filters change (but preserve URL if it's from URL)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlSubject = searchParams.get('subject') || 'all';
    if ((searchTerm !== urlSearch || selectedSubject !== urlSubject) && 
        (searchTerm !== '' || selectedSubject !== 'all')) {
      setPage(1);
    }
  }, [searchTerm, selectedSubject]);

  // Fetch courses when page or filters change
  useEffect(() => {
    fetchCourses();
  }, [page, searchTerm, selectedSubject]);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const response = await courseService.getCourseSubjects();
      const subjectsList = response?.subjects || [];
      setSubjects(['all', ...subjectsList]);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        studentID: currentUser?.id || null,
        searchQuery: searchTerm || undefined,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        limit: 20,
        loadBlock: page,
      };
      const response = await courseService.getAvailableCourses(params);
      
      // Handle different response formats
      const coursesData = Array.isArray(response) 
        ? response 
        : response.data || response.courses || [];
      setCourses(coursesData);
      
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
      console.error('Error fetching courses:', err);
      setError(err.message || 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    // URL will be updated by useEffect
  };

  if (loading && courses.length === 0) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader2 size={48} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  // SEO data
  const currentSearch = searchParams.get('search') || '';
  const currentSubject = subjects.find(s => s === selectedSubject && s !== 'all');

  return (
    <div className="container">
      <SEO
        title={currentSearch ? `Search: ${currentSearch} - Courses` : currentSubject ? `${currentSubject} Courses` : 'Browse Courses'}
        description={currentSearch 
          ? `Search results for "${currentSearch}" courses. Find online courses taught by expert teachers on Ta3afi Education platform.`
          : currentSubject
          ? `Browse ${currentSubject} courses. Learn from expert teachers with structured lessons, videos, and assignments.`
          : 'Browse our comprehensive catalog of online courses. Learn from expert teachers with structured lessons, video lectures, and interactive assignments.'}
        keywords={`courses, online courses, ${currentSubject ? currentSubject + ', ' : ''}${currentSearch ? currentSearch + ', ' : ''}e-learning, education, online learning, teaching`}
        url={`/courses${currentSearch ? `?search=${encodeURIComponent(currentSearch)}` : ''}${selectedSubject !== 'all' ? `${currentSearch ? '&' : '?'}subject=${selectedSubject}` : ''}`}
        type="website"
      />
      <div className="page-header">
        <h1>Explore Courses</h1>
        <p>
          {currentUser?.role === 'parent' 
            ? 'Browse courses and monitor your connected students\' progress' 
            : 'Discover and enroll in courses taught by expert instructors'}
        </p>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '1em 0', padding: '1em', background: '#fee', color: '#c33', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Subject Filter - Button Picker Style */}
      {subjects.length > 1 && (
        <div className="subject-filter">
          <button
            className={`filter-btn ${selectedSubject === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedSubject('all')}
          >
            All Subjects
          </button>
          {subjects.filter(s => s !== 'all').map(subject => (
            <button
              key={subject}
              className={`filter-btn ${selectedSubject === subject ? 'active' : ''}`}
              onClick={() => setSelectedSubject(subject)}
            >
              {subject}
            </button>
          ))}
        </div>
      )}

      <div className="results-info">
        <p>
          {pagination.total > 0 
            ? `Showing ${courses.length} of ${pagination.total} course${pagination.total !== 1 ? 's' : ''}`
            : `Showing ${courses.length} course${courses.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {courses.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: '3em', color: '#666' }}>
          <p>No courses found. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="course-grid">
          {courses.map(course => {
            const courseId = course.id || course.courseID;
            const hasThumbnail = course.thumbnailUrl || course.thumbnail;
            const imageFailed = failedImages.has(courseId);
            const showPlaceholder = !hasThumbnail || imageFailed;

            return (
              <div key={courseId} className="course-card">
                <Link to={`/courses/${courseId}`}>
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
                    <div className="course-thumb-placeholder" style={{ display: 'flex' }}>
                      <span>{course.title?.charAt(0)?.toUpperCase() || 'C'}</span>
                    </div>
                  )}
                </Link>
              <div className="course-content">
                <div className="course-meta">
                  <span className="category-badge">
                    {course.subject || 'No Subject'}
                  </span>
                  {course.status && course.status !== 'published' && (
                    <span className="level-badge">{course.status}</span>
                  )}
                </div>
                <Link to={`/courses/${course.id || course.courseID}`}>
                  <h3>{course.title}</h3>
                </Link>
                <p className="course-description">
                  {course.description || 'No description available'}
                </p>
                {course.teacher && (
                  <div className="teacher-info">
                    <img
                      src={course.teacher.profileImage || course.teacher.avatar || '/default-avatar.png'}
                      alt={course.teacher.name}
                      onError={(e) => { e.target.src = '/default-avatar.png'; }}
                    />
                    <span>{course.teacher.name}</span>
                  </div>
                )}
                <div className="course-stats">
                  <div>
                    {course.enrolledCount !== undefined && (
                      <span className="students">
                        {course.enrolledCount.toLocaleString()} students
                      </span>
                    )}
                  </div>
                  {course.price !== undefined && (
                    <span className="price">
                      {course.currency || '$'}{course.price}
                    </span>
                  )}
                </div>
                {course.isEnrolled && course.progress !== undefined && (
                  <div className="course-progress-bar" style={{ marginBottom: '0.5rem' }}>
                    <div
                      className="progress-fill"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                    <span className="progress-text" style={{ fontSize: '0.875rem', color: '#666' }}>
                      {course.progress}% Complete
                    </span>
                  </div>
                )}
                <Link 
                  to={`/courses/${courseId}`} 
                  className="enroll-btn"
                >
                  {course.isEnrolled ? 'View Course' : 'View Details'}
                </Link>
              </div>
            </div>
            );
          })}
        </div>
      )}
      
      {courses.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default CourseList;
