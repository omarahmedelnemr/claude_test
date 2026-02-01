import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  FileQuestion,
  BookOpen,
  Loader2,
  Save,
  X,
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon
} from 'lucide-react';
import './CourseContentManager.css';
import '../Teacher/CreateArticle.css';

const CourseContentManager = () => {
  const { id: courseID } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [contentMap, setContentMap] = useState({}); // lectureID -> content array
  const [expandedLectures, setExpandedLectures] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [selectedLectureID, setSelectedLectureID] = useState(null);

  // Form states
  const [lectureForm, setLectureForm] = useState({
    title: '',
    description: '',
    completionPoints: 0,
    thumbnailUrl: ''
  });

  const [contentForm, setContentForm] = useState({
    title: '',
    description: '',
    contentType: 'video',
    fileUrl: '',
    fileSize: 0,
    duration: 0,
    estimatedViewingTime: 0,
    articleContent: '',
    totalPoints: 0,
    hasAnswerModel: true
  });

  // TipTap editor for article content
  const articleEditor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setContentForm(prev => ({
        ...prev,
        articleContent: editor.getHTML()
      }));
    },
  });

  const articleImageInputRef = useRef(null);

  useEffect(() => {
    if (courseID && currentUser?.id) {
      fetchData();
    }
  }, [courseID, currentUser?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch course details
      const courseData = await courseService.getCourseDetailsTeacher(courseID);
      setCourse(courseData);

      // Check if teacher owns this course
      if (courseData.teacherID !== currentUser.id && courseData.teacher?.id !== currentUser.id) {
        setError('You do not have permission to manage this course');
        setTimeout(() => navigate('/my-courses'), 2000);
        return;
      }

      // Fetch lectures (teacher view)
      const lecturesData = await courseService.getCourseLecturesTeacher(courseID, currentUser.id);
      const lecturesArray = Array.isArray(lecturesData) ? lecturesData : lecturesData.lectures || [];
      setLectures(lecturesArray);

      // Fetch content for each lecture (teacher view)
      const contentPromises = lecturesArray.map(lecture =>
        courseService.getLectureContentTeacher(lecture.id, currentUser.id)
      );
      const contentsArrays = await Promise.all(contentPromises);
      
      const contentMapObj = {};
      lecturesArray.forEach((lecture, idx) => {
        const content = Array.isArray(contentsArrays[idx]) 
          ? contentsArrays[idx] 
          : contentsArrays[idx].content || [];
        contentMapObj[lecture.id] = content;
      });
      setContentMap(contentMapObj);

      // Expand first lecture by default
      if (lecturesArray.length > 0) {
        setExpandedLectures(new Set([lecturesArray[0].id]));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const toggleLecture = (lectureID) => {
    setExpandedLectures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lectureID)) {
        newSet.delete(lectureID);
      } else {
        newSet.add(lectureID);
      }
      return newSet;
    });
  };

  const openLectureModal = (lecture = null) => {
    if (lecture) {
      setEditingLecture(lecture);
      setLectureForm({
        title: lecture.title || '',
        description: lecture.description || '',
        completionPoints: lecture.completionPoints || 0,
        thumbnailUrl: lecture.thumbnailUrl || ''
      });
    } else {
      setEditingLecture(null);
      setLectureForm({
        title: '',
        description: '',
        completionPoints: 0,
        thumbnailUrl: ''
      });
    }
    setShowLectureModal(true);
  };

  const openContentModal = (lectureID, content = null) => {
    setSelectedLectureID(lectureID);
    if (content) {
      setEditingContent(content);
      setContentForm({
        title: content.title || '',
        description: content.description || '',
        contentType: content.contentType || 'video',
        fileUrl: content.fileUrl || '',
        fileSize: content.fileSize || 0,
        duration: content.duration || 0,
        estimatedViewingTime: content.estimatedViewingTime || 0,
        articleContent: content.articleContent || '',
        totalPoints: content.totalPoints || 0,
        hasAnswerModel: content.hasAnswerModel !== undefined ? content.hasAnswerModel : true
      });
      // Set editor content if it's an article
      if (content.contentType === 'article' && articleEditor) {
        setTimeout(() => {
          if (content.articleContent) {
            articleEditor.commands.setContent(content.articleContent);
          } else {
            articleEditor.commands.setContent('');
          }
        }, 100);
      }
    } else {
      setEditingContent(null);
      setContentForm({
        title: '',
        description: '',
        contentType: 'video',
        fileUrl: '',
        fileSize: 0,
        duration: 0,
        estimatedViewingTime: 0,
        articleContent: '',
        totalPoints: 0,
        hasAnswerModel: true
      });
      // Clear editor content
      if (articleEditor) {
        articleEditor.commands.setContent('');
      }
    }
    setShowContentModal(true);
  };

  // Update editor content when modal opens or content type changes to article
  useEffect(() => {
    if (showContentModal && contentForm.contentType === 'article' && articleEditor) {
      if (editingContent && editingContent.contentType === 'article') {
        // When editing an article, load its content
        const targetContent = editingContent.articleContent || '';
        const currentContent = articleEditor.getHTML();
        if (currentContent !== targetContent) {
          articleEditor.commands.setContent(targetContent);
        }
      } else if (!editingContent) {
        // For new articles, ensure editor is empty
        const currentContent = articleEditor.getHTML();
        if (currentContent && currentContent !== '<p></p>' && currentContent !== '') {
          articleEditor.commands.setContent('');
        }
      }
    }
  }, [showContentModal, contentForm.contentType, articleEditor, editingContent]);

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (articleEditor) {
        articleEditor.destroy();
      }
    };
  }, [articleEditor]);

  const setLink = useCallback(() => {
    if (!articleEditor) return;
    
    const previousUrl = articleEditor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      articleEditor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    articleEditor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [articleEditor]);

  const handleImageUpload = useCallback(async (e) => {
    if (!articleEditor) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setError('');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload image to server
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      // Parse JSON response to get the URL string
      const imageUrl = await response.json();
      
      // Clean URL (remove any extra quotes if present)
      const cleanUrl = typeof imageUrl === 'string' ? imageUrl.replace(/^["']|["']$/g, '') : imageUrl;
      
      // Insert image into editor
      articleEditor.chain().focus().setImage({ src: cleanUrl.trim() }).run();
      
      // Reset file input
      if (articleImageInputRef.current) {
        articleImageInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
    }
  }, [articleEditor]);

  const triggerImageUpload = useCallback(() => {
    if (articleImageInputRef.current) {
      articleImageInputRef.current.click();
    }
  }, []);

  const handleLectureSubmit = async (e) => {
    e.preventDefault();
    if (!lectureForm.title.trim()) {
      setError('Lecture title is required');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const lectureData = {
        courseID,
        teacherID: currentUser.id,
        ...lectureForm,
        completionPoints: parseInt(lectureForm.completionPoints) || 0
      };

      if (editingLecture) {
        lectureData.lectureID = editingLecture.id;
        await courseService.updateLecture(lectureData);
        setSuccess('Lecture updated successfully!');
      } else {
        await courseService.createLecture(lectureData);
        setSuccess('Lecture created successfully!');
      }

      setShowLectureModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving lecture:', err);
      setError(err.message || `Failed to ${editingLecture ? 'update' : 'create'} lecture`);
    }
  };

  const handleContentSubmit = async (e) => {
    e.preventDefault();
    if (!contentForm.title.trim()) {
      setError('Content title is required');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const contentData = {
        lectureID: selectedLectureID,
        teacherID: currentUser.id,
        title: contentForm.title.trim(),
        description: contentForm.description.trim() || null,
        contentType: contentForm.contentType
      };

      if (contentForm.contentType === 'video' || contentForm.contentType === 'pdf') {
        contentData.fileUrl = contentForm.fileUrl.trim() || null;
        contentData.fileSize = parseInt(contentForm.fileSize) || 0;
        if (contentForm.contentType === 'video') {
          contentData.duration = parseFloat(contentForm.duration) || 0;
        }
        contentData.estimatedViewingTime = parseInt(contentForm.estimatedViewingTime) || 0;
      } else if (contentForm.contentType === 'article') {
        // Get HTML content from editor
        const articleHTML = articleEditor ? articleEditor.getHTML() : contentForm.articleContent;
        contentData.articleContent = articleHTML || null;
      } else if (contentForm.contentType === 'form') {
        contentData.totalPoints = parseInt(contentForm.totalPoints) || 0;
        contentData.hasAnswerModel = contentForm.hasAnswerModel;
      }

      if (editingContent) {
        contentData.contentID = editingContent.id;
        await courseService.updateContent(contentData);
        setSuccess('Content updated successfully!');
      } else {
        await courseService.createContent(contentData);
        setSuccess('Content created successfully!');
      }

      setShowContentModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving content:', err);
      setError(err.message || `Failed to ${editingContent ? 'update' : 'create'} content`);
    }
  };

  const handleDeleteLecture = async (lectureID) => {
    if (!window.confirm('Are you sure you want to delete this lecture? This will also delete all content in this lecture.')) {
      return;
    }

    try {
      await courseService.deleteLecture(lectureID, currentUser.id);
      setSuccess('Lecture deleted successfully!');
      fetchData();
    } catch (err) {
      console.error('Error deleting lecture:', err);
      setError(err.message || 'Failed to delete lecture');
    }
  };

  const handleDeleteContent = async (contentID) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      await courseService.deleteContent(contentID, currentUser.id);
      setSuccess('Content deleted successfully!');
      fetchData();
    } catch (err) {
      console.error('Error deleting content:', err);
      setError(err.message || 'Failed to delete content');
    }
  };

  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'video':
        return <Video size={18} />;
      case 'pdf':
        return <FileText size={18} />;
      case 'article':
        return <BookOpen size={18} />;
      case 'form':
        return <FileQuestion size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="content-manager-container">
        <div className="loading-state">
          <Loader2 size={48} className="spinner" />
          <p>Loading course content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-manager-container">
      <div className="content-manager-header">
        <button className="back-button" onClick={() => navigate(`/courses/${courseID}`)}>
          <ArrowLeft size={20} />
          <span>Back to Course</span>
        </button>
        <div>
          <h1>{course?.title || 'Course Content Manager'}</h1>
          <p>Manage lectures and content for this course</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => openLectureModal()}
        >
          <Plus size={20} />
          <span>Add Lecture</span>
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

      <div className="lectures-list">
        {lectures.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={64} color="#ccc" />
            <h3>No Lectures Yet</h3>
            <p>Create your first lecture to start adding content</p>
            <button className="btn-primary" onClick={() => openLectureModal()}>
              <Plus size={20} />
              <span>Create First Lecture</span>
            </button>
          </div>
        ) : (
          lectures.map((lecture, idx) => {
            const isExpanded = expandedLectures.has(lecture.id);
            const contents = contentMap[lecture.id] || [];

            return (
              <div key={lecture.id} className="lecture-card">
                <div className="lecture-header" onClick={() => toggleLecture(lecture.id)}>
                  <div className="lecture-header-left">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <div>
                      <h3>Lecture {idx + 1}: {lecture.title}</h3>
                      {lecture.description && (
                        <p className="lecture-description">{lecture.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="lecture-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="icon-btn"
                      onClick={() => openLectureModal(lecture)}
                      title="Edit Lecture"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="icon-btn icon-btn-danger"
                      onClick={() => handleDeleteLecture(lecture.id)}
                      title="Delete Lecture"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      className="btn-small"
                      onClick={() => openContentModal(lecture.id)}
                    >
                      <Plus size={16} />
                      <span>Add Content</span>
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="lecture-content">
                    {contents.length === 0 ? (
                      <div className="empty-content">
                        <p>No content in this lecture</p>
                        <button
                          className="btn-secondary btn-small"
                          onClick={() => openContentModal(lecture.id)}
                        >
                          <Plus size={16} />
                          <span>Add Content</span>
                        </button>
                      </div>
                    ) : (
                      <div className="content-list">
                        {contents.map((content, contentIdx) => (
                          <div key={content.id} className="content-item">
                            <div className="content-item-left">
                              {getContentIcon(content.contentType)}
                              <div>
                                <h4>
                                  {content.contentType === 'video' && 'Video: '}
                                  {content.contentType === 'pdf' && 'PDF: '}
                                  {content.contentType === 'article' && 'Article: '}
                                  {content.contentType === 'form' && 'Quiz: '}
                                  {content.title}
                                </h4>
                                {content.description && (
                                  <p className="content-description">{content.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="content-actions">
                              <button
                                className="icon-btn"
                                onClick={() => openContentModal(lecture.id, content)}
                                title="Edit Content"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="icon-btn icon-btn-danger"
                                onClick={() => handleDeleteContent(content.id)}
                                title="Delete Content"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Lecture Modal */}
      {showLectureModal && (
        <div className="modal-overlay" onClick={() => setShowLectureModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingLecture ? 'Edit Lecture' : 'Create New Lecture'}</h2>
              <button className="modal-close" onClick={() => setShowLectureModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleLectureSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="lecture-title">
                  Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="lecture-title"
                  value={lectureForm.title}
                  onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lecture-description">Description</label>
                <textarea
                  id="lecture-description"
                  value={lectureForm.description}
                  onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                  rows="4"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="completion-points">Completion Points</label>
                  <input
                    type="number"
                    id="completion-points"
                    value={lectureForm.completionPoints}
                    onChange={(e) => setLectureForm({ ...lectureForm, completionPoints: e.target.value })}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lecture-thumbnail">Thumbnail URL</label>
                  <input
                    type="url"
                    id="lecture-thumbnail"
                    value={lectureForm.thumbnailUrl}
                    onChange={(e) => setLectureForm({ ...lectureForm, thumbnailUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowLectureModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={18} />
                  <span>{editingLecture ? 'Update' : 'Create'} Lecture</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Modal */}
      {showContentModal && (
        <div className="modal-overlay" onClick={() => setShowContentModal(false)}>
          <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingContent ? 'Edit Content' : 'Add New Content'}</h2>
              <button className="modal-close" onClick={() => setShowContentModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleContentSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="content-type">Content Type</label>
                <select
                  id="content-type"
                  value={contentForm.contentType}
                  onChange={(e) => setContentForm({ ...contentForm, contentType: e.target.value })}
                  disabled={!!editingContent}
                >
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                  <option value="article">Article</option>
                  <option value="form">Quiz/Form</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="content-title">
                  Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="content-title"
                  value={contentForm.title}
                  onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="content-description">Description</label>
                <textarea
                  id="content-description"
                  value={contentForm.description}
                  onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                  rows="3"
                />
              </div>

              {(contentForm.contentType === 'video' || contentForm.contentType === 'pdf') && (
                <>
                  <div className="form-group">
                    <label htmlFor="file-url">File URL</label>
                    <input
                      type="url"
                      id="file-url"
                      value={contentForm.fileUrl}
                      onChange={(e) => setContentForm({ ...contentForm, fileUrl: e.target.value })}
                      placeholder="https://example.com/file.mp4"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="file-size">File Size (bytes)</label>
                      <input
                        type="number"
                        id="file-size"
                        value={contentForm.fileSize}
                        onChange={(e) => setContentForm({ ...contentForm, fileSize: e.target.value })}
                        min="0"
                      />
                    </div>
                    {contentForm.contentType === 'video' && (
                      <div className="form-group">
                        <label htmlFor="duration">Duration (minutes)</label>
                        <input
                          type="number"
                          id="duration"
                          value={contentForm.duration}
                          onChange={(e) => setContentForm({ ...contentForm, duration: e.target.value })}
                          min="0"
                          step="0.1"
                        />
                      </div>
                    )}
                    <div className="form-group">
                      <label htmlFor="estimated-time">Estimated Viewing Time (minutes)</label>
                      <input
                        type="number"
                        id="estimated-time"
                        value={contentForm.estimatedViewingTime}
                        onChange={(e) => setContentForm({ ...contentForm, estimatedViewingTime: e.target.value })}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {contentForm.contentType === 'article' && (
                <div className="form-group">
                  <label htmlFor="article-content">
                    Article Content <span className="required">*</span>
                  </label>
                  <div className="rich-text-editor">
                    {articleEditor && (
                      <div className="editor-toolbar">
                        <button
                          type="button"
                          onClick={() => articleEditor.chain().focus().toggleBold().run()}
                          className={articleEditor.isActive('bold') ? 'is-active' : ''}
                          title="Bold"
                        >
                          <Bold size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => articleEditor.chain().focus().toggleItalic().run()}
                          className={articleEditor.isActive('italic') ? 'is-active' : ''}
                          title="Italic"
                        >
                          <Italic size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => articleEditor.chain().focus().toggleStrike().run()}
                          className={articleEditor.isActive('strike') ? 'is-active' : ''}
                          title="Strikethrough"
                        >
                          <Underline size={18} />
                        </button>
                        <div className="toolbar-divider"></div>
                        <button
                          type="button"
                          onClick={() => articleEditor.chain().focus().toggleHeading({ level: 1 }).run()}
                          className={articleEditor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                          title="Heading 1"
                        >
                          <Heading1 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => articleEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                          className={articleEditor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                          title="Heading 2"
                        >
                          <Heading2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => articleEditor.chain().focus().toggleHeading({ level: 3 }).run()}
                          className={articleEditor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                          title="Heading 3"
                        >
                          <Heading3 size={18} />
                        </button>
                        <div className="toolbar-divider"></div>
                        <button
                          type="button"
                          onClick={() => articleEditor.chain().focus().toggleBulletList().run()}
                          className={articleEditor.isActive('bulletList') ? 'is-active' : ''}
                          title="Bullet List"
                        >
                          <List size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => articleEditor.chain().focus().toggleOrderedList().run()}
                          className={articleEditor.isActive('orderedList') ? 'is-active' : ''}
                          title="Numbered List"
                        >
                          <List size={18} />
                        </button>
                        <div className="toolbar-divider"></div>
                        <button
                          type="button"
                          onClick={setLink}
                          className={articleEditor.isActive('link') ? 'is-active' : ''}
                          title="Add Link"
                        >
                          <LinkIcon size={18} />
                        </button>
                        <input
                          type="file"
                          ref={articleImageInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={triggerImageUpload}
                          title="Upload Image"
                        >
                          <ImageIcon size={18} />
                        </button>
                      </div>
                    )}
                    <EditorContent editor={articleEditor} className="editor-content" />
                  </div>
                  <div className="editor-info">
                    <span>You can format text, add links, and insert images. Reading time is calculated automatically based on word count.</span>
                  </div>
                </div>
              )}

              {contentForm.contentType === 'form' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="total-points">Total Points</label>
                    <input
                      type="number"
                      id="total-points"
                      value={contentForm.totalPoints}
                      onChange={(e) => setContentForm({ ...contentForm, totalPoints: e.target.value })}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="has-answer-model" className="checkbox-label">
                      <input
                        type="checkbox"
                        id="has-answer-model"
                        checked={contentForm.hasAnswerModel}
                        onChange={(e) => setContentForm({ ...contentForm, hasAnswerModel: e.target.checked })}
                      />
                      <span>Has Answer Model (Auto-correction)</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowContentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={18} />
                  <span>{editingContent ? 'Update' : 'Create'} Content</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContentManager;

