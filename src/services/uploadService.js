import api from './api';

/**
 * Upload Service
 * Handles all file upload operations to the server
 */
export const uploadService = {
  /**
   * Upload a general file (images, PDFs, videos)
   * @param {File} file - File to upload
   * @returns {Promise<string>} URL of the uploaded file
   */
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; // Returns URL string
  },

  /**
   * Upload a profile picture
   * @param {File} file - Image file to upload
   * @returns {Promise<string>} URL of the uploaded profile picture
   */
  uploadProfilePic: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploadProfilePic', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; // Returns URL string
  },

  /**
   * Upload a lecture recording (video)
   * @param {File} file - Video file to upload
   * @returns {Promise<Object>} Object with url, fileName, fileType, size
   */
  uploadLectureRecording: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploadLectureRecording', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload a homework file (PDF, DOC, DOCX)
   * @param {File} file - Document file to upload
   * @returns {Promise<Object>} Object with url, fileName, fileType, size
   */
  uploadHomeworkFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploadHomeworkFile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload lecture content (video or PDF)
   * @param {File} file - Video or PDF file to upload
   * @returns {Promise<Object>} Object with url, fileName, fileType, contentType, size
   */
  uploadLectureContent: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload-lecture-content', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default uploadService;

