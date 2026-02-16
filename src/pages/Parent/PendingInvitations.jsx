import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import parentService from '../../services/parentService';
import { Mail, Check, X, Clock, Loader2, UserPlus } from 'lucide-react';
import './PendingInvitations.css';

const PendingInvitations = () => {
  const { currentUser } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser?.id) {
      loadInvitations();
    }
  }, [currentUser?.id]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await parentService.getPendingInvitations(currentUser.id);
      setInvitations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading invitations:', err);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationID, accept) => {
    try {
      setResponding(invitationID);
      setError('');
      setSuccess('');
      await parentService.respondToInvitation(currentUser.id, invitationID, accept);
      setSuccess(accept ? 'Invitation accepted! You are now connected.' : 'Invitation rejected.');
      loadInvitations();
    } catch (err) {
      const msg = err.response?.data || err.message || 'Failed to respond';
      setError(typeof msg === 'string' ? msg : 'Failed to respond to invitation');
    } finally {
      setResponding(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
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
    <div className="container">
      <div className="page-header">
        <h1>Student Invitations</h1>
        <p>Students have invited you to connect as their parent</p>
      </div>

      {error && (
        <div className="ppi-alert ppi-alert-error">
          {error}
          <button onClick={() => setError('')} className="ppi-alert-close"><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="ppi-alert ppi-alert-success">
          {success}
          <button onClick={() => setSuccess('')} className="ppi-alert-close"><X size={16} /></button>
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="card ppi-empty-state">
          <Mail size={56} color="#cbd5e1" />
          <h3>No Pending Invitations</h3>
          <p>When a student invites you, their invitation will appear here.</p>
        </div>
      ) : (
        <div className="ppi-list">
          {invitations.map(inv => {
            const student = inv.student || {};
            const isResponding = responding === inv.id;

            return (
              <div key={inv.id} className="card ppi-invitation-card">
                <div className="ppi-student-info">
                  <img
                    src={student.profileImage || '/default-avatar.png'}
                    alt={student.name || 'Student'}
                    className="ppi-avatar"
                    onError={(e) => { e.target.src = '/default-avatar.png'; }}
                  />
                  <div className="ppi-details">
                    <h3>{student.name || 'Student'}</h3>
                    <div className="ppi-meta">
                      <span><UserPlus size={14} /> Wants to add you as parent</span>
                      <span><Clock size={14} /> Sent {formatDate(inv.createdAt)}</span>
                      <span className="ppi-expires">Expires {formatDate(inv.expiresAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="ppi-actions">
                  <button
                    className="ppi-accept-btn"
                    onClick={() => handleRespond(inv.id, true)}
                    disabled={isResponding}
                  >
                    {isResponding ? (
                      <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Check size={18} />
                    )}
                    Accept
                  </button>
                  <button
                    className="ppi-reject-btn"
                    onClick={() => handleRespond(inv.id, false)}
                    disabled={isResponding}
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingInvitations;
