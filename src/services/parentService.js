import api from './api';

const parentService = {
  /**
   * Get connected students
   * @param {string} parentID - Parent ID
   * @returns {Promise} API response with connected students list
   */
  getConnectedStudents: async (parentID) => {
    const response = await api.get('/parent/students', { params: { parentID } });
    return response.data;
  },

  /**
   * Get pending invitations (invitations sent TO parent by students)
   * @param {string} parentID - Parent ID
   * @returns {Promise} API response with pending invitations
   */
  getPendingInvitations: async (parentID) => {
    const response = await api.get('/parent/pending-invitations', { params: { parentID } });
    return response.data;
  },

  /**
   * Respond to an invitation (accept or reject)
   * @param {string} parentID - Parent ID
   * @param {string} invitationID - Invitation ID
   * @param {boolean} accept - Whether to accept (true) or reject (false)
   * @returns {Promise} API response
   */
  respondToInvitation: async (parentID, invitationID, accept) => {
    const response = await api.post('/parent/respond-to-invitation', { parentID, invitationID, accept });
    return response.data;
  },

  /**
   * Get all courses for all connected students
   * @param {string} parentID - Parent ID
   * @returns {Promise} API response with course enrollments
   */
  getAllStudentCourses: async (parentID) => {
    const response = await api.get('/parent/student-courses', { params: { parentID } });
    return response.data;
  },

  /**
   * Get student main info (for parent viewing connected student)
   * @param {string} studentID - Student ID
   * @returns {Promise} API response with student profile data
   */
  getStudentInfo: async (studentID) => {
    const response = await api.get('/profile/student-main-info', { params: { studentID } });
    return response.data;
  },
};

export default parentService;
