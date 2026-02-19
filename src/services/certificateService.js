import api from './api';

/**
 * Certificate Service
 * Handles all certificate-related API calls
 */
export const certificateService = {
  /**
   * Get all certificates for a student
   * @param {string} studentID - Student ID
   * @returns {Promise} API response with certificates list
   */
  getUserCertificates: async (studentID) => {
    const response = await api.get('/certificate/user', {
      params: { studentID }
    });
    return response.data;
  },

  /**
   * Get certificate for a specific course
   * @param {string} studentID - Student ID
   * @param {string} courseID - Course ID
   * @returns {Promise} API response with certificate data
   */
  getCourseCertificate: async (studentID, courseID) => {
    const response = await api.get('/certificate/course', {
      params: { studentID, courseID }
    });
    return response.data;
  },

  /**
   * Generate a certificate (for testing)
   * @param {Object} certificateData - Certificate data
   * @param {string} certificateData.studentName - Student name
   * @param {string} certificateData.courseName - Course name
   * @param {string} certificateData.courseProvider - Course provider/teacher name
   * @param {string} certificateData.date - Date (optional)
   * @returns {Promise} Blob of certificate image
   */
  generateCertificate: async (certificateData) => {
    const response = await api.post('/certificate/generate', certificateData, {
      responseType: 'blob'
    });
    return response.data;
  },
};

export default certificateService;

