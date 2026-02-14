import api from './api';

export const agoraService = {
    registerUser: async () => {
        const response = await api.post('/agora/register-user');
        return response.data;
    },

    getChatToken: async () => {
        const response = await api.post('/agora/chat-token');
        return response.data;
    },

    getRtcToken: async (channelName, uid) => {
        const response = await api.post('/agora/rtc-token', { channelName, uid });
        return response.data;
    },

    createVideoSession: async (targetUserID, maxParticipants = 3) => {
        const response = await api.post('/agora/video-session', { targetUserID, maxParticipants });
        return response.data;
    },

    endVideoSession: async (sessionId) => {
        const response = await api.post('/agora/video-session/end', { sessionId });
        return response.data;
    },

    getActiveVideoSession: async () => {
        const response = await api.get('/agora/video-session/active');
        return response.data;
    },

    heartbeat: async () => {
        const response = await api.post('/agora/heartbeat');
        return response.data;
    },

    getContacts: async () => {
        const response = await api.get('/agora/contacts');
        return response.data;
    },
};

export default agoraService;
