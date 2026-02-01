import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import './CourseEditor.css';

const CourseEditor = () => {
  const { id } = useParams(); // Course ID if editing
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    tags: '',
    thumbnailUrl: '',
    price: 0,
    currency: 'USD',
    maxStudents: 0,
    status: 'draft'
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEditMode && currentUser?.id) {
      fetchCourseData();
    }
  }, [id, currentUser?.id]);

  const fetchCourseData = async () => {
    try {
      setFetching(true);
      setError('');
      const courseData = await courseService.getCourseDetails(id);
      
      // Check if teacher owns this course
      if (courseData.teacherID !== currentUser.id && courseData.teacher?.id !== currentUser.id) {
        setError('You do not have permission to edit this course');
        setTimeout(() => navigate('/my-courses'), 2000);
        return;
      }

      setFormData({
        title: courseData.title || '',
        description: courseData.description || '',
        subject: courseData.subject || '',
        tags: Array.isArray(courseData.tags) ? courseData.tags.join(', ') : courseData.tags || '',
        thumbnailUrl: courseData.thumbnailUrl || '',
        price: courseData.price || 0,
        currency: courseData.currency || 'USD',
        maxStudents: courseData.maxStudents || 0,
        status: courseData.status || 'draft'
      });
    } catch (err) {
      console.error('Error fetching course:', err);
      setError(err.message || 'Failed to load course data');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'maxStudents' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Course title is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const courseData = {
        teacherID: currentUser.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        subject: formData.subject.trim() || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        thumbnailUrl: formData.thumbnailUrl.trim() || null,
        price: parseFloat(formData.price) || 0,
        currency: formData.currency || 'USD',
        maxStudents: parseInt(formData.maxStudents) || 0,
        status: formData.status || 'draft'
      };

      let response;
      if (isEditMode) {
        courseData.courseID = id;
        response = await courseService.updateCourse(courseData);
      } else {
        response = await courseService.createCourse(courseData);
      }

      setSuccess(isEditMode ? 'Course updated successfully!' : 'Course created successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        if (isEditMode) {
          navigate(`/courses/${id}`);
        } else {
          navigate('/my-courses');
        }
      }, 1500);
    } catch (err) {
      console.error('Error saving course:', err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} course`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="course-editor-container">
        <div className="loading-state">
          <Loader2 size={48} className="spinner" />
          <p>Loading course data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-editor-container">
      <div className="course-editor-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1>{isEditMode ? 'Edit Course' : 'Create New Course'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="course-editor-form">
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

        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="title">
              Course Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter course title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter course description"
              rows="6"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="subject">Subject/Category</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Mathematics, Programming"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., beginner, javascript, web-development"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="thumbnailUrl">Thumbnail URL</label>
            <input
              type="url"
              id="thumbnailUrl"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
            {formData.thumbnailUrl && (
              <div className="thumbnail-preview">
                <img src={formData.thumbnailUrl} alt="Thumbnail preview" onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2>Pricing & Enrollment</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="SAR">SAR (﷼)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="maxStudents">Max Students</label>
              <input
                type="number"
                id="maxStudents"
                name="maxStudents"
                value={formData.maxStudents}
                onChange={handleChange}
                min="0"
                placeholder="0 = unlimited"
              />
              <small>Enter 0 for unlimited enrollment</small>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Status</h2>
          
          <div className="form-group">
            <label htmlFor="status">Course Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <small>
              {formData.status === 'draft' && 'Course is not visible to students'}
              {formData.status === 'published' && 'Course is visible and students can enroll'}
              {formData.status === 'archived' && 'Course is archived and not visible'}
            </small>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>{isEditMode ? 'Update Course' : 'Create Course'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseEditor;

