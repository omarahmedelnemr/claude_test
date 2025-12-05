import { useState } from 'react';
import { Link } from 'react-router-dom';
import { courses } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, Users, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import './LectureSchedule.css';

const LectureSchedule = () => {
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'

  // Get teacher's courses
  const teacherCourses = courses.filter(c => c.teacherId === currentUser.id);

  // Mock scheduled lectures data
  const scheduledLectures = [
    {
      id: 1,
      courseId: 1,
      title: 'Introduction to React Hooks',
      date: new Date(2024, 11, 10, 10, 0),
      duration: 90,
      studentsEnrolled: 45,
      type: 'live'
    },
    {
      id: 2,
      courseId: 1,
      title: 'State Management Deep Dive',
      date: new Date(2024, 11, 12, 14, 0),
      duration: 120,
      studentsEnrolled: 45,
      type: 'live'
    },
    {
      id: 3,
      courseId: 3,
      title: 'Advanced JavaScript Patterns',
      date: new Date(2024, 11, 15, 9, 0),
      duration: 60,
      studentsEnrolled: 30,
      type: 'recorded'
    }
  ];

  const getCourse = (courseId) => {
    return courses.find(c => c.id === courseId);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getLecturesForDay = (day) => {
    if (!day) return [];
    return scheduledLectures.filter(lecture => {
      const lectureDate = lecture.date;
      return (
        lectureDate.getDate() === day.getDate() &&
        lectureDate.getMonth() === day.getMonth() &&
        lectureDate.getFullYear() === day.getFullYear()
      );
    });
  };

  const upcomingLectures = scheduledLectures
    .filter(lecture => lecture.date >= new Date())
    .sort((a, b) => a.date - b.date);

  return (
    <div className="container schedule-page">
      <div className="page-header">
        <div>
          <h1>Lecture Schedule</h1>
          <p>Manage your upcoming lectures and schedule new ones</p>
        </div>
        <Link to="/schedule/new" className="btn-primary">
          <Plus size={20} />
          Schedule Lecture
        </Link>
      </div>

      <div className="schedule-controls">
        <div className="view-mode-tabs">
          <button
            className={viewMode === 'month' ? 'active' : ''}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button
            className={viewMode === 'week' ? 'active' : ''}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button
            className={viewMode === 'day' ? 'active' : ''}
            onClick={() => setViewMode('day')}
          >
            Day
          </button>
        </div>

        <div className="calendar-navigation">
          <button onClick={() => navigateMonth('prev')} className="nav-btn">
            <ChevronLeft size={20} />
          </button>
          <h3>
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </h3>
          <button onClick={() => navigateMonth('next')} className="nav-btn">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="schedule-content">
        <div className="calendar-view card">
          <div className="calendar-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-day-name">
                {day}
              </div>
            ))}
          </div>
          <div className="calendar-grid">
            {getDaysInMonth().map((day, index) => {
              const lectures = getLecturesForDay(day);
              const isToday = day && day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={index}
                  className={`calendar-day ${!day ? 'empty' : ''} ${isToday ? 'today' : ''}`}
                >
                  {day && (
                    <>
                      <div className="day-number">{day.getDate()}</div>
                      <div className="day-lectures">
                        {lectures.slice(0, 2).map(lecture => {
                          const course = getCourse(lecture.courseId);
                          return (
                            <div key={lecture.id} className="mini-lecture">
                              <span className="lecture-time">
                                {formatTime(lecture.date)}
                              </span>
                              <span className="lecture-title">
                                {lecture.title}
                              </span>
                            </div>
                          );
                        })}
                        {lectures.length > 2 && (
                          <div className="more-lectures">
                            +{lectures.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="upcoming-sidebar">
          <div className="card">
            <h3>Upcoming Lectures</h3>
            <div className="upcoming-list">
              {upcomingLectures.length > 0 ? (
                upcomingLectures.map(lecture => {
                  const course = getCourse(lecture.courseId);
                  return (
                    <div key={lecture.id} className="upcoming-lecture-card">
                      <div className="lecture-badge">
                        <Calendar size={16} />
                        {lecture.type === 'live' ? '🔴 Live' : '📹 Recorded'}
                      </div>
                      <h4>{lecture.title}</h4>
                      <p className="course-name">{course?.title}</p>
                      <div className="lecture-details">
                        <div className="detail-item">
                          <Clock size={14} />
                          <span>{formatDate(lecture.date)}</span>
                        </div>
                        <div className="detail-item">
                          <Clock size={14} />
                          <span>{formatTime(lecture.date)} ({lecture.duration} min)</span>
                        </div>
                        <div className="detail-item">
                          <Users size={14} />
                          <span>{lecture.studentsEnrolled} students</span>
                        </div>
                      </div>
                      <div className="lecture-actions">
                        <button className="btn-secondary">Edit</button>
                        {lecture.type === 'live' && (
                          <button className="btn-primary">Start Lecture</button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state-small">
                  <Calendar size={48} color="#ccc" />
                  <p>No upcoming lectures</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LectureSchedule;
