import api from './api';

/**
 * QA Service
 * Handles all Q&A-related API calls
 */
const qaService = {
  /**
   * Get all questions with optional filters
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status (answered, pending)
   * @param {string} params.studentID - Filter by student ID
   * @param {string} params.teacherID - Filter by teacher ID
   * @param {string} params.searchQuery - Search query
   * @param {string} params.sortBy - Sort by (question_date)
   * @param {number} params.loadBlock - Page number
   * @returns {Promise} API response with questions and answers
   */
  getQuestions: async (params = {}) => {
    const response = await api.get('/qa/questions', { params });
    return response.data;
  },

  /**
   * Add a new question (students only)
   * @param {Object} data - Question data
   * @param {string} data.question - Question text
   * @param {string} data.date - Question date (ISO string)
   * @returns {Promise} API response
   */
  addQuestion: async (data) => {
    const response = await api.post('/qa/question', data);
    return response.data;
  },

  /**
   * Add an answer to a question (teachers only)
   * @param {Object} data - Answer data
   * @param {number} data.questionID - Question ID
   * @param {string} data.answer - Answer text
   * @param {string} data.date - Answer date (ISO string)
   * @returns {Promise} API response
   */
  addAnswer: async (data) => {
    const response = await api.post('/qa/answer', data);
    return response.data;
  },

  /**
   * Mark an answer as helpful (students only)
   * @param {Object} data - Helpful vote data
   * @param {number} data.answerID - Answer ID
   * @returns {Promise} API response
   */
  markAnswerAsHelpful: async (data) => {
    const response = await api.post('/qa/answer/helpful', data);
    return response.data;
  },

  /**
   * Remove helpful vote from an answer (students only)
   * @param {Object} data - Helpful vote data
   * @param {number} data.answerID - Answer ID
   * @returns {Promise} API response
   */
  removeHelpfulVote: async (data) => {
    const response = await api.delete('/qa/answer/helpful', { data });
    return response.data;
  },

  /**
   * Delete an answer (teachers can delete their own answers)
   * @param {Object} data - Delete data
   * @param {number} data.answerID - Answer ID
   * @returns {Promise} API response
   */
  deleteAnswer: async (data) => {
    const response = await api.delete('/qa/answer', { data });
    return response.data;
  },
};

export default qaService;

