import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import { Clock, Users as UsersIcon, BarChart, Star, BookOpen, Loader2, Settings } from 'lucide-react';
import SEO from '../../components/SEO/SEO';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
    }
  }, [id, currentUser?.id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch course details (API will check enrollment if session exists)
      const courseData = await courseService.getCourseDetails(id);
      setCourse(courseData);
      
      // Set enrollment status from API response (isEnrolled field)
      // Default to false if not provided (no user or not enrolled)
      setIsEnrolled(courseData.isEnrolled === true);
      
      // Fetch teacher info if available
      if (courseData.teacherID || courseData.teacher?.id) {
        try {
          const teacherData = await courseService.getTeacherProfile(
            courseData.teacherID || courseData.teacher?.id
          );
          setTeacher(teacherData);
        } catch (err) {
          console.error('Error fetching teacher:', err);
        }
      } else if (courseData.teacher) {
        setTeacher(courseData.teacher);
      }

      // Fetch lectures
      try {
        const lecturesData = await courseService.getCourseLectures(id);
        // Handle both old format (flat array) and new format (sections with lectures)
        let lecturesArray = [];
        if (Array.isArray(lecturesData)) {
          // Check if it's the new format (array of sections with section objects)
          const firstItem = lecturesData[0];
          if (firstItem && firstItem.lectures !== undefined && Array.isArray(firstItem.lectures)) {
            // New format: array of sections with lectures property
            // Flatten all lectures from all sections
            lecturesArray = lecturesData.flatMap(sectionData => sectionData.lectures || []);
          } else {
            // Old format: flat array of lectures
            lecturesArray = lecturesData;
          }
        } else {
          lecturesArray = lecturesData.lectures || [];
        }
        setLectures(lecturesArray);
      } catch (err) {
        console.error('Error fetching lectures:', err);
      }
    } catch (err) {
      console.error('Error fetching course:', err);
      setError(err.message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'student') {
      alert('Only students can enroll in courses');
      return;
    }

    // Navigate to checkout page
    navigate(`/checkout/${id}`);
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

  if (!course || error) {
    return (
      <div className="container">
        <div className="empty-state">
          <h2>{error ? 'Error loading course' : 'Course not found'}</h2>
          <p>{error || "The course you're looking for doesn't exist."}</p>
        </div>
      </div>
    );
  }

  const isTeacher = currentUser?.id === (course.teacherID || course.teacher?.id);
  const isParent = currentUser?.role === 'parent';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  // SEO data
  const courseTitle = course?.title || 'Course';
  const courseDescription = course?.description || 'Learn from expert teachers with structured lessons, video lectures, and interactive assignments.';
  const courseImage = course?.thumbnailUrl || course?.thumbnail || '/Logo Vertical.png';
  const teacherName = teacher?.name || course?.teacher?.name || 'Expert Teacher';
  const baseUrl = import.meta.env.VITE_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  // Structured data for course
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: courseTitle,
    description: courseDescription,
    image: courseImage.startsWith('http') ? courseImage : `${baseUrl}${courseImage}`,
    provider: {
      '@type': 'Organization',
      name: 'Ta3afi Education',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/Logo Vertical.png`,
      },
    },
    ...(teacher && {
      instructor: {
        '@type': 'Person',
        name: teacherName,
      },
    }),
    ...(course.subject && { courseCode: course.subject }),
    ...(course.enrolledCount !== undefined && { aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: course.starRate || 0,
      ratingCount: course.enrolledCount,
    }}),
  };

  return (
    <div className="course-detail-page">
      <SEO
        title={courseTitle}
        description={courseDescription}
        keywords={`${course.subject ? course.subject + ', ' : ''}course, online course, education, ${teacherName}, e-learning, teaching`}
        image={courseImage}
        url={`/courses/${id}`}
        type="website"
        structuredData={structuredData}
      />
      <div className="container">
        <div className="course-header-section">
          <div className="course-header-content">
            <div className="course-badges">
              {course.subject && <span className="badge">{course.subject}</span>}
              {course.status && course.status !== 'published' && (
                <span className="badge badge-status">{course.status}</span>
              )}
            </div>
            <h1 className="course-title">{course.title}</h1>
            <p className="course-description-preview">{course.description || 'No description available'}</p>
            <div className="course-meta-info">
              {course.enrolledCount !== undefined && (
                <div className="meta-item">
                  <UsersIcon size={18} />
                  <span>{course.enrolledCount.toLocaleString()} students</span>
                </div>
              )}
              {lectures.length > 0 && (
                <div className="meta-item">
                  <BookOpen size={18} />
                  <span>{lectures.length} lectures</span>
                </div>
              )}
              {course.duration && (
                <div className="meta-item">
                  <Clock size={18} />
                  <span>{course.duration}</span>
                </div>
              )}
            </div>
          </div>
          {course.thumbnailUrl || course.thumbnail ? (
            <div className="course-thumbnail-container">
              <img 
                src={course.thumbnailUrl || course.thumbnail} 
                alt={course.title}
                className="course-thumbnail"
              />
            </div>
          ) : null}
        </div>
        <div className="course-detail-content">
          <div className="course-main">
            <div className="card">
              <h2>About this course</h2>
              <p>{course.description || 'No description available'}</p>
            </div>

            {lectures.length > 0 && (
              <div className="card">
                <h2>Course Content</h2>
                <div className="lectures-list">
                  {lectures.map((lecture, index) => (
                    <div key={lecture.id || lecture.lectureID} className="lecture-item">
                      <div className="lecture-header">
                        <BookOpen size={20} color="var(--primary-color)" />
                        <div>
                          <h4>Lecture {index + 1}: {lecture.title}</h4>
                          {lecture.description && <p>{lecture.description}</p>}
                        </div>
                      </div>
                      {lecture.contentCount > 0 && (
                        <div className="lecture-content-types">
                          <span className="content-type-badge">
                            {lecture.contentCount} items
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {teacher && (
              <div className="card">
                <h2>Instructor</h2>
                <div className="instructor-card">
                  <img 
                    src={teacher.profileImage || teacher.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(teacher.name || 'Teacher')} 
                    alt={teacher.name} 
                  />
                  <div>
                    <h3>{teacher.name}</h3>
                    {teacher.description && <p>{teacher.description}</p>}
                    {teacher.bio && <p>{teacher.bio}</p>}
                    {teacher.tags && teacher.tags.length > 0 && (
                      <div className="expertise-tags">
                        {teacher.tags.map((tag, idx) => (
                          <span key={tag.id || idx} className="expertise-tag">
                            {typeof tag === 'string' ? tag : tag.tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="course-sidebar">
            <div className="card sticky-card">
              <div className="price-section">
                <h2>
                  {course.price !== undefined 
                    ? `${course.currency || '$'}${course.price}` 
                    : 'Free'}
                </h2>
              </div>

              {isEnrolled ? (
                <button
                  onClick={() => navigate(`/course-player/${id}`)}
                  className="enroll-button"
                >
                  Continue Learning
                </button>
              ) : isTeacher ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75em' }}>
                  <button 
                    onClick={() => navigate(`/courses/${id}/manage`)}
                    className="enroll-button"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '0.5em',
                      backgroundColor: 'var(--primary-color)'
                    }}
                  >
                    <Settings size={18} />
                    <span>Manage Content</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/courses/edit/${id}`)}
                    className="enroll-button"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '0.5em',
                      backgroundColor: '#6c757d'
                    }}
                  >
                    <span>Edit Course Info</span>
                  </button>
                </div>
              ) : isParent ? (
                <div 
                  style={{ 
                    padding: '1rem', 
                    background: '#fff3cd', 
                    border: '1px solid #ffc107', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#856404'
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    Parents cannot enroll in courses. Only students can enroll.
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
                    You can view course information and monitor your connected students' progress.
                  </p>
                </div>
              ) : isAdmin ? (
                <div 
                  style={{ 
                    padding: '1rem', 
                    background: '#e3f2fd', 
                    border: '1px solid #2196f3', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#1565c0',
                    marginBottom: '1rem'
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    Admin users cannot enroll in courses.
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
                    You can view course information and manage course content.
                  </p>
                </div>
              ) : (
                <button 
                  onClick={handleEnroll} 
                  className="enroll-button"
                >
                  Enroll Now
                </button>
              )}

              <div className="sidebar-info">
                <h3>This course includes:</h3>
                <ul>
                  {lectures.length > 0 && (
                    <li>📹 {lectures.length} lectures</li>
                  )}
                  <li>📄 Downloadable resources</li>
                  <li>📝 Quizzes and assignments</li>
                  <li>🏆 Certificate of completion</li>
                  <li>♾️ Lifetime access</li>
                  <li>📱 Access on mobile and desktop</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
