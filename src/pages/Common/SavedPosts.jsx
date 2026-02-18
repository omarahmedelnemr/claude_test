import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import communityService from '../../services/communityService';
import ImageGallery from '../../components/Common/ImageGallery';
import ReportPost from '../../components/Common/ReportPost';
import { Heart, MessageCircle, Send, Loader, BookmarkCheck, Flag } from 'lucide-react';
import './Community.css';

const SavedPosts = () => {
  const { currentUser } = useAuth();

  // State for posts
  const [posts, setPosts] = useState([]);
  const [loadBlock, setLoadBlock] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [loadingComments, setLoadingComments] = useState({});

  // Load saved posts on mount
  useEffect(() => {
    if (currentUser) {
      fetchSavedPosts(1, true);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchSavedPosts = async (block = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPosts([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const postsData = await communityService.getSavedPosts(block);
      
      if (Array.isArray(postsData)) {
        if (reset) {
          setPosts(postsData);
        } else {
          setPosts(prev => [...prev, ...postsData]);
        }
        setHasMore(postsData.length === 15); // Assuming 15 posts per page
        setLoadBlock(block);
      } else {
        setPosts([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching saved posts:', err);
      setError('Failed to load saved posts. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (!loadingMore && hasMore) {
      fetchSavedPosts(loadBlock + 1, false);
    }
  };

  const handleLike = async (postId, isLiked) => {
    if (!currentUser) return;

    try {
      const reactionData = {
        postID: postId,
        studentID: currentUser.role === 'student' ? currentUser.id : undefined,
        teacherID: currentUser.role === 'teacher' ? currentUser.id : undefined,
        parentID: currentUser.role === 'parent' ? currentUser.id : undefined
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

  const handleUnsavePost = async (postId) => {
    if (!currentUser) return;

    try {
      await communityService.unsavePost(postId);
      // Remove post from list
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error unsaving post:', err);
      alert('Failed to unsave post. Please try again.');
    }
  };

  const toggleComments = async (postId) => {
    const isExpanded = expandedComments[postId];

    setExpandedComments(prev => ({
      ...prev,
      [postId]: !isExpanded
    }));

    if (!isExpanded && !postComments[postId]) {
      try {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        const comments = await communityService.getComments(postId, 1);
        const commentsArray = Array.isArray(comments) ? comments : [];
        setPostComments(prev => ({
          ...prev,
          [postId]: commentsArray
        }));
        setPostCommentsLoadBlock(prev => ({ ...prev, [postId]: 1 }));
        setPostCommentsHasMore(prev => ({ 
          ...prev, 
          [postId]: commentsArray.length >= 3 && (posts.find(p => p.id === postId)?.commentsNumber || 0) > 3
        }));
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
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
      
      const currentComments = postComments[postId] || [];
      const updatedComments = [...currentComments, ...commentsArray];
      
      setPostComments(prev => ({
        ...prev,
        [postId]: updatedComments
      }));
      
      const post = posts.find(p => p.id === postId);
      const totalComments = post?.commentsNumber || 0;
      
      setPostCommentsLoadBlock(prev => ({ ...prev, [postId]: nextLoadBlock }));
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

      const updatedPost = posts.find(post => post.id === postId);
      const newTotalComments = (updatedPost?.commentsNumber || 0) + 1;
      
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, commentsNumber: newTotalComments }
          : post
      ));

      setNewComment(prev => ({ ...prev, [postId]: '' }));

      try {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        const comments = await communityService.getComments(postId, 1);
        const commentsArray = Array.isArray(comments) ? comments : [];
        setPostComments(prev => ({
          ...prev,
          [postId]: commentsArray
        }));
        setPostCommentsLoadBlock(prev => ({ ...prev, [postId]: 1 }));
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
      setPosts(prevPosts => prevPosts.filter(post => post.id !== reportData.postID));
      alert('Thank you for your report. Our moderation team will review it.');
      handleCloseReport();
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to submit report. Please try again.');
    }
  }, [handleCloseReport]);

  const defaultAvatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%236366f1'/%3E%3Ccircle cx='20' cy='15' r='7' fill='white'/%3E%3Cellipse cx='20' cy='33' rx='12' ry='9' fill='white'/%3E%3C/svg%3E`;

  if (!currentUser) {
    return (
      <div className="container community-page">
        <div className="empty-state">
          <p>Please log in to view your saved posts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container community-page">
      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1>My Saved Posts</h1>
            <p>Posts you've saved for later</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="posts-section">
        <div className="posts-list">
          {loading && posts.length === 0 ? (
            <div className="loading-container">
              <Loader className="spinner" size={48} />
              <span>Loading saved posts...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="no-posts">
              <p>No saved posts yet.</p>
            </div>
          ) : (
            <>
              {posts.map(post => (
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
                    </div>
                    <div className="post-header-actions">
                      <button
                        onClick={() => handleUnsavePost(post.id)}
                        className="post-report-btn"
                        title="Unsave post"
                        aria-label="Unsave post"
                      >
                        <BookmarkCheck size={18} fill="currentColor" />
                      </button>
                      <button
                        className="post-report-btn"
                        onClick={() => handleOpenReport(post.id)}
                        aria-label="Report post"
                        title="Report post"
                      >
                        <Flag size={18} />
                      </button>
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
                                </div>
                                <p>{comment.comment}</p>
                              </div>
                            </div>
                          ))}

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
              ))}
              
              {hasMore && (
                <div className="load-more-container">
                  <button
                    onClick={loadMorePosts}
                    disabled={loadingMore}
                    className="load-more-btn"
                  >
                    {loadingMore ? (
                      <>
                        <Loader className="spinner" size={18} />
                        Loading...
                      </>
                    ) : (
                      'Load More Posts'
                    )}
                  </button>
                </div>
              )}
            </>
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
    </div>
  );
};

export default SavedPosts;

