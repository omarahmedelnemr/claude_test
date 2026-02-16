import api from './api';

const parentService = {
  getPendingInvitations: async (parentID) => {
    const response = await api.get('/parent/pending-invitations', { params: { parentID } });
    return response.data;
  },

  respondToInvitation: async (parentID, invitationID, accept) => {
    const response = await api.post('/parent/respond-to-invitation', { parentID, invitationID, accept });
    return response.data;
  },
};

export default parentService;
