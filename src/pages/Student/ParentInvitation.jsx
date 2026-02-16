import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import profileService from '../../services/profileService';
import { Mail, Send, X, Clock, Check, XCircle, Loader2, UserX, Users } from 'lucide-react';
import './ParentInvitation.css';

const ParentInvitation = () => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser?.id) {
      loadData();
    }
  }, [currentUser?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invitationsRes, parentsRes] = await Promise.all([
        profileService.getSentInvitations(currentUser.id),
        profileService.getParentsList(currentUser.id),
      ]);
      setInvitations(Array.isArray(invitationsRes) ? invitationsRes : []);
      setParents(Array.isArray(parentsRes) ? parentsRes : []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setSending(true);
      setError('');
      setSuccess('');
      await profileService.sendParentInvitation(currentUser.id, email.trim());
      setSuccess('Invitation sent successfully!');
      setEmail('');
      loadData();
    } catch (err) {
      const msg = err.response?.data || err.message || 'Failed to send invitation';
      setError(typeof msg === 'string' ? msg : 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (invitationID) => {
    try {
      setError('');
      await profileService.cancelInvitation(currentUser.id, invitationID);
      setSuccess('Invitation cancelled');
      loadData();
    } catch (err) {
      setError('Failed to cancel invitation');
    }
  };

  const handleRemoveParent = async (parentID) => {
    if (!window.confirm('Are you sure you want to remove this parent?')) return;
    try {
      setError('');
      await profileService.removeParent(currentUser.id, parentID);
      setSuccess('Parent removed');
      loadData();
    } catch (err) {
      setError('Failed to remove parent');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="pi-badge pi-badge-pending"><Clock size={14} /> Pending</span>;
      case 'accepted':
        return <span className="pi-badge pi-badge-accepted"><Check size={14} /> Accepted</span>;
      case 'rejected':
        return <span className="pi-badge pi-badge-rejected"><XCircle size={14} /> Rejected</span>;
      case 'expired':
        return <span className="pi-badge pi-badge-expired"><Clock size={14} /> Expired</span>;
      default:
        return <span className="pi-badge">{status}</span>;
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
        <h1>Parent Connection</h1>
        <p>Invite a parent by email to connect to your account</p>
      </div>

      {error && (
        <div className="pi-alert pi-alert-error">
          {error}
          <button onClick={() => setError('')} className="pi-alert-close"><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="pi-alert pi-alert-success">
          {success}
          <button onClick={() => setSuccess('')} className="pi-alert-close"><X size={16} /></button>
        </div>
      )}

      {/* Send Invitation Form */}
      <div className="card pi-section">
        <h2><Mail size={22} /> Invite Parent</h2>
        <form onSubmit={handleSendInvitation} className="pi-form">
          <div className="pi-input-group">
            <input
              type="email"
              placeholder="Enter parent's email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={sending}
            />
            <button type="submit" className="pi-send-btn" disabled={sending || !email.trim()}>
              {sending ? <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
              {sending ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
          <p className="pi-hint">The parent will see this invitation when they log into their account. They can accept or reject it.</p>
        </form>
      </div>

      {/* Connected Parents */}
      {parents.length > 0 && (
        <div className="card pi-section">
          <h2><Users size={22} /> Connected Parents</h2>
          <div className="pi-parents-list">
            {parents.map(parent => (
              <div key={parent.id} className="pi-parent-item">
                <img
                  src={parent.profileImage || '/default-avatar.png'}
                  alt={parent.name}
                  className="pi-parent-avatar"
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
                <div className="pi-parent-info">
                  <span className="pi-parent-name">{parent.name}</span>
                </div>
                <button
                  className="pi-remove-btn"
                  onClick={() => handleRemoveParent(parent.id)}
                  title="Remove parent"
                >
                  <UserX size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Invitations */}
      <div className="card pi-section">
        <h2><Clock size={22} /> Sent Invitations</h2>
        {invitations.length === 0 ? (
          <p className="pi-empty">No invitations sent yet</p>
        ) : (
          <div className="pi-invitations-list">
            {invitations.map(inv => (
              <div key={inv.id} className="pi-invitation-item">
                <div className="pi-invitation-info">
                  <span className="pi-invitation-email">{inv.parentEmail}</span>
                  <div className="pi-invitation-meta">
                    {getStatusBadge(inv.status)}
                    <span className="pi-invitation-date">Sent {formatDate(inv.createdAt)}</span>
                    {inv.status === 'pending' && (
                      <span className="pi-invitation-expires">Expires {formatDate(inv.expiresAt)}</span>
                    )}
                  </div>
                </div>
                {inv.status === 'pending' && (
                  <button
                    className="pi-cancel-btn"
                    onClick={() => handleCancel(inv.id)}
                    title="Cancel invitation"
                  >
                    <X size={16} /> Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentInvitation;
