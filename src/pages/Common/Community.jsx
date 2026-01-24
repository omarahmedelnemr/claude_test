import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import communityService from '../../services/communityService';
import { Heart, MessageCircle, Image, Send, Loader, AlertCircle, Bookmark, BookmarkCheck } from 'lucide-react';
import './Community.css';

const Community = () => {
  const { currentUser } = useAuth();

  // State for posts and communities
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState('');

  // State for creating new posts
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [hideIdentity, setHideIdentity] = useState(false);

  // State for comments
  const [expandedComments, setExpandedComments] = useState({});
  const [postComments, setPostComments] = useState({});
  const [newComment, setNewComment] = useState({});

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
      setPosts(Array.isArray(postsData) ? postsData : []);
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
      setPosts(Array.isArray(postsData) ? postsData : []);
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

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() || !currentUser) return;

    // Only students can create posts
    if (currentUser.role !== 'student') {
      setError('Only students can create posts.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const postData = {
        studentID: currentUser.id,
        communityID: selectedCommunity || (communities[0]?.id || ''),
        mainText: newPostContent,
        date: new Date().toISOString(),
        hideIdentity: hideIdentity,
        attachedImages: newPostImage ? [{ name: 'image', link: newPostImage }] : []
      };

      await communityService.createPost(postData);

      // Refresh posts
      await fetchPosts(selectedCommunity);

      // Clear form
      setNewPostContent('');
      setNewPostImage('');
      setShowImageInput(false);
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
    if (!currentUser || currentUser.role !== 'student') return;

    try {
      if (isSaved) {
        await communityService.unsavePost(currentUser.id, postId);
      } else {
        await communityService.savePost(currentUser.id, postId);
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

    // Load comments if expanding and not already loaded
    if (!isExpanded && !postComments[postId]) {
      try {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        const comments = await communityService.getComments(postId);
        setPostComments(prev => ({
          ...prev,
          [postId]: Array.isArray(comments) ? comments : []
        }));
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleAddComment = async (postId) => {
    const commentText = newComment[postId];
    if (!commentText?.trim() || !currentUser || currentUser.role !== 'student') return;

    try {
      await communityService.addComment({
        studentID: currentUser.id,
        postID: postId,
        comment: commentText,
        date: new Date().toISOString()
      });

      // Refresh comments
      const comments = await communityService.getComments(postId);
      setPostComments(prev => ({
        ...prev,
        [postId]: Array.isArray(comments) ? comments : []
      }));

      // Update comment count in post
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, commentsNumber: (post.commentsNumber || 0) + 1 }
          : post
      ));

      // Clear input
      setNewComment(prev => ({ ...prev, [postId]: '' }));
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
        <h1>Community</h1>
        <p>Connect, share, and learn together</p>
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

          {/* Create Post Form - Only for students */}
          {currentUser && currentUser.role === 'student' && (
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
                {showImageInput && (
                  <input
                    type="text"
                    value={newPostImage}
                    onChange={(e) => setNewPostImage(e.target.value)}
                    placeholder="Image URL (optional)"
                    className="image-input"
                    disabled={submitting}
                  />
                )}
                <div className="create-post-options">
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
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setShowImageInput(!showImageInput)}
                    disabled={submitting}
                  >
                    <Image size={18} />
                    {showImageInput ? 'Hide' : 'Add'} Image
                  </button>
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
                    <div>
                      <h4>{post.hideIdentity ? 'Anonymous' : post.userName}</h4>
                      {post.community && <span className="post-community">{post.community}</span>}
                      <span className="post-time">{formatDate(post.date)}</span>
                      {post.edited && <span className="post-edited">(edited)</span>}
                    </div>
                  </div>
                  <div className="post-content">
                    <p>{post.mainText}</p>
                    {post.images && post.images.length > 0 && (
                      <div className="post-images">
                        {post.images.map((img, idx) => (
                          <img key={idx} src={img.link} alt={img.name || 'Post image'} className="post-image" />
                        ))}
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
                    {currentUser && currentUser.role === 'student' && (
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
                      {loadingComments[post.id] ? (
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

                          {/* Add Comment Form - Only for students */}
                          {currentUser && currentUser.role === 'student' && (
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
                              >
                                <Send size={16} />
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
    </div>
  );
};

export default Community;
