import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import parentService from '../../services/parentService';
import { Users, UserX, Loader2, BookOpen, Mail } from 'lucide-react';
import './ConnectedStudents.css';

const ConnectedStudents = () => {
  const { currentUser } = useAuth();
  const [connectedStudents, setConnectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.id) {
      fetchConnectedStudents();
    }
  }, [currentUser?.id]);

  const fetchConnectedStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await parentService.getConnectedStudents(currentUser.id);
      setConnectedStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching connected students:', err);
      setError(err.message || 'Failed to load connected students');
    } finally {
      setLoading(false);
    }
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
    <div className="container connected-students-page">
      <div className="page-header">
        <div>
          <h1><Users size={32} /> Connected Students</h1>
          <p>Manage your connected students and view their information</p>
        </div>
        <Link to="/pending-invitations" className="btn-primary">
          <Mail size={18} />
          View Invitations
        </Link>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '1em 0', padding: '1em', background: '#fee', color: '#c33', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {connectedStudents.length > 0 ? (
        <div className="students-grid">
          {connectedStudents.map((student) => (
            <div key={student.id} className="student-card card">
              <div className="student-header">
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
              <div className="student-actions">
                <Link to={`/profile?studentID=${student.id}`} className="btn-secondary">
                  <BookOpen size={16} />
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Users size={64} color="#ccc" />
          <h3>No Connected Students</h3>
          <p>Students can invite you to connect with them. Check your invitations to accept connection requests.</p>
          <Link to="/pending-invitations" className="btn-primary">
            <Mail size={18} />
            Check Invitations
          </Link>
        </div>
      )}
    </div>
  );
};

export default ConnectedStudents;

