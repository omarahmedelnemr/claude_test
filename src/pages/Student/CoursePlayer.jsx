import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import {
  PlayCircle,
  FileText,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Download,
  Loader2,
  ArrowLeft,
  Lock
} from 'lucide-react';
import './CoursePlayer.css';

const CoursePlayer = () => {
  const { id: courseID } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
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
  const [videoStartTime, setVideoStartTime] = useState(null);
  const [videoPlayedTime, setVideoPlayedTime] = useState(0);
  const [pdfStartTime, setPdfStartTime] = useState(null);
  const [contentProgress, setContentProgress] = useState({}); // contentID -> progress percentage
  const [lastUpdateTime, setLastUpdateTime] = useState({}); // contentID -> last update timestamp
  const [expandedLectureId, setExpandedLectureId] = useState(null); // Only one lecture expanded at a time

  useEffect(() => {
    if (courseID && currentUser?.id) {
      fetchCourseData();
    }
    
    // Prevent body overflow when in course player
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Restore body overflow when leaving course player
      document.body.style.overflow = '';
    };
  }, [courseID, currentUser?.id]);

  // Track PDF and Article viewing time
  useEffect(() => {
    if (!selectedContent || (selectedContent.contentType !== 'pdf' && selectedContent.contentType !== 'article') || !pdfStartTime || isContentCompleted(selectedContent.id)) {
      return;
    }

    let lastUpdate = 0;
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - pdfStartTime) / 1000);
      const secondsSinceLastUpdate = elapsed - lastUpdate;
      
      if (secondsSinceLastUpdate >= 10) {
        lastUpdate = elapsed;
        updateViewingTime(selectedContent.id, 10);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [selectedContent, pdfStartTime]);

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
          const progressResponse = await courseService.getCourseProgress(courseID, currentUser.id);
          // Progress data can be an object with overallProgress and lectures, or just an array
          const progressData = progressResponse.lectures || (Array.isArray(progressResponse) ? progressResponse : []);
          const overallProgress = progressResponse.overallProgress !== undefined ? progressResponse.overallProgress : 0;
          
          // Set progress with overallProgress
          setProgress({
            overallProgress: overallProgress,
            lectures: progressData
          });
          
          // No longer tracking individual content progress percentages
          setContentProgress({});
        } catch (err) {
          console.error('Error fetching progress:', err);
        }
      }

      // Determine which lecture to expand and select
      if (lecturesArray.length > 0) {
        // Check URL for active lecture
        const urlLectureId = searchParams.get('lecture');
        let targetLecture = null;
        let targetContent = null;

        if (urlLectureId) {
          // Find lecture from URL
          targetLecture = lecturesArray.find(l => l.id === urlLectureId);
          if (targetLecture) {
            // Try to load content for this lecture
            try {
              const contentData = await courseService.getLectureContent(targetLecture.id);
              const contentArray = Array.isArray(contentData)
                ? contentData
                : contentData.content || [];
              setContentItems(prev => ({
                ...prev,
                [targetLecture.id]: contentArray
              }));
              
              // Check URL for active content
              const urlContentId = searchParams.get('content');
              if (urlContentId && contentArray.length > 0) {
                targetContent = contentArray.find(c => c.id === urlContentId);
              }
              
              if (!targetContent && contentArray.length > 0) {
                targetContent = contentArray[0];
              }
            } catch (err) {
              console.error('Error fetching lecture content:', err);
            }
          }
        }

        // If no URL lecture or not found, find first uncompleted content
        if (!targetLecture || !targetContent) {
          for (const lecture of lecturesArray) {
            const lectureData = progress?.lectures?.find(l => l.lecture?.id === lecture.id);
            const isUnlocked = lecturesArray.indexOf(lecture) === 0 || lectureData?.isUnlocked !== false;
            
            if (!isUnlocked) continue;

            try {
              const contentData = await courseService.getLectureContent(lecture.id);
              const contentArray = Array.isArray(contentData)
                ? contentData
                : contentData.content || [];
              setContentItems(prev => ({
                ...prev,
                [lecture.id]: contentArray
              }));

              // Find first uncompleted content
              for (const content of contentArray) {
                const progressContent = lectureData?.contents?.find(c => c.id === content.id);
                const isCompleted = Boolean(progressContent?.isCompleted);
                
                if (!isCompleted) {
                  targetLecture = lecture;
                  targetContent = content;
                  break;
                }
              }

              if (targetLecture && targetContent) break;
            } catch (err) {
              console.error('Error fetching lecture content:', err);
            }
          }
        }

        // If still no target, use first lecture and first content
        if (!targetLecture) {
          targetLecture = lecturesArray[0];
          try {
            const contentData = await courseService.getLectureContent(targetLecture.id);
            const contentArray = Array.isArray(contentData)
              ? contentData
              : contentData.content || [];
            setContentItems(prev => ({
              ...prev,
              [targetLecture.id]: contentArray
            }));
            if (contentArray.length > 0) {
              targetContent = contentArray[0];
            }
          } catch (err) {
            console.error('Error fetching lecture content:', err);
          }
        }

        // Set expanded lecture and select content
        if (targetLecture) {
          setExpandedLectureId(targetLecture.id);
          // Update URL
          const newParams = new URLSearchParams(searchParams);
          newParams.set('lecture', targetLecture.id);
          if (targetContent) {
            newParams.set('content', targetContent.id);
          }
          setSearchParams(newParams, { replace: true });
          
          if (targetContent) {
            await selectContent(targetLecture, targetContent);
          } else {
            setSelectedLecture(targetLecture);
          }
        }
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
    
    // Update URL with content
    const newParams = new URLSearchParams(searchParams);
    newParams.set('lecture', lecture.id);
    newParams.set('content', content.id);
    setSearchParams(newParams, { replace: true });
    
    // Reset video/PDF tracking
    setVideoStartTime(null);
    setVideoPlayedTime(0);
    setPdfStartTime(null);
    setLastUpdateTime(prev => {
      const newState = { ...prev };
      delete newState[content.id];
      return newState;
    });
    
    // Check if quiz is already submitted
    const submitted = isQuizSubmitted(content.id);
    if (submitted) {
      setQuizSubmitted(true);
      const score = getQuizScore(content.id);
      setQuizScore(score);
    } else {
      setQuizSubmitted(false);
      setQuizScore(null);
    }

    // If it's a form, fetch questions (only if not submitted)
    if (content.contentType === 'form' && !formQuestions[content.id] && !submitted) {
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

      // Calculate score from submission data
      const totalPoints = selectedContent.totalPoints || 0;
      const earnedPoints = submissionData.pointsEarned || 0;
      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      
      setQuizScore(score);
      setQuizSubmitted(true);
      
      // Refresh progress to get updated completion status
      const progressResponse = await courseService.getCourseProgress(courseID, currentUser.id);
      const progressData = progressResponse.lectures || (Array.isArray(progressResponse) ? progressResponse : []);
      const overallProgress = progressResponse.overallProgress !== undefined ? progressResponse.overallProgress : 0;
      setProgress({
        overallProgress: overallProgress,
        lectures: progressData
      });
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert(err.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Update viewing time for content
  const updateViewingTime = async (contentId, additionalSeconds) => {
    if (!currentUser || !contentId) return;

    try {
      const response = await courseService.updateContentViewingTime({
        contentID: contentId,
        studentID: currentUser.id,
        viewingTime: additionalSeconds || 0
      });

      // If auto-completed, refresh progress
      if (response.isCompleted) {
        const progressResponse = await courseService.getCourseProgress(courseID, currentUser.id);
        const progressData = progressResponse.lectures || (Array.isArray(progressResponse) ? progressResponse : []);
        const overallProgress = progressResponse.overallProgress !== undefined ? progressResponse.overallProgress : 0;
        setProgress({
          overallProgress: overallProgress,
          lectures: progressData
        });
      }
    } catch (err) {
      console.error('Error updating viewing time:', err);
    }
  };

  const isLectureCompleted = (lectureId) => {
    if (!progress || !progress.lectures) return false;
    const lectureData = progress.lectures.find(l => l.lecture?.id === lectureId);
    return lectureData?.isCompleted === true;
  };

  const isContentCompleted = (contentId) => {
    if (!progress || !progress.lectures) return false;
    // Progress is an object with lectures array
    for (const lectureData of progress.lectures) {
      if (lectureData.contents && Array.isArray(lectureData.contents)) {
        const content = lectureData.contents.find(c => c.id === contentId);
        if (content && content.isCompleted === true) {
          return true;
        }
      }
    }
    return false;
  };

  const isQuizSubmitted = (contentId) => {
    if (!progress || !progress.lectures) return false;
    // Check if quiz has a submission
    for (const lectureData of progress.lectures) {
      if (lectureData.contents && Array.isArray(lectureData.contents)) {
        const content = lectureData.contents.find(c => c.id === contentId);
        if (content && content.contentType === 'form' && content.submission) {
          return true;
        }
      }
    }
    return false;
  };

  const getQuizScore = (contentId) => {
    if (!progress || !progress.lectures) return null;
    for (const lectureData of progress.lectures) {
      if (lectureData.contents && Array.isArray(lectureData.contents)) {
        const content = lectureData.contents.find(c => c.id === contentId);
        if (content && content.submission) {
          // Calculate score from submission
          const totalPoints = content.totalPoints || 0;
          const earnedPoints = content.submission.pointsEarned || 0;
          return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : null;
        }
      }
    }
    return null;
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
            <div className="video-header">
              <h3>{selectedContent.title}</h3>
              {selectedContent.duration && (
                <p className="video-duration">Duration: {selectedContent.duration} minutes</p>
              )}
            </div>
            {selectedContent.fileUrl ? (
              <div className="video-container">
                <video
                  controls
                  src={selectedContent.fileUrl}
                  className="video-element"
                  onTimeUpdate={(e) => {
                    const video = e.target;
                    const currentTime = video.currentTime;
                    const duration = video.duration;
                    
                    if (duration > 0 && !video.paused) {
                      setVideoPlayedTime(currentTime);
                      
                      // Update viewing time every 5 seconds of playback
                      const currentSecond = Math.floor(currentTime);
                      const lastUpdate = lastUpdateTime[selectedContent.id] || 0;
                      
                      if (currentSecond > lastUpdate && currentSecond % 5 === 0) {
                        setLastUpdateTime(prev => ({ ...prev, [selectedContent.id]: currentSecond }));
                        updateViewingTime(selectedContent.id, 5);
                      }
                      
                      // Auto-complete if watched 50% of video
                      if (currentTime >= duration * 0.5 && !isContentCompleted(selectedContent.id)) {
                        updateViewingTime(selectedContent.id, 0); // Trigger completion check
                      }
                    }
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="video-placeholder">
                <PlayCircle size={64} color="var(--text-light)" />
                <p className="video-info">Video URL: {selectedContent.fileUrl || 'Not available'}</p>
              </div>
            )}
            {selectedContent.description && (
              <div className="content-description">
                <p>{selectedContent.description}</p>
              </div>
            )}
            {currentUser?.role === 'student' && isContentCompleted(selectedContent.id) && (
              <div className="content-completed-badge">
                <CheckCircle size={20} color="var(--success-color)" />
                <span>Completed</span>
              </div>
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
                  onLoad={() => {
                    // Start tracking PDF viewing time
                    if (pdfStartTime === null) {
                      setPdfStartTime(Date.now());
                    }
                  }}
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
            {currentUser?.role === 'student' && isContentCompleted(selectedContent.id) && (
              <div className="content-completed-badge">
                <CheckCircle size={20} color="var(--success-color)" />
                <span>Completed</span>
              </div>
            )}
          </div>
        );

      case 'article':
        return (
          <div className="article-viewer">
            <div className="article-header">
              <h3>{selectedContent.title}</h3>
              {selectedContent.estimatedViewingTime && (
                <p className="article-reading-time">
                  Estimated reading time: {selectedContent.estimatedViewingTime} {selectedContent.estimatedViewingTime === 1 ? 'minute' : 'minutes'}
                </p>
              )}
            </div>
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{ __html: selectedContent.articleContent || '' }}
            />
            {currentUser?.role === 'student' && isContentCompleted(selectedContent.id) && (
              <div className="content-completed-badge">
                <CheckCircle size={20} color="var(--success-color)" />
                <span>Completed</span>
              </div>
            )}
          </div>
        );

      case 'form':
        const isSubmitted = isQuizSubmitted(selectedContent.id);
        const questions = formQuestions[selectedContent.id] || [];
        
        // If quiz is already submitted, show results
        if (isSubmitted && !quizSubmitted) {
          const score = getQuizScore(selectedContent.id);
          return (
            <div className="quiz-container">
              <div className="quiz-header">
                <h3>{selectedContent.title}</h3>
                <p className="quiz-completed-badge">✓ Quiz Completed</p>
              </div>
              <div className="quiz-results">
                <div className={`score-card ${score >= 70 ? 'pass' : 'fail'}`}>
                  <h2>Your Score: {score}%</h2>
                  <p>
                    {score >= 70
                      ? 'Congratulations! You passed!'
                      : 'You completed this quiz.'}
                  </p>
                  <p className="quiz-locked-message">
                    This quiz has been completed and cannot be retaken.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        if (questions.length === 0 && !isSubmitted) {
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

            {!quizSubmitted && !isSubmitted ? (
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
                          {question.options.map((option, optIdx) => {
                            const currentAnswers = quizAnswers[question.id];
                            const isArray = Array.isArray(currentAnswers);
                            const isChecked = isArray && currentAnswers.includes(optIdx);
                            
                            return (
                              <label key={optIdx} className="option-label">
                                <input
                                  type="checkbox"
                                  name={`question-${question.id}-${optIdx}`}
                                  value={optIdx}
                                  onChange={(e) => {
                                    const current = Array.isArray(quizAnswers[question.id]) 
                                      ? quizAnswers[question.id] 
                                      : [];
                                    const updated = e.target.checked
                                      ? [...current, optIdx]
                                      : current.filter(i => i !== optIdx);
                                    handleQuizAnswer(question.id, updated);
                                  }}
                                  checked={isChecked}
                                />
                                <span>{option}</span>
                              </label>
                            );
                          })}
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
                  <p className="quiz-locked-message">
                    This quiz has been completed and cannot be retaken.
                  </p>
                </div>
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
        <div className="player-sidebar">
          <button 
            onClick={() => navigate('/')} 
            className="back-button"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          
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
                const lectureData = progress?.lectures?.find(l => l.lecture?.id === lecture.id);
                const isLectureUnlocked = lectureIdx === 0 || lectureData?.isUnlocked !== false;
                const isLectureCompleted = lectureData?.isCompleted === true;
                const isExpanded = expandedLectureId === lecture.id;
                
                return (
                  <div key={lecture.id || lectureIdx} className={`lecture-section ${!isLectureUnlocked ? 'locked' : ''} ${isExpanded ? 'expanded' : ''}`}>
                    <div 
                      className="lecture-title clickable"
                      onClick={() => isLectureUnlocked && toggleLecture(lecture)}
                      style={{ cursor: isLectureUnlocked ? 'pointer' : 'not-allowed' }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} style={{ marginRight: '4px' }} />
                      ) : (
                        <ChevronRight size={16} style={{ marginRight: '4px' }} />
                      )}
                      {!isLectureUnlocked && <Lock size={16} color="#999" style={{ marginRight: '4px' }} />}
                      {isLectureCompleted && (
                        <CheckCircle size={16} color="var(--success-color)" />
                      )}
                      <span>
                        Lecture {lectureIdx + 1}: {lecture.title}
                      </span>
                    </div>
                    {!isLectureUnlocked && (
                      <p className="lecture-locked-message" style={{ fontSize: '0.875rem', color: '#999', fontStyle: 'italic', marginTop: '0.25rem' }}>
                        Complete previous lecture to unlock
                      </p>
                    )}
                    {lecture.description && (
                      <p className="lecture-description">{lecture.description}</p>
                    )}

                    {isExpanded && (
                      <div className="content-items">
                        {lectureContent.length === 0 ? (
                          <p className="no-content">No content available</p>
                        ) : (
                          lectureContent.map((content, contentIdx) => {
                            const isSelected =
                              selectedLecture?.id === lecture.id &&
                              selectedContent?.id === content.id;

                            // Get completion status from progress data
                            const progressContent = lectureData?.contents?.find(c => c.id === content.id);
                            // Check if content is completed (strict boolean check)
                            const contentCompleted = Boolean(progressContent?.isCompleted);
                            const quizSubmitted = content.contentType === 'form' && isQuizSubmitted(content.id);
                            const isDisabled = quizSubmitted; // Disable only quizzes that are submitted

                            return (
                              <div key={content.id || contentIdx} className="content-item-wrapper">
                                <button
                                  className={`content-item ${isSelected ? 'active' : ''} ${contentCompleted ? 'completed' : ''} ${isDisabled ? 'disabled' : ''}`}
                                  onClick={() => !isDisabled && selectContent(lecture, content)}
                                  disabled={isDisabled}
                                  title={
                                    isDisabled 
                                      ? 'This quiz has been completed and cannot be retaken' 
                                      : ''
                                  }
                                >
                                  {content.contentType === 'video' && <PlayCircle size={16} />}
                                  {content.contentType === 'pdf' && <FileText size={16} />}
                                  {content.contentType === 'article' && <FileText size={16} />}
                                  {content.contentType === 'form' && <span>📝</span>}
                                  <span>
                                    {content.contentType === 'video' && 'Video: '}
                                    {content.contentType === 'pdf' && 'PDF: '}
                                    {content.contentType === 'article' && 'Article: '}
                                    {content.contentType === 'form' && 'Quiz: '}
                                    {content.title}
                                  </span>
                                  {contentCompleted && (
                                    <CheckCircle size={14} color="var(--success-color)" />
                                  )}
                                  {quizSubmitted && !contentCompleted && (
                                    <span className="quiz-submitted-badge">✓</span>
                                  )}
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="player-main">
          <div className="content-viewer">{renderContentViewer()}</div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
