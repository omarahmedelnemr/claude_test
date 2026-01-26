import api from './api';

/**
 * Community Service - API methods for community features
 */
const communityService = {
  /**
   * Get list of all approved communities
   * @returns {Promise<Array>} List of communities
   */
  getCommunityList: async () => {
    const response = await api.get('/community/community-list');
    return response.data;
  },

  /**
   * Get post feed with optional filters
   * @param {Object} params - Query parameters
   * @param {string} params.studentID - Student ID (optional if teacherID provided)
   * @param {string} params.teacherID - Teacher ID (optional if studentID provided)
   * @param {string} params.communityID - Community filter (optional)
   * @param {number} params.loadBlock - Page number (default: 1)
   * @returns {Promise<Array>} List of posts
   */
  getPostFeed: async ({ studentID, teacherID, communityID, loadBlock = 1 }) => {
    const params = { loadBlock };
    if (studentID) params.studentID = studentID;
    if (teacherID) params.teacherID = teacherID;
    if (communityID) params.communityID = communityID;

    const response = await api.get('/community/post-feed', { params });
    return response.data;
  },

  /**
   * Get detailed information about a single post
   * @param {Object} params - Query parameters
   * @param {string} params.postID - Post ID (required)
   * @param {string} params.studentID - Student ID (optional)
   * @param {string} params.teacherID - Teacher ID (optional)
   * @returns {Promise<Object>} Post details
   */
  getPostInfo: async ({ postID, studentID, teacherID }) => {
    const params = { postID };
    if (studentID) params.studentID = studentID;
    if (teacherID) params.teacherID = teacherID;

    const response = await api.get('/community/post-info', { params });
    return response.data;
  },

  /**
   * Get all posts by a specific student
   * @param {string} studentID - Student ID
   * @param {number} loadBlock - Page number (default: 1)
   * @returns {Promise<Array>} List of student's posts
   */
  getStudentPosts: async (studentID, loadBlock = 1) => {
    const response = await api.get('/community/student-posts', {
      params: { studentID, loadBlock }
    });
    return response.data;
  },

  /**
   * Create a new community post
   * @param {Object} postData - Post data
   * @param {string} postData.studentID - Student ID
   * @param {string} postData.communityID - Community ID
   * @param {string} postData.mainText - Post content (max 1000 chars)
   * @param {string} postData.date - Date in ISO format
   * @param {boolean} postData.hideIdentity - Whether to hide identity
   * @param {Array} postData.attachedImages - Array of {name, link} objects (optional)
   * @returns {Promise<Object>} Created post
   */
  createPost: async (postData) => {
    const response = await api.post('/community/new-post', postData);
    return response.data;
  },

  /**
   * Edit an existing post
   * @param {Object} postData - Post data
   * @param {string} postData.studentID - Student ID
   * @param {string} postData.postID - Post ID
   * @param {string} postData.communityID - Community ID
   * @param {string} postData.mainText - Post content (max 1000 chars)
   * @param {boolean} postData.hideIdentity - Whether to hide identity
   * @param {Array} postData.attachedImages - Array of {name, link} objects (optional)
   * @returns {Promise<Object>} Updated post
   */
  editPost: async (postData) => {
    const response = await api.post('/community/edit-post', postData);
    return response.data;
  },

  /**
   * Delete a post
   * @param {string} studentID - Student ID
   * @param {string} postID - Post ID
   * @returns {Promise<Object>} Deletion result
   */
  deletePost: async (studentID, postID) => {
    const response = await api.delete('/community/post', {
      data: { studentID, postID }
    });
    return response.data;
  },

  /**
   * Get reactions for a post
   * @param {string} postID - Post ID
   * @returns {Promise<Array>} List of reactions
   */
  getPostReactions: async (postID) => {
    const response = await api.get('/community/post-reaction', {
      params: { postID }
    });
    return response.data;
  },

  /**
   * Add a reaction (like) to a post
   * @param {Object} data - Reaction data
   * @param {string} data.postID - Post ID
   * @param {string} data.studentID - Student ID (optional if teacherID provided)
   * @param {string} data.teacherID - Teacher ID (optional if studentID provided)
   * @returns {Promise<Object>} Reaction result
   */
  addPostReaction: async ({ postID, studentID, teacherID }) => {
    const data = { postID };
    if (studentID) data.studentID = studentID;
    if (teacherID) data.teacherID = teacherID;

    const response = await api.post('/community/post-reaction', data);
    return response.data;
  },

  /**
   * Remove a reaction from a post
   * @param {Object} data - Reaction data
   * @param {string} data.postID - Post ID
   * @param {string} data.studentID - Student ID (optional if teacherID provided)
   * @param {string} data.teacherID - Teacher ID (optional if studentID provided)
   * @returns {Promise<Object>} Removal result
   */
  removePostReaction: async ({ postID, studentID, teacherID }) => {
    const data = { postID };
    if (studentID) data.studentID = studentID;
    if (teacherID) data.teacherID = teacherID;

    const response = await api.delete('/community/post-reaction', { data });
    return response.data;
  },

  /**
   * Get comments for a post
   * @param {string} postID - Post ID
   * @param {number} loadBlock - Page number (default: 1)
   * @returns {Promise<Array>} List of comments
   */
  getComments: async (postID, loadBlock = 1) => {
    const response = await api.get('/community/comment-list', {
      params: { postID, loadBlock }
    });
    return response.data;
  },

  /**
   * Add a comment to a post
   * @param {Object} commentData - Comment data
   * @param {string} commentData.studentID - Student ID
   * @param {string} commentData.postID - Post ID
   * @param {string} commentData.comment - Comment text (max 500 chars)
   * @param {string} commentData.date - Date in ISO format
   * @returns {Promise<Object>} Created comment
   */
  addComment: async (commentData) => {
    const response = await api.post('/community/post-comment', commentData);
    return response.data;
  },

  /**
   * Delete a comment
   * @param {string} studentID - Student ID
   * @param {string} commentID - Comment ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteComment: async (studentID, commentID) => {
    const response = await api.delete('/community/post-comment', {
      data: { studentID, commentID }
    });
    return response.data;
  },

  /**
   * Add a reaction to a comment
   * @param {string} studentID - Student ID
   * @param {string} commentID - Comment ID
   * @returns {Promise<Object>} Reaction result
   */
  addCommentReaction: async (studentID, commentID) => {
    const response = await api.post('/community/post-comment-reaction', {
      studentID,
      commentID
    });
    return response.data;
  },

  /**
   * Remove a reaction from a comment
   * @param {string} studentID - Student ID
   * @param {string} commentID - Comment ID
   * @returns {Promise<Object>} Removal result
   */
  removeCommentReaction: async (studentID, commentID) => {
    const response = await api.delete('/community/post-comment-reaction', {
      data: { studentID, commentID }
    });
    return response.data;
  },

  /**
   * Get saved posts for the current user (student, teacher, or parent)
   * User ID is automatically extracted from session by backend
   * @param {number} loadBlock - Page number (default: 1)
   * @returns {Promise<Array>} List of saved posts
   */
  getSavedPosts: async (loadBlock = 1) => {
    const response = await api.get('/community/save-post-list', {
      params: { loadBlock }
    });
    return response.data;
  },

  /**
   * Save a post
   * User ID is automatically extracted from session by backend
   * @param {string} postID - Post ID
   * @returns {Promise<Object>} Save result
   */
  savePost: async (postID) => {
    const response = await api.post('/community/save-post', {
      postID
    });
    return response.data;
  },

  /**
   * Unsave a post
   * User ID is automatically extracted from session by backend
   * @param {string} postID - Post ID
   * @returns {Promise<Object>} Unsave result
   */
  unsavePost: async (postID) => {
    const response = await api.delete('/community/save-post', {
      data: { postID }
    });
    return response.data;
  },

  /**
   * Report a post
   * @param {Object} reportData - Report data
   * @param {string} reportData.postID - Post ID
   * @param {string} reportData.reportType - Type of report
   * @param {string} reportData.reason - Reason for reporting
   * @returns {Promise<Object>} Report result
   */
  reportPost: async (reportData) => {
    const response = await api.post('/community/report-post', reportData);
    return response.data;
  }
};

export default communityService;
