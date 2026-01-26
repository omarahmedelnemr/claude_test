import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import blogService from '../../services/blogService';
import { Calendar, Eye, Heart, ArrowLeft, Loader2 } from 'lucide-react';
import './BlogDetail.css';

const BlogDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const data = await blogService.getArticle(id);
        setArticle(data);
        setLikes(data.likeCount || data.likes || 0);
        setLiked(data.isLiked || false);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert('Please login to like articles');
      return;
    }

    try {
      if (!liked) {
        await blogService.likeArticle(id);
        setLikes(likes + 1);
        setLiked(true);
      } else {
        await blogService.unlikeArticle(id);
        setLikes(likes - 1);
        setLiked(false);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Failed to update like');
    }
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
                src={article.teacher?.profileImage || article.author?.avatar || '/default-avatar.png'} 
                alt={article.teacher?.name || article.author?.name} 
              />
              <div>
                <strong>{article.teacher?.name || article.author?.name || 'Unknown'}</strong>
                <div className="meta-info">
                  <span>
                    <Calendar size={14} />
                    {formatDate(article.date || article.createdAt)}
                  </span>
                  <span>
                    <Eye size={14} />
                    {article.viewCount || article.views || 0} views
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLike}
              className={`like-btn ${liked ? 'liked' : ''}`}
              disabled={!currentUser}
            >
              <Heart size={20} fill={liked ? '#e74c3c' : 'none'} />
              <span>{likes}</span>
            </button>
          </div>
        </header>

        {article.coverImage && (
          <img src={article.coverImage} alt={article.title} className="article-image" />
        )}

        <div className="article-content">
          <p className="lead">{article.mainText || article.content || article.excerpt}</p>
        </div>

        {article.attachedImage && article.attachedImage.length > 0 && (
          <div className="article-images">
            {article.attachedImage.map((img, idx) => (
              <img key={idx} src={img.link || img} alt={`${article.title} - Image ${idx + 1}`} />
            ))}
          </div>
        )}
      </article>
    </div>
  );
};

export default BlogDetail;
