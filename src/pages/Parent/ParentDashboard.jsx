import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import parentService from '../../services/parentService';
import { Users, Mail, BookOpen, Clock, Loader2, UserCheck, MailCheck } from 'lucide-react';
import './ParentDashboard.css';

const ParentDashboard = () => {
  const { currentUser } = useAuth();
  const [connectedStudents, setConnectedStudents] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [studentCourses, setStudentCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedImages, setFailedImages] = useState(new Set());

  useEffect(() => {
    if (currentUser?.id) {
      fetchDashboardData();
    }
  }, [currentUser?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [studentsRes, invitationsRes, coursesRes] = await Promise.all([
        parentService.getConnectedStudents(currentUser.id),
        parentService.getPendingInvitations(currentUser.id),
        parentService.getAllStudentCourses(currentUser.id),
      ]);

      setConnectedStudents(Array.isArray(studentsRes) ? studentsRes : []);
      setPendingInvitations(Array.isArray(invitationsRes) ? invitationsRes : []);
      setStudentCourses(Array.isArray(coursesRes) ? coursesRes : []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
    <div className="container parent-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {currentUser?.name || 'Parent'}!</h1>
        <p>Monitor your students' learning progress</p>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '1em 0', padding: '1em', background: '#fee', color: '#c33', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
            <Users size={28} color="#2196f3" />
          </div>
          <div className="stat-info">
            <h3>{connectedStudents.length}</h3>
            <p>Connected Students</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
            <Mail size={28} color="#ff9800" />
          </div>
          <div className="stat-info">
            <h3>{pendingInvitations.length}</h3>
            <p>Pending Invitations</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
            <BookOpen size={28} color="#4caf50" />
          </div>
          <div className="stat-info">
            <h3>{studentCourses.length}</h3>
            <p>Active Courses</p>
          </div>
        </div>
      </div>

      {/* Connected Students Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2><Users size={24} /> Connected Students</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/connected-students" className="view-all-link">
              View All
            </Link>
            <Link to="/pending-invitations" className="view-all-link">
              Manage Invitations
            </Link>
          </div>
        </div>

        {connectedStudents.length > 0 ? (
          <div className="students-grid">
            {connectedStudents.map((student) => (
              <div key={student.id} className="student-card card">
                <img
                  src={student.profileImage || '/default-avatar.png'}
                  alt={student.name}
                  className="student-avatar"
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
                <div className="student-info">
                  <h3>{student.name}</h3>
                  {student.email && <p className="student-email">{student.email}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Users size={64} color="#ccc" />
            <h3>No Connected Students</h3>
            <p>Students can invite you to connect with them</p>
            <Link to="/pending-invitations" className="btn-primary">
              Check Invitations
            </Link>
          </div>
        )}
      </div>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2><Mail size={24} /> Pending Invitations</h2>
            <Link to="/pending-invitations" className="view-all-link">
              View All
            </Link>
          </div>

          <div className="invitations-list">
            {pendingInvitations.slice(0, 3).map((invitation) => {
              const student = invitation.student || {};
              return (
                <div key={invitation.id} className="invitation-card card">
                  <div className="invitation-content">
                    <img
                      src={student.profileImage || '/default-avatar.png'}
                      alt={student.name || 'Student'}
                      className="invitation-avatar"
                      onError={(e) => { e.target.src = '/default-avatar.png'; }}
                    />
                    <div className="invitation-info">
                      <h4>{student.name || 'Student'}</h4>
                      <p className="invitation-meta">
                        <Clock size={14} /> Sent {formatDate(invitation.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Link to="/pending-invitations" className="btn-secondary">
                    Respond
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Student Courses Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2><BookOpen size={24} /> Student Courses</h2>
        </div>

        {studentCourses.length > 0 ? (
          <div className="courses-grid">
            {studentCourses.map((enrollment) => {
              const course = enrollment.course || {};
              const student = enrollment.student || {};
              const progress = enrollment.progress || 0;
              const courseId = course.id || course.courseID || enrollment.courseID;
              const hasThumbnail = course.thumbnailUrl || course.thumbnail;
              const imageFailed = failedImages.has(courseId);
              const showPlaceholder = !hasThumbnail || imageFailed;

              return (
                <div key={enrollment.id || courseId} className="course-card">
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
                    <div className="course-student-badge">
                      <Users size={14} />
                      {student.name || 'Student'}
                    </div>
                    <h3>{course.title}</h3>
                    {course.teacher && (
                      <p className="course-teacher">By {course.teacher.name || 'Teacher'}</p>
                    )}
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
                      to={`/courses/${courseId}`}
                      className="view-course-btn"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen size={64} color="#ccc" />
            <h3>No Active Courses</h3>
            <p>Your connected students haven't enrolled in any courses yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;

