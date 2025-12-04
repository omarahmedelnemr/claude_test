import { useState } from 'react';
import { qaData } from '../../data/mockData';
import { Search, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';
import './QASection.css';

const QASection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const categories = ['all', ...new Set(qaData.map(qa => qa.category))];

  const filteredQA = qaData.filter(qa => {
    const matchesSearch = qa.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         qa.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || qa.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleHelpful = (id) => {
    alert('Thank you for your feedback!');
  };

  return (
    <div className="container qa-page">
      <div className="page-header">
        <h1>Questions & Answers</h1>
        <p>Find answers to common questions about our platform</p>
      </div>

      <div className="qa-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="qa-list">
        {filteredQA.length > 0 ? (
          filteredQA.map(qa => (
            <div key={qa.id} className="qa-item card">
              <div className="qa-header" onClick={() => toggleExpand(qa.id)}>
                <div>
                  <span className="category-label">{qa.category}</span>
                  <h3>{qa.question}</h3>
                </div>
                <button className="expand-btn">
                  {expandedId === qa.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
              </div>
              {expandedId === qa.id && (
                <div className="qa-answer">
                  <p>{qa.answer}</p>
                  <div className="qa-footer">
                    <button
                      className="helpful-btn"
                      onClick={() => handleHelpful(qa.id)}
                    >
                      <ThumbsUp size={16} />
                      Helpful ({qa.helpful})
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>No questions found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <div className="qa-contact card">
        <h3>Still have questions?</h3>
        <p>Can't find the answer you're looking for? Please contact our support team.</p>
        <button>Contact Support</button>
      </div>
    </div>
  );
};

export default QASection;
