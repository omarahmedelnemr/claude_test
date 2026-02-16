import api from './api';

/**
 * Profile Service
 * Handles all profile-related API calls
 */
export const profileService = {
  // ==================== General Profile (All Roles) ====================

  /**
   * Get my main profile information
   * @returns {Promise} API response with profile data
   */
  getMainInfo: async () => {
    const response = await api.get('/profile/main-info');
    return response.data;
  },

  /**
   * Update my name
   * @param {string} newName - New name
   * @returns {Promise} API response
   */
  updateName: async (newName) => {
    const response = await api.post('/profile/name', { newName });
    return response.data;
  },

  /**
   * Update my birth date
   * @param {string} newBirthDate - New birth date (YYYY-MM-DD)
   * @returns {Promise} API response
   */
  updateBirthDate: async (newBirthDate) => {
    const response = await api.post('/profile/birthdate', { newBirthDate });
    return response.data;
  },

  /**
   * Update my profile image
   * @param {string} imageName - URL or path to profile image
   * @returns {Promise} API response
   */
  updateProfileImage: async (imageName) => {
    const response = await api.post('/profile/profile-image', { imageName });
    return response.data;
  },

  /**
   * Update my language preference
   * @param {string} language - Language code (ar, en, ms)
   * @returns {Promise} API response
   */
  updateLanguage: async (language) => {
    const response = await api.post('/profile/language', { language });
    return response.data;
  },

  /**
   * Send confirmation code for email change
   * @param {string} newEmail - New email address
   * @returns {Promise} API response
   */
  sendEmailChangeCode: async (newEmail) => {
    const response = await api.post('/profile/change-email', { newEmail });
    return response.data;
  },

  /**
   * Confirm email change with code
   * @param {string} newEmail - New email address
   * @param {string} code - Confirmation code
   * @returns {Promise} API response
   */
  confirmEmailChange: async (newEmail, code) => {
    const response = await api.post('/profile/confirm-change-email', { newEmail, code });
    return response.data;
  },

  /**
   * Change password
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password (min 6 characters)
   * @returns {Promise} API response
   */
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/profile/change-password', { oldPassword, newPassword });
    return response.data;
  },

  /**
   * Update my bio
   * @param {string} newBio - New bio text (max 500 characters)
   * @returns {Promise} API response
   */
  updateBio: async (newBio) => {
    const response = await api.post('/profile/bio', { newBio });
    return response.data;
  },

  // ==================== Teacher Profile ====================

  /**
   * Get teacher main info
   * @returns {Promise} API response with teacher profile data
   */
  getTeacherMainInfo: async () => {
    const response = await api.get('/profile/teacher-main-info');
    return response.data;
  },

  /**
   * Update teacher name
   * @param {string} newName - New name
   * @returns {Promise} API response
   */
  updateTeacherName: async (newName) => {
    const response = await api.post('/profile/teacher-name-edit', { newName });
    return response.data;
  },

  /**
   * Update teacher title
   * @param {string} newTitle - New professional title
   * @returns {Promise} API response
   */
  updateTeacherTitle: async (newTitle) => {
    const response = await api.post('/profile/teacher-title-edit', { newTitle });
    return response.data;
  },

  /**
   * Update teacher description
   * @param {string} newDescription - New description
   * @returns {Promise} API response
   */
  updateTeacherDescription: async (newDescription) => {
    const response = await api.post('/profile/teacher-description-edit', { newDescription });
    return response.data;
  },

  // Teacher Education Records
  getTeacherEducation: async (teacherID) => {
    const response = await api.get('/profile/teacher-education-record', { params: { teacherID } });
    return response.data;
  },

  addTeacherEducation: async (teacherID, title) => {
    const response = await api.post('/profile/teacher-education-record', { teacherID, title });
    return response.data;
  },

  deleteTeacherEducation: async (teacherID, recordID) => {
    const response = await api.delete('/profile/teacher-education-record', { data: { teacherID, recordID } });
    return response.data;
  },

  // Teacher Experience Records
  getTeacherExperience: async (teacherID) => {
    const response = await api.get('/profile/teacher-experience-record', { params: { teacherID } });
    return response.data;
  },

  addTeacherExperience: async (teacherID, title) => {
    const response = await api.post('/profile/teacher-experience-record', { teacherID, title });
    return response.data;
  },

  deleteTeacherExperience: async (teacherID, recordID) => {
    const response = await api.delete('/profile/teacher-experience-record', { data: { teacherID, recordID } });
    return response.data;
  },

  // Teacher Certificate Records
  getTeacherCertificates: async (teacherID) => {
    const response = await api.get('/profile/teacher-certificate-record', { params: { teacherID } });
    return response.data;
  },

  addTeacherCertificate: async (teacherID, title) => {
    const response = await api.post('/profile/teacher-certificate-record', { teacherID, title });
    return response.data;
  },

  deleteTeacherCertificate: async (teacherID, recordID) => {
    const response = await api.delete('/profile/teacher-certificate-record', { data: { teacherID, recordID } });
    return response.data;
  },

  // ==================== Student Profile ====================

  /**
   * Get student main info
   * @returns {Promise} API response with student profile data
   */
  getStudentMainInfo: async () => {
    const response = await api.get('/profile/student-main-info');
    return response.data;
  },

  /**
   * Update student name
   * @param {string} newName - New name
   * @returns {Promise} API response
   */
  updateStudentName: async (newName) => {
    const response = await api.post('/profile/student-name-edit', { newName });
    return response.data;
  },

  // ==================== Parent Invitations (Student Side) ====================

  sendParentInvitation: async (studentID, parentEmail) => {
    const response = await api.post('/profile/send-parent-invitation', { studentID, parentEmail });
    return response.data;
  },

  getSentInvitations: async (studentID) => {
    const response = await api.get('/profile/sent-parent-invitations', { params: { studentID } });
    return response.data;
  },

  cancelInvitation: async (studentID, invitationID) => {
    const response = await api.delete('/profile/cancel-parent-invitation', { data: { studentID, invitationID } });
    return response.data;
  },

  getParentsList: async (studentID) => {
    const response = await api.get('/profile/parents-list', { params: { studentID } });
    return response.data;
  },

  removeParent: async (studentID, parentID) => {
    const response = await api.delete('/profile/remove-parent', { data: { studentID, parentID } });
    return response.data;
  },
};

export default profileService;

