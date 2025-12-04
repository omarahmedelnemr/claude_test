import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { courses, studentProgress } from '../../data/mockData';
import { BookOpen, Clock, Award, TrendingUp } from 'lucide-react';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { currentUser } = useAuth();

  const enrolledCourses = courses.filter(course =>
    currentUser.enrolledCourses?.includes(course.id)
  );

  const progress = studentProgress.filter(p => p.studentId === currentUser.id);

  const overallProgress = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.progress, 0) / progress.length)
    : 0;

  const totalQuizzes = progress.reduce((sum, p) => sum + p.quizScores.length, 0);
  const avgQuizScore = totalQuizzes > 0
    ? Math.round(
        progress.reduce(
          (sum, p) => sum + p.quizScores.reduce((s, q) => s + q.score, 0),
          0
        ) / totalQuizzes
      )
    : 0;

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Welcome back, {currentUser.name}!</h1>
        <p>Continue your learning journey</p>
      </div>

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
            <h3>{avgQuizScore}%</h3>
            <p>Average Quiz Score</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>
            <Clock size={28} color="#9c27b0" />
          </div>
          <div className="stat-info">
            <h3>{totalQuizzes}</h3>
            <p>Quizzes Completed</p>
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
            {enrolledCourses.map(course => {
              const courseProgress = progress.find(p => p.courseId === course.id);
              return (
                <div key={course.id} className="course-card">
                  <img src={course.thumbnail} alt={course.title} />
                  <div className="course-content">
                    <h3>{course.title}</h3>
                    <p className="course-description">{course.description}</p>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${courseProgress?.progress || 0}%` }}
                      ></div>
                    </div>
                    <p className="progress-text">
                      {courseProgress?.progress || 0}% Complete
                    </p>
                    <Link
                      to={`/course-player/${course.id}`}
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
      </div>
    </div>
  );
};

export default StudentDashboard;
