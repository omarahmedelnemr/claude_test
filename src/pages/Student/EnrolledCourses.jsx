import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courses, users, studentProgress } from '../../data/mockData';
import { BookOpen, Play, Award } from 'lucide-react';
import '../Student/StudentDashboard.css';
import './EnrolledCourses.css';

const EnrolledCourses = () => {
  const { currentUser } = useAuth();

  const enrolledCourses = courses.filter(course =>
    currentUser.enrolledCourses?.includes(course.id)
  );

  const progress = studentProgress.filter(p => p.studentId === currentUser.id);

  const getCourseProgress = (courseId) => {
    return progress.find(p => p.courseId === courseId);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>My Learning</h1>
        <p>Continue where you left off and track your progress</p>
      </div>

      {enrolledCourses.length > 0 ? (
        <div className="enrolled-courses-grid">
          {enrolledCourses.map(course => {
            const teacher = users.find(u => u.id === course.teacherId);
            const courseProgress = getCourseProgress(course.id);
            const completedLectures = courseProgress?.completedLectures?.length || 0;
            const totalLectures = course.lectures.length;
            const avgScore = courseProgress?.quizScores?.length > 0
              ? Math.round(
                  courseProgress.quizScores.reduce((sum, q) => sum + q.score, 0) /
                  courseProgress.quizScores.length
                )
              : 0;

            return (
              <div key={course.id} className="enrolled-course-card card">
                <div className="course-image-wrapper">
                  <img src={course.thumbnail} alt={course.title} />
                  <div className="progress-overlay">
                    <div className="circular-progress">
                      <span>{courseProgress?.progress || 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="enrolled-course-content">
                  <h3>{course.title}</h3>
                  <div className="teacher-mini">
                    <img src={teacher?.avatar} alt={teacher?.name} />
                    <span>{teacher?.name}</span>
                  </div>

                  <div className="course-progress-section">
                    <div className="progress-stats">
                      <div className="stat">
                        <BookOpen size={18} color="var(--primary-color)" />
                        <span>{completedLectures}/{totalLectures} lectures</span>
                      </div>
                      {avgScore > 0 && (
                        <div className="stat">
                          <Award size={18} color="#ff9800" />
                          <span>{avgScore}% avg score</span>
                        </div>
                      )}
                    </div>

                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${courseProgress?.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <Link to={`/course-player/${course.id}`} className="continue-learning-btn">
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
