import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AC from 'agora-chat';
import { useAuth } from './AuthContext';
import agoraService from '../services/agoraService';

const AgoraChatContext = createContext(null);

export const useAgoraChat = () => {
    const context = useContext(AgoraChatContext);
    if (!context) {
        throw new Error('useAgoraChat must be used within an AgoraChatProvider');
    }
    return context;
};

export const AgoraChatProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState({});
    const [unreadCounts, setUnreadCounts] = useState({});
    const [chatUsername, setChatUsername] = useState(null);
    const connectionRef = useRef(null);
    const connectingRef = useRef(false);
    const heartbeatRef = useRef(null);

    const initConnection = useCallback(async () => {
        if (!currentUser || connectionRef.current || connectingRef.current) return;
        connectingRef.current = true;

        try {
            const tokenData = await agoraService.getChatToken();
            setChatUsername(tokenData.agoraChatUsername);

            const conn = new AC.connection({
                appKey: tokenData.agoraAppKey,
            });

            conn.addEventHandler('messageHandler', {
                onTextMessage: (message) => {
                    const conversationId = message.from === tokenData.agoraChatUsername
                        ? message.to
                        : message.from;

                    setMessages(prev => {
                        const existing = prev[conversationId] || [];
                        // Avoid duplicates
                        if (existing.some(m => m.id === message.id)) return prev;
                        return {
                            ...prev,
                            [conversationId]: [
                                ...existing,
                                {
                                    id: message.id,
                                    from: message.from,
                                    to: message.to,
                                    text: message.msg || message.data || '',
                                    timestamp: message.time || Date.now(),
                                    isSent: message.from === tokenData.agoraChatUsername,
                                }
                            ]
                        };
                    });

                    if (message.from !== tokenData.agoraChatUsername) {
                        setUnreadCounts(prev => ({
                            ...prev,
                            [conversationId]: (prev[conversationId] || 0) + 1
                        }));
                    }
                },
                onConnected: () => {
                    setIsConnected(true);
                },
                onDisconnected: () => {
                    setIsConnected(false);
                },
                onTokenExpired: async () => {
                    // Re-fetch token and reconnect
                    try {
                        const newTokenData = await agoraService.getChatToken();
                        await conn.open({
                            user: newTokenData.agoraChatUsername,
                            agoraToken: newTokenData.chatToken,
                        });
                    } catch (err) {
                        console.error("Failed to refresh Agora Chat token:", err);
                    }
                },
                onError: (error) => {
                    console.error("Agora Chat error:", error);
                },
            });

            await conn.open({
                user: tokenData.agoraChatUsername,
                agoraToken: tokenData.chatToken,
            });

            connectionRef.current = conn;
        } catch (error) {
            console.error("Failed to initialize Agora Chat:", error);
        } finally {
            connectingRef.current = false;
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            initConnection();
        }
        return () => {
            if (connectionRef.current) {
                connectionRef.current.close();
                connectionRef.current = null;
                setIsConnected(false);
                connectingRef.current = false;
            }
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
        };
    }, [currentUser, initConnection]);

    // Heartbeat: update lastActive every 30s while connected
    useEffect(() => {
        if (isConnected) {
            agoraService.heartbeat().catch(() => {});
            heartbeatRef.current = setInterval(() => {
                agoraService.heartbeat().catch(() => {});
            }, 30000);
        }
        return () => {
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
        };
    }, [isConnected]);

    const sendMessage = useCallback(async (targetUsername, text) => {
        if (!connectionRef.current || !isConnected) {
            throw new Error("Not connected to Agora Chat");
        }

        const msg = AC.message.create({
            type: 'txt',
            msg: text,
            to: targetUsername,
            chatType: 'singleChat',
        });

        const result = await connectionRef.current.send(msg);

        const newMsg = {
            id: result.serverMsgId || Date.now().toString(),
            from: chatUsername,
            to: targetUsername,
            text: text,
            timestamp: Date.now(),
            isSent: true,
        };

        setMessages(prev => ({
            ...prev,
            [targetUsername]: [
                ...(prev[targetUsername] || []),
                newMsg
            ]
        }));

        return result;
    }, [isConnected, chatUsername]);

    const fetchHistory = useCallback(async (targetUsername, cursor = '', pageSize = 10) => {
        if (!connectionRef.current) return { messages: [], cursor: '', isLast: true };

        try {
            const result = await connectionRef.current.getHistoryMessages({
                targetId: targetUsername,
                chatType: 'singleChat',
                pageSize: pageSize,
                cursor: cursor,
            });

            const fetchedMessages = (result.messages || []).map(msg => ({
                id: msg.id,
                from: msg.from,
                to: msg.to,
                text: msg.msg || msg.data || msg.body?.msg || '',
                timestamp: msg.time || 0,
                isSent: msg.from === chatUsername,
            }));

            if (!cursor) {
                // First load - replace messages
                setMessages(prev => ({
                    ...prev,
                    [targetUsername]: fetchedMessages.reverse()
                }));
            } else {
                // Loading more - prepend older messages
                setMessages(prev => ({
                    ...prev,
                    [targetUsername]: [
                        ...fetchedMessages.reverse(),
                        ...(prev[targetUsername] || [])
                    ]
                }));
            }

            return { messages: fetchedMessages, cursor: result.cursor, isLast: result.isLast };
        } catch (err) {
            console.error("Failed to fetch history:", err);
            return { messages: [], cursor: '', isLast: true };
        }
    }, [chatUsername]);

    const clearUnread = useCallback((conversationId) => {
        setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));
    }, []);

    const value = {
        isConnected,
        messages,
        unreadCounts,
        chatUsername,
        sendMessage,
        fetchHistory,
        clearUnread,
    };

    return (
        <AgoraChatContext.Provider value={value}>
            {children}
        </AgoraChatContext.Provider>
    );
};
