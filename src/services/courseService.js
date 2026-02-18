import api from './api';

/**
 * Course Service
 * Handles all course-related API calls
 */
export const courseService = {
  // ==================== Student Side ====================

  /**
   * Get all unique subjects (metadata)
   * @returns {Promise} API response with subjects list
   */
  getCourseSubjects: async () => {
    const response = await api.get('/courses/subjects');
    return response.data;
  },

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
   * @param {string} studentID - Student ID (optional - will be taken from session if not provided)
   * @returns {Promise} API response
   */
  enrollInCourse: async (courseID, studentID) => {
    const requestBody = { courseID };
    // Only include studentID if provided (otherwise backend uses session)
    if (studentID) {
      requestBody.studentID = studentID;
    }
    const response = await api.post('/courses/student/enroll', requestBody);
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
   * Get course lectures (student view) - now returns sections with lectures
   * @param {string} courseID - Course ID
   * @returns {Promise} API response with sections and lectures
   */
  getCourseLectures: async (courseID) => {
    const response = await api.get('/courses/student/lectures', {
      params: { courseID },
    });
    return response.data;
  },

  /**
   * Get course sections with lectures (student view)
   * @param {string} courseID - Course ID
   * @returns {Promise} API response with sections and lectures
   */
  getCourseSections: async (courseID) => {
    const response = await api.get('/courses/student/sections', {
      params: { courseID },
    });
    return response.data;
  },

  /**
   * Get lecture content (student view)
   * @param {string} lectureID - Lecture ID (optional if sectionID provided)
   * @param {string} sectionID - Section ID (optional if lectureID provided)
   * @returns {Promise} API response with content
   */
  getLectureContent: async (lectureID, sectionID = null) => {
    const params = {};
    if (sectionID) {
      params.sectionID = sectionID;
    } else if (lectureID) {
      params.lectureID = lectureID;
    }
    const response = await api.get('/courses/student/content', {
      params,
    });
    return response.data;
  },

  /**
   * Get student's course progress
   * @param {string} courseID - Course ID
   * @param {string} studentID - Student ID (optional - will be taken from session if not provided)
   * @returns {Promise} API response with progress data
   */
  getCourseProgress: async (courseID, studentID) => {
    const params = { courseID };
    // Only include studentID if provided (otherwise backend uses session)
    if (studentID) {
      params.studentID = studentID;
    }
    const response = await api.get('/courses/student/course-progress', { params });
    return response.data;
  },

  /**
   * Get form questions for a content item
   * @param {string} contentID - Content ID
   * @returns {Promise} API response with form questions
   */
  getFormQuestions: async (contentID, studentID = null) => {
    const params = { contentID };
    if (studentID) {
      params.studentID = studentID;
    }
    const response = await api.get('/courses/student/form-questions', {
      params,
    });
    return response.data;
  },

  /**
   * Submit form answers
   * @param {Object} submissionData - Submission data
   * @param {string} submissionData.contentID - Content ID
   * @param {string} submissionData.studentID - Student ID (optional - will be taken from session if not provided)
   * @param {Object} submissionData.answers - Answers object (questionID: answer)
   * @returns {Promise} API response with score
   */
  submitForm: async (submissionData) => {
    const response = await api.post('/courses/student/submit-form', submissionData);
    return response.data;
  },

  /**
   * Update content viewing time and auto-complete if threshold met
   * @param {Object} timeData - Time tracking data
   * @param {string} timeData.contentID - Content ID
   * @param {string} timeData.studentID - Student ID (optional - will be taken from session if not provided)
   * @param {number} timeData.viewingTime - Additional viewing time in seconds
   * @returns {Promise} API response with progress percentage and completion status
   */
  updateContentViewingTime: async (timeData) => {
    const response = await api.post('/courses/student/update-viewing-time', timeData);
    return response.data;
  },

  /**
   * Mark content as completed
   * @param {string} lectureID - Lecture ID (optional, not used by backend)
   * @param {string} contentID - Content ID
   * @param {string} studentID - Student ID (optional - will be taken from session if not provided)
   * @returns {Promise} API response
   */
  markContentCompleted: async (lectureID, contentID, studentID) => {
    const requestBody = { contentID };
    // Only include studentID if provided (otherwise backend uses session)
    if (studentID) {
      requestBody.studentID = studentID;
    }
    const response = await api.post('/courses/student/mark-completed', requestBody);
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

  // ==================== Lecture Management ====================

  /**
   * Create a new lecture for a course
   * @param {Object} lectureData - Lecture data
   * @param {string} lectureData.courseID - Course ID
   * @param {string} lectureData.teacherID - Teacher ID
   * @param {string} lectureData.title - Lecture title
   * @param {string} lectureData.description - Lecture description
   * @param {number} lectureData.completionPoints - Completion points
   * @param {string} lectureData.thumbnailUrl - Thumbnail URL
   * @returns {Promise} API response
   */
  createLecture: async (lectureData) => {
    const response = await api.post('/courses/teacher/lecture', lectureData);
    return response.data;
  },

  /**
   * Update a lecture
   * @param {Object} lectureData - Lecture data
   * @param {string} lectureData.lectureID - Lecture ID
   * @param {string} lectureData.teacherID - Teacher ID
   * @param {Object} lectureData - Other lecture fields to update
   * @returns {Promise} API response
   */
  updateLecture: async (lectureData) => {
    const response = await api.put('/courses/teacher/lecture', lectureData);
    return response.data;
  },

  /**
   * Delete a lecture
   * @param {string} lectureID - Lecture ID
   * @param {string} teacherID - Teacher ID
   * @returns {Promise} API response
   */
  deleteLecture: async (lectureID, teacherID) => {
    const response = await api.delete('/courses/teacher/lecture', {
      data: { lectureID, teacherID },
    });
    return response.data;
  },

  /**
   * Get lectures for a course (teacher view)
   * @param {string} courseID - Course ID
   * @param {string} teacherID - Teacher ID
   * @returns {Promise} API response with lectures
   */
  getCourseLecturesTeacher: async (courseID, teacherID) => {
    const response = await api.get('/courses/teacher/lectures', {
      params: { courseID, teacherID },
    });
    return response.data;
  },

  // ==================== Section Management ====================

  /**
   * Create a new section for a course
   * @param {Object} sectionData - Section data
   * @param {string} sectionData.courseID - Course ID
   * @param {string} sectionData.teacherID - Teacher ID
   * @param {string} sectionData.title - Section title
   * @param {string} sectionData.description - Section description (optional)
   * @returns {Promise} API response
   */
  createSection: async (sectionData) => {
    const response = await api.post('/courses/teacher/section', sectionData);
    return response.data;
  },

  /**
   * Update a section
   * @param {Object} sectionData - Section data
   * @param {string} sectionData.sectionID - Section ID
   * @param {string} sectionData.teacherID - Teacher ID
   * @param {string} sectionData.title - Section title (optional)
   * @param {string} sectionData.description - Section description (optional)
   * @param {number} sectionData.order - Order number (optional)
   * @returns {Promise} API response
   */
  updateSection: async (sectionData) => {
    const response = await api.put('/courses/teacher/section', sectionData);
    return response.data;
  },

  /**
   * Delete a section
   * @param {string} sectionID - Section ID
   * @param {string} teacherID - Teacher ID
   * @returns {Promise} API response
   */
  deleteSection: async (sectionID, teacherID) => {
    const response = await api.delete('/courses/teacher/section', {
      data: { sectionID, teacherID },
    });
    return response.data;
  },

  /**
   * Get all sections for a course (teacher view)
   * @param {string} courseID - Course ID
   * @returns {Promise} API response with sections and lectures
   */
  getCourseSectionsTeacher: async (courseID) => {
    const response = await api.get('/courses/teacher/sections', {
      params: { courseID },
    });
    return response.data;
  },

  // ==================== Content Management ====================

  /**
   * Create lecture content (Video, PDF, Article, or Form)
   * @param {Object} contentData - Content data
   * @param {string} contentData.lectureID - Lecture ID
   * @param {string} contentData.teacherID - Teacher ID
   * @param {string} contentData.title - Content title
   * @param {string} contentData.contentType - Content type (video, pdf, article, form)
   * @param {string} contentData.description - Content description
   * @param {string} contentData.fileUrl - File URL (for video/pdf)
   * @param {number} contentData.fileSize - File size in bytes
   * @param {number} contentData.duration - Duration in minutes (for video)
   * @param {number} contentData.estimatedViewingTime - Estimated viewing time in minutes
   * @param {string} contentData.articleContent - Article content HTML (for article)
   * @param {number} contentData.totalPoints - Total points (for form)
   * @param {boolean} contentData.hasAnswerModel - Has answer model (for form)
   * @returns {Promise} API response
   */
  createContent: async (contentData) => {
    const response = await api.post('/courses/teacher/content', contentData);
    return response.data;
  },

  /**
   * Update lecture content
   * @param {Object} contentData - Content data
   * @param {string} contentData.contentID - Content ID
   * @param {string} contentData.teacherID - Teacher ID
   * @param {Object} contentData - Other content fields to update
   * @returns {Promise} API response
   */
  updateContent: async (contentData) => {
    const response = await api.put('/courses/teacher/content', contentData);
    return response.data;
  },

  /**
   * Delete lecture content
   * @param {string} contentID - Content ID
   * @param {string} teacherID - Teacher ID
   * @returns {Promise} API response
   */
  deleteContent: async (contentID, teacherID) => {
    const response = await api.delete('/courses/teacher/content', {
      data: { contentID, teacherID },
    });
    return response.data;
  },

  /**
   * Get content for a lecture (teacher view)
   * @param {string} lectureID - Lecture ID
   * @param {string} teacherID - Teacher ID
   * @returns {Promise} API response with content list
   */
  getLectureContentTeacher: async (lectureID, teacherID) => {
    const response = await api.get('/courses/teacher/content-list', {
      params: { lectureID, teacherID },
    });
    return response.data;
  },

  // ==================== Form Question Management ====================

  /**
   * Get form questions for a content item (teacher view)
   * @param {string} contentID - Content ID
   * @param {string} teacherID - Teacher ID
   * @returns {Promise} API response with questions list
   */
  getFormQuestionsTeacher: async (contentID, teacherID) => {
    const response = await api.get('/courses/teacher/form-questions', {
      params: { contentID, teacherID },
    });
    return response.data;
  },

  /**
   * Add a question to a form
   * @param {Object} questionData - Question data
   * @param {string} questionData.contentID - Content ID
   * @param {string} questionData.teacherID - Teacher ID
   * @param {string} questionData.questionText - Question text
   * @param {string} questionData.questionType - Question type (multiple_choice, checkbox, short_answer, long_answer, true_false, dropdown, linear_scale, date, time, file_upload)
   * @param {Array} questionData.options - Options array (for multiple_choice, checkbox, dropdown)
   * @param {any} questionData.correctAnswer - Correct answer(s) for auto-correction
   * @param {number} questionData.points - Points for this question
   * @param {boolean} questionData.required - Whether question is required
   * @param {Object} questionData.settings - Additional settings (min/max for scale, etc.)
   * @returns {Promise} API response
   */
  addFormQuestion: async (questionData) => {
    const response = await api.post('/courses/teacher/form-question', questionData);
    return response.data;
  },

  /**
   * Update a form question
   * @param {Object} questionData - Question data
   * @param {string} questionData.questionID - Question ID
   * @param {string} questionData.teacherID - Teacher ID
   * @param {Object} questionData - Other question fields to update
   * @returns {Promise} API response
   */
  updateFormQuestion: async (questionData) => {
    const response = await api.put('/courses/teacher/form-question', questionData);
    return response.data;
  },

  /**
   * Delete a form question
   * @param {string} questionID - Question ID
   * @param {string} teacherID - Teacher ID
   * @returns {Promise} API response
   */
  deleteFormQuestion: async (questionID, teacherID) => {
    const response = await api.delete('/courses/teacher/form-question', {
      data: { questionID, teacherID },
    });
    return response.data;
  },
};

export default courseService;

