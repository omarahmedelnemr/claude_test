import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import blogService from '../../services/blogService';
import { Calendar, Eye, Heart, ArrowLeft, Loader2, MessageCircle, Send, Edit } from 'lucide-react';
import './BlogDetail.css';

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

  return (
    <div className="container blog-detail-page">
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
                src={article.teacherProfileImage || article.teacher?.profileImage || article.author?.avatar || '/default-avatar.png'} 
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
              {currentUser?.role === 'teacher' && article.teacherID === currentUser.id && (
                <Link to={`/blog/edit/${id}`} className="edit-article-btn">
                  <Edit size={18} />
                  Edit Article
                </Link>
              )}
              <button
                onClick={handleLike}
                className={`like-btn ${liked ? 'liked' : ''}`}
                disabled={!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'student' && currentUser.role !== 'parent')}
              >
                <Heart size={20} fill={liked ? '#e74c3c' : 'none'} />
                <span>{likes}</span>
              </button>
            </div>
          </div>
        </header>

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
                        src={comment.userProfileImage || comment.teacherProfileImage || '/default-avatar.png'}
                        alt={comment.userName || comment.teacherName || 'User'}
                        className="comment-avatar"
                      />
                      <div className="comment-content">
                        <div className="comment-header">
                          <strong>{comment.userName || comment.teacherName || 'User'}</strong>
                          {comment.teacherTitle && (
                            <span className="comment-title">{comment.teacherTitle}</span>
                          )}
                          <span className="comment-date">{formatDate(comment.date)}</span>
                        </div>
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
