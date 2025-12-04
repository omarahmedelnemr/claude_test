import { Link } from 'react-router-dom';
import { blogArticles, users } from '../../data/mockData';
import { Calendar, Eye, Heart, User } from 'lucide-react';
import './BlogList.css';

const BlogList = () => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Blog Articles</h1>
        <p>Insights and knowledge from our expert teachers</p>
      </div>

      <div className="blog-grid">
        {blogArticles.map(article => {
          const author = users.find(u => u.id === article.authorId);
          return (
            <div key={article.id} className="blog-card">
              <Link to={`/blog/${article.id}`}>
                <img src={article.image} alt={article.title} className="blog-image" />
              </Link>
              <div className="blog-content">
                <div className="blog-tags">
                  {article.tags.map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                  ))}
                </div>
                <Link to={`/blog/${article.id}`}>
                  <h2>{article.title}</h2>
                </Link>
                <p className="blog-excerpt">{article.excerpt}</p>
                <div className="blog-meta">
                  <div className="author-info">
                    <img src={author?.avatar} alt={author?.name} />
                    <div>
                      <strong>{author?.name}</strong>
                      <span className="date">
                        <Calendar size={14} />
                        {formatDate(article.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="blog-stats">
                    <span>
                      <Eye size={16} />
                      {article.views}
                    </span>
                    <span>
                      <Heart size={16} />
                      {article.likes}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BlogList;
