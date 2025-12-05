import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courses, users } from '../../data/mockData';
import {
  Send,
  Mail,
  Users,
  Search,
  MessageCircle,
  Megaphone,
  Plus
} from 'lucide-react';
import './Messaging.css';

const Messaging = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('messages');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);

  const teacherCourses = courses.filter(c => c.teacherId === currentUser.id);

  // Mock messages data
  const conversations = [
    {
      id: 1,
      student: users[3],
      lastMessage: 'Thank you for the feedback!',
      timestamp: new Date(2024, 11, 5, 14, 30),
      unread: 0
    },
    {
      id: 2,
      student: users[4],
      lastMessage: 'Can you help me with the homework?',
      timestamp: new Date(2024, 11, 4, 10, 15),
      unread: 2
    }
  ];

  // Mock announcements data
  const announcements = [
    {
      id: 1,
      courseId: 1,
      title: 'New Assignment Posted',
      message: 'A new assignment has been posted for Week 5. Due date is next Friday.',
      sentAt: new Date(2024, 11, 3, 9, 0),
      recipients: 45
    },
    {
      id: 2,
      courseId: 3,
      title: 'Class Rescheduled',
      message: 'Tomorrow\'s class has been rescheduled to 2 PM. Please mark your calendars.',
      sentAt: new Date(2024, 11, 2, 15, 30),
      recipients: 30
    }
  ];

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    // API call to send message
    setMessageText('');
  };

  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    // API call to send announcement
    setShowNewMessage(false);
  };

  return (
    <div className="container messaging-page">
      <div className="page-header">
        <div>
          <h1>Messages & Announcements</h1>
          <p>Communicate with your students</p>
        </div>
        <button onClick={() => setShowNewMessage(true)} className="btn-primary">
          <Plus size={20} />
          New {activeTab === 'messages' ? 'Message' : 'Announcement'}
        </button>
      </div>

      <div className="messaging-container">
        <div className="messaging-sidebar card">
          <div className="tabs">
            <button
              className={activeTab === 'messages' ? 'active' : ''}
              onClick={() => setActiveTab('messages')}
            >
              <MessageCircle size={18} />
              Messages
            </button>
            <button
              className={activeTab === 'announcements' ? 'active' : ''}
              onClick={() => setActiveTab('announcements')}
            >
              <Megaphone size={18} />
              Announcements
            </button>
          </div>

          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search..." />
          </div>

          {activeTab === 'messages' ? (
            <div className="conversations-list">
              {conversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <img src={conversation.student.avatar} alt={conversation.student.name} />
                  <div className="conversation-info">
                    <h4>{conversation.student.name}</h4>
                    <p>{conversation.lastMessage}</p>
                  </div>
                  <div className="conversation-meta">
                    <span className="time">{formatTime(conversation.timestamp)}</span>
                    {conversation.unread > 0 && (
                      <span className="unread-badge">{conversation.unread}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="announcements-list">
              {announcements.map(announcement => {
                const course = courses.find(c => c.id === announcement.courseId);
                return (
                  <div key={announcement.id} className="announcement-item">
                    <div className="announcement-header">
                      <h4>{announcement.title}</h4>
                      <span className="course-badge">{course?.title}</span>
                    </div>
                    <p>{announcement.message}</p>
                    <div className="announcement-footer">
                      <span><Users size={14} /> {announcement.recipients} recipients</span>
                      <span>{formatTime(announcement.sentAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="messaging-main card">
          {activeTab === 'messages' ? (
            selectedConversation ? (
              <>
                <div className="chat-header">
                  <img src={selectedConversation.student.avatar} alt={selectedConversation.student.name} />
                  <div>
                    <h3>{selectedConversation.student.name}</h3>
                    <span className="status">Active now</span>
                  </div>
                </div>

                <div className="chat-messages">
                  <div className="message received">
                    <img src={selectedConversation.student.avatar} alt="" />
                    <div className="message-content">
                      <p>Hi Professor, I have a question about the last lecture.</p>
                      <span className="message-time">2:30 PM</span>
                    </div>
                  </div>

                  <div className="message sent">
                    <div className="message-content">
                      <p>Of course! What would you like to know?</p>
                      <span className="message-time">2:32 PM</span>
                    </div>
                    <img src={currentUser.avatar} alt="" />
                  </div>

                  <div className="message received">
                    <img src={selectedConversation.student.avatar} alt="" />
                    <div className="message-content">
                      <p>{selectedConversation.lastMessage}</p>
                      <span className="message-time">{formatTime(selectedConversation.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="chat-input">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button onClick={handleSendMessage}>
                    <Send size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <Mail size={64} color="#ccc" />
                <h3>No conversation selected</h3>
                <p>Choose a conversation from the list or start a new one</p>
              </div>
            )
          ) : showNewMessage ? (
            <div className="new-announcement-form">
              <h3>Create New Announcement</h3>
              <form onSubmit={handleSendAnnouncement}>
                <div className="form-group">
                  <label>Select Course</label>
                  <select required>
                    <option value="">Choose a course...</option>
                    {teacherCourses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Title</label>
                  <input type="text" placeholder="Announcement title" required />
                </div>

                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    rows="6"
                    placeholder="Write your announcement..."
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="secondary" onClick={() => setShowNewMessage(false)}>
                    Cancel
                  </button>
                  <button type="submit">
                    Send Announcement
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="empty-state">
              <Megaphone size={64} color="#ccc" />
              <h3>No announcements yet</h3>
              <p>Create a new announcement to reach your students</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messaging;
