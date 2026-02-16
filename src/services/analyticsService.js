import api from './api';

/**
 * Analytics Service
 * Handles all analytics-related API calls
 */
export const analyticsService = {
  /**
   * Get comprehensive teacher analytics
   * @param {Object} params - Query parameters
   * @param {string} params.teacherID - Teacher ID (optional - will be taken from session if not provided)
   * @param {string} params.timeRange - Time range (7days, 30days, 90days, year)
   * @param {string} params.courseID - Optional course ID filter (or 'all' for all courses)
   * @returns {Promise} API response with analytics data
   */
  getTeacherAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/teacher', { params });
    return response.data;
  },

  /**
   * Get detailed enrollment trend data
   * @param {Object} params - Query parameters
   * @param {string} params.teacherID - Teacher ID
   * @param {string} params.timeRange - Time range (7days, 30days, 90days, year)
   * @param {string} params.courseID - Optional course ID filter
   * @returns {Promise} API response with enrollment trend data
   */
  getEnrollmentTrend: async (params = {}) => {
    const response = await api.get('/analytics/enrollment-trend', { params });
    return response.data;
  },
};

export default analyticsService;

