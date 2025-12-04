import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogArticles, users } from '../../data/mockData';
import { Calendar, Eye, Heart, ArrowLeft } from 'lucide-react';
import './BlogDetail.css';

const BlogDetail = () => {
  const { id } = useParams();
  const article = blogArticles.find(a => a.id === parseInt(id));
  const author = users.find(u => u.id === article?.authorId);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(article?.likes || 0);

  if (!article) {
    return (
      <div className="container">
        <div className="empty-state">
          <h2>Article not found</h2>
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

  const handleLike = () => {
    if (!liked) {
      setLikes(likes + 1);
      setLiked(true);
    } else {
      setLikes(likes - 1);
      setLiked(false);
    }
  };

  const relatedArticles = blogArticles.filter(a =>
    a.id !== article.id && a.tags.some(tag => article.tags.includes(tag))
  ).slice(0, 2);

  return (
    <div className="container blog-detail-page">
      <Link to="/blog" className="back-link">
        <ArrowLeft size={18} />
        Back to Blog
      </Link>

      <article className="blog-article">
        <header className="article-header">
          <div className="article-tags">
            {article.tags.map((tag, idx) => (
              <span key={idx} className="tag">{tag}</span>
            ))}
          </div>
          <h1>{article.title}</h1>
          <div className="article-meta">
            <div className="author-section">
              <img src={author?.avatar} alt={author?.name} />
              <div>
                <strong>{author?.name}</strong>
                <div className="meta-info">
                  <span>
                    <Calendar size={14} />
                    {formatDate(article.createdAt)}
                  </span>
                  <span>
                    <Eye size={14} />
                    {article.views} views
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLike}
              className={`like-btn ${liked ? 'liked' : ''}`}
            >
              <Heart size={20} fill={liked ? '#e74c3c' : 'none'} />
              <span>{likes}</span>
            </button>
          </div>
        </header>

        <img src={article.image} alt={article.title} className="article-image" />

        <div className="article-content">
          <p className="lead">{article.excerpt}</p>
          <p>{article.content}</p>
          <p>
            As technology continues to evolve, staying updated with the latest trends and best practices
            is crucial for success. This article explores key insights that can help you advance your skills
            and knowledge in this rapidly changing field.
          </p>
          <p>
            Whether you're a beginner or an experienced professional, continuous learning and adaptation
            are essential. We encourage you to engage with the community, share your experiences, and
            keep pushing the boundaries of what's possible.
          </p>
        </div>

        <div className="article-footer">
          <div className="tags-section">
            <h4>Tags:</h4>
            <div className="article-tags">
              {article.tags.map((tag, idx) => (
                <span key={idx} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </article>

      {relatedArticles.length > 0 && (
        <div className="related-articles">
          <h3>Related Articles</h3>
          <div className="related-grid">
            {relatedArticles.map(related => {
              const relatedAuthor = users.find(u => u.id === related.authorId);
              return (
                <Link key={related.id} to={`/blog/${related.id}`} className="related-card">
                  <img src={related.image} alt={related.title} />
                  <div className="related-content">
                    <h4>{related.title}</h4>
                    <p>{related.excerpt}</p>
                    <div className="related-meta">
                      <span>{relatedAuthor?.name}</span>
                      <span>{formatDate(related.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogDetail;
