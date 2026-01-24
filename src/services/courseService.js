import api from './api';

/**
 * Course Service
 * Handles all course-related API calls
 */
export const courseService = {
  // ==================== Student Side ====================

  /**
   * Get all available courses for students
   * @param {Object} params - Query parameters
   * @param {string} params.studentID - Student ID (optional)
   * @param {string} params.subject - Filter by subject
   * @param {string} params.searchQuery - Search query
   * @param {string} params.sortBy - Sort field (createdAt, rating, price, enrolledCount)
   * @param {string} params.sortOrder - Sort order (ASC, DESC)
   * @param {number} params.limit - Results per page
   * @param {number} params.loadBlock - Page number
   * @returns {Promise} API response with courses list
   */
  getAvailableCourses: async (params = {}) => {
    const response = await api.get('/courses/student/list', { params });
    return response.data;
  },

  /**
   * Get course details (student view)
   * @param {string} courseID - Course ID
   * @returns {Promise} API response with course details
   */
  getCourseDetails: async (courseID) => {
    const response = await api.get('/courses/student/details', {
      params: { courseID },
    });
    return response.data;
  },

  /**
   * Get teacher profile information
   * @param {string} teacherID - Teacher ID
   * @returns {Promise} API response with teacher profile
   */
  getTeacherProfile: async (teacherID) => {
    const response = await api.get('/courses/student/teacher-info', {
      params: { teacherID },
    });
    return response.data;
  },

  /**
   * Enroll in a course
   * @param {string} courseID - Course ID
   * @param {string} studentID - Student ID
   * @returns {Promise} API response
   */
  enrollInCourse: async (courseID, studentID) => {
    const response = await api.post('/courses/student/enroll', {
      courseID,
      studentID,
    });
    return response.data;
  },

  /**
   * Get student's enrollments
   * @param {Object} params - Query parameters
   * @param {string} params.studentID - Student ID
   * @param {string} params.status - Filter by status (enrolled, completed, dropped)
   * @param {number} params.limit - Results per page
   * @param {number} params.loadBlock - Page number
   * @returns {Promise} API response with enrollments
   */
  getStudentEnrollments: async (params) => {
    const response = await api.get('/courses/student/enrollments', { params });
    return response.data;
  },

  /**
   * Drop/unenroll from a course
   * @param {string} courseID - Course ID
   * @param {string} studentID - Student ID
   * @returns {Promise} API response
   */
  dropCourse: async (courseID, studentID) => {
    const response = await api.post('/courses/student/drop', {
      courseID,
      studentID,
    });
    return response.data;
  },

  /**
   * Update enrollment progress
   * @param {string} courseID - Course ID
   * @param {string} studentID - Student ID
   * @param {number} progress - Progress percentage (0-100)
   * @returns {Promise} API response
   */
  updateEnrollmentProgress: async (courseID, studentID, progress) => {
    const response = await api.post('/courses/student/update-progress', {
      courseID,
      studentID,
      progress,
    });
    return response.data;
  },

  /**
   * Post a course review
   * @param {Object} reviewData - Review data
   * @param {string} reviewData.studentID - Student ID
   * @param {string} reviewData.teacherID - Teacher ID
   * @param {string} reviewData.courseID - Course ID
   * @param {string} reviewData.review - Review text
   * @param {number} reviewData.stars - Rating (1-5)
   * @param {string} reviewData.date - Review date
   * @returns {Promise} API response
   */
  postReview: async (reviewData) => {
    const response = await api.post('/courses/student/review', reviewData);
    return response.data;
  },

  /**
   * Remove a review
   * @param {string} reviewID - Review ID
   * @returns {Promise} API response
   */
  removeReview: async (reviewID) => {
    const response = await api.delete('/courses/student/review', {
      data: { reviewID },
    });
    return response.data;
  },

  /**
   * Get teacher reviews
   * @param {Object} params - Query parameters
   * @param {string} params.teacherID - Teacher ID
   * @param {number} params.limit - Results per page
   * @param {number} params.loadBlock - Page number
   * @returns {Promise} API response with reviews
   */
  getTeacherReviews: async (params) => {
    const response = await api.get('/courses/student/teacher-reviews', {
      params,
    });
    return response.data;
  },

  /**
   * Get course lectures (student view)
   * @param {string} courseID - Course ID
   * @returns {Promise} API response with lectures
   */
  getCourseLectures: async (courseID) => {
    const response = await api.get('/courses/student/lectures', {
      params: { courseID },
    });
    return response.data;
  },

  /**
   * Get lecture content (student view)
   * @param {string} lectureID - Lecture ID
   * @returns {Promise} API response with content
   */
  getLectureContent: async (lectureID) => {
    const response = await api.get('/courses/student/content', {
      params: { lectureID },
    });
    return response.data;
  },

  /**
   * Get student's course progress
   * @param {string} courseID - Course ID
   * @param {string} studentID - Student ID
   * @returns {Promise} API response with progress data
   */
  getCourseProgress: async (courseID, studentID) => {
    const response = await api.get('/courses/student/course-progress', {
      params: { courseID, studentID },
    });
    return response.data;
  },

  /**
   * Get form questions for a content item
   * @param {string} contentID - Content ID
   * @returns {Promise} API response with form questions
   */
  getFormQuestions: async (contentID) => {
    const response = await api.get('/courses/student/form-questions', {
      params: { contentID },
    });
    return response.data;
  },

  /**
   * Submit form answers
   * @param {Object} submissionData - Submission data
   * @param {string} submissionData.contentID - Content ID
   * @param {string} submissionData.studentID - Student ID
   * @param {Object} submissionData.answers - Answers object (questionID: answer)
   * @returns {Promise} API response with score
   */
  submitForm: async (submissionData) => {
    const response = await api.post('/courses/student/submit-form', submissionData);
    return response.data;
  },

  /**
   * Mark content as completed
   * @param {string} lectureID - Lecture ID
   * @param {string} contentID - Content ID
   * @param {string} studentID - Student ID
   * @returns {Promise} API response
   */
  markContentCompleted: async (lectureID, contentID, studentID) => {
    const response = await api.post('/courses/student/mark-completed', {
      lectureID,
      contentID,
      studentID,
    });
    return response.data;
  },

  // ==================== Teacher Side ====================

  /**
   * Create a new course
   * @param {Object} courseData - Course data
   * @param {string} courseData.teacherID - Teacher ID
   * @param {string} courseData.title - Course title
   * @param {string} courseData.description - Course description
   * @param {string} courseData.subject - Subject/category
   * @param {Array} courseData.tags - Tags array
   * @param {string} courseData.thumbnailUrl - Thumbnail URL
   * @param {number} courseData.price - Course price
   * @param {string} courseData.currency - Currency code
   * @param {number} courseData.maxStudents - Max students (0 = unlimited)
   * @param {string} courseData.status - Status (draft, published, archived)
   * @returns {Promise} API response
   */
  createCourse: async (courseData) => {
    const response = await api.post('/courses/teacher/create', courseData);
    return response.data;
  },

  /**
   * Update a course
   * @param {Object} courseData - Course data
   * @param {string} courseData.courseID - Course ID
   * @param {string} courseData.teacherID - Teacher ID
   * @param {Object} courseData - Other course fields to update
   * @returns {Promise} API response
   */
  updateCourse: async (courseData) => {
    const response = await api.put('/courses/teacher/update', courseData);
    return response.data;
  },

  /**
   * Delete a course
   * @param {string} courseID - Course ID
   * @param {string} teacherID - Teacher ID
   * @returns {Promise} API response
   */
  deleteCourse: async (courseID, teacherID) => {
    const response = await api.delete('/courses/teacher/delete', {
      data: { courseID, teacherID },
    });
    return response.data;
  },

  /**
   * Get teacher's courses
   * @param {Object} params - Query parameters
   * @param {string} params.teacherID - Teacher ID
   * @param {string} params.status - Filter by status
   * @param {string} params.searchQuery - Search query
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort order
   * @param {number} params.limit - Results per page
   * @param {number} params.loadBlock - Page number
   * @returns {Promise} API response with courses
   */
  getTeacherCourses: async (params) => {
    const response = await api.get('/courses/teacher/list', { params });
    return response.data;
  },

  /**
   * Get course details (teacher view)
   * @param {string} courseID - Course ID
   * @returns {Promise} API response with course details
   */
  getCourseDetailsTeacher: async (courseID) => {
    const response = await api.get('/courses/teacher/details', {
      params: { courseID },
    });
    return response.data;
  },

  /**
   * Get course enrollments
   * @param {Object} params - Query parameters
   * @param {string} params.courseID - Course ID
   * @param {string} params.teacherID - Teacher ID
   * @param {string} params.status - Filter by status
   * @param {number} params.limit - Results per page
   * @param {number} params.loadBlock - Page number
   * @returns {Promise} API response with enrollments
   */
  getCourseEnrollments: async (params) => {
    const response = await api.get('/courses/teacher/enrollments', { params });
    return response.data;
  },

  /**
   * Add note to course
   * @param {string} courseID - Course ID
   * @param {string} note - Note text
   * @returns {Promise} API response
   */
  addCourseNote: async (courseID, note) => {
    const response = await api.post('/courses/teacher/note', {
      courseID,
      note,
    });
    return response.data;
  },

  /**
   * Get course notes
   * @param {Object} params - Query parameters
   * @param {string} params.courseID - Course ID
   * @param {number} params.limit - Results per page
   * @param {number} params.loadBlock - Page number
   * @returns {Promise} API response with notes
   */
  getCourseNotes: async (params) => {
    const response = await api.get('/courses/teacher/notes', { params });
    return response.data;
  },

  /**
   * Delete course note
   * @param {string} noteID - Note ID
   * @returns {Promise} API response
   */
  deleteCourseNote: async (noteID) => {
    const response = await api.delete('/courses/teacher/note', {
      data: { noteID },
    });
    return response.data;
  },

  /**
   * Get students progress for a course
   * @param {string} courseID - Course ID
   * @param {string} teacherID - Teacher ID
   * @returns {Promise} API response with students progress
   */
  getStudentsProgress: async (courseID, teacherID) => {
    const response = await api.get('/courses/teacher/students-progress', {
      params: { courseID, teacherID },
    });
    return response.data;
  },
};

export default courseService;

