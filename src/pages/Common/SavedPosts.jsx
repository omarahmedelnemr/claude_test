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

      // Remove from local state
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error unsaving post:', err);
      setError('Failed to unsave post. Please try again.');
    }
  };

  const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments(prev => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
    } else {
      setExpandedComments(prev => ({ ...prev, [postId]: true }));
      if (!postComments[postId]) {
        try {
          setLoadingComments(prev => ({ ...prev, [postId]: true }));
          const comments = await communityService.getComments(postId, 1);
          const commentsArray = Array.isArray(comments) ? comments : [];
          
          // Get total comment count from post
          const post = posts.find(p => p.id === postId);
          const totalComments = post?.commentsNumber || 0;
          
          setPostComments(prev => ({ ...prev, [postId]: commentsArray }));
          // Backend returns 2 comments per page
          setPostCommentsLoadBlock(prev => ({ ...prev, [postId]: 1 }));
          // Show "See More" only if fetched comments < total comments
          setPostCommentsHasMore(prev => ({ 
            ...prev, 
            [postId]: commentsArray.length < totalComments 
          }));
        } catch (err) {
          console.error('Error fetching comments:', err);
        } finally {
          setLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
      }
    }
  };

  const handleAddComment = async (postId) => {
    if (!currentUser || !newComment[postId]?.trim() || (currentUser.role !== 'student' && currentUser.role !== 'teacher')) return;

    try {
      const commentData = {
        studentID: currentUser.role === 'student' ? currentUser.id : undefined,
        teacherID: currentUser.role === 'teacher' ? currentUser.id : undefined,
        postID: postId,
        comment: newComment[postId].trim(),
        date: new Date().toISOString()
      };

      await communityService.addComment(commentData);

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

      // Fetch comments with higher limit to cover all comments
      // Backend returns 2 comments per page, so calculate how many pages we need
      const pagesNeeded = Math.ceil(newTotalComments / 2);
      
      try {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        
        // Fetch all needed pages in parallel
        const commentPromises = [];
        for (let page = 1; page <= pagesNeeded; page++) {
          commentPromises.push(communityService.getComments(postId, page));
        }
        
        const commentPages = await Promise.all(commentPromises);
        const allComments = commentPages.flat().filter(Boolean);
        
        setPostComments(prev => ({
          ...prev,
          [postId]: allComments
        }));
        
        // Update loadBlock to the last page we fetched
        setPostCommentsLoadBlock(prev => ({ ...prev, [postId]: pagesNeeded }));
        
        // Show "See More" only if we fetched fewer comments than the total
        setPostCommentsHasMore(prev => ({ 
          ...prev, 
          [postId]: allComments.length < newTotalComments 
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
      handleCloseReport();
      
      // Remove reported post from feed
      setPosts(prevPosts => prevPosts.filter(post => post.id !== reportData.postID));
    } catch (err) {
      console.error('Error reporting post:', err);
      throw err;
    }
  }, [handleCloseReport]);

  if (!currentUser) {
    return (
      <div className="community-container">
        <div className="community-main">
          <div className="card">
            <p>Please log in to view your saved posts.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="community-container">
      <div className="community-main">
        <div className="community-header">
          <h1>My Saved Posts</h1>
          <p>Posts you've saved for later</p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Posts List */}
        <div className="posts-list">
          {loading ? (
            <div className="loading-posts">
              <Loader className="spinner" size={32} />
              <span>Loading saved posts...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="no-posts">
              <BookmarkCheck size={48} />
              <p>No saved posts yet.</p>
              <p>Save posts from the community to see them here!</p>
            </div>
          ) : (
            <>
              {posts.map(post => (
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
                    <button
                      className="post-report-btn"
                      onClick={() => handleOpenReport(post.id)}
                      aria-label="Report post"
                      title="Report post"
                    >
                      <Flag size={18} />
                    </button>
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
                    <button
                      onClick={() => handleUnsavePost(post.id)}
                      className="action-btn saved"
                      title="Remove from saved"
                    >
                      <BookmarkCheck size={18} />
                      <span>Saved</span>
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

                          {/* Add Comment Form */}
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

