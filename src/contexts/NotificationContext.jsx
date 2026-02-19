import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    // Return default values if context is not available (graceful degradation)
    if (!context) {
        return {
            notifications: [],
            unreadCount: 0,
            isConnected: false,
            markAsSeen: () => {},
            clearAll: () => {},
            refreshNotifications: () => {}
        };
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    // Initialize WebSocket connection
    const connectWebSocket = useCallback(() => {
        if (!currentUser?.id) return;
        
        // Don't reconnect if already connected and authenticated
        if (socketRef.current?.connected) {
            console.log('WebSocket already connected, skipping...');
            return;
        }

        // Clean up existing connection if any
        if (socketRef.current) {
            console.log('Cleaning up existing socket connection...');
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        // Get API base URL from environment or default (same as API service)
        const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const token = localStorage.getItem('token');
        
        console.log('Initializing WebSocket connection to:', apiUrl);
        
        const socket = io(apiUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: maxReconnectAttempts,
            autoConnect: true,
            timeout: 20000, // 20 second timeout
            auth: {
                token: token
            },
            query: {
                token: token
            }
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('WebSocket connected:', socket.id);
            setIsConnected(true);
            reconnectAttemptsRef.current = 0;

            // Authenticate immediately after connection
            if (currentUser?.id) {
                const currentToken = localStorage.getItem('token');
                console.log('Authenticating WebSocket for user:', currentUser.id);
                socket.emit('authenticate', {
                    userId: currentUser.id,
                    role: currentUser.role,
                    token: currentToken
                });
            }
        });

        socket.on('authenticated', (data) => {
            console.log('WebSocket authenticated successfully:', data);
        });

        socket.on('notification', (notification) => {
            console.log('Received real-time notification:', notification);
            
            // Add notification to state
            setNotifications(prev => {
                // Avoid duplicates by checking id and timestamp
                const exists = prev.some(n => 
                    (n.id === notification.id || n.entityID === notification.id) && 
                    n.timestamp === notification.timestamp
                );
                if (exists) return prev;
                
                // Format notification to match DB structure
                const formattedNotification = {
                    id: notification.id || notification.entityID,
                    entityID: notification.id || notification.entityID,
                    category: notification.category || 'general',
                    header: notification.header || '',
                    text: notification.text || '',
                    route: notification.route || '/notifications',
                    timestamp: notification.timestamp || new Date().toISOString(),
                    seen: false
                };
                
                return [formattedNotification, ...prev].slice(0, 100); // Keep last 100 notifications
            });

            // Update unread count
            setUnreadCount(prev => prev + 1);

            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
                const browserNotification = new Notification(notification.header || 'New Notification', {
                    body: notification.text,
                    icon: '/favicon.ico',
                    tag: notification.id,
                    data: notification
                });
                
                // Handle click on browser notification
                browserNotification.onclick = () => {
                    window.focus();
                    if (notification.route && notification.route !== '/notifications') {
                        // Use window.location for navigation from notification click
                        window.location.href = notification.route;
                    }
                    browserNotification.close();
                };
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setIsConnected(false);
            reconnectAttemptsRef.current++;
            
            if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                console.warn('Max reconnection attempts reached');
            }
        });

        // Note: Socket.IO has built-in heartbeat/ping-pong at the protocol level
        // No need for custom application-level ping/pong - Socket.IO handles connection health automatically
        // This is more efficient than application-level events
    }, [currentUser]);

    // Request browser notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
    }, []);

    // Fetch notifications from database
    const fetchNotifications = useCallback(async () => {
        if (!currentUser?.id) return;

        try {
            const response = await api.get('/notify/get-notifications', {
                params: {
                    userID: currentUser.id,
                    role: currentUser.role
                }
            });

            if (response.data && response.data.notifications) {
                const dbNotifications = response.data.notifications.map(n => ({
                    id: n.entityID || n.id,
                    category: n.category || 'general',
                    header: n.header || '',
                    text: n.text || '',
                    route: n.route || '/notifications',
                    timestamp: n.timestamp || new Date().toISOString(),
                    seen: n.seen || false
                }));

                // Merge with existing notifications (avoid duplicates)
                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => `${n.id}-${n.timestamp}`));
                    const newNotifications = dbNotifications.filter(n => 
                        !existingIds.has(`${n.id}-${n.timestamp}`)
                    );
                    return [...newNotifications, ...prev].slice(0, 100);
                });

                // Update unread count from DB
                if (response.data.unreadCount !== undefined) {
                    setUnreadCount(response.data.unreadCount);
                } else {
                    // Calculate unread count if not provided
                    const unread = dbNotifications.filter(n => !n.seen).length;
                    setUnreadCount(unread);
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [currentUser]);

    // Fetch notifications on mount/startup - ensures badge shows correct count
    useEffect(() => {
        if (currentUser?.id) {
            // Fetch notifications immediately on mount/startup
            fetchNotifications();
        }
    }, []); // Only run once on mount

    // Connect when user logs in and fetch notifications
    useEffect(() => {
        if (!currentUser?.id) {
            // Disconnect when user logs out
            if (socketRef.current) {
                const socket = socketRef.current;
                socket.removeAllListeners();
                socket.disconnect();
                socketRef.current = null;
            }
            setIsConnected(false);
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        // Fetch notifications from database when user changes
        fetchNotifications();

        // Don't reconnect if already connected
        if (socketRef.current?.connected) {
            console.log('WebSocket already connected, skipping reconnection');
            return;
        }

        // Connect with a small delay to avoid React Strict Mode double mount issues
        const connectTimer = setTimeout(() => {
            if (currentUser?.id && !socketRef.current?.connected) {
                connectWebSocket();
            }
        }, 500);

        return () => {
            clearTimeout(connectTimer);
            // Don't cleanup on unmount if user is still logged in (React Strict Mode)
            // Only cleanup if user actually logged out
            if (!currentUser?.id && socketRef.current) {
                const socket = socketRef.current;
                socket.removeAllListeners();
                socket.disconnect();
                socketRef.current = null;
            }
        };
    }, [currentUser?.id, connectWebSocket, fetchNotifications]); // Depend on user ID, connect function, and fetch function

    // Mark notifications as seen
    const markAsSeen = useCallback(async () => {
        if (!currentUser) return;

        try {
            await api.post('/notify/mark-seen-notification', {
                userID: currentUser.id,
                role: currentUser.role
            });
            
            // Update local state to mark all notifications as seen
            setNotifications(prev => 
                prev.map(notification => ({
                    ...notification,
                    seen: true
                }))
            );
            
            // Reset unread count
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking notifications as seen:', error);
        }
    }, [currentUser]);

    // Clear all notifications
    const clearAll = useCallback(async () => {
        if (!currentUser) return;

        try {
            const endpoint = currentUser.role === 'student' 
                ? '/notify/all-student-notification'
                : '/notify/all-teacher-notification';
            
            await api.delete(endpoint, {
                data: {
                    [currentUser.role === 'student' ? 'studentID' : 'teacherID']: currentUser.id
                }
            });
            
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    }, [currentUser]);

    // Expose fetchNotifications for manual refresh if needed
    const refreshNotifications = useCallback(() => {
        if (currentUser?.id) {
            fetchNotifications();
        }
    }, [currentUser, fetchNotifications]);

    const value = {
        notifications,
        unreadCount,
        isConnected,
        markAsSeen,
        clearAll,
        refreshNotifications // Expose refresh function
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

