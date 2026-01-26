import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import communityService from '../../services/communityService';
import FileUpload from '../../components/Common/FileUpload';
import ImageGallery from '../../components/Common/ImageGallery';
import ReportPost from '../../components/Common/ReportPost';
import { Heart, MessageCircle, Image, Send, Loader, AlertCircle, Bookmark, BookmarkCheck, X, Flag, MoreVertical, Edit2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Community.css';

const Community = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State for posts and communities
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState('');

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

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loadingComments, setLoadingComments] = useState({});

  // Load posts and communities on mount
  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

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

      // Fetch communities and posts in parallel
      const [communitiesData, postsData] = await Promise.all([
        communityService.getCommunityList().catch(() => []),
        communityService.getPostFeed({
          studentID: currentUser.role === 'student' ? currentUser.id : undefined,
          teacherID: currentUser.role === 'teacher' ? currentUser.id : undefined,
          loadBlock: 1
        })
      ]);

      setCommunities(Array.isArray(communitiesData) ? communitiesData : []);
      const postsArray = Array.isArray(postsData) ? postsData : [];
      setPosts(postsArray);
      
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

  const fetchPosts = async (communityID = null) => {
    try {
      setLoading(true);
      const postsData = await communityService.getPostFeed({
        studentID: currentUser.role === 'student' ? currentUser.id : undefined,
        teacherID: currentUser.role === 'teacher' ? currentUser.id : undefined,
        communityID: communityID || undefined,
        loadBlock: 1
      });
      const postsArray = Array.isArray(postsData) ? postsData : [];
      setPosts(postsArray);
      
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
      setPostComments(prev => ({ ...prev, ...initialComments }));
      setPostCommentsLoadBlock(prev => ({ ...prev, ...initialLoadBlocks }));
      setPostCommentsHasMore(prev => ({ ...prev, ...initialHasMore }));
      setExpandedComments(prev => ({ ...prev, ...initialExpanded }));
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityFilter = (communityID) => {
    setSelectedCommunity(communityID);
    fetchPosts(communityID);
  };

  const handleRemoveImage = (indexToRemove) => {
    setNewPostImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() || !currentUser) return;

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

      // Refresh posts
      await fetchPosts(selectedCommunity);

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
    if (!currentUser) return;

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
    if (!currentUser || (currentUser.role !== 'student' && currentUser.role !== 'teacher')) return;

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
    if (!commentText?.trim() || !currentUser || (currentUser.role !== 'student' && currentUser.role !== 'teacher')) return;

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

      // Refresh posts
      await fetchPosts(selectedCommunity);

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

  return (
    <div className="container community-page">
      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1>Community</h1>
            <p>Connect, share, and learn together</p>
          </div>
          {currentUser && (
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
                <img src={currentUser.profileImage || currentUser.avatar || '/default-avatar.png'} alt={currentUser.name} />
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
          <div className="posts-list">
            {posts.length === 0 ? (
              <div className="no-posts">
                <p>No posts yet. Be the first to share something!</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="card post-card">
                  <div className="post-header">
                    <img
                      src={post.hideIdentity ? '/anonymous-avatar.png' : (post.userProfileImage || '/default-avatar.png')}
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
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {!isMyPost(post) && (
                        <button
                          className="post-report-btn"
                          onClick={() => handleOpenReport(post.id)}
                          aria-label="Report post"
                          title="Report post"
                        >
                          <Flag size={18} />
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
                  <div className="post-actions">
                    <button
                      onClick={() => handleLike(post.id, post.likedByUser)}
                      className={`action-btn ${post.likedByUser ? 'liked' : ''}`}
                    >
                      <Heart size={18} fill={post.likedByUser ? 'currentColor' : 'none'} />
                      <span>{post.reactions || 0} Likes</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="action-btn"
                    >
                      <MessageCircle size={18} />
                      <span>{post.commentsNumber || 0} Comments</span>
                    </button>
                    {(currentUser && (currentUser.role === 'student' || currentUser.role === 'teacher')) && (
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
                                src={comment.userProfileImage || '/default-avatar.png'}
                                alt={comment.userName}
                              />
                              <div className="comment-content">
                                <strong>{comment.userName}</strong>
                                <p>{comment.comment}</p>
                                <span className="comment-time">{formatDate(comment.date)}</span>
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

                          {/* Add Comment Form - For students and teachers */}
                          {currentUser && (currentUser.role === 'student' || currentUser.role === 'teacher') && (
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
