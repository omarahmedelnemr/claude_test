import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courses, users } from '../../data/mockData';
import { Clock, Users as UsersIcon, BarChart, Star, BookOpen } from 'lucide-react';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const course = courses.find(c => c.id === parseInt(id));
  const teacher = users.find(u => u.id === course?.teacherId);

  if (!course) {
    return (
      <div className="container">
        <div className="empty-state">
          <h2>Course not found</h2>
          <p>The course you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isEnrolled = currentUser?.enrolledCourses?.includes(course.id);
  const isTeacher = currentUser?.id === course.teacherId;

  const handleEnroll = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'student') {
      alert('Only students can enroll in courses');
      return;
    }

    if (!currentUser.enrolledCourses) {
      currentUser.enrolledCourses = [];
    }

    currentUser.enrolledCourses.push(course.id);
    alert('Successfully enrolled in the course!');
    navigate('/enrolled-courses');
  };

  return (
    <div className="course-detail-page">
      <div className="course-hero" style={{ backgroundImage: `url(${course.thumbnail})` }}>
        <div className="hero-overlay">
          <div className="container">
            <div className="hero-content">
              <div className="course-badges">
                <span className="badge">{course.category}</span>
                <span className="badge">{course.level}</span>
              </div>
              <h1>{course.title}</h1>
              <p className="course-subtitle">{course.description}</p>
              <div className="course-meta-info">
                <div className="meta-item">
                  <Star size={18} />
                  <span>{course.rating} rating</span>
                </div>
                <div className="meta-item">
                  <UsersIcon size={18} />
                  <span>{course.studentsEnrolled.toLocaleString()} students</span>
                </div>
                <div className="meta-item">
                  <Clock size={18} />
                  <span>{course.duration}</span>
                </div>
                <div className="meta-item">
                  <BarChart size={18} />
                  <span>{course.level}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="course-detail-content">
          <div className="course-main">
            <div className="card">
              <h2>About this course</h2>
              <p>{course.description}</p>
              <p>
                This comprehensive course will take you from {course.level.toLowerCase()} to advanced levels.
                You'll learn through hands-on projects and real-world examples.
              </p>
            </div>

            <div className="card">
              <h2>Course Content</h2>
              <div className="lectures-list">
                {course.lectures.map((lecture, index) => (
                  <div key={lecture.id} className="lecture-item">
                    <div className="lecture-header">
                      <BookOpen size={20} color="var(--primary-color)" />
                      <div>
                        <h4>Lecture {index + 1}: {lecture.title}</h4>
                        <p>{lecture.duration}</p>
                      </div>
                    </div>
                    <div className="lecture-content-types">
                      {lecture.content.map((item, idx) => (
                        <span key={idx} className="content-type-badge">
                          {item.type === 'video' && '🎥 Video'}
                          {item.type === 'pdf' && '📄 PDF'}
                          {item.type === 'quiz' && '📝 Quiz'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2>Instructor</h2>
              <div className="instructor-card">
                <img src={teacher?.avatar} alt={teacher?.name} />
                <div>
                  <h3>{teacher?.name}</h3>
                  <p>{teacher?.bio}</p>
                  {teacher?.expertise && (
                    <div className="expertise-tags">
                      {teacher.expertise.map((skill, idx) => (
                        <span key={idx} className="expertise-tag">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="course-sidebar">
            <div className="card sticky-card">
              <div className="price-section">
                <h2>${course.price}</h2>
              </div>

              {isEnrolled ? (
                <button
                  onClick={() => navigate(`/course-player/${course.id}`)}
                  className="enroll-button"
                >
                  Continue Learning
                </button>
              ) : isTeacher ? (
                <button disabled className="enroll-button" style={{ backgroundColor: '#ccc' }}>
                  Your Course
                </button>
              ) : (
                <button onClick={handleEnroll} className="enroll-button">
                  Enroll Now
                </button>
              )}

              <div className="sidebar-info">
                <h3>This course includes:</h3>
                <ul>
                  <li>📹 {course.lectures.length} video lectures</li>
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
