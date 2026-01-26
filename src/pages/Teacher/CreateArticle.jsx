import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import blogService from '../../services/blogService';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { ArrowLeft, Loader2, Save, Image as ImageIcon, Bold, Italic, Underline, List, Link as LinkIcon, Heading1, Heading2, Heading3, X } from 'lucide-react';
import './CreateArticle.css';

const CreateArticle = () => {
  const navigate = useNavigate();
  const { id: articleID } = useParams(); // Get articleID from URL if editing
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    mainText: '',
    categoryID: '',
    coverImage: '',
    date: new Date().toISOString(), // Auto-set to current date
  });
  const [error, setError] = useState('');
  const coverImageInputRef = React.useRef(null);
  const isEditing = !!articleID;

  useEffect(() => {
    if (currentUser?.role !== 'teacher') {
      navigate('/blog');
      return;
    }

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await blogService.getCategoriesList();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };

    const fetchArticle = async () => {
      if (!articleID) return;
      
      try {
        setLoadingArticle(true);
        const article = await blogService.getArticle(articleID);
        
        // Check if article belongs to current teacher
        if (article.teacherID !== currentUser.id) {
          setError('You can only edit your own articles');
          navigate('/blog');
          return;
        }

        // Populate form with article data
        // Store original publish date separately to preserve it
        const originalDate = article.date || new Date().toISOString();
        setFormData({
          title: article.title || '',
          mainText: article.mainText || '',
          categoryID: article.categoryID || article.category?.id || '',
          coverImage: article.coverImage || '',
          date: originalDate, // Keep original publish date
        });
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article');
      } finally {
        setLoadingArticle(false);
      }
    };

    fetchCategories();
    if (isEditing) {
      fetchArticle();
    }
  }, [currentUser, navigate, articleID, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const editor = useEditor({
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
      setFormData(prev => ({
        ...prev,
        mainText: editor.getHTML()
      }));
    },
  });

  // Set editor content when article data is loaded (for editing)
  useEffect(() => {
    if (editor && isEditing && formData.mainText) {
      // Only set if editor content is different to avoid infinite loops
      const currentContent = editor.getHTML();
      if (currentContent !== formData.mainText) {
        editor.commands.setContent(formData.mainText);
      }
    }
  }, [editor, isEditing, formData.mainText]);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.mainText.trim()) {
      setError('Article content is required');
      return;
    }

    if (!formData.categoryID) {
      setError('Category is required');
      return;
    }

    // Strip HTML tags to check text length (for validation)
    const textContent = formData.mainText.replace(/<[^>]*>/g, '').trim();
    if (textContent.length === 0) {
      setError('Article content cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      if (isEditing) {
        // Edit existing article - preserve original publish date
        // Backend will set editDate automatically
        await blogService.editArticle({
          articleID: articleID,
          title: formData.title,
          mainText: formData.mainText,
          categoryID: formData.categoryID,
          coverImage: formData.coverImage || '', // Ensure empty string if no image
          date: formData.date, // Keep original publish date, don't change it
        });
      } else {
        // Create new article
        await blogService.createArticle({
          title: formData.title,
          mainText: formData.mainText,
          categoryID: formData.categoryID,
          coverImage: formData.coverImage || null, // null for new articles if no image
          date: new Date().toISOString(), // Always use current date
        });
      }
      
      navigate('/blog');
    } catch (err) {
      console.error(`Error ${isEditing ? 'editing' : 'creating'} article:`, err);
      setError(err.response?.data?.message || `Failed to ${isEditing ? 'edit' : 'create'} article`);
    } finally {
      setLoading(false);
    }
  };

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const fileInputRef = React.useRef(null);

  const handleImageUpload = useCallback(async (e) => {
    if (!editor) return;
    
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
      setLoading(true);
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
      editor.chain().focus().setImage({ src: cleanUrl.trim() }).run();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  }, [editor]);

  const triggerImageUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleCoverImageUpload = useCallback(async (e) => {
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
      setLoading(true);
      setError('');

      // Create FormData for file upload
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      // Upload image to server
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formDataUpload,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload cover image');
      }

      // Parse JSON response to get the URL string
      const imageUrl = await response.json();
      
      // Set cover image URL (remove any extra quotes if present)
      const cleanUrl = typeof imageUrl === 'string' ? imageUrl.replace(/^["']|["']$/g, '') : imageUrl;
      
      setFormData(prev => ({
        ...prev,
        coverImage: cleanUrl.trim()
      }));
      
      // Reset file input
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading cover image:', err);
      setError(err.message || 'Failed to upload cover image');
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerCoverImageUpload = useCallback(() => {
    if (coverImageInputRef.current) {
      coverImageInputRef.current.click();
    }
  }, []);

  return (
    <div className="container create-article-page">
      <div className="create-article-header">
        <button onClick={() => navigate('/blog')} className="back-btn">
          <ArrowLeft size={20} />
          Back to Blog
        </button>
        <h1>{isEditing ? 'Edit Article' : 'Create New Article'}</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loadingArticle && (
        <div className="loading-state">
          <Loader2 size={32} className="spinner" />
          <p>Loading article...</p>
        </div>
      )}

      {!loadingArticle && (
      <form onSubmit={handleSubmit} className="article-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter article title (max 200 characters)"
            maxLength={200}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="categoryID">Category *</label>
          {loadingCategories ? (
            <div className="loading-select">
              <Loader2 size={16} className="spinner" />
              <span>Loading categories...</span>
            </div>
          ) : (
            <select
              id="categoryID"
              name="categoryID"
              value={formData.categoryID}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.category || category.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="coverImage">Cover Image (Optional)</label>
          <input
            type="file"
            ref={coverImageInputRef}
            accept="image/*"
            onChange={handleCoverImageUpload}
            style={{ display: 'none' }}
          />
          <div className="cover-image-upload">
            {formData.coverImage ? (
              <div className="cover-image-preview">
                <img src={formData.coverImage} alt="Cover preview" />
                <div className="cover-image-actions">
                  <button
                    type="button"
                    onClick={triggerCoverImageUpload}
                    className="change-image-btn"
                    disabled={loading}
                  >
                    <ImageIcon size={18} />
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, coverImage: '' }));
                      // Reset file input
                      if (coverImageInputRef.current) {
                        coverImageInputRef.current.value = '';
                      }
                    }}
                    className="remove-image-btn"
                    disabled={loading}
                    title="Remove Image"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={triggerCoverImageUpload}
                className="upload-cover-image-btn"
                disabled={loading}
              >
                <ImageIcon size={20} />
                Upload Cover Image
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="mainText">Article Content *</label>
          <div className="rich-text-editor">
            {editor && (
              <div className="editor-toolbar">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={editor.isActive('bold') ? 'is-active' : ''}
                  title="Bold"
                >
                  <Bold size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={editor.isActive('italic') ? 'is-active' : ''}
                  title="Italic"
                >
                  <Italic size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={editor.isActive('strike') ? 'is-active' : ''}
                  title="Strikethrough"
                >
                  <Underline size={18} />
                </button>
                <div className="toolbar-divider"></div>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                  title="Heading 1"
                >
                  <Heading1 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                  title="Heading 2"
                >
                  <Heading2 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                  title="Heading 3"
                >
                  <Heading3 size={18} />
                </button>
                <div className="toolbar-divider"></div>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={editor.isActive('bulletList') ? 'is-active' : ''}
                  title="Bullet List"
                >
                  <List size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={editor.isActive('orderedList') ? 'is-active' : ''}
                  title="Numbered List"
                >
                  <List size={18} />
                </button>
                <div className="toolbar-divider"></div>
                <button
                  type="button"
                  onClick={setLink}
                  className={editor.isActive('link') ? 'is-active' : ''}
                  title="Add Link"
                >
                  <LinkIcon size={18} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={triggerImageUpload}
                  title="Upload Image"
                  disabled={loading}
                >
                  <ImageIcon size={18} />
                </button>
              </div>
            )}
            <EditorContent editor={editor} className="editor-content" />
          </div>
          <div className="editor-info">
            <span>You can format text, add links, and insert images</span>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/blog')}
            className="cancel-btn"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" />
                {isEditing ? 'Saving...' : 'Publishing...'}
              </>
            ) : (
              <>
                <Save size={18} />
                {isEditing ? 'Save Changes' : 'Publish Article'}
              </>
            )}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

export default CreateArticle;

