import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import courseService from '../../services/courseService';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import QuestionManager from '../../components/QuestionManager';
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
  Image as ImageIcon,
  Settings
} from 'lucide-react';
import './CourseContentManager.css';
import '../Teacher/CreateArticle.css';

const CourseContentManager = () => {
  const { id: courseID } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]); // Array of {section: {...}, lectures: [...]}
  const [contentMap, setContentMap] = useState({}); // lectureID -> content array
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [expandedLectures, setExpandedLectures] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [selectedContentForQuestions, setSelectedContentForQuestions] = useState(null);
  const [editingLecture, setEditingLecture] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [selectedLectureID, setSelectedLectureID] = useState(null);

  // Form states
  const [lectureForm, setLectureForm] = useState({
    title: '',
    description: '',
    completionPoints: 0,
    thumbnailUrl: '',
    sectionID: null // For section assignment
  });

  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: ''
  });

  const [contentForm, setContentForm] = useState({
    title: '',
    description: '',
    contentType: 'video',
    fileUrl: '',
    fileSize: 0,
    estimatedViewingTime: 0,
    articleContent: '',
    totalPoints: 0,
    hasAnswerModel: true
  });
  const [isDurationManuallySet, setIsDurationManuallySet] = useState(false);
  const SECONDS_PER_WORD = 0.5; // Default: 0.5 seconds per word

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
      const htmlContent = editor.getHTML();
      
      // Auto-calculate duration for articles if not manually set
      setContentForm(prev => {
        const newForm = {
          ...prev,
          articleContent: htmlContent
        };
        
        if (prev.contentType === 'article' && !isDurationManuallySet) {
          const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const words = textContent.split(/\s+/).filter(word => word.length > 0);
          const wordCount = words.length;
          const durationInMinutes = (wordCount * SECONDS_PER_WORD) / 60;
          newForm.estimatedViewingTime = Math.max(1, Math.ceil(durationInMinutes)); // At least 1 minute
        }
        
        return newForm;
      });
    },
  });

  const articleImageInputRef = useRef(null);
  const contentFileInputRef = useRef(null);
  const thumbnailFileInputRef = useRef(null);
  const lectureThumbnailInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

      // Fetch sections with lectures (teacher view)
      const sectionsData = await courseService.getCourseLecturesTeacher(courseID, currentUser.id);
      
      // Handle both old format (flat array) and new format (sections with lectures)
      let sectionsArray = [];
      if (Array.isArray(sectionsData)) {
        // Check if it's the new format (array of sections with section objects)
        const firstItem = sectionsData[0];
        if (firstItem && firstItem.lectures !== undefined && Array.isArray(firstItem.lectures)) {
          // New format: array of sections
          sectionsArray = sectionsData;
        } else {
          // Old format: flat array of lectures (no sections)
          sectionsArray = [{
            section: null, // No section
            lectures: sectionsData
          }];
        }
      } else {
        sectionsArray = [];
      }
      setSections(sectionsArray);

      // Flatten all lectures for content fetching
      const allLectures = sectionsArray.flatMap(sectionData => sectionData.lectures || []);

      // Fetch content for each lecture (teacher view)
      const contentPromises = allLectures.map(lecture =>
        courseService.getLectureContentTeacher(lecture.id, currentUser.id)
      );
      const contentsArrays = await Promise.all(contentPromises);
      
      const contentMapObj = {};
      allLectures.forEach((lecture, idx) => {
        const content = Array.isArray(contentsArrays[idx]) 
          ? contentsArrays[idx] 
          : contentsArrays[idx].content || [];
        contentMapObj[lecture.id] = content;
      });
      setContentMap(contentMapObj);

      // Expand first section and first lecture by default
      if (sectionsArray.length > 0) {
        const firstSection = sectionsArray[0];
        const sectionId = firstSection.section ? firstSection.section.id : 'unsectioned';
        setExpandedSections(new Set([sectionId]));
        if (firstSection.lectures && firstSection.lectures.length > 0) {
          setExpandedLectures(new Set([firstSection.lectures[0].id]));
        }
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

  const openLectureModal = (lecture = null, defaultSectionID = null) => {
    if (lecture) {
      setEditingLecture(lecture);
      setLectureForm({
        title: lecture.title || '',
        description: lecture.description || '',
        completionPoints: lecture.completionPoints || 0,
        thumbnailUrl: lecture.thumbnailUrl || '',
        sectionID: lecture.section?.id || null
      });
    } else {
      setEditingLecture(null);
      setLectureForm({
        title: '',
        description: '',
        completionPoints: 0,
        thumbnailUrl: '',
        sectionID: defaultSectionID || null
      });
    }
    setShowLectureModal(true);
  };

  const openSectionModal = (section = null) => {
    if (section) {
      setEditingSection(section);
      setSectionForm({
        title: section.title || '',
        description: section.description || ''
      });
    } else {
      setEditingSection(null);
      setSectionForm({
        title: '',
        description: ''
      });
    }
    setShowSectionModal(true);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    if (!sectionForm.title.trim()) {
      setError('Section title is required');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const sectionData = {
        courseID,
        teacherID: currentUser.id,
        ...sectionForm
      };

      let savedSection;
      if (editingSection) {
        sectionData.sectionID = editingSection.id;
        const response = await courseService.updateSection(sectionData);
        savedSection = response.data || response; // Handle both response formats
        setSuccess('Section updated successfully!');
        
        // Update local state without reloading
        setSections(prevSections => {
          return prevSections.map(sectionData => {
            if (sectionData.section && sectionData.section.id === editingSection.id) {
              return {
                ...sectionData,
                section: { ...sectionData.section, ...savedSection }
              };
            }
            return sectionData;
          });
        });
      } else {
        const response = await courseService.createSection(sectionData);
        savedSection = response.data || response; // Handle both response formats
        setSuccess('Section created successfully!');
        
        // Update local state without reloading - add new section
        if (savedSection && savedSection.id) {
          setSections(prevSections => {
            return [...prevSections, {
              section: savedSection,
              lectures: []
            }];
          });
          
          // Expand the new section
          setExpandedSections(prev => new Set([...prev, savedSection.id]));
        }
      }

      setShowSectionModal(false);
    } catch (err) {
      console.error('Error saving section:', err);
      setError(err.message || `Failed to ${editingSection ? 'update' : 'create'} section`);
    }
  };

  const handleDeleteSection = async (sectionID) => {
    if (!window.confirm('Are you sure you want to delete this section? Lectures in this section will be moved to the default section.')) {
      return;
    }

    try {
      await courseService.deleteSection(sectionID, currentUser.id);
      setSuccess('Section deleted successfully!');
      fetchData();
    } catch (err) {
      console.error('Error deleting section:', err);
      setError(err.message || 'Failed to delete section');
    }
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
        estimatedViewingTime: content.estimatedViewingTime || content.duration || 0, // Use estimatedViewingTime, fallback to duration for backward compatibility
        articleContent: content.articleContent || '',
        totalPoints: content.totalPoints || 0,
        hasAnswerModel: content.hasAnswerModel !== undefined ? content.hasAnswerModel : true
      });
      // If editing article with existing estimatedViewingTime, consider it manually set
      if (content.contentType === 'article' && content.estimatedViewingTime) {
        setIsDurationManuallySet(true);
      } else {
        setIsDurationManuallySet(false);
      }
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
        estimatedViewingTime: 0,
        articleContent: '',
        totalPoints: 0,
        hasAnswerModel: true
      });
      setIsDurationManuallySet(false);
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

  const handleContentFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const contentType = contentForm.contentType;
    
    // Validate file type
    if (contentType === 'video') {
      const videoTypes = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !videoTypes.includes(fileExt)) {
        setError('Please select a valid video file (MP4, WebM, MOV, AVI, MKV, M4V)');
        return;
      }
    } else if (contentType === 'pdf') {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (fileExt !== 'pdf') {
        setError('Please select a PDF file');
        return;
      }
    }

    // Validate file size (max 500MB for videos, 50MB for PDFs)
    const maxSize = contentType === 'video' ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than ${contentType === 'video' ? '500MB' : '50MB'}`);
      return;
    }

    try {
      setUploadingFile(true);
      setError('');
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/upload-lecture-content`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to upload file' }));
        throw new Error(errorData.message || 'Failed to upload file');
      }

      const result = await response.json();
      const fileUrl = typeof result === 'string' ? result : result.url;
      
      // Update form with file URL and size
      setContentForm(prev => ({
        ...prev,
        fileUrl: fileUrl.trim(),
        fileSize: result.size || file.size
      }));

      setSuccess('File uploaded successfully!');
      setUploadProgress(100);
      
      // Reset file input
      if (contentFileInputRef.current) {
        contentFileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const handleThumbnailUpload = async (e, type = 'lecture') => {
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
      setUploadingFile(true);
      setError('');
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

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
        throw new Error('Failed to upload thumbnail');
      }

      const imageUrl = await response.json();
      const cleanUrl = typeof imageUrl === 'string' ? imageUrl.replace(/^["']|["']$/g, '') : imageUrl;
      
      // Update form based on type
      if (type === 'lecture') {
        setLectureForm(prev => ({
          ...prev,
          thumbnailUrl: cleanUrl.trim()
        }));
      }

      setSuccess('Thumbnail uploaded successfully!');
      setUploadProgress(100);
      
      // Reset file input
      if (type === 'lecture' && lectureThumbnailInputRef.current) {
        lectureThumbnailInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading thumbnail:', err);
      setError(err.message || 'Failed to upload thumbnail');
    } finally {
      setUploadingFile(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const triggerContentFileUpload = () => {
    if (contentFileInputRef.current) {
      contentFileInputRef.current.click();
    }
  };

  const triggerThumbnailUpload = (type = 'lecture') => {
    if (type === 'lecture' && lectureThumbnailInputRef.current) {
      lectureThumbnailInputRef.current.click();
    }
  };

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
        completionPoints: parseInt(lectureForm.completionPoints) || 0,
        sectionID: lectureForm.sectionID || null // Include section assignment
      };

      let savedLecture;
      if (editingLecture) {
        lectureData.lectureID = editingLecture.id;
        const response = await courseService.updateLecture(lectureData);
        savedLecture = response.data || response; // Handle both response formats
        setSuccess('Lecture updated successfully!');
        
        // Update local state without reloading
        setSections(prevSections => {
          return prevSections.map(sectionData => {
            const lectureIndex = sectionData.lectures?.findIndex(l => l.id === editingLecture.id);
            if (lectureIndex !== undefined && lectureIndex >= 0) {
              const updatedLectures = [...sectionData.lectures];
              updatedLectures[lectureIndex] = { ...updatedLectures[lectureIndex], ...savedLecture };
              return { ...sectionData, lectures: updatedLectures };
            }
            return sectionData;
          });
        });
      } else {
        const response = await courseService.createLecture(lectureData);
        savedLecture = response.data || response; // Handle both response formats
        setSuccess('Lecture created successfully!');
        
        // Update local state without reloading
        const targetSectionID = lectureForm.sectionID || null;
        setSections(prevSections => {
          return prevSections.map(sectionData => {
            const sectionId = sectionData.section ? sectionData.section.id : 'unsectioned';
            // If no sectionID specified, add to default section (first section with title "Default Section")
            if (!targetSectionID) {
              // Find default section
              if (sectionData.section?.title === 'Default Section' || (!sectionData.section && prevSections.indexOf(sectionData) === 0)) {
                return {
                  ...sectionData,
                  lectures: [...(sectionData.lectures || []), savedLecture]
                };
              }
            } else if (sectionId === targetSectionID) {
              return {
                ...sectionData,
                lectures: [...(sectionData.lectures || []), savedLecture]
              };
            }
            return sectionData;
          });
        });
        
        // Expand the section where the lecture was added
        if (targetSectionID) {
          setExpandedSections(prev => new Set([...prev, targetSectionID]));
        } else {
          // Expand default section if no section specified
          const defaultSection = sections.find(s => s.section?.title === 'Default Section' || !s.section);
          if (defaultSection) {
            const defaultSectionId = defaultSection.section ? defaultSection.section.id : 'unsectioned';
            setExpandedSections(prev => new Set([...prev, defaultSectionId]));
          }
        }
        
        // Expand the new lecture
        if (savedLecture && savedLecture.id) {
          setExpandedLectures(prev => new Set([...prev, savedLecture.id]));
        }
      }

      setShowLectureModal(false);
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
        // Use estimatedViewingTime for both duration and estimated viewing time
        contentData.estimatedViewingTime = parseInt(contentForm.estimatedViewingTime) || 0;
      } else if (contentForm.contentType === 'article') {
        // Get HTML content from editor
        const articleHTML = articleEditor ? articleEditor.getHTML() : contentForm.articleContent;
        contentData.articleContent = articleHTML || null;
        // Set estimated viewing time (duration in minutes) for articles
        contentData.estimatedViewingTime = parseInt(contentForm.estimatedViewingTime) || 1;
      } else if (contentForm.contentType === 'form') {
        contentData.totalPoints = parseInt(contentForm.totalPoints) || 0;
        contentData.hasAnswerModel = contentForm.hasAnswerModel;
      }

      let savedContent;
      if (editingContent) {
        contentData.contentID = editingContent.id;
        const response = await courseService.updateContent(contentData);
        savedContent = response.data || response; // Handle both response formats
        setSuccess('Content updated successfully!');
        
        // Update local state without reloading
        setContentMap(prevContentMap => {
          const lectureContent = prevContentMap[selectedLectureID] || [];
          const contentIndex = lectureContent.findIndex(c => c.id === editingContent.id);
          if (contentIndex >= 0) {
            const updatedContent = [...lectureContent];
            updatedContent[contentIndex] = { ...updatedContent[contentIndex], ...savedContent };
            return {
              ...prevContentMap,
              [selectedLectureID]: updatedContent
            };
          }
          return prevContentMap;
        });
      } else {
        const response = await courseService.createContent(contentData);
        savedContent = response.data || response; // Handle both response formats
        setSuccess('Content created successfully!');
        
        // Update local state without reloading
        if (savedContent && savedContent.id) {
          setContentMap(prevContentMap => {
            return {
              ...prevContentMap,
              [selectedLectureID]: [...(prevContentMap[selectedLectureID] || []), savedContent]
            };
          });
        }
      }

      setShowContentModal(false);
      
      // If it's a new form, open question manager
      if (!editingContent && contentForm.contentType === 'form') {
        // Use the saved content directly
        setSelectedContentForQuestions(savedContent);
        setShowQuestionManager(true);
      }
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
        <div style={{ display: 'flex', gap: '1em' }}>
          <button
            className="btn-secondary"
            onClick={() => openSectionModal()}
          >
            <Plus size={20} />
            <span>Add Section</span>
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              // Find default section or first section
              const defaultSection = sections.find(s => s.section && s.section.title === 'Default Section');
              const sectionID = defaultSection?.section?.id || (sections.length > 0 && sections[0].section ? sections[0].section.id : null);
              openLectureModal(null, sectionID);
            }}
          >
            <Plus size={20} />
            <span>Add Lecture</span>
          </button>
        </div>
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
        {sections.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={64} color="#ccc" />
            <h3>No Content Yet</h3>
            <p>Create your first section and lecture to start adding content</p>
            <button className="btn-primary" onClick={() => openSectionModal()}>
              <Plus size={20} />
              <span>Create First Section</span>
            </button>
          </div>
        ) : (
          sections.map((sectionData, sectionIdx) => {
            const sectionId = sectionData.section ? sectionData.section.id : 'unsectioned';
            const isSectionExpanded = expandedSections.has(sectionId);
            const sectionLectures = sectionData.lectures || [];
            
            return (
              <div key={sectionId || sectionIdx} className="section-container">
                {sectionData.section && (
                  <div className="section-header">
                    <div className="section-header-left" onClick={() => toggleSection(sectionId)}>
                      {isSectionExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <div>
                        <h2 className="section-title">{sectionData.section.title}</h2>
                        {sectionData.section.description && (
                          <p className="section-description">{sectionData.section.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="section-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="icon-btn"
                        onClick={() => openSectionModal(sectionData.section)}
                        title="Edit Section"
                      >
                        <Edit size={16} />
                      </button>
                      {sectionData.section.title !== 'Default Section' && (
                        <button
                          className="icon-btn icon-btn-danger"
                          onClick={() => handleDeleteSection(sectionData.section.id)}
                          title="Delete Section"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button
                        className="btn-small"
                        onClick={() => openLectureModal(null, sectionData.section.id)}
                      >
                        <Plus size={16} />
                        <span>Add Lecture</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {isSectionExpanded && (
                  <div className="section-lectures">
                    {sectionLectures.length === 0 ? (
                      <div className="empty-state-small">
                        <p>No lectures in this section</p>
                        <button
                          className="btn-secondary btn-small"
                          onClick={() => openLectureModal(null, sectionData.section?.id || null)}
                        >
                          <Plus size={16} />
                          <span>Add Lecture</span>
                        </button>
                      </div>
                    ) : (
                      sectionLectures.map((lecture, idx) => {
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
                      onClick={() => {
                        // Find which section this lecture belongs to
                        const parentSection = sections.find(s => 
                          s.lectures?.some(l => l.id === lecture.id)
                        );
                        openLectureModal(lecture, parentSection?.section?.id || null);
                      }}
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
                                  {content.contentType === 'form' && content.questionCount !== undefined && (
                                    <span className="question-count-badge">
                                      {content.questionCount} {content.questionCount === 1 ? 'question' : 'questions'}
                                    </span>
                                  )}
                                </h4>
                                {content.description && (
                                  <p className="content-description">{content.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="content-actions">
                              {content.contentType === 'form' && (
                                <button
                                  className="icon-btn"
                                  onClick={() => {
                                    setSelectedContentForQuestions(content);
                                    setShowQuestionManager(true);
                                  }}
                                  title="Manage Questions"
                                >
                                  <Settings size={16} />
                                </button>
                              )}
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
              <div className="form-group">
                <label htmlFor="lecture-section">Section</label>
                <select
                  id="lecture-section"
                  value={lectureForm.sectionID || ''}
                  onChange={(e) => setLectureForm({ ...lectureForm, sectionID: e.target.value || null })}
                >
                  <option value="">Select a section (optional)</option>
                  {sections.map((sectionData) => {
                    if (sectionData.section) {
                      return (
                        <option key={sectionData.section.id} value={sectionData.section.id}>
                          {sectionData.section.title}
                        </option>
                      );
                    }
                    return null;
                  })}
                </select>
                <small>Select which section this lecture belongs to. If not selected, it will be added to the default section.</small>
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
                  <label htmlFor="lecture-thumbnail">
                    Thumbnail URL {uploadingFile && <span className="uploading-indicator">(Uploading...)</span>}
                  </label>
                  <div className="file-url-input-group">
                    <input
                      type="url"
                      id="lecture-thumbnail"
                      value={lectureForm.thumbnailUrl}
                      onChange={(e) => setLectureForm({ ...lectureForm, thumbnailUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg or upload an image"
                      disabled={uploadingFile}
                    />
                    <button
                      type="button"
                      className="btn-secondary btn-small"
                      onClick={() => triggerThumbnailUpload('lecture')}
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? (
                        <>
                          <Loader2 size={16} className="spinner" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          <span>Upload</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={lectureThumbnailInputRef}
                    accept="image/*"
                    onChange={(e) => handleThumbnailUpload(e, 'lecture')}
                    style={{ display: 'none' }}
                  />
                  {lectureForm.thumbnailUrl && (
                    <div className="thumbnail-preview" style={{ marginTop: '0.5rem' }}>
                      <img 
                        src={lectureForm.thumbnailUrl} 
                        alt="Thumbnail preview" 
                        onError={(e) => e.target.style.display = 'none'} 
                        style={{ maxWidth: '200px', maxHeight: '120px', borderRadius: '6px' }}
                      />
                    </div>
                  )}
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
                  onChange={(e) => {
                    const newType = e.target.value;
                    setContentForm({ ...contentForm, contentType: newType });
                    // Reset duration state when switching to/from article
                    if (newType === 'article') {
                      setIsDurationManuallySet(false);
                    }
                  }}
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

              {contentForm.contentType !== 'article' && (
                <div className="form-group">
                  <label htmlFor="content-description">Description</label>
                  <textarea
                    id="content-description"
                    value={contentForm.description}
                    onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                    rows="3"
                  />
                </div>
              )}

              {(contentForm.contentType === 'video' || contentForm.contentType === 'pdf') && (
                <>
                  <div className="form-group">
                    <label htmlFor="file-url">
                      File URL {uploadingFile && <span className="uploading-indicator">(Uploading...)</span>}
                    </label>
                    <div className="file-url-input-group">
                      <input
                        type="url"
                        id="file-url"
                        value={contentForm.fileUrl}
                        onChange={(e) => setContentForm({ ...contentForm, fileUrl: e.target.value })}
                        placeholder="https://example.com/file.mp4 or upload a file"
                        disabled={uploadingFile}
                      />
                      <button
                        type="button"
                        className="btn-secondary btn-small"
                        onClick={triggerContentFileUpload}
                        disabled={uploadingFile}
                      >
                        {uploadingFile ? (
                          <>
                            <Loader2 size={16} className="spinner" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            <span>Upload File</span>
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={contentFileInputRef}
                      accept={contentForm.contentType === 'video' ? 'video/*' : '.pdf'}
                      onChange={handleContentFileUpload}
                      style={{ display: 'none' }}
                    />
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="upload-progress">
                        <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}
                    {contentForm.fileUrl && (
                      <small className="file-info">
                        {contentForm.contentType === 'video' ? 'Video' : 'PDF'} file: {contentForm.fileUrl}
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="estimated-time">
                      {contentForm.contentType === 'video' ? 'Duration' : 'Estimated Viewing Time'} (minutes)
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="estimated-time"
                      value={contentForm.estimatedViewingTime}
                      onChange={(e) => setContentForm({ ...contentForm, estimatedViewingTime: e.target.value })}
                      min="1"
                      step="0.5"
                      required
                      placeholder="Enter duration in minutes"
                    />
                    <small>
                      {contentForm.contentType === 'video' 
                        ? 'Enter the video duration in minutes'
                        : 'Enter the estimated viewing time in minutes'}
                    </small>
                  </div>
                </>
              )}

              {contentForm.contentType === 'article' && (
                <>
                  <div className="form-group">
                    <label htmlFor="article-duration">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      id="article-duration"
                      value={contentForm.estimatedViewingTime || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        if (value > 0) {
                          setIsDurationManuallySet(true);
                        } else {
                          setIsDurationManuallySet(false);
                          // Recalculate if cleared
                          if (articleEditor) {
                            const htmlContent = articleEditor.getHTML();
                            const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                            const words = textContent.split(/\s+/).filter(word => word.length > 0);
                            const wordCount = words.length;
                            const durationInMinutes = (wordCount * SECONDS_PER_WORD) / 60;
                            setContentForm(prev => ({
                              ...prev,
                              estimatedViewingTime: Math.max(1, Math.ceil(durationInMinutes))
                            }));
                            return;
                          }
                        }
                        setContentForm(prev => ({
                          ...prev,
                          estimatedViewingTime: value || 0
                        }));
                      }}
                      onBlur={(e) => {
                        // If user clears the field, switch back to auto-calculation
                        if (e.target.value === '' || parseFloat(e.target.value) === 0) {
                          setIsDurationManuallySet(false);
                          if (articleEditor) {
                            const htmlContent = articleEditor.getHTML();
                            const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                            const words = textContent.split(/\s+/).filter(word => word.length > 0);
                            const wordCount = words.length;
                            const durationInMinutes = (wordCount * SECONDS_PER_WORD) / 60;
                            setContentForm(prev => ({
                              ...prev,
                              estimatedViewingTime: Math.max(1, Math.ceil(durationInMinutes))
                            }));
                          }
                        }
                      }}
                      min="1"
                      step="0.5"
                      placeholder="Auto-calculated from word count"
                    />
                    <small>
                      {isDurationManuallySet 
                        ? 'Duration is manually set and won\'t change automatically. Clear the field to enable auto-calculation.'
                        : (() => {
                            const wordCount = articleEditor 
                              ? (() => {
                                  const htmlContent = articleEditor.getHTML();
                                  const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                                  return textContent.split(/\s+/).filter(word => word.length > 0).length;
                                })()
                              : 0;
                            return `Auto-calculated: ${SECONDS_PER_WORD} seconds per word (${wordCount} words = ${contentForm.estimatedViewingTime || 1} minutes)`;
                          })()}
                    </small>
                  </div>
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
                    <span>You can format text, add links, and insert images. Reading time is calculated automatically based on word count (0.5 seconds per word).</span>
                  </div>
                </div>
                </>
              )}

              {contentForm.contentType === 'form' && (
                <>
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
                  {editingContent && (
                    <div className="form-group">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setShowContentModal(false);
                          setSelectedContentForQuestions(editingContent);
                          setShowQuestionManager(true);
                        }}
                        style={{ width: '100%' }}
                      >
                        <Settings size={18} />
                        <span>Manage Questions</span>
                      </button>
                      <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                        Add, edit, or remove questions for this quiz
                      </small>
                    </div>
                  )}
                </>
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

      {/* Section Modal */}
      {showSectionModal && (
        <div className="modal-overlay" onClick={() => setShowSectionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSection ? 'Edit Section' : 'Create New Section'}</h2>
              <button className="modal-close" onClick={() => setShowSectionModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSectionSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="section-title">
                  Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="section-title"
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="section-description">Description</label>
                <textarea
                  id="section-description"
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowSectionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={18} />
                  <span>{editingSection ? 'Update' : 'Create'} Section</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Manager Modal */}
      {showQuestionManager && selectedContentForQuestions && (
        <QuestionManager
          contentID={selectedContentForQuestions.id}
          teacherID={currentUser.id}
          contentTitle={selectedContentForQuestions.title}
          onClose={() => {
            setShowQuestionManager(false);
            setSelectedContentForQuestions(null);
            fetchData(); // Refresh to show updated question count
          }}
        />
      )}
    </div>
  );
};

export default CourseContentManager;

