import api from './api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} API response with user data and token
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Teacher signup
   * @param {Object} data - Signup data including token, name, birthDate, gender, title, description
   * @returns {Promise} API response
   */
  teacherSignup: async (data) => {
    const response = await api.post('/auth/teacher-signup', data);
    return response.data;
  },

  /**
   * Student signup
   * @param {Object} data - Signup data including token, name, birthDate, gender
   * @returns {Promise} API response
   */
  studentSignup: async (data) => {
    const response = await api.post('/auth/student-signup', data);
    return response.data;
  },

  /**
   * Parent signup
   * @param {Object} data - Signup data including token, name, birthDate, gender
   * @returns {Promise} API response
   */
  parentSignup: async (data) => {
    const response = await api.post('/auth/parent-signup', data);
    return response.data;
  },

  /**
   * Send confirmation code to email
   * @param {string} email - User email
   * @returns {Promise} API response
   */
  sendConfirmationCode: async (email) => {
    const response = await api.post('/auth/send-confirmation-code', { email });
    return response.data;
  },

  /**
   * Check confirmation code
   * @param {string} email - User email
   * @param {string} code - 4-digit confirmation code
   * @returns {Promise} API response with verification token
   */
  checkConfirmationCode: async (email, code) => {
    const response = await api.post('/auth/check-confirmation-code', { email, code });
    return response.data;
  },

  /**
   * Verify account with token
   * @param {string} email - User email
   * @param {string} token - Verification token from checkConfirmationCode
   * @returns {Promise} API response
   */
  verifyAccount: async (email, token) => {
    const response = await api.post('/auth/verify-account', { email, token });
    return response.data;
  },

  /**
   * Reset password
   * @param {string} email - User email
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise} API response
   */
  resetPassword: async (email, token, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      email,
      token,
      newPassword,
    });
    return response.data;
  },

  /**
   * Get role information
   * @param {string} userID - User ID
   * @returns {Promise} API response with role and token
   */
  getRoleInfo: async (userID) => {
    const response = await api.get('/auth/role_info', { params: { userID } });
    return response.data;
  },

  /**
   * Logout - deletes the current session from the database
   * @returns {Promise} API response
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Validate current session
   * @param {boolean} refresh - Whether to refresh the session expiration
   * @returns {Promise} API response with session validity
   */
  validateSession: async (refresh = false) => {
    const response = await api.get('/auth/session', { params: { refresh } });
    return response.data;
  },

  /**
   * Get all active sessions for the current user
   * @returns {Promise} API response with list of sessions
   */
  getUserSessions: async () => {
    const response = await api.get('/auth/sessions');
    return response.data;
  },

  /**
   * Logout from all devices (delete all user sessions)
   * @returns {Promise} API response
   */
  logoutAllSessions: async () => {
    const response = await api.post('/auth/logout-all');
    return response.data;
  },
};

export default authService;

