import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import communityService from '../../services/communityService';
import FileUpload from '../../components/Common/FileUpload';
import ImageGallery from '../../components/Common/ImageGallery';
import ReportPost from '../../components/Common/ReportPost';
import { Heart, MessageCircle, Send, Loader, AlertCircle, Bookmark, BookmarkCheck, X, Flag, MoreVertical, Edit2, Save, Trash2, Shield, AlertTriangle, CheckCircle, Settings, Plus } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './Community.css';
import '../Admin/AdminDashboard.css';

const ReportedPostRow = ({ report, onDecision, defaultAvatar, formatDate }) => {
  const [reason, setReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  const handleBlock = async () => {
    if (!reason.trim()) return;
    setBlocking(true);
    await onDecision(report.reportID, true, report.postID, reason);
    setBlocking(false);
  };

  return (
    <div className="card post-card" style={{ border: '2px solid #fee2e2' }}>
      <div className="post-header">
        <img src={defaultAvatar} alt={report.postAuthor || 'Author'} />
        <div className="post-header-info">
          <h4>{report.postAuthor || 'Unknown'}</h4>
          {report.community && <span className="post-community">{report.community}</span>}
          <span className="post-time">{formatDate(report.postDate)}</span>
        </div>
        <div className="post-header-actions">
          <span className="tag" style={{ background: '#fee2e2', color: '#ef4444', fontSize: '12px', padding: '4px 8px', borderRadius: '4px' }}>
            Reported
          </span>
        </div>
      </div>
      <div className="post-content">
        <p>{report.postText || 'No content'}</p>
        {/* Report Information */}
        <div style={{ marginTop: '1em', padding: '0.75em', background: '#fff5f5', borderRadius: '6px', fontSize: '0.9em' }}>
          <p style={{ margin: '0 0 0.5em', color: '#6b7280' }}>
            <strong>Reported by:</strong> {report.reporterName || 'Unknown'}
          </p>
          {report.reportType && (
            <p style={{ margin: '0 0 0.5em', color: '#6b7280' }}>
              <strong>Type:</strong> {report.reportType}
            </p>
          )}
          <p style={{ margin: 0, color: '#6b7280' }}>
            <strong>Reason:</strong> {report.reason || 'No reason provided'}
          </p>
        </div>
      </div>
      
      {/* Moderation Actions */}
      <div style={{ borderTop: '1px solid #fee2e2', padding: '1em' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <button
            className="ad-btn ad-btn--ghost ad-btn--sm"
            onClick={() => onDecision(report.reportID, false, report.postID, '')}
            title="Dismiss report"
            style={{ flex: '0 0 auto' }}
          >Dismiss</button>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <input
            className="ad-input"
            placeholder="Reason to block post…"
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ flex: 1, minWidth: '180px', fontSize: '13px', padding: '6px 10px' }}
          />
          <button
            className="ad-btn ad-btn--danger ad-btn--sm"
            onClick={handleBlock}
            disabled={!reason.trim() || blocking}
          >
            {blocking ? 'Blocking…' : 'Block Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Community = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Initialize from URL params or defaults
  const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const [selectedCommunity, setSelectedCommunity] = useState(() => searchParams.get('community') || '');

  // State for posts and communities
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const postsContainerRef = useRef(null);

  // State for creating new posts
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImages, setNewPostImages] = useState([]);
  const [hideIdentity, setHideIdentity] = useState(false);
  const [selectedPostCommunity, setSelectedPostCommunity] = useState('');

  // State for comments
  const [expandedComments, setExpandedComments] = useState({});
  const [postComments, setPostComments] = useState({});
  const [postCommentsLoadBlock, setPostCommentsLoadBlock] = useState({}); // Track loadBlock for each post
  const [postCommentsHasMore, setPostCommentsHasMore] = useState({}); // Track if more comments available
  const [newComment, setNewComment] = useState({});

  // State for image gallery
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  // State for report post modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState(null);

  // State for edit post
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostImages, setEditPostImages] = useState([]);
  const [editHideIdentity, setEditHideIdentity] = useState(false);
  const [editPostCommunity, setEditPostCommunity] = useState('');
  const [editMenuOpen, setEditMenuOpen] = useState(null); // Track which post's menu is open
  const [deletingPost, setDeletingPost] = useState(null); // Track which post is being deleted
  const [deletingComment, setDeletingComment] = useState(null); // Track which comment is being deleted

  // Admin moderation state
  const [blockPostTarget, setBlockPostTarget] = useState(null); // { id, reason }
  const [blockCommentTarget, setBlockCommentTarget] = useState(null); // { id, reason, postId }
  const [reportedPosts, setReportedPosts] = useState([]);
  const [reportedPostsOpen, setReportedPostsOpen] = useState(false);
  const [reportedPostsLoading, setReportedPostsLoading] = useState(false);
  const [modToast, setModToast] = useState(null);

  // Community management state (admin/supervisor)
  const [manageCommunityOpen, setManageCommunityOpen] = useState(false);
  const [allCommunities, setAllCommunities] = useState([]);
  const [allCommunitiesLoading, setAllCommunitiesLoading] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');
  const [newCommunityIcon, setNewCommunityIcon] = useState('');
  const [creatingCommunity, setCreatingCommunity] = useState(false);
  const [togglingCommunity, setTogglingCommunity] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loadingComments, setLoadingComments] = useState({});

  // Sync state from URL on mount
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    const urlCommunity = searchParams.get('community') || '';
    if (urlPage !== currentPage) setCurrentPage(urlPage);
    if (urlCommunity !== selectedCommunity) setSelectedCommunity(urlCommunity);
  }, []); // Only run on mount

  // Update URL when page or community changes (for infinite scroll tracking)
  useEffect(() => {
    const urlPage = searchParams.get('page');
    const urlCommunity = searchParams.get('community') || '';
    if (currentPage.toString() !== (urlPage || '1') || selectedCommunity !== urlCommunity) {
      const params = new URLSearchParams();
      if (currentPage > 1) params.set('page', currentPage.toString());
      if (selectedCommunity) params.set('community', selectedCommunity);
      setSearchParams(params, { replace: true });
    }
  }, [currentPage, selectedCommunity, setSearchParams, searchParams]);

  // Reset to page 1 and clear posts when community filter changes
  useEffect(() => {
    const urlCommunity = searchParams.get('community') || '';
    if (selectedCommunity !== urlCommunity && selectedCommunity !== '') {
      setCurrentPage(1);
      setPosts([]);
      setHasMorePosts(true);
    }
  }, [selectedCommunity]);

  // Load initial posts and communities on mount and when community changes
  useEffect(() => {
    fetchInitialData();
  }, [selectedCommunity]);

  // Update selected post community when filter changes
  useEffect(() => {
    if (communities.length > 0) {
      if (selectedCommunity) {
        // If a specific community is selected, use it
        setSelectedPostCommunity(selectedCommunity);
      } else {
        // If "All" is selected, default to first community
        setSelectedPostCommunity(communities[0]?.id || '');
      }
    }
  }, [selectedCommunity, communities]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setHasMorePosts(true);

      // Fetch communities and first page of posts in parallel
      const [communitiesData, postsData] = await Promise.all([
        communityService.getCommunityList().catch(() => []),
        communityService.getPostFeed({
          studentID: currentUser?.role === 'student' ? currentUser.id : undefined,
          teacherID: currentUser?.role === 'teacher' ? currentUser.id : undefined,
          communityID: selectedCommunity || undefined,
          loadBlock: 1
        }).catch((err) => {
          // Handle guest mode - return empty array if unauthorized
          if (err.isGuestMode) {
            return { data: [], pagination: { hasNextPage: false } };
          }
          throw err;
        })
      ]);

      setCommunities(Array.isArray(communitiesData) ? communitiesData : []);
      
      // Handle response format - could be array or object with data and pagination
      let postsArray = [];
      if (Array.isArray(postsData)) {
        postsArray = postsData;
      } else if (postsData.data) {
        postsArray = Array.isArray(postsData.data) ? postsData.data : [];
      } else {
        postsArray = [];
      }
      
      setPosts(postsArray);
      
      // Extract pagination metadata for infinite scroll
      if (postsData.pagination) {
        setHasMorePosts(postsData.pagination.hasNextPage || false);
      } else {
        // Fallback: if we got 15 posts (the limit), assume there might be more
        setHasMorePosts(postsArray.length === 15);
      }
      
      // Initialize comments from posts feed (latest 3 comments per post)
      const initialComments = {};
      const initialLoadBlocks = {};
      const initialHasMore = {};
      const initialExpanded = {};
      postsArray.forEach(post => {
        if (post.comments && Array.isArray(post.comments)) {
          initialComments[post.id] = post.comments;
          initialLoadBlocks[post.id] = 1; // Already loaded first 3 comments
          // Show "See More" if we have 3 comments and total is more than 3
          initialHasMore[post.id] = post.comments.length >= 3 && (post.commentsNumber || 0) > 3;
        } else {
          // Initialize empty array for posts with no comments
          initialComments[post.id] = [];
          initialLoadBlocks[post.id] = 1;
          initialHasMore[post.id] = false;
        }
        // Expand comments section by default for all posts
        initialExpanded[post.id] = true;
      });
      setPostComments(initialComments);
      setPostCommentsLoadBlock(initialLoadBlocks);
      setPostCommentsHasMore(initialHasMore);
      setExpandedComments(initialExpanded);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load community data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load more posts for infinite scroll
  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMorePosts) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const postsData = await communityService.getPostFeed({
        studentID: currentUser?.role === 'student' ? currentUser.id : undefined,
        teacherID: currentUser?.role === 'teacher' ? currentUser.id : undefined,
        communityID: selectedCommunity || undefined,
        loadBlock: nextPage
      }).catch((err) => {
        // Handle guest mode
        if (err.isGuestMode) {
          return { data: [], pagination: { hasNextPage: false } };
        }
        throw err;
      });
      
      // Handle response format
      let postsArray = [];
      if (Array.isArray(postsData)) {
        postsArray = postsData;
      } else if (postsData.data) {
        postsArray = Array.isArray(postsData.data) ? postsData.data : [];
      } else {
        postsArray = [];
      }
      
      // Append new posts to existing ones
      setPosts(prev => [...prev, ...postsArray]);
      setCurrentPage(nextPage);
      
      // Update hasMorePosts based on pagination metadata
      if (postsData.pagination) {
        setHasMorePosts(postsData.pagination.hasNextPage || false);
      } else {
        // Fallback: if we got 15 posts, assume there might be more
        setHasMorePosts(postsArray.length === 15);
      }
      
      // Initialize comments from new posts feed (latest 3 comments per post)
      const newComments = {};
      const newLoadBlocks = {};
      const newHasMore = {};
      const newExpanded = {};
      postsArray.forEach(post => {
        if (post.comments && Array.isArray(post.comments)) {
          newComments[post.id] = post.comments;
          newLoadBlocks[post.id] = 1;
          newHasMore[post.id] = post.comments.length >= 3 && (post.commentsNumber || 0) > 3;
        } else {
          newComments[post.id] = [];
          newLoadBlocks[post.id] = 1;
          newHasMore[post.id] = false;
        }
        newExpanded[post.id] = true;
      });
      setPostComments(prev => ({ ...prev, ...newComments }));
      setPostCommentsLoadBlock(prev => ({ ...prev, ...newLoadBlocks }));
      setPostCommentsHasMore(prev => ({ ...prev, ...newHasMore }));
      setExpandedComments(prev => ({ ...prev, ...newExpanded }));
    } catch (err) {
      console.error('Error loading more posts:', err);
      setError('Failed to load more posts.');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMorePosts, currentUser, currentPage, selectedCommunity]);

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMorePosts) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Load more when user is 200px from bottom
      if (scrollTop + windowHeight >= documentHeight - 200) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMorePosts, loadMorePosts]);

  const handleCommunityFilter = (communityID) => {
    setSelectedCommunity(communityID);
    // Posts will be reset and fetched by useEffect
  };

  const handleRemoveImage = (indexToRemove) => {
    setNewPostImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Students and teachers can create posts
    if (currentUser.role !== 'student' && currentUser.role !== 'teacher') {
      setError('Only students and teachers can create posts.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const postData = {
        studentID: currentUser.role === 'student' ? currentUser.id : undefined,
        teacherID: currentUser.role === 'teacher' ? currentUser.id : undefined,
        communityID: selectedPostCommunity || (communities[0]?.id || ''),
        mainText: newPostContent,
        date: new Date().toISOString(),
        hideIdentity: hideIdentity,
        attachedImages: newPostImages.map(img => ({
          name: img.name || 'image',
          link: img.url || img
        }))
      };

      await communityService.createPost(postData);

      // Refresh posts - reset to page 1 after creating new post
      setCurrentPage(1);
      setHasMorePosts(true);
      fetchInitialData();

      // Clear form
      setNewPostContent('');
      setNewPostImages([]);
      setHideIdentity(false);
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId, isLiked) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Admin cannot like posts
    if (isAdmin) return;

    try {
      const reactionData = {
        postID: postId,
        studentID: currentUser.role === 'student' ? currentUser.id : undefined,
        teacherID: currentUser.role === 'teacher' ? currentUser.id : undefined
      };

      if (isLiked) {
        await communityService.removePostReaction(reactionData);
      } else {
        await communityService.addPostReaction(reactionData);
      }

      // Update local state
      setPosts(posts.map(post =>
        post.id === postId
          ? {
              ...post,
              reactions: isLiked ? post.reactions - 1 : post.reactions + 1,
              likedByUser: !isLiked
            }
          : post
      ));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleSavePost = async (postId, isSaved) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'student' && currentUser.role !== 'teacher') return;
    
    // Admin cannot save posts
    if (isAdmin) return;

    try {
      if (isSaved) {
        await communityService.unsavePost(postId);
      } else {
        await communityService.savePost(postId);
      }

      // Update local state
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, saved: !isSaved }
          : post
      ));
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  const toggleComments = async (postId) => {
    const isExpanded = expandedComments[postId];

    setExpandedComments(prev => ({
      ...prev,
      [postId]: !isExpanded
    }));

    // Comments are already loaded from the feed (latest 3), so no need to fetch again
    // If comments are not in state but exist in post, initialize them
    if (!isExpanded && !postComments[postId]) {
      const post = posts.find(p => p.id === postId);
      if (post?.comments && Array.isArray(post.comments)) {
        setPostComments(prev => ({
          ...prev,
          [postId]: post.comments
        }));
        setPostCommentsLoadBlock(prev => ({ ...prev, [postId]: 1 }));
        setPostCommentsHasMore(prev => ({ 
          ...prev, 
          [postId]: post.comments.length >= 3 && (post.commentsNumber || 0) > 3
        }));
      } else {
        // Initialize empty array if no comments
        setPostComments(prev => ({
          ...prev,
          [postId]: []
        }));
        setPostCommentsLoadBlock(prev => ({ ...prev, [postId]: 1 }));
        setPostCommentsHasMore(prev => ({ 
          ...prev, 
          [postId]: false
        }));
      }
    }
  };

  const loadMoreComments = async (postId) => {
    if (loadingComments[postId] || !postCommentsHasMore[postId]) return;

    try {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      const currentLoadBlock = postCommentsLoadBlock[postId] || 1;
      const nextLoadBlock = currentLoadBlock + 1;
      const comments = await communityService.getComments(postId, nextLoadBlock);
      const commentsArray = Array.isArray(comments) ? comments : [];
      
      // Append new comments to existing ones
      const currentComments = postComments[postId] || [];
      const updatedComments = [...currentComments, ...commentsArray];
      
      setPostComments(prev => ({
        ...prev,
        [postId]: updatedComments
      }));
      
      // Get total comment count from post
      const post = posts.find(p => p.id === postId);
      const totalComments = post?.commentsNumber || 0;
      
      // Update loadBlock and hasMore
      // Backend returns 3 comments per page
      setPostCommentsLoadBlock(prev => ({ ...prev, [postId]: nextLoadBlock }));
      // Show "See More" only if fetched comments < total comments
      setPostCommentsHasMore(prev => ({ 
        ...prev, 
        [postId]: updatedComments.length < totalComments 
      }));
    } catch (err) {
      console.error('Error loading more comments:', err);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'student' && currentUser.role !== 'teacher') return;
    
    // Admin cannot add comments
    if (isAdmin) return;

    try {
      await communityService.addComment({
        studentID: currentUser.role === 'student' ? currentUser.id : undefined,
        teacherID: currentUser.role === 'teacher' ? currentUser.id : undefined,
        postID: postId,
        comment: commentText,
        date: new Date().toISOString()
      });

      // Update comment count in post (increment by 1)
      const updatedPost = posts.find(post => post.id === postId);
      const newTotalComments = (updatedPost?.commentsNumber || 0) + 1;
      
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, commentsNumber: newTotalComments }
          : post
      ));

      // Clear input
      setNewComment(prev => ({ ...prev, [postId]: '' }));

      // Refresh comments - fetch latest 3 comments from page 1
      try {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        
        const comments = await communityService.getComments(postId, 1);
        const commentsArray = Array.isArray(comments) ? comments : [];
        
        setPostComments(prev => ({
          ...prev,
          [postId]: commentsArray
        }));
        
        // Update loadBlock to 1 (first page with 3 comments)
        setPostCommentsLoadBlock(prev => ({ ...prev, [postId]: 1 }));
        
        // Show "See More" only if we have 3 comments and total is more than 3
        setPostCommentsHasMore(prev => ({ 
          ...prev, 
          [postId]: commentsArray.length >= 3 && newTotalComments > 3
        }));
      } catch (err) {
        console.error('Error refreshing comments:', err);
      } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const handleImageClick = (images, index) => {
    if (!images || images.length === 0) return;
    setGalleryImages(images);
    setGalleryInitialIndex(index);
    setGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setGalleryOpen(false);
    setGalleryImages([]);
    setGalleryInitialIndex(0);
  };

  const handleOpenReport = useCallback((postId) => {
    setReportingPostId(postId);
    setReportModalOpen(true);
  }, []);

  const handleCloseReport = useCallback(() => {
    setReportModalOpen(false);
    setReportingPostId(null);
  }, []);

  const handleReportPost = useCallback(async (reportData) => {
    try {
      await communityService.reportPost(reportData);
      
      // Remove the reported post from the feed immediately
      setPosts(prevPosts => prevPosts.filter(post => post.id !== reportData.postID));
      
      alert('Thank you for your report. Our moderation team will review it.');
      handleCloseReport();
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to submit report. Please try again.');
    }
  }, [handleCloseReport]);

  // Check if post belongs to current user
  const isMyPost = (post) => {
    if (!currentUser) return false;
    if (currentUser.role === 'student' && post.studentID === currentUser.id) return true;
    if (currentUser.role === 'teacher' && post.teacherID === currentUser.id) return true;
    return false;
  };

  // Check if comment belongs to current user
  const isMyComment = (comment) => {
    if (!currentUser) return false;
    if (currentUser.role === 'student' && comment.studentID === currentUser.id) return true;
    if (currentUser.role === 'teacher' && comment.teacherID === currentUser.id) return true;
    return false;
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const showModToast = (type, text) => {
    setModToast({ type, text });
    setTimeout(() => setModToast(null), 3500);
  };

  const fetchReportedPosts = async () => {
    setReportedPostsLoading(true);
    try {
      const r = await api.get('/admin/moderation/reported-posts');
      setReportedPosts(Array.isArray(r.data) ? r.data : []);
    } catch {
      showModToast('error', 'Failed to load reported posts.');
    } finally {
      setReportedPostsLoading(false);
    }
  };

  const handleToggleReportedPosts = () => {
    if (!reportedPostsOpen) fetchReportedPosts();
    setReportedPostsOpen(v => !v);
  };

  const handleAdminBlockPost = async (postId, reason) => {
    try {
      await api.delete('/admin/moderation/post', { data: { postID: postId, reason } });
      setPosts(prev => prev.filter(p => p.id !== postId));
      setBlockPostTarget(null);
      showModToast('success', 'Post blocked.');
    } catch {
      showModToast('error', 'Failed to block post.');
    }
  };

  const handleAdminBlockComment = async (commentId, postId, reason) => {
    try {
      await api.delete('/admin/moderation/post-comment', { data: { commentID: commentId, reason } });
      setPostComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
      }));
      setBlockCommentTarget(null);
      showModToast('success', 'Comment blocked.');
    } catch {
      showModToast('error', 'Failed to block comment.');
    }
  };

  const handlePostReportDecision = async (reportID, block, postID, reason) => {
    try {
      await api.post('/admin/moderation/post-report-decision', { reportID, block, reason: reason || '' });
      if (block) setPosts(prev => prev.filter(p => p.id !== postID));
      setReportedPosts(prev => prev.filter(r => r.reportID !== reportID));
      showModToast('success', block ? 'Post blocked.' : 'Report dismissed.');
    } catch {
      showModToast('error', 'Failed to process report.');
    }
  };

  // Community management handlers
  const fetchAllCommunities = async () => {
    setAllCommunitiesLoading(true);
    try {
      const r = await api.get('/admin/communities');
      setAllCommunities(Array.isArray(r.data) ? r.data : []);
    } catch {
      showModToast('error', 'Failed to load communities.');
    } finally {
      setAllCommunitiesLoading(false);
    }
  };

  const handleToggleManageCommunity = () => {
    if (!manageCommunityOpen) fetchAllCommunities();
    setManageCommunityOpen(v => !v);
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!newCommunityName.trim()) return;
    setCreatingCommunity(true);
    try {
      await api.post('/admin/new-community', {
        name: newCommunityName.trim(),
        description: newCommunityDesc.trim(),
        iconLink: newCommunityIcon.trim()
      });
      setNewCommunityName('');
      setNewCommunityDesc('');
      setNewCommunityIcon('');
      showModToast('success', 'Community created.');
      fetchAllCommunities();
      // Refresh the sidebar communities list
      const commData = await communityService.getCommunityList().catch(() => []);
      setCommunities(Array.isArray(commData) ? commData : []);
    } catch {
      showModToast('error', 'Failed to create community.');
    } finally {
      setCreatingCommunity(false);
    }
  };

  const handleToggleCommunityStatus = async (communityID, currentApproved) => {
    setTogglingCommunity(communityID);
    try {
      await api.post('/admin/community/toggle', { communityID, approved: !currentApproved });
      setAllCommunities(prev =>
        prev.map(c => c.id === communityID ? { ...c, approved: !currentApproved } : c)
      );
      showModToast('success', `Community ${!currentApproved ? 'activated' : 'deactivated'}.`);
      // Refresh the sidebar communities list
      const commData = await communityService.getCommunityList().catch(() => []);
      setCommunities(Array.isArray(commData) ? commData : []);
    } catch {
      showModToast('error', 'Failed to toggle community status.');
    } finally {
      setTogglingCommunity(null);
    }
  };

  const handleOpenEditMenu = (postId, e) => {
    e.stopPropagation();
    setEditMenuOpen(editMenuOpen === postId ? null : postId);
  };

  const handleCloseEditMenu = () => {
    setEditMenuOpen(null);
  };

  const handleStartEdit = (post) => {
    setEditingPost(post);
    setEditPostContent(post.mainText || '');
    setEditPostImages(post.images || []);
    setEditHideIdentity(post.hideIdentity || false);
    // Find community ID from communities list
    const community = communities.find(c => c.name === post.community);
    setEditPostCommunity(community?.id || '');
    setEditMenuOpen(null);
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditPostContent('');
    setEditPostImages([]);
    setEditHideIdentity(false);
    setEditPostCommunity('');
  };

  const handleSaveEdit = async () => {
    if (!editingPost || !editPostContent.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const postData = {
        postID: editingPost.id,
        studentID: currentUser.role === 'student' ? currentUser.id : undefined,
        teacherID: currentUser.role === 'teacher' ? currentUser.id : undefined,
        communityID: editPostCommunity || (communities[0]?.id || ''),
        mainText: editPostContent,
        hideIdentity: editHideIdentity,
        editDate: new Date().toISOString(),
        attachedImages: editPostImages.map(img => ({
          name: img.name || img.link?.split('/').pop() || 'image',
          link: img.link || img.url || img
        }))
      };

      await communityService.editPost(postData);

      // Refresh posts - stay on current page
      // Posts will be refreshed by useEffect
      fetchInitialData();

      // Close edit form
      handleCancelEdit();
      alert('Post updated successfully!');
    } catch (err) {
      console.error('Error updating post:', err);
      setError(err.message || 'Failed to update post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveEditImage = (indexToRemove) => {
    setEditPostImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDeletePost = async (postId) => {
    if (!currentUser) return;
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingPost(postId);
      setError(null);

      // Call delete API
      await communityService.deletePost({
        postID: postId,
        studentID: currentUser.role === 'student' ? currentUser.id : undefined,
        teacherID: currentUser.role === 'teacher' ? currentUser.id : undefined
      });

      // Remove post from local state
      setPosts(prev => prev.filter(post => post.id !== postId));
      
      // Clean up related state
      setPostComments(prev => {
        const newComments = { ...prev };
        delete newComments[postId];
        return newComments;
      });
      setPostCommentsLoadBlock(prev => {
        const newLoadBlocks = { ...prev };
        delete newLoadBlocks[postId];
        return newLoadBlocks;
      });
      setPostCommentsHasMore(prev => {
        const newHasMore = { ...prev };
        delete newHasMore[postId];
        return newHasMore;
      });
      setExpandedComments(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[postId];
        return newExpanded;
      });

      // Close menu
      setEditMenuOpen(null);
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Failed to delete post. Please try again.');
    } finally {
      setDeletingPost(null);
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!currentUser) return;
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingComment(commentId);
      setError(null);

      // Call delete API
      await communityService.deleteComment({
        commentID: commentId,
        studentID: currentUser.role === 'student' ? currentUser.id : undefined,
        teacherID: currentUser.role === 'teacher' ? currentUser.id : undefined
      });

      // Update comment count in post (decrement by 1)
      const updatedPost = posts.find(post => post.id === postId);
      const newTotalComments = Math.max(0, (updatedPost?.commentsNumber || 0) - 1);
      
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, commentsNumber: newTotalComments }
          : post
      ));

      // Refetch the current page of comments
      try {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        
        // Get the current loadBlock for this post (default to 1 if not set)
        const currentLoadBlock = postCommentsLoadBlock[postId] || 1;
        
        // Refetch the current page
        const comments = await communityService.getComments(postId, currentLoadBlock);
        const commentsArray = Array.isArray(comments) ? comments : [];
        
        // Update comments based on current page
        if (currentLoadBlock === 1) {
          // If on page 1, replace all comments
          setPostComments(prev => ({
            ...prev,
            [postId]: commentsArray
          }));
        } else {
          // If on page 2 or later, keep previous pages and replace only current page
          const currentComments = postComments[postId] || [];
          // Previous pages have (currentLoadBlock - 1) * 3 comments
          const previousPagesCount = (currentLoadBlock - 1) * 3;
          const previousPagesComments = currentComments.slice(0, previousPagesCount);
          // Replace with previous pages + refetched current page
          setPostComments(prev => ({
            ...prev,
            [postId]: [...previousPagesComments, ...commentsArray]
          }));
        }
        
        // Update hasMore based on new total
        // Backend returns 3 comments per page
        // Show "See More" only if we have 3 comments and total is more than what we've loaded
        const loadedCommentsCount = currentLoadBlock * 3;
        setPostCommentsHasMore(prev => ({ 
          ...prev, 
          [postId]: commentsArray.length >= 3 && newTotalComments > loadedCommentsCount
        }));
      } catch (err) {
        console.error('Error refreshing comments after deletion:', err);
      } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err.response?.data?.message || 'Failed to delete comment. Please try again.');
      alert(err.response?.data?.message || 'Failed to delete comment. Please try again.');
    } finally {
      setDeletingComment(null);
    }
  };

  // Loading state
  if (loading && posts.length === 0) {
    return (
      <div className="container community-page">
        <div className="loading-container">
          <Loader className="spinner" size={48} />
          <p>Loading community...</p>
        </div>
      </div>
    );
  }

  const defaultAvatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%236366f1'/%3E%3Ccircle cx='20' cy='15' r='7' fill='white'/%3E%3Cellipse cx='20' cy='33' rx='12' ry='9' fill='white'/%3E%3C/svg%3E`;

  return (
    <div className="container community-page">
      {/* Admin moderation toast */}
      {modToast && (
        <div className={`ad-toast ${modToast.type === 'success' ? 'ad-toast--ok' : 'ad-toast--err'}`} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
          {modToast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{modToast.text}</span>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1>Community</h1>
            <p>Connect, share, and learn together</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isAdmin && (
              <button
                onClick={handleToggleManageCommunity}
                className="saved-posts-icon-btn"
                title="Manage Communities"
                aria-label="Manage Communities"
                style={{ background: manageCommunityOpen ? '#6366f1' : undefined }}
              >
                <Settings size={22} color="white" strokeWidth={2.5} />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={handleToggleReportedPosts}
                className="saved-posts-icon-btn"
                title="Reported Posts"
                aria-label="Reported Posts"
                style={{ background: reportedPostsOpen ? '#ef4444' : undefined }}
              >
                <Flag size={22} color="white" strokeWidth={2.5} />
              </button>
            )}
            {currentUser && !isAdmin && (
              <button
                onClick={() => navigate('/saved-posts')}
                className="saved-posts-icon-btn"
                title="View Saved Posts"
                aria-label="View Saved Posts"
              >
                <BookmarkCheck size={24} color="white" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reported Posts Section (admin/supervisor only) */}
      {isAdmin && reportedPostsOpen && (
        <div className="posts-section" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
              <Flag size={20} /> Reported Posts
            </h2>
            <button onClick={() => setReportedPostsOpen(false)} className="close-btn"><X size={18} /></button>
          </div>
          {reportedPostsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader className="spinner" size={32} />
            </div>
          ) : reportedPosts.length === 0 ? (
            <div className="empty-state">
              <h3>No reported posts</h3>
              <p>No unreviewed reports at this time.</p>
            </div>
          ) : (
            <div className="posts-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reportedPosts.map(r => (
                <ReportedPostRow 
                  key={r.reportID} 
                  report={r} 
                  onDecision={handlePostReportDecision}
                  defaultAvatar={defaultAvatar}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Community Management Panel (admin/supervisor only) */}
      {isAdmin && manageCommunityOpen && (
        <div className="card" style={{ marginBottom: '16px', border: '2px solid #6366f1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1' }}>
              <Settings size={18} /> Manage Communities
            </h3>
            <button onClick={() => setManageCommunityOpen(false)} className="close-btn"><X size={18} /></button>
          </div>

          {/* Create Community Form */}
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
            <h4 style={{ margin: '0 0 12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Create New Community</h4>
            <form onSubmit={handleCreateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                className="ad-input"
                placeholder="Community name *"
                value={newCommunityName}
                onChange={e => setNewCommunityName(e.target.value)}
                required
              />
              <input
                className="ad-input"
                placeholder="Description (optional)"
                value={newCommunityDesc}
                onChange={e => setNewCommunityDesc(e.target.value)}
              />
              <input
                className="ad-input"
                placeholder="Icon URL (optional)"
                value={newCommunityIcon}
                onChange={e => setNewCommunityIcon(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="ad-btn ad-btn--primary ad-btn--sm"
                  disabled={!newCommunityName.trim() || creatingCommunity}
                >
                  {creatingCommunity ? 'Creating…' : <><Plus size={14} style={{ display: 'inline', marginRight: '4px' }} />Create Community</>}
                </button>
              </div>
            </form>
          </div>

          {/* All Communities List */}
          <h4 style={{ margin: '0 0 12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>All Communities</h4>
          {allCommunitiesLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
              <Loader className="spinner" size={20} /> Loading…
            </div>
          ) : allCommunities.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No communities found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {allCommunities.map(community => (
                <div
                  key={community.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: '8px',
                    background: community.approved ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${community.approved ? '#bbf7d0' : '#fecaca'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {community.icon && (
                      <img src={community.icon} alt={community.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#374151' }}>{community.name}</p>
                      {community.description && <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{community.description}</p>}
                      <span style={{ fontSize: '11px', color: community.approved ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                        {community.approved ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <button
                    className={`ad-btn ad-btn--sm ${community.approved ? 'ad-btn--danger' : 'ad-btn--success'}`}
                    onClick={() => handleToggleCommunityStatus(community.id, community.approved)}
                    disabled={togglingCommunity === community.id}
                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {togglingCommunity === community.id ? 'Saving…' : community.approved ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="community-content">
        <div className="posts-section">
          {/* Community Filter */}
          {communities.length > 0 && (
            <div className="community-filter">
              <button
                className={`filter-btn ${selectedCommunity === '' ? 'active' : ''}`}
                onClick={() => handleCommunityFilter('')}
              >
                All
              </button>
              {communities.map(community => (
                <button
                  key={community.id}
                  className={`filter-btn ${selectedCommunity === community.id ? 'active' : ''}`}
                  onClick={() => handleCommunityFilter(community.id)}
                >
                  {community.name}
                </button>
              ))}
            </div>
          )}

          {/* Create Post Form - For students and teachers */}
          {currentUser && (currentUser.role === 'student' || currentUser.role === 'teacher') && (
            <div className="card create-post">
              <div className="create-post-header">
                <img src={currentUser.profileImage || currentUser.avatar || defaultAvatar} alt={currentUser.name} />
                <h3>What's on your mind, {currentUser.name}?</h3>
              </div>
              <form onSubmit={handleCreatePost}>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your thoughts, ideas, or questions..."
                  rows="4"
                  maxLength={1000}
                  disabled={submitting}
                />
                {newPostImages.length > 0 && (
                  <div className="post-images-preview">
                    {newPostImages.map((file, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={file.url || file} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="remove-image-btn"
                          aria-label="Remove image"
                        >
                          <X size={20} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="create-post-options">
                  {communities.length > 0 && (
                    <div className="community-select-wrapper">
                      <label htmlFor="post-community-select" className="community-select-label">
                        Community:
                      </label>
                      <select
                        id="post-community-select"
                        value={selectedPostCommunity}
                        onChange={(e) => setSelectedPostCommunity(e.target.value)}
                        disabled={submitting}
                        className="community-select"
                      >
                        {communities.map(community => (
                          <option key={community.id} value={community.id}>
                            {community.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={hideIdentity}
                      onChange={(e) => setHideIdentity(e.target.checked)}
                      disabled={submitting}
                    />
                    Post anonymously
                  </label>
                </div>
                <div className="create-post-actions">
                  <FileUpload
                    uploadType="file"
                    accept="image/*"
                    multiple={true}
                    maxSize={5}
                    label="Upload Images"
                    onUploadComplete={(files) => {
                      if (Array.isArray(files)) {
                        setNewPostImages(prev => [...prev, ...files]);
                      } else if (files) {
                        setNewPostImages(prev => [...prev, files]);
                      }
                    }}
                    showPreview={false}
                    className="upload-button-inline"
                  />
                  <button type="submit" disabled={submitting || !newPostContent.trim()}>
                    {submitting ? <Loader className="spinner" size={18} /> : <Send size={18} />}
                    {submitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Posts List */}
          <div className="posts-list" ref={postsContainerRef}>
            {posts.length === 0 ? (
              <div className="no-posts">
                <p>No posts yet. Be the first to share something!</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="card post-card">
                  <div className="post-header">
                    <img
                      src={post.hideIdentity ? defaultAvatar : (post.userProfileImage || defaultAvatar)}
                      alt={post.hideIdentity ? 'Anonymous' : post.userName}
                    />
                    <div className="post-header-info">
                      <h4>{post.hideIdentity ? 'Anonymous' : post.userName}</h4>
                      {post.community && <span className="post-community">{post.community}</span>}
                      <span className="post-time">{formatDate(post.date)}</span>
                      {post.edited ? <span className="post-edited">(edited)</span>:""}
                    </div>
                    <div className="post-header-actions">
                      {isMyPost(post) && (
                        <div className="post-menu-wrapper">
                          <button
                            className="post-menu-btn"
                            onClick={(e) => handleOpenEditMenu(post.id, e)}
                            aria-label="Post options"
                            title="Post options"
                          >
                            <MoreVertical size={18} color="currentColor" strokeWidth={2.5} />
                          </button>
                          {editMenuOpen === post.id && (
                            <>
                              <div className="post-menu-overlay" onClick={handleCloseEditMenu}></div>
                              <div className="post-menu-dropdown">
                                <button
                                  onClick={() => handleStartEdit(post)}
                                  className="post-menu-item"
                                >
                                  <Edit2 size={16} />
                                  <span>Edit Post</span>
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="post-menu-item delete-post-item"
                                  disabled={deletingPost === post.id}
                                >
                                  {deletingPost === post.id ? (
                                    <Loader size={16} className="spinner" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                  <span>Delete Post</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {!isMyPost(post) && !isAdmin && (
                        <button
                          className="post-report-btn"
                          onClick={() => handleOpenReport(post.id)}
                          aria-label="Report post"
                          title="Report post"
                        >
                          <Flag size={18} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          className="post-report-btn"
                          onClick={() => setBlockPostTarget(blockPostTarget?.id === post.id ? null : { id: post.id, reason: '' })}
                          aria-label="Block post"
                          title="Block post (admin)"
                          style={{ color: '#ef4444' }}
                        >
                          <Shield size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="post-content">
                    <p>{post.mainText}</p>
                    {post.images && post.images.length > 0 && (
                      <div className={`post-images ${post.images.length === 1 ? 'single-image' : 'multiple-images'}`}>
                        {post.images.length === 1 ? (
                          <div 
                            className="post-image-wrapper single"
                            onClick={() => handleImageClick(post.images, 0)}
                          >
                            <img 
                              src={post.images[0].link} 
                              alt={post.images[0].name || 'Post image'} 
                              className="post-image" 
                            />
                          </div>
                        ) : (
                          <div className="post-images-grid">
                            {post.images.slice(0, 4).map((img, idx) => (
                              <div
                                key={idx}
                                className={`post-image-wrapper ${idx === 3 && post.images.length > 4 ? 'has-more' : ''}`}
                                onClick={() => handleImageClick(post.images, idx)}
                              >
                                <img 
                                  src={img.link} 
                                  alt={img.name || `Post image ${idx + 1}`} 
                                  className="post-image" 
                                />
                                {idx === 3 && post.images.length > 4 && (
                                  <div className="image-more-overlay">
                                    <span>+{post.images.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="post-stats">
                    <span>{post.views || 0} views</span>
                  </div>

                  {/* Admin inline block post */}
                  {isAdmin && blockPostTarget?.id === post.id && (
                    <div className="ad-inline-action" style={{ margin: '8px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        className="ad-input"
                        placeholder="Reason for blocking…"
                        value={blockPostTarget.reason}
                        onChange={e => setBlockPostTarget(x => ({ ...x, reason: e.target.value }))}
                        style={{ flex: 1, minWidth: '180px' }}
                      />
                      <button
                        className="ad-btn ad-btn--danger ad-btn--sm"
                        onClick={() => handleAdminBlockPost(post.id, blockPostTarget.reason)}
                        disabled={!blockPostTarget.reason.trim()}
                      >
                        Confirm Block
                      </button>
                      <button
                        className="ad-btn ad-btn--ghost ad-btn--sm"
                        onClick={() => setBlockPostTarget(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="post-actions">
                    {!isAdmin && (
                      <button
                        onClick={() => handleLike(post.id, post.likedByUser)}
                        className={`action-btn ${post.likedByUser ? 'liked' : ''}`}
                      >
                        <Heart size={18} fill={post.likedByUser ? 'currentColor' : 'none'} />
                        <span>{post.reactions || 0} Likes</span>
                      </button>
                    )}
                    {isAdmin && (
                      <div className="action-btn" style={{ cursor: 'default', opacity: 0.6 }}>
                        <Heart size={18} fill="none" />
                        <span>{post.reactions || 0} Likes</span>
                      </div>
                    )}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="action-btn"
                    >
                      <MessageCircle size={18} />
                      <span>{post.commentsNumber || 0} Comments</span>
                    </button>
                    {(currentUser && (currentUser.role === 'student' || currentUser.role === 'teacher') && !isAdmin) && (
                      <button
                        onClick={() => handleSavePost(post.id, post.saved)}
                        className={`action-btn ${post.saved ? 'saved' : ''}`}
                      >
                        {post.saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        <span>{post.saved ? 'Saved' : 'Save'}</span>
                      </button>
                    )}
                  </div>

                  {/* Comments Section */}
                  {expandedComments[post.id] && (
                    <div className="comments-section">
                      {loadingComments[post.id] && !postComments[post.id] ? (
                        <div className="loading-comments">
                          <Loader className="spinner" size={20} />
                          <span>Loading comments...</span>
                        </div>
                      ) : (
                        <>
                          {postComments[post.id]?.map(comment => (
                            <div key={comment.id} className="comment">
                              <img
                                src={comment.userProfileImage || defaultAvatar}
                                alt={comment.userName}
                              />
                              <div className="comment-content">
                                <div className="comment-header">
                                  <div>
                                    <strong>{comment.userName}</strong>
                                    <span className="comment-time">{formatDate(comment.date)}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    {isMyComment(comment) && (
                                      <button
                                        onClick={() => handleDeleteComment(comment.id, post.id)}
                                        disabled={deletingComment === comment.id}
                                        className="comment-delete-btn"
                                        aria-label="Delete comment"
                                      >
                                        {deletingComment === comment.id ? (
                                          <Loader className="spinner" size={14} />
                                        ) : (
                                          <Trash2 size={14} />
                                        )}
                                      </button>
                                    )}
                                    {isAdmin && (
                                      <button
                                        onClick={() => setBlockCommentTarget(
                                          blockCommentTarget?.id === comment.id ? null : { id: comment.id, postId: post.id, reason: '' }
                                        )}
                                        className="comment-delete-btn"
                                        aria-label="Block comment"
                                        title="Block comment (admin)"
                                        style={{ color: '#ef4444' }}
                                      >
                                        <Shield size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {isAdmin && blockCommentTarget?.id === comment.id && (
                                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                    <input
                                      className="ad-input"
                                      placeholder="Reason…"
                                      value={blockCommentTarget.reason}
                                      onChange={e => setBlockCommentTarget(x => ({ ...x, reason: e.target.value }))}
                                      style={{ flex: 1, minWidth: '140px', fontSize: '13px', padding: '4px 8px' }}
                                    />
                                    <button
                                      className="ad-btn ad-btn--danger ad-btn--sm"
                                      onClick={() => handleAdminBlockComment(comment.id, post.id, blockCommentTarget.reason)}
                                      disabled={!blockCommentTarget.reason.trim()}
                                    >Block</button>
                                    <button
                                      className="ad-btn ad-btn--ghost ad-btn--sm"
                                      onClick={() => setBlockCommentTarget(null)}
                                    >Cancel</button>
                                  </div>
                                )}
                                <p>{comment.comment}</p>
                              </div>
                            </div>
                          ))}

                          {/* See More Comments Button */}
                          {postCommentsHasMore[post.id] && (
                            <div className="load-more-comments">
                              <button
                                onClick={() => loadMoreComments(post.id)}
                                disabled={loadingComments[post.id]}
                                className="see-more-comments-btn"
                              >
                                {loadingComments[post.id] ? (
                                  <>
                                    <Loader className="spinner" size={16} />
                                    Loading...
                                  </>
                                ) : (
                                  'See More Comments'
                                )}
                              </button>
                            </div>
                          )}

                          {/* Add Comment Form - For students and teachers (not admin) */}
                          {currentUser && (currentUser.role === 'student' || currentUser.role === 'teacher') && !isAdmin && (
                            <div className="add-comment">
                              <input
                                type="text"
                                value={newComment[post.id] || ''}
                                onChange={(e) => setNewComment(prev => ({
                                  ...prev,
                                  [post.id]: e.target.value
                                }))}
                                placeholder="Write a comment..."
                                maxLength={500}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddComment(post.id);
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!newComment[post.id]?.trim()}
                                aria-label="Send comment"
                              >
                                <Send size={20} strokeWidth={2.5} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Infinite scroll loading indicator */}
          {loadingMore && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Loader className="spinner" size={32} />
            </div>
          )}
          
          {!hasMorePosts && posts.length > 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
              <p>No more posts to load</p>
            </div>
          )}
        </div>

        <div className="community-sidebar">
          <div className="card">
            <h3>Community Guidelines</h3>
            <ul className="guidelines-list">
              <li>Be respectful and kind to others</li>
              <li>Share knowledge and help fellow learners</li>
              <li>Stay on topic and avoid spam</li>
              <li>Respect privacy and confidentiality</li>
              <li>Report inappropriate content</li>
            </ul>
          </div>

          {communities.length > 0 && (
            <div className="card">
              <h3>Communities</h3>
              <div className="communities-list">
                {communities.map(community => (
                  <div
                    key={community.id}
                    className={`community-item ${selectedCommunity === community.id ? 'active' : ''}`}
                    onClick={() => handleCommunityFilter(community.id)}
                  >
                    {community.icon && <img src={community.icon} alt={community.name} />}
                    <div>
                      <strong>{community.name}</strong>
                      {community.description && <span>{community.description}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ImageGallery
        images={galleryImages}
        isOpen={galleryOpen}
        onClose={handleCloseGallery}
        initialIndex={galleryInitialIndex}
      />

      <ReportPost
        isOpen={reportModalOpen}
        onClose={handleCloseReport}
        onReport={handleReportPost}
        postId={reportingPostId}
      />

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="edit-post-modal-overlay" onClick={handleCancelEdit}>
          <div className="edit-post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-post-header">
              <h2>Edit Post</h2>
              <button onClick={handleCancelEdit} className="close-btn" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="edit-post-content">
              <textarea
                value={editPostContent}
                onChange={(e) => setEditPostContent(e.target.value)}
                placeholder="What's on your mind?"
                rows="4"
                maxLength={1000}
                disabled={submitting}
              />
              {editPostImages.length > 0 && (
                <div className="post-images-preview">
                  {editPostImages.map((img, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={img.link || img.url || img} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => handleRemoveEditImage(index)}
                        className="remove-image-btn"
                        aria-label="Remove image"
                      >
                        <X size={20} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="edit-post-options">
                {communities.length > 0 && (
                  <div className="community-select-wrapper">
                    <label htmlFor="edit-post-community-select" className="community-select-label">
                      Community:
                    </label>
                    <select
                      id="edit-post-community-select"
                      value={editPostCommunity}
                      onChange={(e) => setEditPostCommunity(e.target.value)}
                      disabled={submitting}
                      className="community-select"
                    >
                      {communities.map(community => (
                        <option key={community.id} value={community.id}>
                          {community.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editHideIdentity}
                    onChange={(e) => setEditHideIdentity(e.target.checked)}
                    disabled={submitting}
                  />
                  Post anonymously
                </label>
              </div>
              <div className="edit-post-actions">
                <FileUpload
                  uploadType="file"
                  accept="image/*"
                  multiple={true}
                  maxSize={5}
                  label="Add Images"
                  onUploadComplete={(files) => {
                    if (Array.isArray(files)) {
                      setEditPostImages(prev => [...prev, ...files]);
                    } else if (files) {
                      setEditPostImages(prev => [...prev, files]);
                    }
                  }}
                  showPreview={false}
                  className="upload-button-inline"
                />
                <button
                  onClick={handleCancelEdit}
                  className="secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={submitting || !editPostContent.trim()}
                >
                  {submitting ? <Loader className="spinner" size={18} /> : <Save size={18} />}
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
