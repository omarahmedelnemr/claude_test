import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { communityPosts, users } from '../../data/mockData';
import { Heart, MessageCircle, Image, Send } from 'lucide-react';
import './Community.css';

const Community = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState(communityPosts);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost = {
      id: posts.length + 1,
      authorId: currentUser.id,
      content: newPostContent,
      image: newPostImage || null,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: []
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setNewPostImage('');
    setShowImageInput(false);
  };

  const handleLike = (postId) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <div className="container community-page">
      <div className="page-header">
        <h1>Community</h1>
        <p>Connect, share, and learn together</p>
      </div>

      <div className="community-content">
        <div className="posts-section">
          {currentUser && (
            <div className="card create-post">
              <div className="create-post-header">
                <img src={currentUser.avatar} alt={currentUser.name} />
                <h3>What's on your mind, {currentUser.name}?</h3>
              </div>
              <form onSubmit={handleCreatePost}>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your thoughts, ideas, or questions..."
                  rows="4"
                />
                {showImageInput && (
                  <input
                    type="text"
                    value={newPostImage}
                    onChange={(e) => setNewPostImage(e.target.value)}
                    placeholder="Image URL (optional)"
                    className="image-input"
                  />
                )}
                <div className="create-post-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setShowImageInput(!showImageInput)}
                  >
                    <Image size={18} />
                    {showImageInput ? 'Hide' : 'Add'} Image
                  </button>
                  <button type="submit">
                    <Send size={18} />
                    Post
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="posts-list">
            {posts.map(post => {
              const author = users.find(u => u.id === post.authorId);
              return (
                <div key={post.id} className="card post-card">
                  <div className="post-header">
                    <img src={author?.avatar} alt={author?.name} />
                    <div>
                      <h4>{author?.name}</h4>
                      <span className="post-role">{author?.role}</span>
                      <span className="post-time">{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="post-content">
                    <p>{post.content}</p>
                    {post.image && (
                      <img src={post.image} alt="Post" className="post-image" />
                    )}
                  </div>
                  <div className="post-actions">
                    <button onClick={() => handleLike(post.id)} className="action-btn">
                      <Heart size={18} />
                      <span>{post.likes} Likes</span>
                    </button>
                    <button className="action-btn">
                      <MessageCircle size={18} />
                      <span>{post.comments.length} Comments</span>
                    </button>
                  </div>
                  {post.comments.length > 0 && (
                    <div className="comments-section">
                      {post.comments.map(comment => {
                        const commentAuthor = users.find(u => u.id === comment.authorId);
                        return (
                          <div key={comment.id} className="comment">
                            <img src={commentAuthor?.avatar} alt={commentAuthor?.name} />
                            <div className="comment-content">
                              <strong>{commentAuthor?.name}</strong>
                              <p>{comment.content}</p>
                              <span className="comment-time">{formatDate(comment.createdAt)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="community-sidebar">
          <div className="card">
            <h3>Community Guidelines</h3>
            <ul className="guidelines-list">
              <li>Be respectful and kind to others</li>
              <li>Share knowledge and help fellow learners</li>
              <li>Stay on topic and avoid spam</li>
              <li>Respect privacy and confidentiality</li>
              <li>Report inappropriate content</li>
            </ul>
          </div>

          <div className="card">
            <h3>Active Members</h3>
            <div className="active-members">
              {users.slice(0, 5).map(user => (
                <div key={user.id} className="member-item">
                  <img src={user.avatar} alt={user.name} />
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
