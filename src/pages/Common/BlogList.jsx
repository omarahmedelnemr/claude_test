import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import blogService from '../../services/blogService';
import { Calendar, Eye, Heart, Loader2 } from 'lucide-react';
import './BlogList.css';

const BlogList = () => {
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
        <h1>Blog Articles</h1>
        <p>Insights and knowledge from our expert teachers</p>
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
                <img 
                  src={article.coverImage || article.image || '/default-blog.jpg'} 
                  alt={article.title} 
                  className="blog-image" 
                />
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
                  {article.mainText?.substring(0, 150) || article.excerpt || ''}
                  {(article.mainText?.length > 150 || article.excerpt?.length > 150) && '...'}
                </p>
                <div className="blog-meta">
                  <div className="author-info">
                    <img 
                      src={article.teacher?.profileImage || article.author?.avatar || '/default-avatar.png'} 
                      alt={article.teacher?.name || article.author?.name} 
                    />
                    <div>
                      <strong>{article.teacher?.name || article.author?.name || 'Unknown'}</strong>
                      <span className="date">
                        <Calendar size={14} />
                        {formatDate(article.date || article.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="blog-stats">
                    <span>
                      <Eye size={16} />
                      {article.viewCount || article.views || 0}
                    </span>
                    <span>
                      <Heart size={16} />
                      {article.likeCount || article.likes || 0}
                    </span>
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
