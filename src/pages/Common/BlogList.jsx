import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import blogService from '../../services/blogService';
import { Calendar, Eye, Heart, Loader2, MessageCircle, Plus, Trash2, Shield, Flag, AlertTriangle, CheckCircle, X } from 'lucide-react';
import api from '../../services/api';
import './BlogList.css';
import '../Admin/AdminDashboard.css';

const defaultAvatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%236366f1'/%3E%3Ccircle cx='20' cy='15' r='7' fill='white'/%3E%3Cellipse cx='20' cy='33' rx='12' ry='9' fill='white'/%3E%3C/svg%3E`;

const ReportedArticleRow = ({ report, onDecision }) => {
  const [reason, setReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  const handleBlock = async () => {
    if (!reason.trim()) return;
    setBlocking(true);
    await onDecision(report.reportID, true, report.articleID, reason);
    setBlocking(false);
  };

  return (
    <div style={{ padding: '12px', border: '1px solid #fee2e2', borderRadius: '8px', background: '#fff5f5', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '13px', color: '#374151' }}>
            Article: <span style={{ color: '#6366f1' }}>{report.articleTitle || 'Unknown'}</span>
            {report.articleAuthor && <span style={{ marginLeft: '6px', color: '#9ca3af', fontWeight: 400 }}>by {report.articleAuthor}</span>}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
            Reported by <strong>{report.reporterName || 'Unknown'}</strong>
            {report.reportType && <span> · {report.reportType}</span>}
            {' · '}{report.reason}
          </p>
        </div>
        <button
          className="ad-btn ad-btn--ghost ad-btn--sm"
          onClick={() => onDecision(report.reportID, false, report.articleID, '')}
          title="Dismiss report"
        >Dismiss</button>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
        <input
          className="ad-input"
          placeholder="Reason to block article…"
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{ flex: 1, minWidth: '180px', fontSize: '13px', padding: '4px 8px' }}
        />
        <button
          className="ad-btn ad-btn--danger ad-btn--sm"
          onClick={handleBlock}
          disabled={!reason.trim() || blocking}
        >
          {blocking ? 'Blocking…' : 'Block Article'}
        </button>
      </div>
    </div>
  );
};

