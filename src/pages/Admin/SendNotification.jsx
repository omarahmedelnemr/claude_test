import { useState, useEffect, useRef } from 'react';
import { Search, X, Bell, Send, Users, CheckSquare, Square, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import './SendNotification.css';

const ROLE_LABELS = { student: 'Student', teacher: 'Teacher', parent: 'Parent' };
const ROLE_COLORS = { student: '#2196f3', teacher: '#4caf50', parent: '#ff9800' };

const SendNotification = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/admin/users/search', { params: { q: searchQuery.trim() } });
        setSearchResults(res.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const isSelected = (user) => selectedUsers.some(u => u.id === user.id);

  const toggleUser = (user) => {
    setSelectedUsers(prev =>
      isSelected(user) ? prev.filter(u => u.id !== user.id) : [...prev, user]
    );
  };

  const removeSelected = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const selectAll = () => {
    const newUsers = searchResults.filter(u => !isSelected(u));
    setSelectedUsers(prev => [...prev, ...newUsers]);
  };

  const clearAll = () => setSelectedUsers([]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim() || selectedUsers.length === 0) return;
    setSending(true);
    setFeedback(null);
    try {
      await api.post('/admin/notifications/send', {
        users: selectedUsers.map(u => ({ id: u.id, role: u.role })),
        title: title.trim(),
        body: body.trim(),
      });
      setFeedback({ type: 'success', message: `Notification sent to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} successfully.` });
      setTitle('');
      setBody('');
      setSelectedUsers([]);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to send notification.' });
    } finally {
      setSending(false);
    }
  };

  const canSend = title.trim() && body.trim() && selectedUsers.length > 0 && !sending;

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Send Notification</h1>
        <p>Search for users and send them a push notification via Firebase</p>
      </div>

      {feedback && (
        <div className={`sn-feedback sn-feedback--${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
          <button className="sn-feedback__close" onClick={() => setFeedback(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="sn-layout">
        {/* Left panel: user search & selection */}
        <div className="sn-panel">
          <div className="sn-panel__header">
            <Users size={20} />
            <h2>Select Recipients</h2>
          </div>

          {/* Search input */}
          <div className="sn-search">
            <Search size={16} className="sn-search__icon" />
            <input
              type="text"
              className="sn-search__input"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="sn-search__clear" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search results */}
          {(searchResults.length > 0 || searching) && (
            <div className="sn-results">
              {searching ? (
                <div className="sn-results__loading">Searching...</div>
              ) : (
                <>
                  <div className="sn-results__actions">
                    <span className="sn-results__count">{searchResults.length} found</span>
                    <button className="sn-btn sn-btn--link" onClick={selectAll}>Select all</button>
                  </div>
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      className={`sn-user-row ${isSelected(user) ? 'sn-user-row--selected' : ''}`}
                      onClick={() => toggleUser(user)}
                    >
                      <div className="sn-user-row__check">
                        {isSelected(user) ? <CheckSquare size={16} color="#1976d2" /> : <Square size={16} color="#9e9e9e" />}
                      </div>
                      <img
                        className="sn-user-row__avatar"
                        src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e3f2fd&color=1976d2`}
                        alt={user.name}
                        onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e3f2fd&color=1976d2`; }}
                      />
                      <div className="sn-user-row__info">
                        <span className="sn-user-row__name">{user.name}</span>
                        <span
                          className="sn-user-row__role"
                          style={{ color: ROLE_COLORS[user.role] }}
                        >
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {searchQuery && !searching && searchResults.length === 0 && (
            <div className="sn-results sn-results--empty">No users found for "{searchQuery}"</div>
          )}

          {/* Selected users chips */}
          {selectedUsers.length > 0 && (
            <div className="sn-selected">
              <div className="sn-selected__header">
                <span className="sn-selected__title">
                  <Bell size={14} /> {selectedUsers.length} selected
                </span>
                <button className="sn-btn sn-btn--link sn-btn--danger" onClick={clearAll}>Clear all</button>
              </div>
              <div className="sn-chips">
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className="sn-chip"
                    style={{ borderColor: ROLE_COLORS[user.role] }}
                  >
                    <span
                      className="sn-chip__dot"
                      style={{ backgroundColor: ROLE_COLORS[user.role] }}
                    />
                    <span className="sn-chip__name">{user.name}</span>
                    <button className="sn-chip__remove" onClick={() => removeSelected(user.id)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel: compose notification */}
        <div className="sn-panel">
          <div className="sn-panel__header">
            <Bell size={20} />
            <h2>Compose Notification</h2>
          </div>

          <div className="sn-form">
            <div className="sn-form__field">
              <label className="sn-form__label">Title</label>
              <input
                type="text"
                className="sn-form__input"
                placeholder="Notification title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={100}
              />
              <span className="sn-form__counter">{title.length}/100</span>
            </div>

            <div className="sn-form__field">
              <label className="sn-form__label">Message</label>
              <textarea
                className="sn-form__textarea"
                placeholder="Write your notification message..."
                value={body}
                onChange={e => setBody(e.target.value)}
                maxLength={500}
                rows={5}
              />
              <span className="sn-form__counter">{body.length}/500</span>
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className="sn-preview">
                <p className="sn-preview__label">Preview</p>
                <div className="sn-preview__card">
                  <div className="sn-preview__icon">
                    <Bell size={20} color="#1976d2" />
                  </div>
                  <div className="sn-preview__content">
                    <p className="sn-preview__title">{title || 'Notification Title'}</p>
                    <p className="sn-preview__body">{body || 'Notification message...'}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              className={`sn-send-btn ${canSend ? '' : 'sn-send-btn--disabled'}`}
              onClick={handleSend}
              disabled={!canSend}
            >
              {sending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send size={18} />
                  Send to {selectedUsers.length > 0 ? `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}` : 'selected users'}
                </>
              )}
            </button>

            {selectedUsers.length === 0 && (
              <p className="sn-hint">Select at least one recipient from the left panel.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendNotification;
