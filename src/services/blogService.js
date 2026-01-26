import api from './api';

/**
 * Blog Service
 * Handles all blog-related API calls
 */
export const blogService = {
  /**
   * Get all approved article categories
   * @returns {Promise} API response with categories list
   */
  getCategoriesList: async () => {
    const response = await api.get('/blog/category-list');
    return response.data;
  },

  /**
   * Get article feed with optional filters
   * @param {Object} params - Query parameters
   * @param {string} params.categoryID - Category filter (optional)
   * @param {number} params.loadBlock - Page number (default: 1)
   * @param {string} params.searchQuery - Search query (optional)
   * @returns {Promise} API response with articles list
   */
  getArticleFeed: async (params = {}) => {
    const response = await api.get('/blog/article-feed', { params });
    return response.data;
  },

  /**
   * Get article feed (admin version - includes unapproved)
   * @param {Object} params - Query parameters
   * @param {string} params.categoryID - Category filter (optional)
   * @param {number} params.loadBlock - Page number (default: 1)
   * @param {string} params.searchQuery - Search query (optional)
   * @returns {Promise} API response with all articles including unapproved
   */
  getArticleFeedAdmin: async (params = {}) => {
    const response = await api.get('/blog/article-feed-admin', { params });
    return response.data;
  },

  /**
   * Get a single article with full details
   * @param {string} articleID - Article ID
   * @returns {Promise} API response with article details
   */
  getArticle: async (articleID) => {
    const response = await api.get('/blog/article', {
      params: { articleID },
    });
    return response.data;
  },

  /**
   * Create a new article (Teacher only)
   * @param {Object} data - Article data
   * @param {string} data.title - Article title (max 200 chars)
   * @param {string} data.mainText - Article content (max 1000 chars)
   * @param {string} data.date - Publication date (ISO string)
   * @param {string} data.categoryID - Category ID
   * @param {string} data.coverImage - Cover image URL (optional)
   * @param {Array} data.attachedImage - Attached images array (optional)
   * @returns {Promise} API response
   */
  createArticle: async (data) => {
    const response = await api.post('/blog/article', data);
    return response.data;
  },

  /**
   * Edit an existing article (Teacher only)
   * @param {Object} data - Article data including articleID
   * @param {string} data.articleID - Article ID
   * @param {string} data.title - Article title
   * @param {string} data.mainText - Article content (max 1000 chars)
   * @param {string} data.date - Publication date (ISO string)
   * @param {string} data.categoryID - Category ID
   * @param {string} data.coverImage - Cover image URL (optional)
   * @param {Array} data.attachedImage - Attached images array (optional)
   * @returns {Promise} API response
   */
  editArticle: async (data) => {
    const response = await api.post('/blog/article-edit', data);
    return response.data;
  },

  /**
   * Delete an article (Teacher only)
   * @param {string} articleID - Article ID
   * @returns {Promise} API response
   */
  deleteArticle: async (articleID) => {
    const response = await api.delete('/blog/article', {
      data: { articleID },
    });
    return response.data;
  },

  /**
   * Like an article (Student or Teacher)
   * @param {string} articleID - Article ID
   * @returns {Promise} API response
   */
  likeArticle: async (articleID) => {
    const response = await api.post('/blog/like-article', { articleID });
    return response.data;
  },

  /**
   * Unlike an article (Student or Teacher)
   * @param {string} articleID - Article ID
   * @returns {Promise} API response
   */
  unlikeArticle: async (articleID) => {
    const response = await api.delete('/blog/like-article', {
      data: { articleID },
    });
    return response.data;
  },

  /**
   * Save an article to saved list (Student or Teacher)
   * @param {string} articleID - Article ID
   * @returns {Promise} API response
   */
  saveArticle: async (articleID) => {
    const response = await api.post('/blog/save-article', { articleID });
    return response.data;
  },

  /**
   * Remove an article from saved list (Student or Teacher)
   * @param {string} articleID - Article ID
   * @returns {Promise} API response
   */
  unsaveArticle: async (articleID) => {
    const response = await api.delete('/blog/save-article', {
      data: { articleID },
    });
    return response.data;
  },

  /**
   * Get saved articles list (Student or Teacher)
   * @param {Object} params - Query parameters
   * @param {number} params.loadBlock - Page number (default: 1)
   * @returns {Promise} API response with saved articles
   */
  getSavedArticles: async (params = {}) => {
    const response = await api.get('/blog/saved-articles', { params });
    return response.data;
  },

  /**
   * Get my articles (Teacher only)
   * @param {Object} params - Query parameters
   * @param {number} params.loadBlock - Page number (default: 1)
   * @returns {Promise} API response with teacher's articles
   */
  getMyArticles: async (params = {}) => {
    const response = await api.get('/blog/my-articles', { params });
    return response.data;
  },
};

export default blogService;

