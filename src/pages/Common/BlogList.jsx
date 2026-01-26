import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import blogService from '../../services/blogService';
import { Calendar, Eye, Heart, Loader2, MessageCircle, Plus } from 'lucide-react';
import './BlogList.css';

const BlogList = () => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const data = await blogService.getArticleFeed();
        // Handle both array and object with articles property
        setArticles(Array.isArray(data) ? data : (data.articles || []));
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Blog Articles</h1>
          <p>Loading articles...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader2 size={32} className="spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Blog Articles</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Blog Articles</h1>
          <p>Insights and knowledge from our expert teachers</p>
        </div>
        {currentUser?.role === 'teacher' && (
          <Link to="/blog/create" className="create-article-btn">
            <Plus size={18} />
            Create Article
          </Link>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="empty-state">
          <h3>No articles found</h3>
          <p>Check back later for new articles!</p>
        </div>
      ) : (
        <div className="blog-grid">
          {articles.map(article => (
            <div key={article.id || article.articleID} className="blog-card">
              <Link to={`/blog/${article.id || article.articleID}`}>
                {article.coverImage || article.image ? (
                  <img 
                    src={article.coverImage || article.image} 
                    alt={article.title} 
                    className="blog-image" 
                  />
                ) : (
                  <div className="blog-image-placeholder">
                    <span>No Image</span>
                  </div>
                )}
              </Link>
              <div className="blog-content">
                {article.category && (
                  <div className="blog-tags">
                    <span className="tag">{article.category.name || article.category}</span>
                  </div>
                )}
                <Link to={`/blog/${article.id || article.articleID}`}>
                  <h2>{article.title}</h2>
                </Link>
                <p className="blog-excerpt">
                  {/* Strip HTML tags for excerpt display */}
                  {(article.mainText || article.excerpt || '')
                    .replace(/<[^>]*>/g, '')
                    .substring(0, 150)}
                  {((article.mainText || article.excerpt || '').replace(/<[^>]*>/g, '').length > 150) && '...'}
                </p>
                <div className="blog-meta">
                  <div className="author-info">
                    <img 
                      src={article.teacherProfileImage || article.teacher?.profileImage || article.author?.avatar || '/default-avatar.png'} 
                      alt={article.teacherName || article.teacher?.name || article.author?.name || 'Teacher'} 
                    />
                    <div>
                      <strong>{article.teacherName || article.teacher?.name || article.author?.name || 'Unknown Teacher'}</strong>
                      {article.teacherTitle && (
                        <span className="teacher-title">{article.teacherTitle}</span>
                      )}
                      <span className="date">
                        <Calendar size={14} />
                        {formatDate(article.date || article.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="blog-stats">
                    <span>
                      <Eye size={16} />
                      {article.viewCount || article.views || article.seenCount || 0}
                    </span>
                    <span>
                      <Heart size={16} />
                      {article.likeCount || article.likes || article.upVotes || 0}
                    </span>
                    {article.commentsNumber !== undefined && (
                      <span>
                        <MessageCircle size={16} />
                        {article.commentsNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;
