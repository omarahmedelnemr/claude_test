import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import courseService from '../services/courseService';
import './QuestionManager.css';

const QuestionManager = ({ contentID, teacherID, onClose, contentTitle }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'multiple_choice',
    options: ['', ''],
    correctAnswer: '',
    points: 0,
    required: false,
    settings: null
  });

  useEffect(() => {
    if (contentID && teacherID) {
      fetchQuestions();
    }
  }, [contentID, teacherID]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await courseService.getFormQuestionsTeacher(contentID, teacherID);
      const questionsArray = Array.isArray(data) ? data : data.questions || [];
      setQuestions(questionsArray.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      questionText: '',
      questionType: 'multiple_choice',
      options: ['', ''],
      correctAnswer: '',
      points: 0,
      required: false,
      settings: null
    });
    setEditingQuestion(null);
    setShowQuestionForm(false);
  };

  const openQuestionForm = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        questionText: question.questionText || '',
        questionType: question.questionType || 'multiple_choice',
        options: Array.isArray(question.options) ? [...question.options] : ['', ''],
        correctAnswer: question.correctAnswer !== null && question.correctAnswer !== undefined 
          ? question.correctAnswer 
          : '',
        points: question.points || 0,
        required: question.required || false,
        settings: question.settings || null
      });
    } else {
      resetQuestionForm();
    }
    setShowQuestionForm(true);
  };

  const handleQuestionTypeChange = (type) => {
    setQuestionForm(prev => {
      const newForm = { ...prev, questionType: type };
      
      // Reset options and correct answer based on type
      if (type === 'multiple_choice' || type === 'checkbox') {
        newForm.options = prev.options && prev.options.length > 0 ? prev.options : ['', ''];
        newForm.correctAnswer = '';
      } else if (type === 'true_false') {
        newForm.options = [];
        newForm.correctAnswer = true;
      }
      
      return newForm;
    });
  };

  const addOption = () => {
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index, value) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    
    if (!questionForm.questionText.trim()) {
      setError('Question text is required');
      return;
    }

    if ((questionForm.questionType === 'multiple_choice' || 
         questionForm.questionType === 'checkbox') &&
        questionForm.options.filter(opt => opt.trim()).length < 2) {
      setError('At least 2 options are required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const questionData = {
        contentID,
        teacherID,
        questionText: questionForm.questionText.trim(),
        questionType: questionForm.questionType,
        points: parseInt(questionForm.points) || 0,
        required: questionForm.required,
      };

      // Add options for multiple choice and checkbox
      if (questionForm.questionType === 'multiple_choice' || 
          questionForm.questionType === 'checkbox') {
        questionData.options = questionForm.options.filter(opt => opt.trim());
      }

      // Add correct answer
      if (questionForm.questionType === 'true_false') {
        questionData.correctAnswer = questionForm.correctAnswer === true || questionForm.correctAnswer === 'true';
      } else if (questionForm.questionType === 'checkbox') {
        questionData.correctAnswer = Array.isArray(questionForm.correctAnswer) 
          ? questionForm.correctAnswer 
          : [];
      } else if (questionForm.questionType === 'multiple_choice') {
        questionData.correctAnswer = questionForm.correctAnswer;
      }

      if (editingQuestion) {
        questionData.questionID = editingQuestion.id;
        await courseService.updateFormQuestion(questionData);
        setSuccess('Question updated successfully!');
      } else {
        await courseService.addFormQuestion(questionData);
        setSuccess('Question added successfully!');
      }

      resetQuestionForm();
      fetchQuestions();
    } catch (err) {
      console.error('Error saving question:', err);
      setError(err.message || `Failed to ${editingQuestion ? 'update' : 'add'} question`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionID) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      setError('');
      await courseService.deleteFormQuestion(questionID, teacherID);
      setSuccess('Question deleted successfully!');
      fetchQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      setError(err.message || 'Failed to delete question');
    }
  };

  const moveQuestion = async (questionID, direction) => {
    const questionIndex = questions.findIndex(q => q.id === questionID);
    if (questionIndex === -1) return;

    const newIndex = direction === 'up' ? questionIndex - 1 : questionIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    try {
      setError('');
      // Swap orders
      const question1 = questions[questionIndex];
      const question2 = questions[newIndex];
      
      await courseService.updateFormQuestion({
        questionID: question1.id,
        teacherID,
        order: question2.order
      });
      
      await courseService.updateFormQuestion({
        questionID: question2.id,
        teacherID,
        order: question1.order
      });

      fetchQuestions();
    } catch (err) {
      console.error('Error moving question:', err);
      setError(err.message || 'Failed to move question');
    }
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      multiple_choice: 'Multiple Choice',
      checkbox: 'Checkbox',
      short_answer: 'Short Answer',
      long_answer: 'Long Answer',
      true_false: 'True/False',
      dropdown: 'Dropdown',
      linear_scale: 'Linear Scale',
      date: 'Date',
      time: 'Time',
      file_upload: 'File Upload'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="question-manager-overlay" onClick={onClose}>
        <div className="question-manager-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading-state">
            <Loader2 size={48} className="spinner" />
            <p>Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="question-manager-overlay" onClick={onClose}>
      <div className="question-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="question-manager-header">
          <div>
            <h2>Manage Questions</h2>
            <p>{contentTitle}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <div className="question-manager-content">
          {!showQuestionForm ? (
            <>
              <div className="questions-header">
                <h3>Questions ({questions.length})</h3>
                <button
                  className="btn-primary"
                  onClick={() => openQuestionForm()}
                >
                  <Plus size={18} />
                  <span>Add Question</span>
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="empty-state">
                  <p>No questions yet. Add your first question to get started.</p>
                  <button
                    className="btn-primary"
                    onClick={() => openQuestionForm()}
                  >
                    <Plus size={18} />
                    <span>Add First Question</span>
                  </button>
                </div>
              ) : (
                <div className="questions-list">
                  {questions.map((question, index) => (
                    <div key={question.id} className="question-item">
                      <div className="question-item-content">
                        <div className="question-number">{index + 1}</div>
                        <div className="question-details">
                          <div className="question-header">
                            <h4>{question.questionText}</h4>
                            <span className="question-type-badge">
                              {getQuestionTypeLabel(question.questionType)}
                            </span>
                          </div>
                          <div className="question-meta">
                            <span>Points: {question.points}</span>
                            {question.required && <span className="required-badge">Required</span>}
                          </div>
                        </div>
                      </div>
                      <div className="question-actions">
                        <button
                          className="icon-btn"
                          onClick={() => moveQuestion(question.id, 'up')}
                          disabled={index === 0}
                          title="Move Up"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => moveQuestion(question.id, 'down')}
                          disabled={index === questions.length - 1}
                          title="Move Down"
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => openQuestionForm(question)}
                          title="Edit Question"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="icon-btn icon-btn-danger"
                          onClick={() => handleDeleteQuestion(question.id)}
                          title="Delete Question"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleQuestionSubmit} className="question-form">
              <div className="form-header">
                <h3>{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resetQuestionForm}
                >
                  Cancel
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="question-text">
                  Question Text <span className="required">*</span>
                </label>
                <textarea
                  id="question-text"
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  rows="3"
                  required
                  placeholder="Enter your question here..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="question-type">Question Type</label>
                <select
                  id="question-type"
                  value={questionForm.questionType}
                  onChange={(e) => handleQuestionTypeChange(e.target.value)}
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="checkbox">Checkbox (Multiple Select)</option>
                  <option value="true_false">True/False</option>
                </select>
              </div>

              {(questionForm.questionType === 'multiple_choice' || 
                questionForm.questionType === 'checkbox' || 
                questionForm.questionType === 'dropdown') && (
                <div className="form-group">
                  <label>Options <span className="required">*</span></label>
                  {questionForm.options.map((option, index) => (
                    <div key={index} className="option-input">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        required
                      />
                      {questionForm.options.length > 2 && (
                        <button
                          type="button"
                          className="icon-btn icon-btn-danger"
                          onClick={() => removeOption(index)}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-secondary btn-small"
                    onClick={addOption}
                  >
                    <Plus size={16} />
                    <span>Add Option</span>
                  </button>
                  
                  {questionForm.questionType === 'multiple_choice' && (
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label htmlFor="correct-answer">Correct Answer</label>
                      <select
                        id="correct-answer"
                        value={questionForm.correctAnswer}
                        onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      >
                        <option value="">Select correct answer</option>
                        {questionForm.options.map((opt, idx) => (
                          opt.trim() && (
                            <option key={idx} value={opt}>
                              {opt}
                            </option>
                          )
                        ))}
                      </select>
                    </div>
                  )}

                  {questionForm.questionType === 'checkbox' && (
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label>Correct Answers (Select all that apply)</label>
                      {questionForm.options.map((opt, idx) => (
                        opt.trim() && (
                          <label key={idx} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={Array.isArray(questionForm.correctAnswer) && questionForm.correctAnswer.includes(opt)}
                              onChange={(e) => {
                                const current = Array.isArray(questionForm.correctAnswer) ? questionForm.correctAnswer : [];
                                if (e.target.checked) {
                                  setQuestionForm({ ...questionForm, correctAnswer: [...current, opt] });
                                } else {
                                  setQuestionForm({ ...questionForm, correctAnswer: current.filter(a => a !== opt) });
                                }
                              }}
                            />
                            <span>{opt}</span>
                          </label>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}

              {questionForm.questionType === 'true_false' && (
                <div className="form-group">
                  <label>Correct Answer</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="true-false"
                        checked={questionForm.correctAnswer === true || questionForm.correctAnswer === 'true'}
                        onChange={() => setQuestionForm({ ...questionForm, correctAnswer: true })}
                      />
                      <span>True</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="true-false"
                        checked={questionForm.correctAnswer === false || questionForm.correctAnswer === 'false'}
                        onChange={() => setQuestionForm({ ...questionForm, correctAnswer: false })}
                      />
                      <span>False</span>
                    </label>
                  </div>
                </div>
              )}

              {questionForm.questionType === 'linear_scale' && questionForm.settings && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="scale-min">Minimum</label>
                    <input
                      type="number"
                      id="scale-min"
                      value={questionForm.settings.min || 1}
                      onChange={(e) => setQuestionForm({
                        ...questionForm,
                        settings: { ...questionForm.settings, min: parseInt(e.target.value) || 1 }
                      })}
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="scale-max">Maximum</label>
                    <input
                      type="number"
                      id="scale-max"
                      value={questionForm.settings.max || 5}
                      onChange={(e) => setQuestionForm({
                        ...questionForm,
                        settings: { ...questionForm.settings, max: parseInt(e.target.value) || 5 }
                      })}
                      min="2"
                    />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="points">Points</label>
                  <input
                    type="number"
                    id="points"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: e.target.value })}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={questionForm.required}
                      onChange={(e) => setQuestionForm({ ...questionForm, required: e.target.checked })}
                    />
                    <span>Required</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resetQuestionForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>{editingQuestion ? 'Update' : 'Add'} Question</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionManager;

