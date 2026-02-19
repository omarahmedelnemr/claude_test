import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import blogService from '../../services/blogService';
import { Calendar, Eye, Heart, Loader2, MessageCircle, Plus, Trash2, Shield, Flag, AlertTriangle, CheckCircle, X, Search } from 'lucide-react';
import Pagination from '../../components/Common/Pagination';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  
  // Initialize from URL params or defaults
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || ''); // Local state for input
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'all');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingArticle, setDeletingArticle] = useState(null);
  const [pagination, setPagination] = useState({ 
    total: 0, 
    totalPages: 1, 
    hasNextPage: false, 
    hasPreviousPage: false 
  });
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Admin moderation state
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const [blockTarget, setBlockTarget] = useState(null); // { id, reason }
  const [reportedArticles, setReportedArticles] = useState([]);
  const [reportedOpen, setReportedOpen] = useState(false);
  const [reportedLoading, setReportedLoading] = useState(false);
  const [modToast, setModToast] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const categoriesData = await blogService.getCategoriesList();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Sync state from URL on mount
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || 'all';
    if (urlPage !== page) setPage(urlPage);
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
      setSearchInput(urlSearch);
    }
    if (urlCategory !== selectedCategory) setSelectedCategory(urlCategory);
  }, []); // Only run on mount

  // Debounced search effect - updates searchTerm after user stops typing
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout to update searchTerm after 500ms of no typing
    searchTimeoutRef.current = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput);
        setPage(1); // Reset to page 1 when search changes
      }
    }, 500);

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]); // Only depend on searchInput, not searchTerm

  // Update URL when page, search, or category changes
  useEffect(() => {
    const currentPage = searchParams.get('page');
    const currentSearch = searchParams.get('search') || '';
    const currentCategory = searchParams.get('category') || 'all';
    
    if (page.toString() !== (currentPage || '1') || 
        searchTerm !== currentSearch || 
        selectedCategory !== currentCategory) {
      const params = new URLSearchParams();
      if (page > 1) params.set('page', page.toString());
      if (searchTerm) params.set('search', searchTerm);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      setSearchParams(params, { replace: true });
    }
  }, [page, searchTerm, selectedCategory, setSearchParams, searchParams]);

  // Reset to page 1 when category filter changes
  useEffect(() => {
    const urlCategory = searchParams.get('category') || 'all';
    if (selectedCategory !== urlCategory && selectedCategory !== 'all') {
      setPage(1);
    }
  }, [selectedCategory]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(''); // Clear previous errors
        const params = {
          loadBlock: page,
          ...(searchTerm && { searchQuery: searchTerm }),
          ...(selectedCategory !== 'all' && { categoryID: selectedCategory })
        };
        const data = await blogService.getArticleFeed(params);
        
        // Handle response format - could be array or object with data and pagination
        let articlesArray = [];
        if (Array.isArray(data)) {
          articlesArray = data;
        } else if (data.data) {
          articlesArray = Array.isArray(data.data) ? data.data : [];
        } else if (data.articles) {
          articlesArray = Array.isArray(data.articles) ? data.articles : [];
        }
        
        setArticles(articlesArray);
        
        // Extract pagination metadata
        if (data.pagination) {
          setPagination({
            total: data.pagination.total || 0,
            totalPages: data.pagination.totalPages || 1,
            hasNextPage: data.pagination.hasNextPage || false,
            hasPreviousPage: data.pagination.hasPreviousPage || false,
          });
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [page, searchTerm, selectedCategory]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    // URL will be updated by useEffect
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value); // Update local input state immediately (no re-render of component)
    // searchTerm will be updated by debounced useEffect
  };

  const handleSearchKeyPress = (e) => {
    // If user presses Enter, update search immediately
    if (e.key === 'Enter') {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      setSearchTerm(searchInput);
      setPage(1);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    // Page reset will be handled by useEffect
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedCategory('all');
    setPage(1);
    // Focus back on search input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

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

      {/* Search and Filter Section */}
      <div className="blog-filters" style={{ 
        marginBottom: '2em', 
        padding: '1.5em', 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: 'var(--card-shadow)' 
      }}>
        <div style={{ display: 'flex', gap: '1em', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#9ca3af' 
              }} 
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search articles..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              style={{
                width: '100%',
                padding: '0.75em 1em 0.75em 2.75em',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.95em',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => handleCategoryChange('all')}
              style={{
                padding: '0.75em 1.25em',
                border: selectedCategory === 'all' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                borderRadius: '8px',
                background: selectedCategory === 'all' ? 'var(--primary-color)' : 'white',
                color: selectedCategory === 'all' ? 'white' : 'var(--text-dark)',
                cursor: 'pointer',
                fontWeight: selectedCategory === 'all' ? '600' : '400',
                transition: 'all 0.3s ease',
                fontSize: '0.9em'
              }}
            >
              All Categories
            </button>
            {loadingCategories ? (
              <Loader2 size={20} className="spinner" />
            ) : (
              categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  style={{
                    padding: '0.75em 1.25em',
                    border: selectedCategory === category.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    background: selectedCategory === category.id ? 'var(--primary-color)' : 'white',
                    color: selectedCategory === category.id ? 'white' : 'var(--text-dark)',
                    cursor: 'pointer',
                    fontWeight: selectedCategory === category.id ? '600' : '400',
                    transition: 'all 0.3s ease',
                    fontSize: '0.9em'
                  }}
                >
                  {category.category || category.en_category || category.mal_category}
                </button>
              ))
            )}
          </div>

          {/* Clear Filters Button */}
          {(searchInput || selectedCategory !== 'all') && (
            <button
              onClick={handleClearFilters}
              style={{
                padding: '0.75em 1.25em',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'white',
                color: 'var(--text-dark)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.9em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5em'
              }}
            >
              <X size={16} />
              Clear
            </button>
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

      {/* Articles Section - Shows loading only in this area, search/filter stays visible */}
      {loading && articles.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={32} className="spinner" />
        </div>
      ) : error && articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
          <p>{error}</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <h3>No articles found</h3>
          <p>Check back later for new articles!</p>
        </div>
      ) : (
        <>
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
          
          {/* Loading overlay when loading more (pagination) */}
          {loading && articles.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', marginTop: '1rem' }}>
              <Loader2 size={24} className="spinner" />
            </div>
          )}
          
          {!loading && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default BlogList;
