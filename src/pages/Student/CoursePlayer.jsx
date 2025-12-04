import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courses, quizzes, studentProgress } from '../../data/mockData';
import {
  PlayCircle,
  FileText,
  CheckCircle,
  ChevronRight,
  Download
} from 'lucide-react';
import './CoursePlayer.css';

const CoursePlayer = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const course = courses.find(c => c.id === parseInt(id));
  const [selectedLecture, setSelectedLecture] = useState(course?.lectures[0]);
  const [selectedContent, setSelectedContent] = useState(course?.lectures[0]?.content[0]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  if (!course) {
    return <div className="container"><h2>Course not found</h2></div>;
  }

  const progress = studentProgress.find(
    p => p.studentId === currentUser.id && p.courseId === course.id
  );

  const isLectureCompleted = (lectureId) => {
    return progress?.completedLectures?.includes(lectureId);
  };

  const handleContentSelect = (lecture, content) => {
    setSelectedLecture(lecture);
    setSelectedContent(content);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleQuizAnswer = (questionId, answer) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: answer
    });
  };

  const handleQuizSubmit = () => {
    if (!selectedContent.id) return;

    const quiz = quizzes.find(q => q.id === selectedContent.id);
    if (!quiz) return;

    let correct = 0;
    quiz.questions.forEach(question => {
      const userAnswer = quizAnswers[question.id];
      if (question.type === 'multiple-choice') {
        if (userAnswer === question.correctAnswer) correct++;
      } else if (question.type === 'text') {
        if (userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase()) {
          correct++;
        }
      }
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const renderContentViewer = () => {
    if (!selectedContent) return null;

    switch (selectedContent.type) {
      case 'video':
        return (
          <div className="video-player">
            <div className="video-placeholder">
              <PlayCircle size={64} color="white" />
              <h3>Video Player</h3>
              <p>{selectedContent.duration}</p>
              <p className="video-info">Video URL: {selectedContent.url}</p>
            </div>
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
              <p>PDF Document: {selectedContent.title}</p>
              <a
                href={selectedContent.url}
                download
                className="download-btn"
              >
                <Download size={18} />
                Download PDF
              </a>
            </div>
          </div>
        );

      case 'quiz':
        const quiz = quizzes.find(q => q.id === selectedContent.id);
        if (!quiz) return <p>Quiz not found</p>;

        return (
          <div className="quiz-container">
            <div className="quiz-header">
              <h3>{quiz.title}</h3>
              <p>{quiz.questions.length} questions</p>
            </div>

            {!quizSubmitted ? (
              <>
                <div className="quiz-questions">
                  {quiz.questions.map((question, idx) => (
                    <div key={question.id} className="question-card">
                      <h4>
                        Question {idx + 1}: {question.question}
                      </h4>

                      {question.type === 'multiple-choice' ? (
                        <div className="options">
                          {question.options.map((option, optIdx) => (
                            <label key={optIdx} className="option-label">
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={optIdx}
                                onChange={() => handleQuizAnswer(question.id, optIdx)}
                                checked={quizAnswers[question.id] === optIdx}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Your answer"
                          value={quizAnswers[question.id] || ''}
                          onChange={(e) =>
                            handleQuizAnswer(question.id, e.target.value)
                          }
                          className="text-answer"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button onClick={handleQuizSubmit} className="submit-quiz-btn">
                  Submit Quiz
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
                    setQuizScore(0);
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
        return <p>Content type not supported</p>;
    }
  };

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
                  style={{ width: `${progress?.progress || 0}%` }}
                ></div>
              </div>
              <span>{progress?.progress || 0}% Complete</span>
            </div>
          </div>

          <div className="lectures-sidebar">
            <h3>Course Content</h3>
            {course.lectures.map((lecture, lectureIdx) => (
              <div key={lecture.id} className="lecture-section">
                <div className="lecture-title">
                  {isLectureCompleted(lecture.id) && (
                    <CheckCircle size={16} color="var(--success-color)" />
                  )}
                  <span>
                    Lecture {lectureIdx + 1}: {lecture.title}
                  </span>
                </div>

                <div className="content-items">
                  {lecture.content.map((content, contentIdx) => {
                    const isSelected =
                      selectedLecture?.id === lecture.id &&
                      selectedContent === content;

                    return (
                      <button
                        key={contentIdx}
                        className={`content-item ${isSelected ? 'active' : ''}`}
                        onClick={() => handleContentSelect(lecture, content)}
                      >
                        {content.type === 'video' && <PlayCircle size={16} />}
                        {content.type === 'pdf' && <FileText size={16} />}
                        {content.type === 'quiz' && <span>📝</span>}
                        <span>
                          {content.type === 'video' && 'Video'}
                          {content.type === 'pdf' && content.title}
                          {content.type === 'quiz' && content.title}
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
