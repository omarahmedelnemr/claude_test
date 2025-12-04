import { users, courses } from '../../data/mockData';
import { BookOpen, Star } from 'lucide-react';
import './TeacherList.css';

const TeacherList = () => {
  const teachers = users.filter(u => u.role === 'teacher');

  const getTeacherStats = (teacherId) => {
    const teacherCourses = courses.filter(c => c.teacherId === teacherId);
    const totalStudents = teacherCourses.reduce((sum, c) => sum + c.studentsEnrolled, 0);
    const avgRating = teacherCourses.length > 0
      ? (teacherCourses.reduce((sum, c) => sum + c.rating, 0) / teacherCourses.length).toFixed(1)
      : 0;

    return {
      coursesCount: teacherCourses.length,
      totalStudents,
      avgRating,
      courses: teacherCourses
    };
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Our Expert Instructors</h1>
        <p>Learn from experienced professionals who are passionate about teaching</p>
      </div>

      <div className="teachers-grid">
        {teachers.map(teacher => {
          const stats = getTeacherStats(teacher.id);
          return (
            <div key={teacher.id} className="teacher-card">
              <div className="teacher-header">
                <img src={teacher.avatar} alt={teacher.name} />
                <div className="teacher-info">
                  <h2>{teacher.name}</h2>
                  <p className="teacher-bio">{teacher.bio}</p>
                  {teacher.expertise && (
                    <div className="teacher-expertise">
                      {teacher.expertise.map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="teacher-stats">
                <div className="stat">
                  <BookOpen size={20} color="var(--primary-color)" />
                  <div>
                    <strong>{stats.coursesCount}</strong>
                    <span>Courses</span>
                  </div>
                </div>
                <div className="stat">
                  <Star size={20} color="#ff9800" />
                  <div>
                    <strong>{stats.avgRating}</strong>
                    <span>Rating</span>
                  </div>
                </div>
                <div className="stat">
                  <div style={{ fontSize: '1.5em' }}>👥</div>
                  <div>
                    <strong>{stats.totalStudents.toLocaleString()}</strong>
                    <span>Students</span>
                  </div>
                </div>
              </div>

              {stats.courses.length > 0 && (
                <div className="teacher-courses">
                  <h4>Courses by {teacher.name.split(' ')[0]}</h4>
                  <div className="courses-list">
                    {stats.courses.map(course => (
                      <div key={course.id} className="mini-course-card">
                        <img src={course.thumbnail} alt={course.title} />
                        <div>
                          <h5>{course.title}</h5>
                          <div className="mini-course-meta">
                            <span>⭐ {course.rating}</span>
                            <span>${course.price}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherList;
