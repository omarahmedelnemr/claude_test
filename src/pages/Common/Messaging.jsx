import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAgoraChat } from '../../contexts/AgoraChatContext';
import agoraService from '../../services/agoraService';
import VideoCall from '../../components/Common/VideoCall';
import {
    Send, Mail, Search, Video
} from 'lucide-react';
import './Messaging.css';

const Messaging = () => {
    const { currentUser } = useAuth();
    const { isConnected, messages, unreadCounts, sendMessage, fetchHistory, clearUnread } = useAgoraChat();
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [videoSessionData, setVideoSessionData] = useState(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [paginationState, setPaginationState] = useState({}); // { contactId: { cursor, isLast } }

    // Load contacts
    useEffect(() => {
        const loadContacts = async () => {
            try {
                const contactList = await agoraService.getContacts();
                setContacts(contactList);
            } catch (error) {
                console.error("Failed to load contacts:", error);
            } finally {
                setLoading(false);
            }
        };
        if (currentUser) loadContacts();
    }, [currentUser]);

    // Load message history when selecting a contact
    useEffect(() => {
        if (selectedContact && isConnected) {
            const loadInitialMessages = async () => {
                const result = await fetchHistory(selectedContact.id);
                setPaginationState(prev => ({
                    ...prev,
                    [selectedContact.id]: {
                        cursor: result.cursor,
                        isLast: result.isLast
                    }
                }));
            };
            loadInitialMessages();
            clearUnread(selectedContact.id);
        }
    }, [selectedContact, isConnected, fetchHistory, clearUnread]);

    // Auto-scroll to bottom on new messages (only if not loading older messages)
    useEffect(() => {
        if (!loadingMore && selectedContact) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messages, selectedContact, loadingMore]);

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedContact || sending) return;
        setSending(true);
        try {
            await sendMessage(selectedContact.id, messageText.trim());
            setMessageText('');
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleStartVideoCall = async () => {
        if (!selectedContact) return;
        try {
            const sessionData = await agoraService.createVideoSession(selectedContact.id);
            setVideoSessionData(sessionData);
            setShowVideoCall(true);
            // Notify the other user via chat message
            await sendMessage(
                selectedContact.id,
                `📹 Video call started. Join channel: ${sessionData.channelName}`
            ).catch(() => {});
        } catch (error) {
            console.error("Failed to start video call:", error);
        }
    };

    const handleJoinVideoCall = async (channelName) => {
        try {
            const tokenData = await agoraService.getRtcToken(channelName);
            setVideoSessionData(tokenData);
            setShowVideoCall(true);
        } catch (error) {
            console.error("Failed to join video call:", error);
        }
    };

    const handleEndVideoCall = async () => {
        if (videoSessionData?.sessionId) {
            await agoraService.endVideoSession(videoSessionData.sessionId).catch(() => {});
        }
        setShowVideoCall(false);
        setVideoSessionData(null);
    };

    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        clearUnread(contact.id);
    };

    const filteredContacts = contacts
        .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const aMsgs = messages[a.id] || [];
            const bMsgs = messages[b.id] || [];
            const aLast = aMsgs.length > 0 ? aMsgs[aMsgs.length - 1].timestamp : 0;
            const bLast = bMsgs.length > 0 ? bMsgs[bMsgs.length - 1].timestamp : 0;
            return bLast - aLast;
        });

    const contactMessages = selectedContact ? (messages[selectedContact.id] || []) : [];

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isOnline = (contact) => {
        if (!contact.lastActive) return false;
        const diff = Date.now() - new Date(contact.lastActive).getTime();
        return diff < 2 * 60 * 1000; // 2 minutes
    };

    const getLastMessage = (contactId) => {
        const msgs = messages[contactId] || [];
        if (msgs.length === 0) return null;
        return msgs[msgs.length - 1];
    };

    const isVideoCallMessage = (text) => {
        return text && text.includes('Video call started. Join channel:');
    };

    const extractChannelName = (text) => {
        const match = text.match(/Join channel: (.+)$/);
        return match ? match[1] : null;
    };

    // Handle infinite scroll up
    const handleScroll = async (e) => {
        const container = e.target;
        // Check if scrolled to top (within 50px)
        if (container.scrollTop <= 50 && !loadingMore && selectedContact) {
            const state = paginationState[selectedContact.id];
            if (state && !state.isLast && state.cursor) {
                setLoadingMore(true);
                const previousScrollHeight = container.scrollHeight;
                
                try {
                    const result = await fetchHistory(selectedContact.id, state.cursor);
                    setPaginationState(prev => ({
                        ...prev,
                        [selectedContact.id]: {
                            cursor: result.cursor,
                            isLast: result.isLast
                        }
                    }));
                    
                    // Maintain scroll position after loading older messages
                    setTimeout(() => {
                        const newScrollHeight = container.scrollHeight;
                        container.scrollTop = newScrollHeight - previousScrollHeight;
                    }, 50);
                } catch (error) {
                    console.error("Failed to load more messages:", error);
                } finally {
                    setLoadingMore(false);
                }
            }
        }
    };

    return (
        <div className="container messaging-page">
            <div className="page-header">
                <div>
                    <h1>Messages</h1>
                    <p>
                        {isConnected
                            ? 'Connected'
                            : 'Connecting to chat...'
                        }
                    </p>
                </div>
            </div>

            <div className="messaging-container">
                {/* Sidebar: Contact List */}
                <div className="messaging-sidebar card">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="conversations-list">
                        {loading ? (
                            <div className="empty-state small">
                                <p>Loading contacts...</p>
                            </div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="empty-state small">
                                <p>No contacts found</p>
                            </div>
                        ) : (
                            filteredContacts.map(contact => (
                                <div
                                    key={contact.id}
                                    className={`conversation-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                                    onClick={() => handleSelectContact(contact)}
                                >
                                    <div className="avatar-wrapper">
                                        <img
                                            src={contact.profileImage || '/default-avatar.png'}
                                            alt={contact.name}
                                            onError={(e) => { e.target.src = '/default-avatar.png'; }}
                                        />
                                        <span className={`status-dot ${isOnline(contact) ? 'online' : 'offline'}`} />
                                    </div>
                                    <div className="conversation-info">
                                        <h4>{contact.name}</h4>
                                        <p className="last-message-preview">
                                            {getLastMessage(contact.id)
                                                ? (isVideoCallMessage(getLastMessage(contact.id).text)
                                                    ? 'Video call'
                                                    : getLastMessage(contact.id).text)
                                                : <span className="contact-role">{contact.role}</span>
                                            }
                                        </p>
                                    </div>
                                    <div className="conversation-meta">
                                        {getLastMessage(contact.id) && (
                                            <span className="message-time-small">
                                                {formatTime(getLastMessage(contact.id).timestamp)}
                                            </span>
                                        )}
                                        {unreadCounts[contact.id] > 0 && (
                                            <span className="unread-badge">{unreadCounts[contact.id]}</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main: Chat Area */}
                <div className="messaging-main card">
                    {selectedContact ? (
                        <>
                            <div className="chat-header">
                                <div className="avatar-wrapper">
                                    <img
                                        src={selectedContact.profileImage || '/default-avatar.png'}
                                        alt={selectedContact.name}
                                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                                    />
                                    <span className={`status-dot ${isOnline(selectedContact) ? 'online' : 'offline'}`} />
                                </div>
                                <div>
                                    <h3>{selectedContact.name}</h3>
                                    <span className={`status ${isOnline(selectedContact) ? 'online-text' : ''}`}>
                                        {isOnline(selectedContact) ? 'Online' : selectedContact.role}
                                    </span>
                                </div>
                                <div className="chat-actions">
                                    <button
                                        className="icon-btn"
                                        onClick={handleStartVideoCall}
                                        title="Start Video Call"
                                    >
                                        <Video size={20} />
                                    </button>
                                </div>
                            </div>

                            <div 
                                className="chat-messages"
                                ref={messagesContainerRef}
                                onScroll={handleScroll}
                            >
                                {loadingMore && (
                                    <div className="loading-more-messages">
                                        <p>Loading older messages...</p>
                                    </div>
                                )}
                                {contactMessages.length === 0 && !loadingMore && (
                                    <div className="empty-state small">
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                )}
                                {contactMessages.map((msg, index) => (
                                    <div
                                        key={msg.id || index}
                                        className={`message ${msg.isSent ? 'sent' : 'received'}`}
                                    >
                                        {!msg.isSent && (
                                            <img
                                                src={selectedContact.profileImage || '/default-avatar.png'}
                                                alt=""
                                                onError={(e) => { e.target.src = '/default-avatar.png'; }}
                                            />
                                        )}
                                        <div className="message-content">
                                            {isVideoCallMessage(msg.text) ? (
                                                <div className="video-call-message">
                                                    <p>Video call started</p>
                                                    {!msg.isSent && (
                                                        <button
                                                            className="join-call-btn"
                                                            onClick={() => handleJoinVideoCall(extractChannelName(msg.text))}
                                                        >
                                                            <Video size={16} />
                                                            Join Call
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <p>{msg.text}</p>
                                            )}
                                            <span className="message-time">
                                                {formatTime(msg.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="chat-input">
                                <input
                                    type="text"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder={isConnected ? "Type a message..." : "Connecting..."}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    disabled={!isConnected || sending}
                                />
                                <button onClick={handleSendMessage} disabled={!isConnected || sending}>
                                    <Send size={20} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <Mail size={64} color="#ccc" />
                            <h3>No conversation selected</h3>
                            <p>Choose a contact from the list to start chatting</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Video Call Overlay */}
            {showVideoCall && videoSessionData && (
                <VideoCall
                    channelName={videoSessionData.channelName}
                    appId={videoSessionData.appId}
                    token={videoSessionData.rtcToken}
                    onEndCall={handleEndVideoCall}
                />
            )}
        </div>
    );
};

export default Messaging;