const BlogList = () => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingArticle, setDeletingArticle] = useState(null);

  // Admin moderation state
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const [blockTarget, setBlockTarget] = useState(null); // { id, reason }
  const [reportedArticles, setReportedArticles] = useState([]);
  const [reportedOpen, setReportedOpen] = useState(false);
  const [reportedLoading, setReportedLoading] = useState(false);
  const [modToast, setModToast] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const data = await blogService.getArticleFeed();
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

  const showModToast = (type, text) => {
    setModToast({ type, text });
    setTimeout(() => setModToast(null), 3500);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isMyArticle = (article) => {
    if (!currentUser || !article) return false;
    return currentUser.role === 'teacher' && article.teacherID === currentUser.id;
  };

  const handleDeleteArticle = async (articleId) => {
    if (!currentUser) return;
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;

    try {
      setDeletingArticle(articleId);
      await blogService.deleteArticle(articleId);
      setArticles(prev => prev.filter(article => (article.id || article.articleID) !== articleId));
    } catch (err) {
      console.error('Error deleting article:', err);
      alert(err.response?.data?.message || 'Failed to delete article. Please try again.');
    } finally {
      setDeletingArticle(null);
    }
  };

  const handleAdminBlockArticle = async () => {
    if (!blockTarget?.reason?.trim()) return;
    try {
      await api.delete('/admin/moderation/article', { data: { articleID: blockTarget.id, reason: blockTarget.reason } });
      setArticles(prev => prev.filter(a => (a.id || a.articleID) !== blockTarget.id));
      setBlockTarget(null);
      showModToast('success', 'Article blocked.');
    } catch {
      showModToast('error', 'Failed to block article.');
    }
  };

  const fetchReportedArticles = async () => {
    setReportedLoading(true);
    try {
      const r = await api.get('/admin/moderation/reported-articles');
      setReportedArticles(Array.isArray(r.data) ? r.data : []);
    } catch {
      showModToast('error', 'Failed to load reported articles.');
    } finally {
      setReportedLoading(false);
    }
  };

  const handleToggleReported = () => {
    if (!reportedOpen) fetchReportedArticles();
    setReportedOpen(v => !v);
  };

  const handleReportDecision = async (reportID, block, articleID, reason) => {
    try {
      await api.post('/admin/moderation/article-report-decision', { reportID, block, reason: reason || '' });
      if (block) setArticles(prev => prev.filter(a => (a.id || a.articleID) !== articleID));
      setReportedArticles(prev => prev.filter(r => r.reportID !== reportID));
      showModToast('success', block ? 'Article blocked.' : 'Report dismissed.');
    } catch {
      showModToast('error', 'Failed to process report.');
    }
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
      {/* Admin moderation toast */}
      {modToast && (
        <div className={`ad-toast ${modToast.type === 'success' ? 'ad-toast--ok' : 'ad-toast--err'}`} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
          {modToast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{modToast.text}</span>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Blog Articles</h1>
        </div>
        <p>Insights and knowledge from our expert teachers</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button
              onClick={handleToggleReported}
              className="ad-btn ad-btn--danger ad-btn--sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Flag size={15} /> Reported Articles
            </button>
          )}
          {currentUser?.role === 'teacher' && (
            <Link to="/blog/create" className="create-article-btn">
              <Plus size={18} />
              Create Article
            </Link>
          )}
        </div>
      </div>

      {/* Reported Articles Panel */}
      {isAdmin && reportedOpen && (
        <div className="card" style={{ marginBottom: '20px', border: '2px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
              <Flag size={18} /> Reported Articles
            </h3>
            <button onClick={() => setReportedOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
          {reportedLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={20} className="spinner" /> Loading…
            </div>
          ) : reportedArticles.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No unreviewed reports.</p>
          ) : (
            reportedArticles.map(r => (
              <ReportedArticleRow key={r.reportID} report={r} onDecision={handleReportDecision} />
            ))
          )}
        </div>
      )}

      {articles.length === 0 ? (
        <div className="empty-state">
          <h3>No articles found</h3>
          <p>Check back later for new articles!</p>
        </div>
      ) : (
        <div className="blog-grid">
          {articles.map(article => {
            const articleId = article.id || article.articleID;
            return (
              <div key={articleId} className="blog-card">
                <div className="blog-card-header">
                  <Link to={`/blog/${articleId}`}>
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
                  {isMyArticle(article) && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteArticle(articleId);
                      }}
                      disabled={deletingArticle === articleId}
                      className="blog-delete-btn"
                      aria-label="Delete article"
                    >
                      {deletingArticle === articleId ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setBlockTarget(blockTarget?.id === articleId ? null : { id: articleId, reason: '' });
                      }}
                      className="blog-delete-btn"
                      aria-label="Block article"
                      title="Block article (admin)"
                      style={{ right: isMyArticle(article) ? '48px' : '8px', background: '#fee2e2', color: '#ef4444' }}
                    >
                      <Shield size={16} />
                    </button>
                  )}
                </div>

                {/* Admin inline block reason */}
                {isAdmin && blockTarget?.id === articleId && (
                  <div style={{ display: 'flex', gap: '6px', padding: '8px', flexWrap: 'wrap', borderTop: '1px solid #fee2e2' }}>
                    <input
                      className="ad-input"
                      placeholder="Reason for blocking…"
                      value={blockTarget.reason}
                      onChange={e => setBlockTarget(x => ({ ...x, reason: e.target.value }))}
                      style={{ flex: 1, minWidth: '160px', fontSize: '13px', padding: '4px 8px' }}
                      onClick={e => e.stopPropagation()}
                    />
                    <button
                      className="ad-btn ad-btn--danger ad-btn--sm"
                      onClick={e => { e.stopPropagation(); handleAdminBlockArticle(); }}
                      disabled={!blockTarget.reason.trim()}
                    >Confirm</button>
                    <button
                      className="ad-btn ad-btn--ghost ad-btn--sm"
                      onClick={e => { e.stopPropagation(); setBlockTarget(null); }}
                    >Cancel</button>
                  </div>
                )}

                <div className="blog-content">
                  {article.category && (
                    <div className="blog-tags">
                      <span className="tag">{article.category.name || article.category}</span>
                    </div>
                  )}
                  <Link to={`/blog/${articleId}`}>
                    <h2>{article.title}</h2>
                  </Link>
                  <p className="blog-excerpt">
                    {(article.mainText || article.excerpt || '')
                      .replace(/<[^>]*>/g, '')
                      .substring(0, 150)}
                    {((article.mainText || article.excerpt || '').replace(/<[^>]*>/g, '').length > 150) && '...'}
                  </p>
                  <div className="blog-meta">
                    <div className="author-info">
                      <img
                        src={article.teacherProfileImage || article.teacher?.profileImage || article.author?.avatar || defaultAvatar}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BlogList;
