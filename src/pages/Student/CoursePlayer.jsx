import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import {
  PlayCircle,
  FileText,
  CheckCircle,
  ChevronRight,
  Download,
  Loader2
} from 'lucide-react';
import './CoursePlayer.css';

const CoursePlayer = () => {
  const { id: courseID } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentItems, setContentItems] = useState({}); // lectureID -> content array
  const [formQuestions, setFormQuestions] = useState({}); // contentID -> questions array
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (courseID && currentUser?.id) {
      fetchCourseData();
    }
  }, [courseID, currentUser?.id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course details
      const courseData = await courseService.getCourseDetails(courseID);
      setCourse(courseData);

      // Fetch course lectures
      const lecturesData = await courseService.getCourseLectures(courseID);
      const lecturesArray = Array.isArray(lecturesData) 
        ? lecturesData 
        : lecturesData.lectures || [];
      setLectures(lecturesArray);

      // Fetch student progress
      if (currentUser.role === 'student') {
        try {
          const progressData = await courseService.getCourseProgress(courseID, currentUser.id);
          setProgress(progressData);
        } catch (err) {
          console.error('Error fetching progress:', err);
        }
      }

      // Select first lecture and its first content if available
      if (lecturesData.length > 0) {
        await selectLecture(lecturesData[0]);
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const selectLecture = async (lecture) => {
    setSelectedLecture(lecture);
    setSelectedContent(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);

    // Fetch content for this lecture if not already loaded
    if (!contentItems[lecture.id]) {
      try {
        const contentData = await courseService.getLectureContent(lecture.id);
        const contentArray = Array.isArray(contentData)
          ? contentData
          : contentData.content || [];
        setContentItems(prev => ({
          ...prev,
          [lecture.id]: contentArray
        }));

        // Select first content if available
        if (contentArray.length > 0) {
          selectContent(lecture, contentArray[0]);
        }
      } catch (err) {
        console.error('Error fetching lecture content:', err);
      }
    } else {
      // Content already loaded, select first one
      const content = contentItems[lecture.id];
      if (content && content.length > 0) {
        selectContent(lecture, content[0]);
      }
    }
  };

  const selectContent = async (lecture, content) => {
    setSelectedLecture(lecture);
    setSelectedContent(content);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);

    // If it's a form, fetch questions
    if (content.contentType === 'form' && !formQuestions[content.id]) {
      try {
        const questionsData = await courseService.getFormQuestions(content.id);
        const questionsArray = Array.isArray(questionsData)
          ? questionsData
          : questionsData.questions || [];
        setFormQuestions(prev => ({
          ...prev,
          [content.id]: questionsArray
        }));
      } catch (err) {
        console.error('Error fetching form questions:', err);
      }
    }
  };

  const handleQuizAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleQuizSubmit = async () => {
    if (!selectedContent || !currentUser) return;

    try {
      setSubmitting(true);
      const submissionData = await courseService.submitForm({
        contentID: selectedContent.id,
        studentID: currentUser.id,
        answers: quizAnswers
      });

      const score = submissionData.score || 0;
      setQuizScore(score);
      setQuizSubmitted(true);
      
      // Mark content as completed if score is passing (70% or higher)
      if (score >= 70) {
        await markContentCompleted();
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert(err.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const markContentCompleted = async () => {
    if (!selectedLecture || !selectedContent || !currentUser) return;

    try {
      await courseService.markContentCompleted(
        selectedLecture.id,
        selectedContent.id,
        currentUser.id
      );
      // Refresh progress
      const progressData = await courseService.getCourseProgress(courseID, currentUser.id);
      setProgress(progressData);
    } catch (err) {
      console.error('Error marking content completed:', err);
    }
  };

  const isLectureCompleted = (lectureId) => {
    if (!progress || !progress.lectures) return false;
    const lectureProgress = progress.lectures.find(l => l.lectureID === lectureId);
    return lectureProgress?.status === 'completed';
  };

  const isContentCompleted = (contentId) => {
    if (!progress || !progress.content) return false;
    return progress.content.some(c => c.contentID === contentId && c.completed);
  };

  const renderContentViewer = () => {
    if (!selectedContent) {
      return (
        <div className="content-placeholder">
          <p>Select a content item to start learning</p>
        </div>
      );
    }

    switch (selectedContent.contentType) {
      case 'video':
        return (
          <div className="video-player">
            <div className="video-placeholder">
              <PlayCircle size={64} color="white" />
              <h3>{selectedContent.title}</h3>
              {selectedContent.duration && (
                <p>Duration: {selectedContent.duration} minutes</p>
              )}
              {selectedContent.fileUrl ? (
                <video
                  controls
                  src={selectedContent.fileUrl}
                  className="video-element"
                  style={{ width: '100%', maxHeight: '600px' }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <p className="video-info">Video URL: {selectedContent.fileUrl || 'Not available'}</p>
              )}
            </div>
            {selectedContent.description && (
              <div className="content-description">
                <p>{selectedContent.description}</p>
              </div>
            )}
            {currentUser?.role === 'student' && !isContentCompleted(selectedContent.id) && (
              <button
                onClick={markContentCompleted}
                className="mark-completed-btn"
              >
                Mark as Completed
              </button>
            )}
          </div>
        );

      case 'pdf':
        return (
          <div className="pdf-viewer">
            <div className="pdf-header">
              <FileText size={32} color="var(--primary-color)" />
              <h3>{selectedContent.title}</h3>
            </div>
            <div className="pdf-content">
              {selectedContent.description && <p>{selectedContent.description}</p>}
              {selectedContent.fileUrl ? (
                <iframe
                  src={selectedContent.fileUrl}
                  className="pdf-iframe"
                  title={selectedContent.title}
                  style={{ width: '100%', height: '600px', border: 'none' }}
                />
              ) : (
                <p>PDF not available</p>
              )}
              {selectedContent.fileUrl && (
                <a
                  href={selectedContent.fileUrl}
                  download
                  className="download-btn"
                >
                  <Download size={18} />
                  Download PDF
                </a>
              )}
            </div>
            {currentUser?.role === 'student' && !isContentCompleted(selectedContent.id) && (
              <button
                onClick={markContentCompleted}
                className="mark-completed-btn"
              >
                Mark as Completed
              </button>
            )}
          </div>
        );

      case 'form':
        const questions = formQuestions[selectedContent.id] || [];
        if (questions.length === 0) {
          return (
            <div className="quiz-container">
              <p>Loading questions...</p>
            </div>
          );
        }

        return (
          <div className="quiz-container">
            <div className="quiz-header">
              <h3>{selectedContent.title}</h3>
              <p>{questions.length} questions</p>
              {selectedContent.totalPoints && (
                <p>Total Points: {selectedContent.totalPoints}</p>
              )}
            </div>

            {!quizSubmitted ? (
              <>
                <div className="quiz-questions">
                  {questions.map((question, idx) => (
                    <div key={question.id || idx} className="question-card">
                      <h4>
                        Question {idx + 1}: {question.questionText}
                        {question.required && <span className="required">*</span>}
                        {question.points > 0 && (
                          <span className="points">({question.points} points)</span>
                        )}
                      </h4>

                      {question.questionType === 'multiple_choice' && question.options && (
                        <div className="options">
                          {question.options.map((option, optIdx) => (
                            <label key={optIdx} className="option-label">
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={optIdx}
                                onChange={() => handleQuizAnswer(question.id, optIdx)}
                                checked={quizAnswers[question.id] === optIdx}
                                required={question.required}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {question.questionType === 'checkbox' && question.options && (
                        <div className="options">
                          {question.options.map((option, optIdx) => (
                            <label key={optIdx} className="option-label">
                              <input
                                type="checkbox"
                                name={`question-${question.id}`}
                                value={optIdx}
                                onChange={(e) => {
                                  const current = quizAnswers[question.id] || [];
                                  const updated = e.target.checked
                                    ? [...current, optIdx]
                                    : current.filter(i => i !== optIdx);
                                  handleQuizAnswer(question.id, updated);
                                }}
                                checked={(quizAnswers[question.id] || []).includes(optIdx)}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {(question.questionType === 'short_answer' || question.questionType === 'long_answer') && (
                        <textarea
                          placeholder="Your answer"
                          value={quizAnswers[question.id] || ''}
                          onChange={(e) => handleQuizAnswer(question.id, e.target.value)}
                          className="text-answer"
                          rows={question.questionType === 'long_answer' ? 5 : 2}
                          required={question.required}
                        />
                      )}

                      {question.questionType === 'true_false' && (
                        <div className="options">
                          <label className="option-label">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value="true"
                              onChange={() => handleQuizAnswer(question.id, true)}
                              checked={quizAnswers[question.id] === true}
                              required={question.required}
                            />
                            <span>True</span>
                          </label>
                          <label className="option-label">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value="false"
                              onChange={() => handleQuizAnswer(question.id, false)}
                              checked={quizAnswers[question.id] === false}
                              required={question.required}
                            />
                            <span>False</span>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleQuizSubmit}
                  className="submit-quiz-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </>
            ) : (
              <div className="quiz-results">
                <div className={`score-card ${quizScore >= 70 ? 'pass' : 'fail'}`}>
                  <h2>Your Score: {quizScore}%</h2>
                  <p>
                    {quizScore >= 70
                      ? 'Congratulations! You passed!'
                      : 'Keep learning and try again!'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setQuizSubmitted(false);
                    setQuizAnswers({});
                    setQuizScore(null);
                  }}
                  className="retake-btn"
                >
                  Retake Quiz
                </button>
              </div>
            )}
          </div>
        );

      default:
        return <p>Content type not supported: {selectedContent.contentType}</p>;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader2 size={48} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container">
        <div className="empty-state">
          <h2>{error ? 'Error loading course' : 'Course not found'}</h2>
          <p>{error || "The course you're looking for doesn't exist."}</p>
          <button onClick={() => navigate('/courses')} className="btn-primary">
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const currentContent = selectedLecture ? contentItems[selectedLecture.id] || [] : [];

  return (
    <div className="course-player-page">
      <div className="player-container">
        <div className="player-main">
          <div className="content-viewer">{renderContentViewer()}</div>
        </div>

        <div className="player-sidebar">
          <div className="course-info">
            <h2>{course.title}</h2>
            <div className="course-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress?.overallProgress || 0}%` }}
                ></div>
              </div>
              <span>{progress?.overallProgress || 0}% Complete</span>
            </div>
          </div>

          <div className="lectures-sidebar">
            <h3>Course Content</h3>
            {lectures.length === 0 ? (
              <p>No lectures available yet.</p>
            ) : (
              lectures.map((lecture, lectureIdx) => {
                const lectureContent = contentItems[lecture.id] || [];
                return (
                  <div key={lecture.id || lectureIdx} className="lecture-section">
                    <div className="lecture-title">
                      {isLectureCompleted(lecture.id) && (
                        <CheckCircle size={16} color="var(--success-color)" />
                      )}
                      <span>
                        Lecture {lectureIdx + 1}: {lecture.title}
                      </span>
                    </div>
                    {lecture.description && (
                      <p className="lecture-description">{lecture.description}</p>
                    )}

                    <div className="content-items">
                      {lectureContent.length === 0 ? (
                        <p className="no-content">No content available</p>
                      ) : (
                        lectureContent.map((content, contentIdx) => {
                          const isSelected =
                            selectedLecture?.id === lecture.id &&
                            selectedContent?.id === content.id;

                          return (
                            <button
                              key={content.id || contentIdx}
                              className={`content-item ${isSelected ? 'active' : ''} ${isContentCompleted(content.id) ? 'completed' : ''}`}
                              onClick={() => selectContent(lecture, content)}
                            >
                              {content.contentType === 'video' && <PlayCircle size={16} />}
                              {content.contentType === 'pdf' && <FileText size={16} />}
                              {content.contentType === 'form' && <span>📝</span>}
                              <span>
                                {content.contentType === 'video' && 'Video: '}
                                {content.contentType === 'pdf' && 'PDF: '}
                                {content.contentType === 'form' && 'Quiz: '}
                                {content.title}
                              </span>
                              {isContentCompleted(content.id) && (
                                <CheckCircle size={14} color="var(--success-color)" />
                              )}
                              <ChevronRight size={16} />
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
