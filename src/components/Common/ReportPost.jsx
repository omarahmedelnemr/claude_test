import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { X, AlertTriangle, Flag } from 'lucide-react';
import './ReportPost.css';

const REPORT_TYPES = [
  'Spam',
  'Harassment or Bullying',
  'Hate Speech',
  'Violence or Dangerous Content',
  'False Information',
  'Inappropriate Content',
  'Copyright Violation',
  'Other'
];

/**
 * Report Post Modal Component
 * Allows users to report posts with predefined types or custom reason
 */
const ReportPost = memo(({ isOpen, onClose, onReport, postId }) => {
  const [selectedType, setSelectedType] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedType('');
      setCustomReason('');
      setError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleTypeSelect = useCallback((type) => {
    setSelectedType(type);
    if (type !== 'Other') {
      setCustomReason('');
    }
    setError(''); // Clear error when user interacts
  }, []);

  const handleReasonChange = useCallback((e) => {
    setCustomReason(e.target.value);
    setError(''); // Clear error when user types
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    // Validation: Must have either selected type or custom reason
    if (!selectedType && !customReason.trim()) {
      setError('Please select a report type or provide a reason.');
      return;
    }

    if (selectedType === 'Other' && !customReason.trim()) {
      setError('Please provide a reason when selecting "Other".');
      return;
    }

    try {
      setSubmitting(true);
      const reportData = {
        postID: postId,
        reportType: selectedType || 'Custom',
        reason: customReason.trim() || selectedType
      };

      await onReport(reportData);
      
      // Reset form and close
      setSelectedType('');
      setCustomReason('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedType, customReason, postId, onReport, onClose]);

  const handleCloseClick = useCallback(() => {
    if (!submitting) {
      onClose();
    }
  }, [submitting, onClose]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget && !submitting) {
      onClose();
    }
  }, [submitting, onClose]);

  const placeholderText = useMemo(() => {
    if (selectedType && selectedType !== 'Other') {
      return `Please provide additional details about "${selectedType}"...`;
    }
    return 'Please describe why you are reporting this post...';
  }, [selectedType]);

  const isSubmitDisabled = useMemo(() => {
    return submitting || (!selectedType && !customReason.trim());
  }, [submitting, selectedType, customReason]);

  if (!isOpen) return null;

  return (
    <div className="report-post-overlay" onClick={handleOverlayClick}>
      <div className="report-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-post-header">
          <div className="report-post-header-icon">
            <Flag size={24} />
          </div>
          <h2>Report Post</h2>
          <button
            className="report-post-close"
            onClick={handleCloseClick}
            disabled={submitting}
            aria-label="Close"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="report-post-form">
          <div className="report-post-content">
            <p className="report-post-description">
              Help us understand what's wrong with this post. Your report will be reviewed by our moderation team.
            </p>

            <div className="report-type-section">
              <label className="report-label">Report Type (Optional)</label>
              <div className="report-type-grid">
                {REPORT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`report-type-btn ${selectedType === type ? 'selected' : ''}`}
                    onClick={() => handleTypeSelect(type)}
                    disabled={submitting}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="report-reason-section">
              <label htmlFor="report-reason" className="report-label">
                Reason <span className="required">*</span>
              </label>
              <textarea
                id="report-reason"
                value={customReason}
                onChange={handleReasonChange}
                placeholder={placeholderText}
                rows="4"
                maxLength={500}
                disabled={submitting}
                required
                className="report-reason-textarea"
              />
              <div className="report-reason-counter">
                {customReason.length} / 500 characters
              </div>
            </div>

            {error && (
              <div className="report-error">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="report-post-actions">
            <button
              type="button"
              onClick={handleCloseClick}
              disabled={submitting}
              className="report-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="report-submit-btn"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

ReportPost.displayName = 'ReportPost';

export default ReportPost;

