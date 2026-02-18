import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import blogService from '../../services/blogService';
import { Calendar, Eye, Heart, ArrowLeft, Loader2, MessageCircle, Send, Edit, Trash2, Shield, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import './BlogDetail.css';
import '../Admin/AdminDashboard.css';

const BlogDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsLoadBlock, setCommentsLoadBlock] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState(false);
  const [deletingComment, setDeletingComment] = useState(null);

  // Admin moderation state
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const [blockArticleReason, setBlockArticleReason] = useState('');
  const [showBlockArticle, setShowBlockArticle] = useState(false);
  const [blockCommentTarget, setBlockCommentTarget] = useState(null); // { id, reason }
  const [reportReason, setReportReason] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [modToast, setModToast] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const data = await blogService.getArticle(id);
        setArticle(data);
        setLikes(data.likeCount || data.likes || data.upVotes || 0);
        // Backend returns 'likedByUser' field
        setLiked(data.likedByUser === true || data.likedByUser === 1 || data.isLiked === true || data.isLiked === 1);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
      fetchComments();
    }
  }, [id]);

  const fetchComments = async (loadBlock = 1) => {
    if (!id) return;
    try {
      setLoadingComments(true);
      const data = await blogService.getArticleComments(id, loadBlock);
      const commentsArray = Array.isArray(data) ? data : [];
      setComments(loadBlock === 1 ? commentsArray : [...comments, ...commentsArray]);
      setCommentsLoadBlock(loadBlock);
      setHasMoreComments(commentsArray.length >= 15);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  if (loading) {
    return (
      <div className="container blog-detail-page">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader2 size={32} className="spinner" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container blog-detail-page">
        <div className="empty-state">
          <h2>{error || 'Article not found'}</h2>
          <Link to="/blog">Back to Blog</Link>
        </div>
      </div>
    );
  }


  const handleLike = async () => {
    if (!currentUser) {
      alert('Please login to like articles');
      return;
    }

    // Admin cannot like articles
    if (isAdmin) {
      return;
    }

    // All user types (teacher, student, parent) can like articles
    if (currentUser.role !== 'teacher' && currentUser.role !== 'student' && currentUser.role !== 'parent') {
      alert('Please login to like articles');
      return;
    }

    // Optimistic UI update - update immediately
    const previousLiked = liked;
    const previousLikes = likes;
    
    if (!liked) {
      setLikes(likes + 1);
      setLiked(true);
    } else {
      setLikes(likes - 1);
      setLiked(false);
    }

    // Then make the API call using unified endpoint
    try {
      if (!previousLiked) {
        await blogService.likeArticle(id);
      } else {
        await blogService.unlikeArticle(id);
      }
    } catch (err) {
      // Revert on error
      setLiked(previousLiked);
      setLikes(previousLikes);
      console.error('Error toggling like:', err);
      alert(err.response?.data?.message || 'Failed to update like');
    }
  };

  const handleAddComment = async () => {
    if (!currentUser) {
      alert('Please login to comment on articles');
      return;
    }

    // All user types (teacher, student, parent) can comment
    if (currentUser.role !== 'teacher' && currentUser.role !== 'student' && currentUser.role !== 'parent') {
      alert('Please login to comment on articles');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      setSubmittingComment(true);
      await blogService.addComment({
        articleID: id,
        comment: newComment,
      });
      setNewComment('');
      // Refresh comments
      await fetchComments(1);
      // Update comment count in article
      if (article) {
        setArticle({
          ...article,
          commentsNumber: (article.commentsNumber || 0) + 1,
        });
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const showModToast = (type, text) => {
    setModToast({ type, text });
    setTimeout(() => setModToast(null), 3500);
  };

  const handleAdminBlockArticle = async () => {
    if (!blockArticleReason.trim()) return;
    try {
      await api.delete('/admin/moderation/article', { data: { articleID: id, reason: blockArticleReason } });
      showModToast('success', 'Article blocked.');
      setTimeout(() => { window.location.href = '/blog'; }, 1500);
    } catch {
      showModToast('error', 'Failed to block article.');
    }
  };

  const handleAdminBlockComment = async (commentId, reason) => {
    if (!reason.trim()) return;
    try {
      await api.delete('/admin/moderation/article-comment', { data: { commentID: commentId, reason } });
      setComments(prev => prev.filter(c => c.id !== commentId));
      setBlockCommentTarget(null);
      showModToast('success', 'Comment blocked.');
    } catch {
      showModToast('error', 'Failed to block comment.');
    }
  };

  const handleReportArticle = async () => {
    if (!reportReason.trim()) return;
    try {
      await api.post('/blog/report-article', { articleID: id, reason: reportReason });
      setShowReportForm(false);
      setReportReason('');
      showModToast('success', 'Report submitted. Thank you!');
    } catch {
      showModToast('error', 'Failed to submit report.');
    }
  };

  // Check if article belongs to current user (teacher)
  const isMyArticle = () => {
    if (!currentUser || !article) return false;
    return currentUser.role === 'teacher' && article.teacherID === currentUser.id;
  };

  // Check if comment belongs to current user
  const isMyComment = (comment) => {
    if (!currentUser) return false;
    if (currentUser.role === 'teacher' && comment.teacherID === currentUser.id) return true;
    if (currentUser.role === 'student' && comment.studentID === currentUser.id) return true;
    return false;
  };

  const handleDeleteArticle = async () => {
    if (!isMyArticle()) return;
    
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingArticle(true);
      await blogService.deleteArticle(id);
      // Redirect to blog list after deletion
      window.location.href = '/blog';
    } catch (err) {
      console.error('Error deleting article:', err);
      alert(err.response?.data?.message || 'Failed to delete article. Please try again.');
    } finally {
      setDeletingArticle(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return;
    
    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingComment(commentId);
      await blogService.deleteComment(commentId);

      // Update comment count in article (decrement by 1)
      if (article) {
        setArticle({
          ...article,
          commentsNumber: Math.max(0, (article.commentsNumber || 0) - 1),
        });
      }

      // Refetch the current page of comments
      try {
        setLoadingComments(true);
        const currentLoadBlock = commentsLoadBlock;
        const commentsData = await blogService.getArticleComments(id, currentLoadBlock);
        const commentsArray = Array.isArray(commentsData) ? commentsData : [];
        
        // Replace comments with refetched ones
        setComments(commentsArray);
        
        // Update hasMore based on new data
        setHasMoreComments(commentsArray.length >= 15);
      } catch (err) {
        console.error('Error refreshing comments after deletion:', err);
      } finally {
        setLoadingComments(false);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert(err.response?.data?.message || 'Failed to delete comment. Please try again.');
    } finally {
      setDeletingComment(null);
    }
  };

  const defaultAvatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%236366f1'/%3E%3Ccircle cx='20' cy='15' r='7' fill='white'/%3E%3Cellipse cx='20' cy='33' rx='12' ry='9' fill='white'/%3E%3C/svg%3E`;

  return (
    <div className="container blog-detail-page">
      {/* Moderation toast */}
      {modToast && (
        <div className={`ad-toast ${modToast.type === 'success' ? 'ad-toast--ok' : 'ad-toast--err'}`} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
          {modToast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{modToast.text}</span>
        </div>
      )}

      <Link to="/blog" className="back-link">
        <ArrowLeft size={18} />
        Back to Blog
      </Link>

      <article className="blog-article">
        <header className="article-header">
          {article.category && (
            <div className="article-tags">
              <span className="tag">{article.category.name || article.category}</span>
            </div>
          )}
          <h1>{article.title}</h1>
          <div className="article-meta">
            <div className="author-section">
              <img 
                src={article.teacherProfileImage || article.teacher?.profileImage || article.author?.avatar || defaultAvatar}
                alt={article.teacherName || article.teacher?.name || article.author?.name || 'Teacher'} 
              />
              <div>
                <strong>{article.teacherName || article.teacher?.name || article.author?.name || 'Unknown Teacher'}</strong>
                {article.teacherTitle && (
                  <div className="teacher-title">{article.teacherTitle}</div>
                )}
                <div className="meta-info">
                  <span>
                    <Calendar size={14} />
                    {formatDate(article.date || article.createdAt)}
                  </span>
                  <span>
                    <Eye size={14} />
                    {article.viewCount || article.views || article.seenCount || 0} views
                  </span>
                </div>
              </div>
            </div>
            <div className="article-actions">
              {isMyArticle() && (
                <>
                  <Link to={`/blog/edit/${id}`} className="edit-article-btn">
                    <Edit size={18} />
                    Edit
                  </Link>
                  <button
                    onClick={handleDeleteArticle}
                    disabled={deletingArticle}
                    className="delete-article-btn"
                    aria-label="Delete article"
                  >
                    {deletingArticle ? (
                      <Loader2 size={18} className="spinner" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                    Delete
                  </button>
                </>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowBlockArticle(v => !v)}
                  className="delete-article-btn"
                  title="Block article (admin)"
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                >
                  <Shield size={18} /> Block
                </button>
              )}
              {!isAdmin && !isMyArticle() && currentUser && (
                <button
                  onClick={() => setShowReportForm(v => !v)}
                  className="delete-article-btn"
                  title="Report article"
                  style={{ color: '#f59e0b', borderColor: '#f59e0b' }}
                >
                  <Flag size={18} /> Report
                </button>
              )}
              {!isAdmin ? (
                <button
                  onClick={handleLike}
                  className={`like-btn ${liked ? 'liked' : ''}`}
                  disabled={!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'student' && currentUser.role !== 'parent')}
                >
                  <Heart size={20} fill={liked ? '#e74c3c' : 'none'} />
                  <span>{likes}</span>
                </button>
              ) : (
                <div className="like-btn" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}>
                  <Heart size={20} fill="none" />
                  <span>{likes}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Admin block article form */}
        {isAdmin && showBlockArticle && (
          <div style={{ padding: '12px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              className="ad-input"
              placeholder="Reason for blocking this article…"
              value={blockArticleReason}
              onChange={e => setBlockArticleReason(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <button className="ad-btn ad-btn--danger ad-btn--sm" onClick={handleAdminBlockArticle} disabled={!blockArticleReason.trim()}>
              Confirm Block
            </button>
            <button className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => setShowBlockArticle(false)}>Cancel</button>
          </div>
        )}

        {/* Report article form (for non-admin users) */}
        {!isAdmin && showReportForm && (
          <div style={{ padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              className="ad-input"
              placeholder="Reason for reporting this article…"
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <button className="ad-btn ad-btn--primary ad-btn--sm" onClick={handleReportArticle} disabled={!reportReason.trim()}>
              Submit Report
            </button>
            <button className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => setShowReportForm(false)}>Cancel</button>
          </div>
        )}

        {article.coverImage && (
          <img src={article.coverImage} alt={article.title} className="article-image" />
        )}

        <div className="article-content">
          {article.mainText ? (
            <div 
              className="article-html-content"
              dangerouslySetInnerHTML={{ __html: article.mainText }}
            />
          ) : (
            <p className="lead">{article.content || article.excerpt || ''}</p>
          )}
        </div>

        {article.attachedImage && article.attachedImage.length > 0 && (
          <div className="article-images">
            {article.attachedImage.map((img, idx) => (
              <img key={idx} src={img.link || img} alt={`${article.title} - Image ${idx + 1}`} />
            ))}
          </div>
        )}

        {/* Comments Section */}
        <div className="article-comments-section">
          <div className="comments-header">
            <MessageCircle size={20} />
            <h3>Comments ({article.commentsNumber || comments.length || 0})</h3>
          </div>

          {/* Comments List */}
          {loadingComments && comments.length === 0 ? (
            <div className="loading-comments">
              <Loader2 size={20} className="spinner" />
              <span>Loading comments...</span>
            </div>
          ) : (
            <>
              {comments.length > 0 ? (
                <div className="comments-list">
                  {comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                      <img
                        src={comment.userProfileImage || comment.teacherProfileImage || defaultAvatar}
                        alt={comment.userName || comment.teacherName || 'User'}
                        className="comment-avatar"
                      />
                      <div className="comment-content">
                        <div className="comment-header">
                          <div>
                            <strong>{comment.userName || comment.teacherName || 'User'}</strong>
                            {comment.teacherTitle && (
                              <span className="comment-title">{comment.teacherTitle}</span>
                            )}
                            <span className="comment-date">{formatDate(comment.date)}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {isMyComment(comment) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deletingComment === comment.id}
                                className="comment-delete-btn"
                                aria-label="Delete comment"
                              >
                                {deletingComment === comment.id ? (
                                  <Loader2 size={14} className="spinner" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => setBlockCommentTarget(
                                  blockCommentTarget?.id === comment.id ? null : { id: comment.id, reason: '' }
                                )}
                                className="comment-delete-btn"
                                title="Block comment (admin)"
                                style={{ color: '#ef4444' }}
                              >
                                <Shield size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        {isAdmin && blockCommentTarget?.id === comment.id && (
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <input
                              className="ad-input"
                              placeholder="Reason…"
                              value={blockCommentTarget.reason}
                              onChange={e => setBlockCommentTarget(x => ({ ...x, reason: e.target.value }))}
                              style={{ flex: 1, minWidth: '140px', fontSize: '13px', padding: '4px 8px' }}
                            />
                            <button
                              className="ad-btn ad-btn--danger ad-btn--sm"
                              onClick={() => handleAdminBlockComment(comment.id, blockCommentTarget.reason)}
                              disabled={!blockCommentTarget.reason.trim()}
                            >Block</button>
                            <button
                              className="ad-btn ad-btn--ghost ad-btn--sm"
                              onClick={() => setBlockCommentTarget(null)}
                            >Cancel</button>
                          </div>
                        )}
                        <p>{comment.comment}</p>
                        {comment.likes !== undefined && comment.likes > 0 && (
                          <div className="comment-likes">
                            <Heart size={14} fill="#e74c3c" />
                            <span>{comment.likes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-comments">
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}

              {/* Load More Comments */}
              {hasMoreComments && (
                <button
                  onClick={() => fetchComments(commentsLoadBlock + 1)}
                  disabled={loadingComments}
                  className="load-more-comments-btn"
                >
                  {loadingComments ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      Loading...
                    </>
                  ) : (
                    'Load More Comments'
                  )}
                </button>
              )}

              {/* Add Comment Form - All user types (Teacher, Student, Parent) */}
              {currentUser && (currentUser.role === 'teacher' || currentUser.role === 'student' || currentUser.role === 'parent') && (
                <div className="add-comment-form">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows="3"
                    maxLength={500}
                    disabled={submittingComment}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submittingComment}
                    className="submit-comment-btn"
                  >
                    {submittingComment ? (
                      <>
                        <Loader2 size={16} className="spinner" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Post Comment
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </article>
    </div>
  );
};

export default BlogDetail;
