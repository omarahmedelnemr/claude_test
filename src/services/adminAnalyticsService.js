import api from './api';

/**
 * Admin Analytics Service
 * Handles all admin analytics-related API calls
 */
export const adminAnalyticsService = {
  /**
   * Get appointments count over time
   * @param {string} fromDate - Start date (ISO format)
   * @param {string} toDate - End date (ISO format)
   * @returns {Promise} API response with appointments over time data
   */
  getAppointmentsOverTime: async (fromDate, toDate) => {
    const response = await api.get('/admin/appointments-overtime', {
      params: { fromDate, toDate }
    });
    return response.data;
  },

  /**
   * Get courses created count over time
   * @param {string} fromDate - Start date (ISO format)
   * @param {string} toDate - End date (ISO format)
   * @returns {Promise} API response with courses created over time data
   */
  getCoursesCreatedOverTime: async (fromDate, toDate) => {
    const response = await api.get('/admin/courses-created-overtime', {
      params: { fromDate, toDate }
    });
    return response.data;
  },

  /**
   * Get user registrations over time grouped by role
   * @param {string} fromDate - Start date (ISO format)
   * @param {string} toDate - End date (ISO format)
   * @returns {Promise} API response with user registrations over time data
   */
  getUserRegistrationsOverTime: async (fromDate, toDate) => {
    const response = await api.get('/admin/user-registrations-overtime', {
      params: { fromDate, toDate }
    });
    return response.data;
  },

  /**
   * Get cancelled appointments count
   * @param {string} fromDate - Optional start date (ISO format)
   * @param {string} toDate - Optional end date (ISO format)
   * @returns {Promise} API response with cancelled appointments count
   */
  getCancelledAppointmentsCount: async (fromDate, toDate) => {
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const response = await api.get('/admin/cancelled-appointments-count', { params });
    return response.data;
  },

  /**
   * Get community posts count over time
   * @param {string} fromDate - Start date (ISO format)
   * @param {string} toDate - End date (ISO format)
   * @returns {Promise} API response with posts over time data
   */
  getPostsOverTime: async (fromDate, toDate) => {
    const response = await api.get('/admin/posts-overtime', {
      params: { fromDate, toDate }
    });
    return response.data;
  },

  /**
   * Get articles count over time
   * @param {string} fromDate - Start date (ISO format)
   * @param {string} toDate - End date (ISO format)
   * @returns {Promise} API response with articles over time data
   */
  getArticlesOverTime: async (fromDate, toDate) => {
    const response = await api.get('/admin/articles-overtime', {
      params: { fromDate, toDate }
    });
    return response.data;
  },

  /**
   * Get blocked posts count over time
   * @param {string} fromDate - Start date (ISO format)
   * @param {string} toDate - End date (ISO format)
   * @returns {Promise} API response with blocked posts over time data
   */
  getBlockedPostsOverTime: async (fromDate, toDate) => {
    const response = await api.get('/admin/blocked-posts-overtime', {
      params: { fromDate, toDate }
    });
    return response.data;
  },

  /**
   * Get blocked articles count over time
   * @param {string} fromDate - Start date (ISO format)
   * @param {string} toDate - End date (ISO format)
   * @returns {Promise} API response with blocked articles over time data
   */
  getBlockedArticlesOverTime: async (fromDate, toDate) => {
    const response = await api.get('/admin/blocked-articles-overtime', {
      params: { fromDate, toDate }
    });
    return response.data;
  },
};

export default adminAnalyticsService;

