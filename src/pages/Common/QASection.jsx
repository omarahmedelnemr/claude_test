import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import qaService from '../../services/qaService';
import { Search, ThumbsUp, ChevronDown, ChevronUp, MessageSquare, Send, X, Loader2, AlertCircle } from 'lucide-react';
import './QASection.css';

const QASection = () => {
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, answered, pending
  const [expandedId, setExpandedId] = useState(null);
  const [loadBlock, setLoadBlock] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Form states
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  
  const [showAnswerForm, setShowAnswerForm] = useState(null); // questionID
  const [newAnswer, setNewAnswer] = useState({});
  const [submittingAnswer, setSubmittingAnswer] = useState({});

  // Helpful votes state
  const [markingHelpful, setMarkingHelpful] = useState({});

  useEffect(() => {
    if (currentUser) {
      fetchQuestions();
    }
  }, [currentUser, statusFilter, searchTerm, loadBlock]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        loadBlock: loadBlock,
        searchQuery: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };
      
      const response = await qaService.getQuestions(params);
      // The service already returns response.data, so response is the array directly
      const questionsData = Array.isArray(response) ? response : [];
      
      if (loadBlock === 1) {
        setQuestions(questionsData);
      } else {
        setQuestions(prev => [...prev, ...questionsData]);
      }
      
      // Check if there are more questions (assuming 10 per page)
      setHasMore(questionsData.length === 10);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.message || 'Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setLoadBlock(1); // Reset to first page on search
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setLoadBlock(1); // Reset to first page on filter change
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !currentUser || currentUser.role !== 'student') return;

    try {
      setSubmittingQuestion(true);
      await qaService.addQuestion({
        question: newQuestion.trim(),
        date: new Date().toISOString(),
      });
      
      setNewQuestion('');
      setShowQuestionForm(false);
      setLoadBlock(1);
      await fetchQuestions();
    } catch (err) {
      console.error('Error adding question:', err);
      alert(err.message || 'Failed to add question. Please try again.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAddAnswer = async (questionID, e) => {
    e.preventDefault();
    const answerText = newAnswer[questionID];
    if (!answerText?.trim() || !currentUser || currentUser.role !== 'teacher') return;

    try {
      setSubmittingAnswer(prev => ({ ...prev, [questionID]: true }));
      await qaService.addAnswer({
        questionID: questionID,
        answer: answerText.trim(),
        date: new Date().toISOString(),
      });
      
      setNewAnswer(prev => ({ ...prev, [questionID]: '' }));
      setShowAnswerForm(null);
      await fetchQuestions();
    } catch (err) {
      console.error('Error adding answer:', err);
      alert(err.message || 'Failed to add answer. Please try again.');
    } finally {
      setSubmittingAnswer(prev => ({ ...prev, [questionID]: false }));
    }
  };

  const handleMarkHelpful = async (answerID) => {
    if (!currentUser || currentUser.role !== 'student') {
      alert('Only students can mark answers as helpful.');
      return;
    }

    try {
      setMarkingHelpful(prev => ({ ...prev, [answerID]: true }));
      await qaService.markAnswerAsHelpful({ answerID });
      
      // Update local state
      setQuestions(prev => prev.map(question => ({
        ...question,
        answers: question.answers?.map(answer => 
          answer.id === answerID
            ? { ...answer, helpfulCount: (answer.helpfulCount || 0) + 1, markedAsHelpful: true }
            : answer
        ) || []
      })));
    } catch (err) {
      console.error('Error marking helpful:', err);
      alert(err.message || 'Failed to mark as helpful. You may have already marked this answer.');
    } finally {
      setMarkingHelpful(prev => ({ ...prev, [answerID]: false }));
    }
  };

  const handleRemoveHelpful = async (answerID) => {
    if (!currentUser || currentUser.role !== 'student') {
      alert('Only students can unmark answers as helpful.');
      return;
    }

    try {
      setMarkingHelpful(prev => ({ ...prev, [answerID]: true }));
      await qaService.removeHelpfulVote({ answerID });
      
      // Update local state
      setQuestions(prev => prev.map(question => ({
        ...question,
        answers: question.answers?.map(answer => 
          answer.id === answerID
            ? { ...answer, helpfulCount: Math.max((answer.helpfulCount || 0) - 1, 0), markedAsHelpful: false }
            : answer
        ) || []
      })));
    } catch (err) {
      console.error('Error removing helpful vote:', err);
      alert(err.message || 'Failed to remove helpful vote. Please try again.');
    } finally {
      setMarkingHelpful(prev => ({ ...prev, [answerID]: false }));
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setLoadBlock(prev => prev + 1);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesQuestion = q.question?.toLowerCase().includes(searchLower);
      const matchesAnswers = q.answers?.some(a => 
        a.answer?.toLowerCase().includes(searchLower)
      );
      return matchesQuestion || matchesAnswers;
    }
    return true;
  });

  return (
    <div className="container qa-page">
      <div className="page-header">
        <h1>Questions & Answers</h1>
        <p>Find answers to common questions or ask your own</p>
      </div>

      <div className="qa-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="category-filters">
          <button
            className={`category-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`category-btn ${statusFilter === 'answered' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('answered')}
          >
            Answered
          </button>
          <button
            className={`category-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('pending')}
          >
            Pending
          </button>
        </div>

        {currentUser?.role === 'student' && (
          <button
            className="btn-primary add-question-btn"
            onClick={() => setShowQuestionForm(true)}
          >
            <MessageSquare size={18} />
            Ask a Question
          </button>
        )}
      </div>

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="modal-overlay" onClick={() => !submittingQuestion && setShowQuestionForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ask a Question</h2>
              <button
                className="modal-close"
                onClick={() => setShowQuestionForm(false)}
                disabled={submittingQuestion}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddQuestion}>
              <div className="form-group">
                <label>Your Question</label>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  rows={5}
                  maxLength={1000}
                  required
                  disabled={submittingQuestion}
                />
                <small>{newQuestion.length}/1000 characters</small>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowQuestionForm(false)}
                  disabled={submittingQuestion}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingQuestion || !newQuestion.trim()}
                >
                  {submittingQuestion ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Question
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading && loadBlock === 1 ? (
        <div className="loading-state">
          <Loader2 size={32} className="spinner" />
          <p>Loading questions...</p>
        </div>
      ) : (
        <>
          <div className="qa-list">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map(question => (
                <div key={question.id} className="qa-item card">
                  <div className="qa-header" onClick={() => toggleExpand(question.id)}>
                    <div className="qa-header-content">
                      <div className="qa-meta">
                        {question.student && (
                          <span className="student-name">
                            {question.student.name}
                          </span>
                        )}
                        <span className="qa-date">
                          {new Date(question.question_date).toLocaleDateString()}
                        </span>
                        {question.hasAnswers && (
                          <span className="answered-badge">Answered</span>
                        )}
                        {!question.hasAnswers && (
                          <span className="pending-badge">Pending</span>
                        )}
                      </div>
                      <h3>{question.question}</h3>
                    </div>
                    <button className="expand-btn">
                      {expandedId === question.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </button>
                  </div>
                  
                  {expandedId === question.id && (
                    <div className="qa-answers">
                      {question.answers && question.answers.length > 0 ? (
                        question.answers.map(answer => (
                          <div key={answer.id} className="answer-item">
                            <div className="answer-header">
                              {answer.teacher && (
                                <div className="answer-teacher">
                                  {answer.teacher.profileImage && (
                                    <img
                                      src={answer.teacher.profileImage}
                                      alt={answer.teacher.name}
                                      className="teacher-avatar"
                                    />
                                  )}
                                  <div>
                                    <div className="teacher-name">
                                      {answer.teacher.name}
                                      {answer.teacher.title && (
                                        <span className="teacher-title"> - {answer.teacher.title}</span>
                                      )}
                                    </div>
                                    <div className="answer-date">
                                      {new Date(answer.answer_date).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="answer-text">{answer.answer}</p>
                            <div className="answer-footer">
                              {currentUser?.role === 'student' && (
                                <button
                                  className={`helpful-btn ${answer.markedAsHelpful ? 'marked' : ''}`}
                                  onClick={() => answer.markedAsHelpful 
                                    ? handleRemoveHelpful(answer.id) 
                                    : handleMarkHelpful(answer.id)
                                  }
                                  disabled={markingHelpful[answer.id]}
                                >
                                  {markingHelpful[answer.id] ? (
                                    <Loader2 size={16} className="spinner" />
                                  ) : (
                                    <ThumbsUp size={16} />
                                  )}
                                  Helpful ({answer.helpfulCount || 0})
                                </button>
                              )}
                              {currentUser?.role !== 'student' && (
                                <div className="helpful-count">
                                  <ThumbsUp size={16} />
                                  {answer.helpfulCount || 0} helpful
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-answers">
                          <p>No answers yet. Be the first to answer!</p>
                        </div>
                      )}

                      {currentUser?.role === 'teacher' && (
                        <div className="add-answer-section">
                          {showAnswerForm === question.id ? (
                            <form
                              onSubmit={(e) => handleAddAnswer(question.id, e)}
                              className="answer-form"
                            >
                              <textarea
                                value={newAnswer[question.id] || ''}
                                onChange={(e) => setNewAnswer(prev => ({
                                  ...prev,
                                  [question.id]: e.target.value
                                }))}
                                placeholder="Write your answer here..."
                                rows={4}
                                maxLength={1000}
                                required
                                disabled={submittingAnswer[question.id]}
                              />
                              <small>{(newAnswer[question.id] || '').length}/1000 characters</small>
                              <div className="answer-form-actions">
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => {
                                    setShowAnswerForm(null);
                                    setNewAnswer(prev => ({ ...prev, [question.id]: '' }));
                                  }}
                                  disabled={submittingAnswer[question.id]}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="btn-primary"
                                  disabled={submittingAnswer[question.id] || !(newAnswer[question.id] || '').trim()}
                                >
                                  {submittingAnswer[question.id] ? (
                                    <>
                                      <Loader2 size={16} className="spinner" />
                                      Submitting...
                                    </>
                                  ) : (
                                    <>
                                      <Send size={16} />
                                      Submit Answer
                                    </>
                                  )}
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              className="btn-secondary add-answer-btn"
                              onClick={() => setShowAnswerForm(question.id)}
                            >
                              <MessageSquare size={16} />
                              Add Answer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <h3>No questions found</h3>
                <p>Try adjusting your search or filters, or be the first to ask a question!</p>
              </div>
            )}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button
                className="btn-secondary load-more-btn"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Loading...
                  </>
                ) : (
                  'Load More Questions'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QASection;
