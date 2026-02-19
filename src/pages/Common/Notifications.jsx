import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, Check, Trash2, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import './Notifications.css';

const Notifications = () => {
  const { notifications, unreadCount, markAsSeen, clearAll, isConnected } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Note: Notifications are NOT automatically marked as read when viewing
  // They will only be marked as read when user explicitly clicks "Mark All as Read"

  const handleMarkAsSeen = async () => {
    try {
      setLoading(true);
      await markAsSeen();
    } catch (err) {
      setError('Failed to mark notifications as seen');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    
    try {
      setLoading(true);
      await clearAll();
    } catch (err) {
      setError('Failed to clear notifications');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'system':
        return <AlertCircle size={20} />;
      case 'homework':
      case 'assignment':
        return <Bell size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'system':
        return '#ef4444';
      case 'homework':
      case 'assignment':
        return '#3b82f6';
      case 'community':
        return '#10b981';
      case 'course':
        return '#8b5cf6';
      case 'blog':
      case 'article':
        return '#f59e0b';
      case 'qa':
      case 'question':
        return '#06b6d4';
      default:
        return '#6366f1';
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.route && notification.route !== '/notifications') {
      navigate(notification.route);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with your latest activities</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
          {!isConnected && (
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25em', 
              color: '#9ca3af',
              fontSize: '0.9em'
            }}>
              <Clock size={16} />
              Disconnected
            </span>
          )}
          {notifications.length > 0 && (
            <>
              <button
                onClick={handleMarkAsSeen}
                disabled={loading || unreadCount === 0}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}
              >
                <Check size={16} />
                Mark All Read
              </button>
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}
              >
                <Trash2 size={16} />
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5em' }}>
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={64} color="#9ca3af" />
          <h3>No notifications</h3>
          <p>You're all caught up! New notifications will appear here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification, index) => {
            const isClickable = notification.route && notification.route !== '/notifications';
            const isUnread = !notification.seen;
            return (
              <div
                key={`${notification.id}-${notification.timestamp}-${index}`}
                className={`notification-item ${isClickable ? 'clickable' : ''} ${isUnread ? 'unread' : ''}`}
                style={{
                  borderLeft: `4px solid ${getCategoryColor(notification.category)}`,
                  cursor: isClickable ? 'pointer' : 'default'
                }}
                onClick={() => isClickable && handleNotificationClick(notification)}
              >
                <div className="notification-icon" style={{ color: getCategoryColor(notification.category) }}>
                  {getCategoryIcon(notification.category)}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', flex: 1 }}>
                      <h3>{notification.header || 'Notification'}</h3>
                      {isUnread && (
                        <span className="unread-dot" title="Unread notification"></span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                      {isClickable && (
                        <ExternalLink size={16} color="#9ca3af" />
                      )}
                      <span className="notification-time">
                        {formatDate(notification.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className="notification-text">{notification.text}</p>
                  {notification.category && (
                    <span className="notification-category">
                      {notification.category}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;

