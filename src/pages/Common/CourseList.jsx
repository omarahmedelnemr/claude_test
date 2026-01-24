import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import { Search, Filter, Loader2 } from 'lucide-react';
import './CourseList.css';

const CourseList = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [subjects, setSubjects] = useState(['all']);

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

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
        loadBlock: 1,
      };
      const response = await courseService.getAvailableCourses(params);
      
      // Handle different response formats
      const coursesData = Array.isArray(response) ? response : response.courses || response.data || [];
      setCourses(coursesData);
      
      // Extract unique subjects
      const uniqueSubjects = ['all', ...new Set(coursesData.map(c => c.subject).filter(Boolean))];
      setSubjects(uniqueSubjects);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Refetch when search term or subject changes
  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => {
        fetchCourses();
      }, 500); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, selectedSubject]);

  // Client-side filtering for immediate feedback
  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm || 
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || course.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  if (loading && courses.length === 0) {
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
        <h1>Explore Courses</h1>
        <p>Discover and enroll in courses taught by expert instructors</p>
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

        <div className="filter-group">
          <Filter size={20} />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>
                {subject === 'all' ? 'All Subjects' : subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="results-info">
        <p>Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}</p>
      </div>

      {filteredCourses.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: '3em', color: '#666' }}>
          <p>No courses found. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="course-grid">
          {filteredCourses.map(course => (
            <div key={course.id || course.courseID} className="course-card">
              <Link to={`/courses/${course.id || course.courseID}`}>
                <img 
                  src={course.thumbnailUrl || course.thumbnail || 'https://via.placeholder.com/400x225?text=Course'} 
                  alt={course.title} 
                />
              </Link>
              <div className="course-content">
                <div className="course-meta">
                  {course.subject && (
                    <span className="category-badge">{course.subject}</span>
                  )}
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
                      src={course.teacher.profileImage || course.teacher.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(course.teacher.name || 'Teacher')} 
                      alt={course.teacher.name} 
                    />
                    <span>{course.teacher.name}</span>
                  </div>
                )}
                <div className="course-stats">
                  <div>
                    {course.rating && (
                      <span className="rating">⭐ {course.rating.toFixed(1)}</span>
                    )}
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
                <Link 
                  to={`/courses/${course.id || course.courseID}`} 
                  className="enroll-btn"
                >
                  {course.isEnrolled ? 'View Course' : 'View Details'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;
